import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { kategori_enum } from "@prisma/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const results = await Promise.all(
    Object.values(kategori_enum).map(async (kategori) => {
      const total = await db.project.count({ where: { kategori } })
      return { kategori, total }
    })
  )

  const byCategory: Record<string, number> = {}
  for (const row of results) {
    byCategory[row.kategori] = row.total
  }

  return NextResponse.json({ byCategory })
}
