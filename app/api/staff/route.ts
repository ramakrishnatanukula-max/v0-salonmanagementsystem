import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

export async function GET() {
  const rows = await query<any>(
    "SELECT id, name, mobile AS phone, email, role, created_at FROM users WHERE role IN ('admin', 'staff', 'receptionist') ORDER BY name",
  )
  return NextResponse.json(rows)
}

// export async function POST(req: Request) {
//   const body = await req.json().catch(() => ({}))
//   const {
//     first_name,
//     last_name,
//     email = null,
//     phone = null,
//     role = "stylist",
//     is_active = 1,
//     allow_overbooking = 0,
//   } = body
//   if (!first_name || !last_name)
//     return NextResponse.json({ error: "first_name and last_name required" }, { status: 400 })
//   const result: any = await execute(
//     "INSERT INTO staff (first_name,last_name,email,phone,role,is_active,allow_overbooking) VALUES (?,?,?,?,?,?,?)",
//     [first_name.trim(), last_name.trim(), email, phone, role, Number(!!is_active), Number(!!allow_overbooking)],
//   )
//   return NextResponse.json({ id: result.insertId })
// }
