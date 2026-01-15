import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { admin_decision_enum } from "@prisma/client"

export default async function TopRevisedTasksTable() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null

  // ambil top 5 task paling sering direvisi
  const grouped = await db.adminConfirmation.groupBy({
    by: ["taskId"],
    where: {
      decision: admin_decision_enum.REVISI
    },
    _count: {
      taskId: true
    },
    orderBy: {
      _count: {
        taskId: "desc"
      }
    },
    take: 5
  })

  const rows = await Promise.all(
    grouped.map(async (item) => {
      const task = await db.task.findUnique({
        where: { id: item.taskId },
        select: {
          id: true,
          judulTahap: true,
          tahapKe: true,
          project: {
            select: {
              judul: true
            }
          }
        }
      })

      return {
        taskId: item.taskId,
        judulTahap: task?.judulTahap ?? "(deleted)",
        tahapKe: task?.tahapKe ?? null,
        projectJudul: task?.project.judul ?? "(deleted)",
        totalRevisi: item._count.taskId
      }
    })
  )

  return (
    <Card>
      <CardContent className="pt-4">
        <h2 className="text-lg font-semibold mb-4">
          Top 5 Task Paling Sering Direvisi
        </h2>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Project</th>
              <th className="text-left py-2">Tahap</th>
              <th className="text-right py-2">Jumlah Revisi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-muted-foreground">
                  Belum ada revisi
                </td>
              </tr>
            )}

            {rows.map((row) => (
              <tr key={row.taskId} className="border-b last:border-0">
                <td className="py-2">
                  {row.projectJudul}
                </td>
                <td className="py-2">
                  {row.judulTahap} (Tahap {row.tahapKe})
                </td>
                <td className="py-2 text-right font-semibold">
                  {row.totalRevisi}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
