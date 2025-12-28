import { NextResponse } from "next/server"
import { execute, query } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

type Item = {
  service_id: number
  doneby_staff_id?: number | null
  price?: number | null
  notes?: string | null
  status?: "scheduled" | "in_service" | "completed" | "canceled"
}

// GET /api/appointments/[id]/actual-services
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const appointmentId = Number(id)
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 })
  }

  const rows = await query<any>(
    `SELECT aas.*, 
            s.name AS service_name,
            s.gst_percentage
     FROM appointment_actualtaken_services aas
     LEFT JOIN services s ON aas.service_id = s.id
     WHERE aas.appointment_id = ?
     ORDER BY aas.id DESC`,
    [appointmentId],
  )
  return NextResponse.json(rows)
}

// POST /api/appointments/[id]/actual-services
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const appointmentId = Number(id)
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 })
  }

  const currentUser = await getCurrentUser()
  const body = await req.json().catch(() => ({}))
  const items: Item[] = Array.isArray(body?.items) ? body.items : []
  if (!items.length) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 })
  }

  // Basic validation
  for (const it of items) {
    if (!Number.isFinite(it.service_id)) {
      return NextResponse.json({ error: "service_id is required for each item" }, { status: 400 })
    }
    
    // Validate: Cannot mark as completed without staff assignment
    if (it.status === "completed" && !it.doneby_staff_id) {
      return NextResponse.json(
        { error: "Cannot mark service as completed without assigning a staff member." },
        { status: 400 }
      )
    }
    
    // Staff can only add services with their own staff ID
    if (currentUser?.role === 'staff' && currentUser?.user_id) {
      if (!it.doneby_staff_id || Number(it.doneby_staff_id) !== currentUser.user_id) {
        return NextResponse.json({ error: "Staff can only add services assigned to themselves" }, { status: 403 })
      }
    }
  }

  // Bulk insert
  const cols = "(appointment_id, service_id, doneby_staff_id, status, price, notes)"
  const placeholders = items.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")
  const values: any[] = []
  for (const it of items) {
    values.push(
      appointmentId,
      Number(it.service_id),
      it.doneby_staff_id != null ? Number(it.doneby_staff_id) : null,
      it.status ?? "completed",
      it.price != null ? Number(it.price) : null,
      it.notes ?? null,
    )
  }

  const res: any = await execute(`INSERT INTO appointment_actualtaken_services ${cols} VALUES ${placeholders}`, values)

  return NextResponse.json({ inserted: res.affectedRows || items.length })
}

// DELETE /api/appointments/[id]/actual-services
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const appointmentId = Number(id)
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 })
  }
  
  const currentUser = await getCurrentUser()
  const body = await req.json().catch(() => ({}))
  const ids: number[] = Array.isArray(body?.ids) ? body.ids : []
  if (!ids.length) {
    return NextResponse.json({ error: "No ids provided" }, { status: 400 })
  }
  
  // Staff can only delete their own assigned services
  if (currentUser?.role === 'staff' && currentUser?.user_id) {
    const res: any = await execute(
      `DELETE FROM appointment_actualtaken_services WHERE appointment_id = ? AND doneby_staff_id = ? AND id IN (${ids.map(() => "?").join(",")})`,
      [appointmentId, currentUser.user_id, ...ids],
    )
    return NextResponse.json({ deleted: res.affectedRows || 0 })
  }
  
  // Admin/receptionist can delete any services
  const res: any = await execute(
    `DELETE FROM appointment_actualtaken_services WHERE appointment_id = ? AND id IN (${ids.map(() => "?").join(",")})`,
    [appointmentId, ...ids],
  )
  return NextResponse.json({ deleted: res.affectedRows || 0 })
}

// PATCH /api/appointments/[id]/actual-services
export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const appointmentId = Number(id)
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 })
  }
  
  const currentUser = await getCurrentUser()
  const body = await req.json().catch(() => ({}))
  const items: any[] = Array.isArray(body?.items) ? body.items : []
  if (!items.length) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 })
  }
  
  let updated = 0
  for (const it of items) {
    if (!Number.isFinite(it.id)) continue
    
    // Staff restrictions
    if (currentUser?.role === 'staff' && currentUser?.user_id) {
      // First check if this service belongs to the staff member
      const existing = await query<any>(
        `SELECT doneby_staff_id FROM appointment_actualtaken_services WHERE id = ? AND appointment_id = ?`,
        [it.id, appointmentId]
      )
      
      if (!existing.length || existing[0].doneby_staff_id !== currentUser.user_id) {
        continue // Skip services not assigned to this staff member
      }
      
      // Staff cannot change the assigned staff ID
      if ("doneby_staff_id" in it && Number(it.doneby_staff_id) !== currentUser.user_id) {
        return NextResponse.json({ error: "Staff cannot reassign services to other staff members" }, { status: 403 })
      }
    }
    
    // Validate: Cannot mark as completed without staff assignment
    if ("status" in it && it.status === "completed") {
      // Check current staff assignment
      const existing = await query<any>(
        `SELECT doneby_staff_id FROM appointment_actualtaken_services WHERE id = ? AND appointment_id = ?`,
        [it.id, appointmentId]
      )
      
      const staffId = "doneby_staff_id" in it ? it.doneby_staff_id : (existing.length > 0 ? existing[0].doneby_staff_id : null)
      
      if (!staffId) {
        return NextResponse.json(
          { error: "Cannot mark service as completed without assigning a staff member." },
          { status: 400 }
        )
      }
    }
    
    const fields = []
    const values = []
    if ("doneby_staff_id" in it) {
      fields.push("doneby_staff_id = ?")
      values.push(it.doneby_staff_id != null ? Number(it.doneby_staff_id) : null)
    }
    if ("price" in it) {
      fields.push("price = ?")
      values.push(it.price != null && it.price !== "" ? Number(it.price) : null)
    }
    if ("notes" in it) {
      fields.push("notes = ?")
      values.push(it.notes ?? null)
    }
    if ("status" in it) {
      fields.push("status = ?")
      values.push(it.status ?? null)
    }
    if ("service_id" in it) {
      fields.push("service_id = ?")
      values.push(Number(it.service_id))
    }
    if (!fields.length) continue
    
    // For staff, add additional WHERE clause
    if (currentUser?.role === 'staff' && currentUser?.user_id) {
      values.push(appointmentId, it.id, currentUser.user_id)
      const res: any = await execute(
        `UPDATE appointment_actualtaken_services SET ${fields.join(", ")} WHERE appointment_id = ? AND id = ? AND doneby_staff_id = ?`,
        values,
      )
      updated += res.affectedRows || 0
    } else {
      values.push(appointmentId, it.id)
      const res: any = await execute(
        `UPDATE appointment_actualtaken_services SET ${fields.join(", ")} WHERE appointment_id = ? AND id = ?`,
        values,
      )
      updated += res.affectedRows || 0
    }
  }
  return NextResponse.json({ updated })
}
