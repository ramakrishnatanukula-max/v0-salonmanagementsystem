import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"
import * as crypto from "crypto"

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const rows = await query<any>("SELECT id, name, mobile AS phone, email, role FROM users WHERE id = ?", [id])
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await req.json().catch(() => ({}))
  const {
    name,
    email = null,
    phone = null,
    role = "staff",
    password,
  } = body
  if (!name || !name.trim())
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  
  // Update user basic info
  await execute(
    "UPDATE users SET name=?, email=?, mobile=?, role=? WHERE id=?",
    [name.trim(), email, phone, role, id],
  )
  
  // If password is provided, update it
  if (password && password.trim()) {
    const hashedPassword = hashPassword(password.trim())
    await execute(
      "UPDATE users SET password=? WHERE id=?",
      [hashedPassword, id]
    )
  }
  
  return NextResponse.json({ id })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  await execute("DELETE FROM users WHERE id = ?", [id])
  return NextResponse.json({ ok: true })
}
