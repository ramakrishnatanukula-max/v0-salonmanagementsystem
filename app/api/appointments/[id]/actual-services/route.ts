import { NextResponse } from "next/server"
import { execute, query } from "@/lib/db"

type Item = {
  service_id: number
  doneby_staff_id?: number | null
  price?: number | null
  notes?: string | null
  status?: "scheduled" | "in_service" | "completed" | "canceled"
}

// GET /api/appointments/[id]/actual-services
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id)
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 })
  }

  const rows = await query<any>(
    `SELECT aas.*, s.name AS service_name
     FROM appointment_actualtaken_services aas
     LEFT JOIN services s ON aas.service_id = s.id
     WHERE aas.appointment_id = ?
     ORDER BY aas.id DESC`,
    [appointmentId],
  )
  return NextResponse.json(rows)
}

// POST /api/appointments/[id]/actual-services
// body: { items: Array<{service_id, doneby_staff_id?, price?, notes?, status?}> }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id)
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 })
  }

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
      it.price != null && it.price !== "" ? Number(it.price) : null,
      it.notes ?? null,
    )
  }

  const res: any = await execute(`INSERT INTO appointment_actualtaken_services ${cols} VALUES ${placeholders}`, values)

  return NextResponse.json({ inserted: res.affectedRows || items.length })
}
