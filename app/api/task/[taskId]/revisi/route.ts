import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  status_task_enum,
  admin_decision_enum
} from "@prisma/client"

const MAX_REVISI = 3

export async function PATCH(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await context.params

  // =====================
  // AUTH (ADMIN ONLY)
  // =====================
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const adminId = session.user.id
  if (!adminId) {
    return NextResponse.json(
      { error: "Admin ID missing in session" },
      { status: 500 }
    )
  }

  // =====================
  // TASK VALIDATION
  // =====================
  const task = await db.task.findUnique({
    where: { id: taskId }
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  if (task.status !== status_task_enum.MENUNGGU_KONFIRMASI) {
    return NextResponse.json(
      { error: "Task is not awaiting confirmation" },
      { status: 400 }
    )
  }

  if (!task.isActive) {
    return NextResponse.json(
      { error: "Task is no longer active" },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => ({}))

  // =====================
  // TRANSACTION (ATOMIC)
  // =====================
try {
  const result = await db.$transaction(async (tx) => {

    // H6-2 — HITUNG JUMLAH REVISI
    const revisiCount = await tx.adminConfirmation.count({
      where: {
        taskId: taskId,
        decision: admin_decision_enum.REVISI
      }
    })

    // H6-3 — BLOK REVISI JIKA SUDAH MAKSIMAL
    if (revisiCount >= MAX_REVISI) {
      throw new Error("MAX_REVISI_REACHED")
    }

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status: status_task_enum.PERLU_REVISI
      }
    })

    await tx.adminConfirmation.create({
      data: {
        taskId: taskId,
        adminId: adminId,
        decision: admin_decision_enum.REVISI,
        catatan: body.note ?? null,
        statusAtDecision: task.status,
        progressAtDecision: task.progress
      }
    })

    return updatedTask
  })

  return NextResponse.json(result)

} catch (error: any) {

  // H6-4 — HANDLE LIMIT REVISI
  if (error.message === "MAX_REVISI_REACHED") {
    return NextResponse.json(
      { error: `Revisi sudah mencapai batas maksimal (${MAX_REVISI} kali)` },
      { status: 400 }
    )
  }

  // ERROR LAIN (DB / SYSTEM)
  console.error("REVISI ERROR:", error)
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  )
}
}
