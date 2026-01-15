import PJSummaryCards from "./PJSummaryCards"

export default function PJDashboardPage() {
  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Dashboard PJ
      </h1>

      <PJSummaryCards />
    </main>
  )
}
