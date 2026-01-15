import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"
import { status_task_enum } from "@prisma/client"

const STATUS_LABEL: Record<status_task_enum, string> = {
  DRAFT: "Draft",
  SEDANG_BERJALAN: "Sedang Berjalan",
  MENUNGGU_KONFIRMASI: "Menunggu Konfirmasi",
  PERLU_REVISI: "Perlu Revisi",
  SELESAI: "Selesai"
}

export default async function TaskStatusBadges() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null

  const data = await Promise.all(
    Object.values(status_task_enum).map(async (status) => ({
      status,
      total: await db.task.count({ where: { status } })
    }))
  )

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {data.map(({ status, total }) => (
        <Card key={status}>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">
              {STATUS_LABEL[status]}
            </p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
