import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Show all completed appointments for today with their billing status
  const rows = await query<any>(
    `SELECT 
       a.*,
       CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
       c.email as customer_email,
       c.phone as customer_phone,
       ab.id as billing_id,
       ab.total_amount,
       ab.paid_amount,
       ab.payment_method,
       ab.payment_status,
       ab.notes as billing_notes,
       ab.updated_at as billing_date
     FROM appointments a
     LEFT JOIN customers c ON a.customer_id = c.id
     LEFT JOIN appointment_billing ab ON ab.appointment_id = a.id
     WHERE DATE(a.scheduled_start) = ? AND a.status = 'completed'
     ORDER BY a.scheduled_start ASC`,
    [dateStr]
  );

  // Transform to match expected structure
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
  }));

  return NextResponse.json(enrichedRows);
}
