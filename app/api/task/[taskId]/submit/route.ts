import {
  status_task_enum,
  progress_enum
} from "@prisma/client"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params

  if (!taskId) {
    return NextResponse.json(
      { error: "Task ID missing" },
      { status: 400 }
    )
  }

  // =====================
  // AUTH
  // =====================
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // HANYA PJ YANG BOLEH SUBMIT
  if (session.user.role !== "PJ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // =====================
  // TASK VALIDATION
  // =====================
  const task = await db.task.findUnique({
    where: { id: taskId }
  })

  if (!task) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 }
    )
  }

  if (task.status !== "SEDANG_BERJALAN") {
    return NextResponse.json(
      { error: "Task is not in progress" },
      { status: 400 }
    )
  }

if (!task.isActive) {
  return NextResponse.json(
    { error: "Task is no longer active" },
    { status: 400 }
  )
}

if (
  task.status !== status_task_enum.SEDANG_BERJALAN ||
  task.progress !== progress_enum.SELESAI
) {
  return NextResponse.json(
    { error: "Task is not ready for submission" },
    { status: 400 }
  )
}



  // =====================
  // UPDATE STATUS
  // =====================
  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      status: "MENUNGGU_KONFIRMASI"
    }
  })

  return NextResponse.json(updatedTask)
}
