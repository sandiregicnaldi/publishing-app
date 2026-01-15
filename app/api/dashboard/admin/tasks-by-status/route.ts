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
  // QUERY PER STATUS
  // =====================
  const results = await Promise.all(
    Object.values(status_task_enum).map(async (status) => {
      const total = await db.task.count({
        where: { status }
      })

      return {
        status,
        total
      }
    })
  )

  // =====================
  // TRANSFORM → OBJECT (INI KUNCI B1)
  // =====================
  const byStatus: Record<string, number> = {}

  for (const row of results) {
    byStatus[row.status] = row.total
  }

  // =====================
  // RESPONSE FINAL (OBJECT)
  // =====================
  return NextResponse.json({
    byStatus
  })
}
