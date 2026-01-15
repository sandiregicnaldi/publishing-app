import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  status_task_enum,
  progress_enum,
  admin_decision_enum,
  archive_reason_enum
} from "@prisma/client"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params

  // =====================
  // AUTH (ADMIN ONLY)
  // =====================
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const adminId = session.user.id
  if (!adminId) {
    return NextResponse.json(
      { error: "Admin ID missing in session" },
      { status: 500 }
    )
  }

  // =====================
  // TASK VALIDATION
  // =====================
  const task = await db.task.findUnique({
    where: { id: taskId }
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  if (task.status !== status_task_enum.MENUNGGU_KONFIRMASI) {
    return NextResponse.json(
      { error: "Task is not awaiting confirmation" },
      { status: 400 }
    )
  }
  if (!task.isActive) {
  return NextResponse.json(
    { error: "Task is no longer active" },
    { status: 400 }
  )
}

// =====================
// 🔒 H4 — CEK TASK AKTIF LAIN
// =====================
const anotherActiveTask = await db.task.findFirst({
  where: {
    projectId: task.projectId,
    isActive: true,
    NOT: {
      id: task.id
    }
  }
})

if (anotherActiveTask) {
  return NextResponse.json(
    { error: "Another active task already exists for this project" },
    { status: 400 }
  )
}



  // =====================
  // TRANSACTION (ATOMIC)
  // =====================
  const result = await db.$transaction(async (tx) => {
    // 1️⃣ Update task jadi SELESAI
    const finishedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: status_task_enum.SELESAI,
        isActive: false
      }
    })

    // 2️⃣ Simpan keputusan admin
    await tx.adminConfirmation.create({
        
      data: {
        taskId: taskId,
        adminId: adminId,
        decision: admin_decision_enum.SETUJU
        statusAtDecision: task.status,
progressAtDecision: task.progress,

      }
    })

    // 3️⃣ Archive task final
    await tx.archive.create({
      data: {
        projectId: finishedTask.projectId,
        taskId: finishedTask.id,
        tahapKe: finishedTask.tahapKe,
        judulTahap: finishedTask.judulTahap,
        status: finishedTask.status,
        progress: finishedTask.progress,
        reason: archive_reason_enum.FINAL_STAGE
      }
    })



    // 4️⃣ Buat tahap berikutnya (DRAFT)
    const nextTask = await tx.task.create({
      data: {
        projectId: finishedTask.projectId,
        tahapKe: finishedTask.tahapKe + 1,
        judulTahap: `Tahap ${finishedTask.tahapKe + 1}`,
        status: status_task_enum.DRAFT,
        progress: progress_enum.P0_25,
        isActive: true
      }
    })

    return {
      finishedTask,
      nextTask
    }
  })

  return NextResponse.json(result)
}
