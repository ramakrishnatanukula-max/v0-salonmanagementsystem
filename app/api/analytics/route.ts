import { NextResponse } from "next/server"
import { query } from "@/lib/db"

function normalizeDateStr(s: string | null): string | null {
  if (!s) return null
  // Expect YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = normalizeDateStr(searchParams.get("from"))
  const to = normalizeDateStr(searchParams.get("to"))
  if (!from || !to) {
    return NextResponse.json({ error: "from and to (YYYY-MM-DD) are required" }, { status: 400 })
  }

  // Status counts
  const statusRows = await query<any>(
    `SELECT a.status, COUNT(*) as count
     FROM appointments a
     WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
     GROUP BY a.status`,
    [from, to],
  )

  // KPIs: total, completed
  const kpiRows = await query<any>(
    `SELECT 
       COUNT(*) AS total,
       SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) AS completed
     FROM appointments a
     WHERE DATE(a.scheduled_start) BETWEEN ? AND ?`,
    [from, to],
  )

  // Top services from actual taken services (more accurate than selected)
  const topServices = await query<any>(
    `SELECT s.id, s.name, COUNT(*) AS count
     FROM appointment_actualtaken_services aas
     JOIN appointments a ON a.id = aas.appointment_id
     LEFT JOIN services s ON s.id = aas.service_id
     WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
     GROUP BY s.id, s.name
     ORDER BY count DESC
     LIMIT 10`,
    [from, to],
  )

  // Staff analytics (services performed and revenue from aas.price)
  const staffStats = await query<any>(
    `SELECT 
       u.id,
       COALESCE(u.name, CONCAT('Staff #', u.id)) AS name,
       COUNT(*) AS services_count,
       COALESCE(SUM(aas.price), 0) AS revenue
     FROM appointment_actualtaken_services aas
     JOIN appointments a ON a.id = aas.appointment_id
     LEFT JOIN users u ON u.id = aas.doneby_staff_id
     WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
     GROUP BY u.id, u.name
     ORDER BY services_count DESC
     LIMIT 10`,
    [from, to],
  )

  // Revenue KPI from actual taken services
  const revenueRow = await query<any>(
    `SELECT COALESCE(SUM(aas.price), 0) AS revenue
     FROM appointment_actualtaken_services aas
     JOIN appointments a ON a.id = aas.appointment_id
     WHERE DATE(a.scheduled_start) BETWEEN ? AND ?`,
    [from, to],
  )

  const kpis = {
    appointments: Number(kpiRows?.[0]?.total || 0),
    completed: Number(kpiRows?.[0]?.completed || 0),
    revenue: Number(revenueRow?.[0]?.revenue || 0),
    servicesPerformed: staffStats.reduce((sum: number, s: any) => sum + Number(s.services_count || 0), 0),
  }

  const status = (statusRows || []).map((r: any) => ({
    status: r.status,
    count: Number(r.count || 0),
  }))

  return NextResponse.json({
    range: { from, to },
    kpis,
    status,
    topServices: topServices.map((t: any) => ({
      id: t.id,
      name: t.name || `Service ${t.id}`,
      count: Number(t.count || 0),
    })),
    staff: staffStats.map((s: any) => ({
      id: s.id,
      name: s.name,
      services_count: Number(s.services_count || 0),
      revenue: Number(s.revenue || 0),
    })),
  })
}
