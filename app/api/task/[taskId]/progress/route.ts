import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { status_task_enum, progress_enum } from "@prisma/client"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params

  if (!taskId) {
    return NextResponse.json({ error: "Task ID missing" }, { status: 400 })
  }

  // =====================
  // AUTH
  // =====================
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "PJ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // =====================
  // PAYLOAD
  // =====================
  const body = await req.json()
  const progress = body.progress as progress_enum

  if (!progress) {
    return NextResponse.json({ error: "Progress required" }, { status: 400 })
  }

  // =====================
  // CURRENT TASK
  // =====================
  const currentTask = await db.task.findUnique({
    where: { id: taskId }
  })

  if (!currentTask) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // =====================
  // TENTUKAN STATUS (DISIPLIN)
  // =====================
let nextStatus = currentTask.status

// DRAFT → mulai kerja
if (currentTask.status === status_task_enum.DRAFT) {
  nextStatus = status_task_enum.SEDANG_BERJALAN
}

// PERLU_REVISI → PJ mulai revisi
if (currentTask.status === status_task_enum.PERLU_REVISI) {
  nextStatus = status_task_enum.SEDANG_BERJALAN
}

if (!task.isActive) {
  return NextResponse.json(
    { error: "Task is no longer active" },
    { status: 400 }
  )
}


  // =====================
  // UPDATE TASK
  // =====================
  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      progress,
      status: nextStatus
    }
  })

  return NextResponse.json(updatedTask)
}
