import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: Request) {
  const currentUser = await getCurrentUser()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date") // YYYY-MM-DD
  const customer_id = searchParams.get("customer_id") // Filter by customer
  
  // Build WHERE clause
  let whereConditions = []
  let params: any[] = []
  
  if (date) {
    whereConditions.push("DATE(a.scheduled_start)=?")
    params.push(date)
  }
  
  if (customer_id) {
    whereConditions.push("a.customer_id=?")
    params.push(customer_id)
  }
  
  // For staff role, filter by assigned staff in actual services
  if (currentUser?.role === 'staff' && currentUser?.user_id) {
    whereConditions.push(`a.id IN (SELECT DISTINCT appointment_id FROM appointment_actualtaken_services WHERE doneby_staff_id = ?)`)
    params.push(currentUser.user_id)
  }
  
  const where = whereConditions.length > 0 ? "WHERE " + whereConditions.join(" AND ") : ""
  
  const rows = await query<any>(
    `SELECT a.*, 
            CONCAT(c.first_name,' ',c.last_name) AS customer_name,
            c.phone,
            c.email,
            fm.id as family_member_id,
            fm.name as family_member_name,
            fm.age_group as family_member_age_group,
            ab.id as billing_id,
            ab.total_amount,
            ab.paid_amount,
            ab.payment_method,
            ab.payment_status,
            ab.notes as billing_notes,
            ab.updated_at as billing_date
     FROM appointments a
     JOIN customers c ON a.customer_id=c.id
     LEFT JOIN family_members fm ON a.family_member_id=fm.id
     LEFT JOIN appointment_billing ab ON ab.appointment_id=a.id
     ${where}
     ORDER BY a.scheduled_start ASC`,
    params,
  )
  
  // Transform to include billing and family member objects
  const enrichedRows = (rows || []).map((row: any) => ({
    ...row,
    family_member: row.family_member_id ? {
      id: row.family_member_id,
      name: row.family_member_name,
      age_group: row.family_member_age_group
    } : null,
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
    customer_id,
    family_member_id = null,
    is_for_self = true,
    notes = null,
    date, // YYYY-MM-DD
    time, // HH:mm
    selected_services = [], // [{serviceId, staffId}]
  } = body

  if (!customer_id || !date || !time) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!Array.isArray(selected_services) || selected_services.length === 0) {
    return NextResponse.json({ error: "At least one service is required" }, { status: 400 })
  }

  const scheduled_start = new Date(`${date}T${time}:00`)
  
  // Extract service IDs and staff IDs for the appointment record
  const selected_servicesIds = selected_services.map(s => s.serviceId)
  const selected_staffIds = selected_services.map(s => s.staffId)

  const appointmentRes: any = await execute(
    "INSERT INTO appointments (customer_id, family_member_id, is_for_self, scheduled_start, status, notes, selected_servicesIds, selected_staffIds) VALUES (?,?,?,?,?,?,CAST(? AS JSON),CAST(? AS JSON))",
    [
      customer_id,
      family_member_id,
      is_for_self ? 1 : 0,
      scheduled_start,
      "scheduled",
      notes,
      JSON.stringify(selected_servicesIds),
      JSON.stringify(selected_staffIds),
    ],
  )

  const appointmentId = appointmentRes.insertId;

  // Create actual services with assigned staff for each selected service
  if (selected_services.length > 0) {
    const serviceIds = selected_services.map((s: any) => Number(s.serviceId)).filter((id: number) => id > 0);
    
    if (serviceIds.length > 0) {
      const placeholders = serviceIds.map(() => '?').join(',');
      const services = await query<any>(
        `SELECT id, price FROM services WHERE id IN (${placeholders})`,
        serviceIds
      );
      
      // Create a map of service prices
      const servicePriceMap = new Map(services.map((s: any) => [s.id, s.price]));
      
      // Insert actual services with their assigned staff
      for (const selectedService of selected_services) {
        const serviceId = Number(selectedService.serviceId);
        const staffId = selectedService.staffId ? Number(selectedService.staffId) : null;
        const price = servicePriceMap.get(serviceId) || 0;
        
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
