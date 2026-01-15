import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { admin_decision_enum } from "@prisma/client"

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
  // TOTAL REVISION
  // =====================
  const totalRevisions = await db.adminConfirmation.count({
    where: {
      decision: admin_decision_enum.REVISI
    }
  })

  // =====================
  // TASK YANG PERNAH DIREVISI
  // =====================
  const tasksWithRevision = await db.adminConfirmation.groupBy({
    by: ["taskId"],
    where: {
      decision: admin_decision_enum.REVISI
    }
  })

  const taskCount = tasksWithRevision.length

  // =====================
  // AVERAGE REVISION
  // =====================
  const averageRevisionPerTask =
    taskCount === 0
      ? 0
      : Number((totalRevisions / taskCount).toFixed(2))

  return NextResponse.json({
    totalRevisions,
    tasksWithRevision: taskCount,
    averageRevisionPerTask
  })
}
