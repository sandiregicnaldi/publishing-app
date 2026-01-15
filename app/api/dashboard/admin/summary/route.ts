import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { status_task_enum } from "@prisma/client"

export async function GET() {
  // =====================
  // AUTH — ADMIN ONLY
  // =====================
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  // =====================
  // QUERIES (READ-ONLY)
  // =====================
  const [
    totalProjects,
    activeTasks,
    waitingConfirmation,
    totalUsers
  ] = await Promise.all([
    db.project.count(),
    db.task.count({
      where: { isActive: true }
    }),
    db.task.count({
      where: {
        status: status_task_enum.MENUNGGU_KONFIRMASI
      }
    }),
    db.user.count()
  ])

  // activeProjects = project yang punya task aktif
  const activeProjects = await db.project.count({
    where: {
      tasks: {
        some: {
          isActive: true
        }
      }
    }
  })

  // =====================
  // RESPONSE
  // =====================
  return NextResponse.json({
    totalProjects,
    activeProjects,
    activeTasks,
    waitingConfirmation,
    totalUsers
  })
}
