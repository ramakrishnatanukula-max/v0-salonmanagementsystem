"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts"

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
  // Filters
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
    // mode === "month"
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

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#14b8a6", // teal accent
  ]

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6">
      <header className="space-y-2">
        {/* neutral heading */}
        <h1 className="text-2xl md:text-3xl font-semibold text-balance text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-600">Insights for {title}</p>

        {/* Filters - Mobile first */}
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

          {/* Pick a Day */}
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

          {/* Pick a Month */}
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

      {/* KPIs - neutral text (colors only in charts) */}
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

      {/* Status Breakdown (Pie) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {/* smaller height on mobile */}
          <div className="h-[220px] md:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData.map((s: any) => ({ name: s.status, value: s.count }))}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusData.map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Top Services</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ count: { label: "Count", color: "hsl(var(--chart-2))" } }}
            className="h-[240px] md:h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServices} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-2 text-xs text-gray-600">
            {topServices.map((s: any) => s.name).join(", ") || "No services in range"}
          </div>
        </CardContent>
      </Card>

      {/* Staff Analytics - Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Staff — Services Performed</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ services_count: { label: "Services", color: "hsl(var(--chart-3))" } }}
            className="h-[240px] md:h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staff} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="services_count" fill="var(--color-services_count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Staff Analytics - Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Staff — Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ revenue: { label: "Revenue", color: "hsl(var(--chart-4))" } }}
            className="h-[240px] md:h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staff} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="var(--color-revenue)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </main>
  )
}
