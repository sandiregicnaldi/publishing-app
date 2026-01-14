import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = session.user.role
  if (role !== "ADMIN" && role !== "PJ") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { judul, kategori, pjId } = await req.json()
  if (!judul || !kategori || !pjId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const project = await db.project.create({
    data: {
      judul,
      kategori,
      pjId,
      status: "DRAFT",
      progress: "P0_25",
      tasks: {
        create: {
          tahapKe: 1,
          judulTahap: "Tahap 1",
          status: "DRAFT",
          progress: "P0_25",
          isActive: true,
        },
      },
    },
    include: { tasks: true },
  })

  return NextResponse.json(project)
}
