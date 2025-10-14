"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Chart as ChartJSCore,
  ArcElement,
  Tooltip as ChartJSTooltip,
  Legend as ChartJSLegend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js"
import { Pie as PieChartJS, Bar as BarChartJS } from "react-chartjs-2"
ChartJSCore.register(ArcElement, ChartJSTooltip, ChartJSLegend, CategoryScale, LinearScale, BarElement)

const fetcher = (u: string) => fetch(u).then((r) => r.json())

function fmtDate(d: Date) {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

function monthBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1)
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  return { from: fmtDate(start), to: fmtDate(end) }
}

export default function AnalyticsPage() {
  const [mode, setMode] = useState<"today" | "thisMonth" | "lastMonth" | "day" | "month">("today")
  const [day, setDay] = useState<string>(() => fmtDate(new Date()))
  const [month, setMonth] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  })

  const { from, to, title } = useMemo(() => {
    const now = new Date()
    if (mode === "today") {
      const f = fmtDate(now)
      return { from: f, to: f, title: "Today" }
    }
    if (mode === "thisMonth") {
      const { from, to } = monthBounds(now)
      return { from, to, title: "This Month" }
    }
    if (mode === "lastMonth") {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const { from, to } = monthBounds(last)
      return { from, to, title: "Last Month" }
    }
    if (mode === "day") {
      return { from: day, to: day, title: `Day: ${day}` }
    }
    const [y, m] = month.split("-").map(Number)
    const base = new Date(y, (m || 1) - 1, 1)
    const { from, to } = monthBounds(base)
    return { from, to, title: `Month: ${month}` }
  }, [mode, day, month])

  const { data } = useSWR(from && to ? `/api/analytics?from=${from}&to=${to}` : null, fetcher)
  const kpis = data?.kpis || { appointments: 0, completed: 0, revenue: 0, servicesPerformed: 0 }
  const statusData = Array.isArray(data?.status) ? data.status : []
  const topServices = Array.isArray(data?.topServices) ? data.topServices : []
  const staff = Array.isArray(data?.staff) ? data.staff : []

  const CHART_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  const pieData = {
    labels: (statusData || []).map((s: any) => s.status),
    datasets: [
      {
        label: "Count",
        data: (statusData || []).map((s: any) => Number(s.count || 0)),
        backgroundColor: (statusData || []).map((_: any, i: number) => CHART_COLORS[i % CHART_COLORS.length]),
        borderWidth: 0,
      },
    ],
  }
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const } },
  }

  const topServicesData = {
    labels: (topServices || []).map((t: any) => t.name),
    datasets: [
      {
        label: "Count",
        data: (topServices || []).map((t: any) => Number(t.count || 0)),
        backgroundColor: "hsl(var(--chart-2))",
        borderWidth: 0,
      },
    ],
  }
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { ticks: { display: false } }, y: { ticks: { precision: 0 } } },
  }

  const staffServicesData = {
    labels: (staff || []).map((s: any) => s.name),
    datasets: [
      {
        label: "Services",
        data: (staff || []).map((s: any) => Number(s.services_count || 0)),
        backgroundColor: "hsl(var(--chart-3))",
        borderWidth: 0,
      },
    ],
  }
  const staffRevenueData = {
    labels: (staff || []).map((s: any) => s.name),
    datasets: [
      {
        label: "Revenue",
        data: (staff || []).map((s: any) => Number(s.revenue || 0)),
        backgroundColor: "hsl(var(--chart-4))",
        borderWidth: 0,
      },
    ],
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-balance text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600">Insights for {title}</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <button
            onClick={() => setMode("today")}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              mode === "today"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-indigo-700 border-indigo-200"
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setMode("thisMonth")}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              mode === "thisMonth"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-indigo-700 border-indigo-200"
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setMode("lastMonth")}
            className={`px-3 py-2 rounded-md text-sm font-medium border ${
              mode === "lastMonth"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-indigo-700 border-indigo-200"
            }`}
          >
            Last Month
          </button>

          <label className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-indigo-700 border-indigo-200">
            <span className="text-xs font-semibold">Pick Day</span>
            <input
              type="date"
              value={day}
              onChange={(e) => {
                setDay(e.target.value)
                setMode("day")
              }}
              className="text-sm outline-none"
            />
          </label>

          <label className="flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-indigo-700 border-indigo-200 md:col-auto col-span-2">
            <span className="text-xs font-semibold">Pick Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value)
                setMode("month")
              }}
              className="text-sm outline-none"
            />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Appointments</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-gray-900">{kpis.appointments}</CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-gray-900">{kpis.completed}</CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-gray-900">
            ₹{Number(kpis.revenue || 0).toFixed(0)}
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Services Performed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold text-gray-900">{kpis.servicesPerformed}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] md:h-[260px]">
            <PieChartJS data={pieData} options={pieOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Top Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] md:h-[280px]">
            <BarChartJS data={topServicesData} options={barOptions} />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {(topServices || []).map((s: any) => s.name).join(", ") || "No services in range"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Staff — Services Performed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] md:h-[300px]">
            <BarChartJS data={staffServicesData} options={barOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Staff — Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px] md:h-[300px]">
            <BarChartJS
              data={staffRevenueData}
              options={{
                ...barOptions,
                scales: { x: { ticks: { display: false } }, y: { ticks: { callback: (v: any) => `₹${v}` } } },
              }}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
