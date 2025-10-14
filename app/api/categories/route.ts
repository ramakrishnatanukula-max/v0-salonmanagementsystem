import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  const result = await query<any[]>(
    "SELECT id, name FROM service_categories ORDER BY id ASC",
  )
  // If result is [rows, fields], use result[0]. If it's just rows, use result.
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
    const result = await query("INSERT INTO service_categories (name) VALUES (?)", [
      name.trim(),
    ])
    // @ts-ignore
    const id = result.insertId
    return NextResponse.json({ id, name })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "DB error" }, { status: 500 })
  }
}
