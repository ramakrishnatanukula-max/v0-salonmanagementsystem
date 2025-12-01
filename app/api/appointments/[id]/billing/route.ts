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
      discount = 0, 
      final_amount, 
      tax_amount = 0,
      payment_method, 
      payment_status = "pending", 
      notes 
    } = body;

    if (!total_amount) {
      return NextResponse.json({ error: "total_amount is required" }, { status: 400 });
    }

    // Calculate final_amount if not provided
    const calculatedFinalAmount = final_amount || (Number(total_amount) - Number(discount));

    const res: any = await execute(
      `INSERT INTO appointment_billing 
       (appointment_id, total_amount, discount, final_amount, tax_amount, payment_method, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [appointmentId, total_amount, discount, calculatedFinalAmount, tax_amount, payment_method, payment_status, notes]
    );

    return NextResponse.json({ 
      id: res.insertId,
      appointment_id: appointmentId,
      total_amount,
      discount,
      final_amount: calculatedFinalAmount,
      tax_amount,
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

    const allowedFields = ["total_amount", "discount", "final_amount", "tax_amount", "payment_method", "payment_status", "notes"];
    
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

