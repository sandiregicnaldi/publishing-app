import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { progress_enum } from "@prisma/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const results = await Promise.all(
    Object.values(progress_enum).map(async (progress) => {
      const total = await db.task.count({ where: { progress } })
      return { progress, total }
    })
  )

  const byProgress: Record<string, number> = {}
  for (const row of results) {
    byProgress[row.progress] = row.total
  }

  return NextResponse.json({ byProgress })
}
