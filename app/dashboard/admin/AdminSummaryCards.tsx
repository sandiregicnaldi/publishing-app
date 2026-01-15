// app/dashboard/admin/AdminSummaryCards.tsx
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Card, CardContent } from "@/components/ui/card"

export default async function AdminSummaryCards() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== "ADMIN") {
    return null
  }

  const [
    totalProjects,
    activeTasks,
    waitingConfirmation,
    totalUsers
  ] = await Promise.all([
    db.project.count(),
    db.task.count({ where: { isActive: true } }),
    db.task.count({
      where: { status: "MENUNGGU_KONFIRMASI" }
    }),
    db.user.count()
  ])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Total Project</p>
          <p className="text-2xl font-bold">{totalProjects}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Task Aktif</p>
          <p className="text-2xl font-bold">{activeTasks}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Menunggu Konfirmasi</p>
          <p className="text-2xl font-bold">{waitingConfirmation}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">Total User</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </CardContent>
      </Card>
    </div>
  )
}
