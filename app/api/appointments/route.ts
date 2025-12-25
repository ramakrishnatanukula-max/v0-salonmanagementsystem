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

  // Always create a new customer (no duplicate checking by email/phone)
  let customerId: number | null = null;
  
  const customerRes: any = await execute("INSERT INTO customers (first_name,last_name,email,phone) VALUES (?,?,?,?)", [
    customer.first_name.trim(),
    customer?.last_name?.trim() ?? ""  ,
    customer.email || null,
    customer.phone || null,
  ])
  customerId = customerRes.insertId;

  const scheduled_start = new Date(`${date}T${time}:00`)
  const appointmentRes: any = await execute(
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

  const appointmentId = appointmentRes.insertId;

  // Automatically create actual services from selected services
  if (selected_servicesIds && selected_servicesIds.length > 0) {
    // Get service details (price) for each selected service
    const serviceIds = selected_servicesIds.map((id: any) => Number(id)).filter((id: number) => id > 0);
    
    if (serviceIds.length > 0) {
      const placeholders = serviceIds.map(() => '?').join(',');
      const services = await query<any>(
        `SELECT id, price FROM services WHERE id IN (${placeholders})`,
        serviceIds
      );
      
      // Create a map of service prices
      const servicePriceMap = new Map(services.map((s: any) => [s.id, s.price]));
      
      // Insert actual services for each selected service
      for (let i = 0; i < serviceIds.length; i++) {
        const serviceId = serviceIds[i];
        const price = servicePriceMap.get(serviceId) || 0;
        const staffId = selected_staffIds && selected_staffIds[i] ? Number(selected_staffIds[i]) : null;
        
        await execute(
          `INSERT INTO appointment_actualtaken_services 
           (appointment_id, service_id, doneby_staff_id, status, price) 
           VALUES (?, ?, ?, 'scheduled', ?)`,
          [appointmentId, serviceId, staffId, price]
        );
      }
    }
  }

  return NextResponse.json({ id: appointmentId })
}
