import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

export async function GET() {
  const rows = await query<any>(
    "SELECT id, first_name, last_name, email, phone, marketing_opt_in, created_at, updated_at FROM customers ORDER BY created_at DESC",
  )
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { first_name, last_name, email = null, phone = null, gender = null, marketing_opt_in = 0 } = body
  if (!first_name || !last_name)
    return NextResponse.json({ error: "first_name and last_name required" }, { status: 400 })
  
  try {
    // If phone is provided, check if customer already exists
    if (phone) {
      const existing = await query<any>(
        "SELECT id, first_name, last_name, email, phone FROM customers WHERE phone = ? LIMIT 1",
        [phone]
      )
      
      if (existing && existing.length > 0) {
        // Customer with this phone already exists, return their ID
        return NextResponse.json({ 
          id: existing[0].id,
          exists: true,
          message: "Customer with this phone number already exists"
        })
      }
    }
    
    // Create new customer
    const result: any = await execute(
      "INSERT INTO customers (first_name, last_name, email, phone, gender, marketing_opt_in) VALUES (?, ?, ?, ?, ?, ?)",
      [first_name.trim(), last_name.trim(), email, phone, gender, Number(!!marketing_opt_in)],
    )
    return NextResponse.json({ id: result.insertId, exists: false })
  } catch (e: any) {
    // Handle duplicate phone error gracefully
    if (e.code === 'ER_DUP_ENTRY' && e.message.includes('phone')) {
      return NextResponse.json({ error: "A customer with this phone number already exists" }, { status: 409 })
    }
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 })
  }
}
