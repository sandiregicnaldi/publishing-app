import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  // =====================
  // AUTH
  // =====================
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: userId, role } = session.user

  // =====================
  // ADMIN MODE — TOP 5
  // =====================
  if (role === "ADMIN") {
    // =====================
    // Top PJ by Projects
    // =====================
    const topPJByProjectsRaw = await db.project.groupBy({
      by: ["pjId"],
      _count: { pjId: true },
      orderBy: { _count: { pjId: "desc" } },
      take: 5
    })

    const topPJByProjects = await Promise.all(
      topPJByProjectsRaw.map(async (item) => {
        const user = await db.user.findUnique({
          where: { id: item.pjId },
          select: { id: true, name: true, email: true }
        })

        return {
          pjId: item.pjId,
          name: user?.name ?? "(unknown)",
          email: user?.email ?? null,
          totalProjects: item._count.pjId
        }
      })
    )

    // =====================
    // Top PJ by Tasks (OPTIMIZED)
    // =====================

    // Ambil project → pjId
    const projects = await db.project.findMany({
      select: { id: true, pjId: true }
    })

    // Hitung task per project
    const taskCountPerProject = await db.task.groupBy({
      by: ["projectId"],
      _count: { projectId: true }
    })

    // Map projectId → pjId
    const projectToPJ = new Map(
      projects.map(p => [p.id, p.pjId])
    )

    // Agregasi task per PJ
    const taskCountByPJ: Record<string, number> = {}

    for (const row of taskCountPerProject) {
      const pjId = projectToPJ.get(row.projectId)
      if (!pjId) continue

      taskCountByPJ[pjId] =
        (taskCountByPJ[pjId] ?? 0) + row._count.projectId
    }

    // Ambil TOP 5 PJ
    const topPJByTasks = await Promise.all(
      Object.entries(taskCountByPJ)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(async ([pjId, totalTasks]) => {
          const user = await db.user.findUnique({
            where: { id: pjId },
            select: { id: true, name: true, email: true }
          })

          return {
            pjId,
            name: user?.name ?? "(unknown)",
            email: user?.email ?? null,
            totalTasks
          }
        })
    )

    return NextResponse.json({
      mode: "ADMIN",
      topPJByProjects,
      topPJByTasks
    })
  }

  // =====================
  // PJ MODE — SELF ONLY
  // =====================
  if (role === "PJ") {
    const totalProjects = await db.project.count({
      where: { pjId: userId }
    })

    const totalTasks = await db.task.count({
      where: {
        project: { pjId: userId }
      }
    })

    return NextResponse.json({
      mode: "PJ",
      me: {
        pjId: userId,
        totalProjects,
        totalTasks
      }
    })
  }

  // =====================
  // VIEWER — NO ACCESS
  // =====================
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  )
}
