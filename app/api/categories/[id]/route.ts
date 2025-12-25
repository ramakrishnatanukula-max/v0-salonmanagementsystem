import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const [rows] = await query<any[]>("SELECT * FROM service_categories WHERE id = ?", [id])
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await req.json()
  const { name } = body || {}
  if (!name || typeof name !== "string") return NextResponse.json({ error: "Name required" }, { status: 400 })
  await query("UPDATE service_categories SET name = ? WHERE id = ?", [
    name.trim(),
    id,
  ])
  return NextResponse.json({ id, name })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  await query("DELETE FROM service_categories WHERE id = ?", [id])
  return NextResponse.json({ ok: true })
}
