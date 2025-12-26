import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const rows = await query<any>(
    "SELECT id, name, mobile AS phone, email, role, created_at FROM users WHERE role = 'staff' ORDER BY name",
  )
  return NextResponse.json(rows)
}
