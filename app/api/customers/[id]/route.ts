import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const rows = await query<any>("SELECT * FROM customers WHERE id = ?", [id])
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json().catch(() => ({}))
  const { first_name, last_name, email = null, phone = null, marketing_opt_in = 0 } = body
  if (!first_name || !last_name)
    return NextResponse.json({ error: "first_name and last_name required" }, { status: 400 })
  await execute("UPDATE customers SET first_name=?, last_name=?, email=?, phone=?, marketing_opt_in=? WHERE id=?", [
    first_name.trim(),
    last_name.trim(),
    email,
    phone,
    Number(!!marketing_opt_in),
    id,
  ])
  return NextResponse.json({ id })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await execute("DELETE FROM customers WHERE id = ?", [id])
  return NextResponse.json({ ok: true })
}
