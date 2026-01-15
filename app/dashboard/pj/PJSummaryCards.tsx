import { Card, CardContent } from "@/components/ui/card"
import { cookies } from "next/headers"

async function getSummary() {
  const cookieStore = await cookies()

  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ")

  const res = await fetch(
    "http://localhost:3000/api/dashboard/pj/summary",
    {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader
      }
    }
  )

  if (!res.ok) {
    throw new Error("Failed to load PJ summary")
  }

  return res.json()
}

export default async function PJSummaryCards() {
  const data = await getSummary()

  const items = [
    { label: "Project Saya", value: data.totalProjects },
    { label: "Task Aktif", value: data.activeTasks },
    { label: "Perlu Revisi", value: data.needRevision },
    { label: "Menunggu Konfirmasi", value: data.waitingConfirmation }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map(item => (
        <Card key={item.label}>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">
              {item.label}
            </p>
            <p className="text-2xl font-bold">
              {item.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
