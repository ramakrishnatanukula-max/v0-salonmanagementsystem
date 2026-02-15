import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("category_id")
  const sql =
    "SELECT s.*, CAST(s.is_active AS UNSIGNED) AS is_active, c.name AS category_name FROM services s LEFT JOIN service_categories c ON s.category_id = c.id" +
    (categoryId ? " WHERE s.category_id = ?" : "") +
    " ORDER BY s.name ASC"
  const result = await query<any[]>(sql, categoryId ? [Number(categoryId)] : [])
  // If result is [rows, fields], use result[0]. If it's just rows, use result.
  const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const {
    name,
    category_id = null,
    description = null,
    duration_minutes = 30,
    price = 0,
    gst_percentage = 0,
    is_active = 1,
  } = body || {}

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const result = await query(
    `INSERT INTO services (name, category_id, description, duration_minutes, price, gst_percentage, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      name.trim(),
      category_id ? Number(category_id) : null,
      description,
      Number(duration_minutes),
      Number(price),
      Number(gst_percentage),
      Number(is_active ? 1 : 0),
    ],
  )
  // @ts-ignore
  const id = result.insertId
  return NextResponse.json({ id })
}
