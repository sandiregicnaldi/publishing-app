import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { admin_decision_enum } from "@prisma/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const grouped = await db.adminConfirmation.groupBy({
    by: ["taskId"],
    where: { decision: admin_decision_enum.REVISI },
    _count: { taskId: true },
    orderBy: { _count: { taskId: "desc" } },
    take: 5
  })

  const topRevisedTasks = await Promise.all(
    grouped.map(async (item) => {
      const task = await db.task.findUnique({
        where: { id: item.taskId },
        select: {
          id: true,
          judulTahap: true,
          projectId: true
        }
      })

      return {
        taskId: item.taskId,
        judulTahap: task?.judulTahap ?? "(deleted)",
        projectId: task?.projectId ?? null,
        totalRevisi: item._count.taskId
      }
    })
  )

  return NextResponse.json({ topRevisedTasks })
}
