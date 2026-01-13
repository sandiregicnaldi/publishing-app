import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"

export async function PATCH(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  // === AMBIL PARAMS (WAJIB AWAIT DI NEXT.JS BARU) ===
  const { taskId } = await context.params
  console.log("PATCH HIT", taskId)

  if (!taskId) {
    return NextResponse.json(
      { error: "Task ID missing in route params" },
      { status: 400 }
    )
  }

  // === AUTH ===
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

  // === PAYLOAD ===
  const body = await req.json()
  const { progress, status } = body

  if (!progress || !status) {
    return NextResponse.json(
      { error: "Invalid payload" },
      { status: 400 }
    )
  }

  // === AMBIL TASK SAAT INI ===
  const currentTask = await db.task.findUnique({
    where: { id: taskId }
  })

  if (!currentTask) {
    return NextResponse.json(
      { error: "Task not found" },
      { status: 404 }
    )
  }

  // === UPDATE TASK SEKARANG ===
  const updatedTask = await db.task.update({
    where: { id: taskId },
    data: {
      progress,
      status
    }
  })

  // === AUTO ARCHIVE TAHAP SEBELUMNYA ===
  if (status === "SEDANG_BERJALAN" && currentTask.tahapKe > 1) {
    const prevTask = await db.task.findFirst({
      where: {
        projectId: currentTask.projectId,
        tahapKe: currentTask.tahapKe - 1,
        isActive: true
      }
    })

   // === AUTO GENERATE TAHAP BERIKUTNYA ===
// === AUTO GENERATE TAHAP BERIKUTNYA ===
if (status === "SELESAI" && currentTask.isActive === true) {

  // Arsipkan task yang BARU SAJA di-update
  await db.archive.create({
    data: {
      projectId: updatedTask.projectId,
      taskId: updatedTask.id,
      tahapKe: updatedTask.tahapKe,
      judulTahap: updatedTask.judulTahap,
      status: updatedTask.status,
      progress: updatedTask.progress,
      reason: "FINAL_STAGE"
    }
  })

  // Nonaktifkan task lama
  await db.task.update({
    where: { id: updatedTask.id },
    data: { isActive: false }
  })

  // BUAT TAHAP BERIKUTNYA (INI YANG TADI KELEWAT)
  await db.task.create({
    data: {
      projectId: updatedTask.projectId,
      tahapKe: updatedTask.tahapKe + 1,
      judulTahap: `Tahap ${updatedTask.tahapKe + 1}`,
      status: "DRAFT",
      progress: "P0_25",
      isActive: true
    }
  })
}



    if (prevTask) {
      // simpan ke archive
      await db.archive.create({
        data: {
          projectId: prevTask.projectId,
          taskId: prevTask.id,
          tahapKe: prevTask.tahapKe,
          judulTahap: prevTask.judulTahap,
          status: prevTask.status,
          progress: prevTask.progress,
          reason: "AUTO_STAGE"
        }
      })

      // nonaktifkan task lama
      await db.task.update({
        where: { id: prevTask.id },
        data: { isActive: false }
      })
    }
  }

  // === RESPONSE ===
  return NextResponse.json(updatedTask)
}
