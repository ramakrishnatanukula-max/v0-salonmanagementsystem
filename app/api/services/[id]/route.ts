import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const [rows] = await query<any[]>(
    "SELECT s.*, c.name AS category_name FROM services s LEFT JOIN service_categories c ON s.category_id = c.id WHERE s.id = ?",
    [id],
  )
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json()
  const {
    name,
    category_id = null,
    description = null,
    duration_minutes = 30,
    base_price = 0,
    is_active = 1,
    allow_addons = 1,
  } = body || {}

  if (!name || typeof name !== "string") return NextResponse.json({ error: "Name required" }, { status: 400 })

  await query(
    `UPDATE services SET name = ?, category_id = ?, description = ?, duration_minutes = ?, base_price = ?, is_active = ?, allow_addons = ? WHERE id = ?`,
    [
      name.trim(),
      category_id ? Number(category_id) : null,
      description,
      Number(duration_minutes),
      Number(base_price),
      Number(is_active ? 1 : 0),
      Number(allow_addons ? 1 : 0),
      id,
    ],
  )
  return NextResponse.json({ id })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await query("DELETE FROM services WHERE id = ?", [id])
  return NextResponse.json({ ok: true })
}
