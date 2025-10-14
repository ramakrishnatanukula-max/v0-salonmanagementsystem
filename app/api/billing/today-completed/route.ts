import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const showPaid = url.searchParams.get("showPaid") === "1";
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  let rows;
  if (showPaid) {
    // Show all appointments with a billing record for today
    rows = await query<any>(
      `SELECT a.*, CONCAT(c.first_name, ' ', c.last_name) AS customer_name, ab.payment_status, ab.total_amount, ab.paid_amount
       FROM appointments a
       LEFT JOIN customers c ON a.customer_id = c.id
       LEFT JOIN appointment_billing ab ON ab.appointment_id = a.id
       WHERE DATE(a.scheduled_start) = ? AND ab.id IS NOT NULL
       ORDER BY a.scheduled_start ASC`,
      [dateStr]
    );
  } else {
    // Only show completed appointments for today that do not have a billing record
    rows = await query<any>(
      `SELECT a.*, CONCAT(c.first_name, ' ', c.last_name) AS customer_name
       FROM appointments a
       LEFT JOIN customers c ON a.customer_id = c.id
       WHERE DATE(a.scheduled_start) = ? AND a.status = 'completed'
         AND NOT EXISTS (
           SELECT 1 FROM appointment_billing ab WHERE ab.appointment_id = a.id
         )
       ORDER BY a.scheduled_start ASC`,
      [dateStr]
    );
  }
  return NextResponse.json(rows);
}
