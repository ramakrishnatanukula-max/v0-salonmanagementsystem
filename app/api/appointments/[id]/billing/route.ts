import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET /api/appointments/[id]/billing
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id);
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
  }
  const rows = await query(
    "SELECT * FROM appointment_billing WHERE appointment_id = ?",
    [appointmentId]
  );
  return NextResponse.json(rows[0] || null);
}

// POST /api/appointments/[id]/billing
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id);
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
  }
  const body = await req.json();
  const { total_amount, paid_amount, payment_method, payment_status, notes, appointment_actualtaken_services_Id } = body;
  if (!appointment_actualtaken_services_Id) {
    return NextResponse.json({ error: "appointment_actualtaken_services_Id is required" }, { status: 400 });
  }
  const res: any = await execute(
    `INSERT INTO appointment_billing (appointment_id, appointment_actualtaken_services_Id, total_amount, paid_amount, payment_method, payment_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [appointmentId, appointment_actualtaken_services_Id, total_amount, paid_amount, payment_method, payment_status, notes]
  );
  return NextResponse.json({ inserted: res.insertId });
}

// PATCH /api/appointments/[id]/billing
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id);
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
  }
  const body = await req.json();
  const fields = [];
  const values = [];
  for (const key of ["appointment_actualtaken_services_Id", "total_amount", "paid_amount", "payment_method", "payment_status", "notes"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }
  if (!fields.length) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  values.push(appointmentId);
  const res: any = await execute(
    `UPDATE appointment_billing SET ${fields.join(", ")} WHERE appointment_id = ?`,
    values
  );
  return NextResponse.json({ updated: res.affectedRows });
}
