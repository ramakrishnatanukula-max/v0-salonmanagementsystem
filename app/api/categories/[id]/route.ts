import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const rows = await query<any[]>("SELECT id, name, CAST(is_active AS UNSIGNED) AS is_active FROM service_categories WHERE id = ?", [id])
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await req.json()
  const { name, is_active } = body || {}

  // If only toggling active status
  if (is_active !== undefined && !name) {
    await query("UPDATE service_categories SET is_active = ? WHERE id = ?", [
      Number(is_active ? 1 : 0),
      id,
    ])
    return NextResponse.json({ id, is_active: is_active ? 1 : 0 })
  }

  if (!name || typeof name !== "string") return NextResponse.json({ error: "Name required" }, { status: 400 })

  if (is_active !== undefined) {
    await query("UPDATE service_categories SET name = ?, is_active = ? WHERE id = ?", [
      name.trim(),
      Number(is_active ? 1 : 0),
      id,
    ])
    return NextResponse.json({ id, name, is_active: is_active ? 1 : 0 })
  }

  await query("UPDATE service_categories SET name = ? WHERE id = ?", [
    name.trim(),
    id,
  ])
  return NextResponse.json({ id, name })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);

  // Soft delete — set is_active = 0
  await query("UPDATE service_categories SET is_active = 0 WHERE id = ?", [id])
  return NextResponse.json({ ok: true, message: "Category deactivated (soft deleted)" })
}
