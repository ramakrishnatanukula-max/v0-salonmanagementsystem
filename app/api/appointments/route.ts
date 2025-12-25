import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") // YYYY-MM-DD
  const where = date ? "WHERE DATE(a.scheduled_start)=?" : ""
  const rows = await query<any>(
    `SELECT a.*, 
            CONCAT(c.first_name,' ',c.last_name) AS customer_name,
            c.phone,
            c.email,
            ab.id as billing_id,
            ab.total_amount,
            ab.paid_amount,
            ab.payment_method,
            ab.payment_status,
            ab.notes as billing_notes,
            ab.updated_at as billing_date
     FROM appointments a
     JOIN customers c ON a.customer_id=c.id
     LEFT JOIN appointment_billing ab ON ab.appointment_id=a.id
     ${where}
     ORDER BY a.scheduled_start ASC`,
    date ? [date] : [],
  )
  
  // Transform to include billing object
  const enrichedRows = (rows || []).map((row: any) => ({
    ...row,
    billing: row.billing_id ? {
      id: row.billing_id,
      total_amount: row.total_amount,
      paid_amount: row.paid_amount,
      payment_method: row.payment_method,
      payment_status: row.payment_status,
      notes: row.billing_notes,
      updated_at: row.billing_date
    } : null
  }))
  
  return NextResponse.json(enrichedRows)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const {
    customer, // {first_name,last_name,phone,email}
    notes = null,
    date, // YYYY-MM-DD
    time, // HH:mm
    selected_servicesIds = [],
    selected_staffIds = [],
  } = body

  if (!customer?.first_name || !date || !time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // upsert customer by phone or email (if provided)
  let customerId: number | null = null
  
  // Check for existing customer by phone or email
  if (customer.phone) {
    const existing = await query<any>("SELECT id FROM customers WHERE phone = ? ORDER BY id DESC LIMIT 1", [
      customer.phone,
    ])
    if (existing.length) customerId = existing[0].id
  }
  
  if (!customerId && customer.email) {
    const existing = await query<any>("SELECT id FROM customers WHERE email = ? ORDER BY id DESC LIMIT 1", [
      customer.email,
    ])
    if (existing.length) customerId = existing[0].id
  }
  
  if (!customerId) {
    const res: any = await execute("INSERT INTO customers (first_name,last_name,email,phone) VALUES (?,?,?,?)", [
      customer.first_name.trim(),
      customer?.last_name?.trim() ?? ""  ,
      customer.email || null,
      customer.phone || null,
    ])
    customerId = res.insertId
  }

  const scheduled_start = new Date(`${date}T${time}:00`)
  const res: any = await execute(
    "INSERT INTO appointments (customer_id, scheduled_start, status, notes, selected_servicesIds, selected_staffIds) VALUES (?,?,?,?,CAST(? AS JSON),CAST(? AS JSON))",
    [
      customerId,
      scheduled_start,
      "scheduled",
      notes,
      JSON.stringify(selected_servicesIds),
      JSON.stringify(selected_staffIds),
    ],
  )

  return NextResponse.json({ id: res.insertId })
}
