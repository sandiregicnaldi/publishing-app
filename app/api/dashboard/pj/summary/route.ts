import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { status_task_enum } from "@prisma/client"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "PJ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const pjId = session.user.id

  const [
    totalProjects,
    activeTasks,
    needRevision,
    waitingConfirmation
  ] = await Promise.all([
    db.project.count({
      where: { pjId }
    }),
    db.task.count({
      where: {
        project: { pjId },
        isActive: true
      }
    }),
    db.task.count({
      where: {
        project: { pjId },
        status: status_task_enum.PERLU_REVISI
      }
    }),
    db.task.count({
      where: {
        project: { pjId },
        status: status_task_enum.MENUNGGU_KONFIRMASI
      }
    })
  ])

  return NextResponse.json({
    totalProjects,
    activeTasks,
    needRevision,
    waitingConfirmation
  })
}
