import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const result = await query<any[]>(
    "SELECT id, name, CAST(is_active AS UNSIGNED) AS is_active FROM service_categories ORDER BY id ASC",
  )
  const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name } = body || {}
  console.log("Creating category:", name)
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  try {
    const result = await query("INSERT INTO service_categories (name, is_active) VALUES (?, 1)", [
      name.trim(),
    ])
    // @ts-ignore
    const id = result.insertId
    return NextResponse.json({ id, name, is_active: 1 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 })
  }
}
