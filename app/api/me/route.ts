import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const role = session.user.role

  if (role !== "ADMIN" && role !== "PJ") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { judul, kategori, pjId } = body

  if (!judul || !kategori || !pjId) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    )
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
          isActive: true
        }
      }
    },
    include: {
      tasks: true
    }
  })

  return NextResponse.json(project)
}
