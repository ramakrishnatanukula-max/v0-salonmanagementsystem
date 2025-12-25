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

  try {
    // Status counts - from appointments table
    const statusRows = await query<any>(
      `SELECT a.status, COUNT(*) as count
       FROM appointments a
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
       GROUP BY a.status
       ORDER BY count DESC`,
      [from, to],
    )

    // KPIs: total appointments and completed count
    const kpiRows = await query<any>(
      `SELECT 
         COUNT(*) AS total,
         SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) AS completed
       FROM appointments a
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?`,
      [from, to],
    )

    // Total count of actual services performed
    const servicesCountRow = await query<any>(
      `SELECT COUNT(*) AS total_services
       FROM appointment_actualtaken_services aas
       JOIN appointments a ON a.id = aas.appointment_id
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

    // Revenue KPI - from appointment_billing table (paid_amount) for completed appointments
    const billingRevenueRow = await query<any>(
      `SELECT COALESCE(SUM(ab.paid_amount), 0) AS billing_revenue,
              COALESCE(SUM(ab.total_amount), 0) AS total_billed
       FROM appointment_billing ab
       JOIN appointments a ON a.id = ab.appointment_id
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
       AND ab.payment_status IN ('paid', 'pending', 'completed')`,
      [from, to],
    )

    // Alternative revenue from actual taken services (if billing not fully populated)
    const actualServicesRevenueRow = await query<any>(
      `SELECT COALESCE(SUM(aas.price), 0) AS services_revenue
       FROM appointment_actualtaken_services aas
       JOIN appointments a ON a.id = aas.appointment_id
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
       AND aas.price IS NOT NULL AND aas.price > 0`,
      [from, to],
    )

    // Payment status breakdown
    const paymentStatusRows = await query<any>(
      `SELECT ab.payment_status, COUNT(*) as count
       FROM appointment_billing ab
       JOIN appointments a ON a.id = ab.appointment_id
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
       GROUP BY ab.payment_status
       ORDER BY count DESC`,
      [from, to],
    )

    // Staff analytics - services performed count and revenue from both sources
    const staffStats = await query<any>(
      `SELECT 
         u.id,
         COALESCE(u.name, CONCAT('Staff #', u.id)) AS name,
         COUNT(DISTINCT aas.id) AS services_count,
         COALESCE(SUM(aas.price), 0) AS actual_revenue
       FROM appointment_actualtaken_services aas
       JOIN appointments a ON a.id = aas.appointment_id
       LEFT JOIN users u ON u.id = aas.doneby_staff_id
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
       GROUP BY u.id, u.name
       ORDER BY services_count DESC
       LIMIT 15`,
      [from, to],
    )

    // Get billed revenue per staff member from actual services performed
    const staffBilledRevenueRows = await query<any>(
      `SELECT 
         aas.doneby_staff_id,
         COALESCE(SUM(ab.paid_amount), 0) AS billed_revenue
       FROM appointment_billing ab
       JOIN appointments a ON a.id = ab.appointment_id
       LEFT JOIN appointment_actualtaken_services aas ON aas.appointment_id = a.id
       WHERE DATE(a.scheduled_start) BETWEEN ? AND ?
       GROUP BY aas.doneby_staff_id`,
      [from, to],
    )

    // Create lookup for billed revenue
    const billedRevenueMap: Record<number, number> = {}
    for (const row of staffBilledRevenueRows) {
      const staffId = row.doneby_staff_id
      if (staffId) {
        billedRevenueMap[staffId] = Number(row.billed_revenue || 0)
      }
    }

    // Determine which revenue value to use (prefer billing table, fallback to services)
    const billingRevenue = Number(billingRevenueRow?.[0]?.billing_revenue || 0)
    const actualServicesRevenue = Number(actualServicesRevenueRow?.[0]?.services_revenue || 0)
    const finalRevenue = billingRevenue > 0 ? billingRevenue : actualServicesRevenue

    const kpis = {
      appointments: Number(kpiRows?.[0]?.total || 0),
      completed: Number(kpiRows?.[0]?.completed || 0),
      revenue: finalRevenue,
      performedRevenue: actualServicesRevenue, // Revenue from services table
      servicesPerformed: Number(servicesCountRow?.[0]?.total_services || 0), // Correct count
    }

    const status = (statusRows || []).map((r: any) => ({
      status: r.status || "unknown",
      count: Number(r.count || 0),
    }))

    const paymentStatus = (paymentStatusRows || []).map((r: any) => ({
      status: r.payment_status || "unknown",
      count: Number(r.count || 0),
    }))

    return NextResponse.json({
      range: { from, to },
      kpis,
      status,
      paymentStatus,
      topServices: topServices.map((t: any) => ({
        id: t.id,
        name: t.name || `Service ${t.id}`,
        count: Number(t.count || 0),
      })),
      staff: staffStats.map((s: any) => ({
        id: s.id,
        name: s.name,
        services_count: Number(s.services_count || 0),
        actual_revenue: Number(s.actual_revenue || 0),
        billed_revenue: billedRevenueMap[s.id] || 0,
      })),
    })
  } catch (error: any) {
    console.error("Analytics endpoint error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error?.message },
      { status: 500 }
    )
  }
}
