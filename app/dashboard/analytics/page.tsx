"use client"

import useSWR from "swr"
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

function todayYYYYMMDD() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}`
}

export default function AnalyticsPage() {
  const date = todayYYYYMMDD()
  const { data: appts } = useSWR(`/api/appointments?date=${date}`, fetcher)
  const { data: services } = useSWR(`/api/services`, fetcher)
  const { data: billingPaid } = useSWR(`/api/billing/today-completed?showPaid=1`, fetcher)

  const svcMap = new Map<number, any>()
  ;(Array.isArray(services) ? services : []).forEach((s: any) => svcMap.set(s.id, s))

  const statusCounts: Record<string, number> = {
    scheduled: 0,
    checked_in: 0,
    in_service: 0,
    completed: 0,
    no_show: 0,
    canceled: 0,
  }
  const serviceCounts: Record<string, number> = {}
  ;(Array.isArray(appts) ? appts : []).forEach((a: any) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1
    const sIds: number[] = Array.isArray(a.selected_servicesIds) ? a.selected_servicesIds : []
    sIds.forEach((id: number) => {
      const name = svcMap.get(id)?.name || `Service ${id}`
      serviceCounts[name] = (serviceCounts[name] || 0) + 1
    })
  })

  const statusData = Object.entries(statusCounts)
    .filter(([, v]) => v > 0)
    .map(([status, count]) => ({ status, count }))

  const serviceData = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  const totalAppts = (Array.isArray(appts) ? appts : []).length
  const completed = statusCounts.completed || 0
  const revenue = (Array.isArray(billingPaid) ? billingPaid : []).reduce(
    (sum: number, b: any) => sum + (Number(b.paid_amount) || 0),
    0,
  )

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "#0ea5e9",
  ]

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-balance">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Appointments Today</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalAppts}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{completed}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue (Today)</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">₹{revenue.toFixed(0)}</CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              count: { label: "Count", color: "hsl(var(--chart-1))" },
            }}
            className="h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle>Top Services (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ count: { label: "Count", color: "hsl(var(--chart-2))" } }} className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="var(--color-count)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-2 text-xs text-(--color-muted-foreground)">
            {serviceData.map((s) => s.name).join(", ") || "No services today"}
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Paid Bills (Pie) */}
      <Card>
        <CardHeader>
          <CardTitle>Paid Bills (Today)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(Array.isArray(billingPaid) ? billingPaid : []).map((b: any, idx: number) => ({
                    name: `#${b.id || idx + 1}`,
                    value: Number(b.paid_amount) || 0,
                  }))}
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {(Array.isArray(billingPaid) ? billingPaid : []).map((_: any, idx: number) => (
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
    </main>
  )
}
