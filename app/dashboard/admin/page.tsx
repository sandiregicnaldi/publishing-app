import AdminSummaryCards from "./AdminSummaryCards"
import TaskStatusBadges from "./TaskStatusBadges"
import TopRevisedTasksTable from "./TopRevisedTasksTable"

export default function AdminDashboardPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Dashboard Admin
      </h1>

      <AdminSummaryCards />
      <TaskStatusBadges />
        <TopRevisedTasksTable />
    </main>
  )
}
