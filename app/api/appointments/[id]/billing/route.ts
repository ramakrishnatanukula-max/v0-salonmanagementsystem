import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

// GET /api/appointments/[id]/billing
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id);
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
  }
  
  try {
    const rows = await query(
      "SELECT * FROM appointment_billing WHERE appointment_id = ?",
      [appointmentId]
    );
    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error("Billing GET error:", error);
    return NextResponse.json({ error: "Failed to fetch billing data" }, { status: 500 });
  }
}

// POST /api/appointments/[id]/billing
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id);
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
  }
  
  try {
    // Check if billing already exists for this appointment
    const existingBilling = await query(
      "SELECT id FROM appointment_billing WHERE appointment_id = ?",
      [appointmentId]
    );

    if (existingBilling && existingBilling.length > 0) {
      return NextResponse.json(
        { error: "Billing already exists for this appointment. Only one payment per appointment allowed." },
        { status: 409 }
      );
    }

    const body = await req.json();
    const { 
      total_amount,
      paid_amount,
      appointment_actualtaken_services_id,
      payment_method, 
      payment_status = "pending", 
      notes 
    } = body;

    if (!total_amount) {
      return NextResponse.json({ error: "total_amount is required" }, { status: 400 });
    }

    if (!appointment_actualtaken_services_id) {
      return NextResponse.json({ error: "appointment_actualtaken_services_id is required" }, { status: 400 });
    }

    // Use paid_amount if provided, otherwise default to 0
    const actualPaidAmount = paid_amount !== undefined ? paid_amount : 0;

    const res: any = await execute(
      `INSERT INTO appointment_billing 
       (appointment_id, appointment_actualtaken_services_id, total_amount, paid_amount, payment_method, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [appointmentId, appointment_actualtaken_services_id, total_amount, actualPaidAmount, payment_method, payment_status, notes]
    );

    return NextResponse.json({ 
      id: res.insertId,
      appointment_id: appointmentId,
      total_amount,
      paid_amount: actualPaidAmount,
      payment_method,
      payment_status,
      notes,
      success: true
    });
  } catch (error) {
    console.error("Billing POST error:", error);
    return NextResponse.json({ error: "Failed to save billing data", details: (error as any).message }, { status: 500 });
  }
}

// PATCH /api/appointments/[id]/billing
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const appointmentId = Number(params.id);
  if (!Number.isFinite(appointmentId)) {
    return NextResponse.json({ error: "Invalid appointment id" }, { status: 400 });
  }
  
  try {
    const body = await req.json();
    const fields = [];
    const values = [];

    const allowedFields = ["total_amount", "paid_amount", "payment_method", "payment_status", "notes"];
    
    for (const key of allowedFields) {
      if (key in body) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }

    if (!fields.length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(appointmentId);
    
    const res: any = await execute(
      `UPDATE appointment_billing SET ${fields.join(", ")} WHERE appointment_id = ?`,
      values
    );

    return NextResponse.json({ updated: res.affectedRows });
  } catch (error) {
    console.error("Billing PATCH error:", error);
    return NextResponse.json({ error: "Failed to update billing data", details: (error as any).message }, { status: 500 });
  }
}

