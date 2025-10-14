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
  const { first_name, last_name, email = null, phone = null, marketing_opt_in = 0 } = body
  if (!first_name || !last_name)
    return NextResponse.json({ error: "first_name and last_name required" }, { status: 400 })
  try {
    const result: any = await execute(
      "INSERT INTO customers (first_name, last_name, email, phone, marketing_opt_in) VALUES (?, ?, ?, ?, ?)",
      [first_name.trim(), last_name.trim(), email, phone, Number(!!marketing_opt_in)],
    )
    return NextResponse.json({ id: result.insertId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 })
  }
}
