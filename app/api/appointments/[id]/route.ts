import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const rows = await query<any>("SELECT * FROM appointments WHERE id = ?", [id])
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json().catch(() => ({}))
  const { status, notes, scheduled_start, selected_servicesIds, selected_staffIds } = body
  await execute(
    "UPDATE appointments SET status=?, notes=?, scheduled_start=?, selected_servicesIds=CAST(? AS JSON), selected_staffIds=CAST(? AS JSON) WHERE id=?",
    [
      status,
      notes,
      scheduled_start ? new Date(scheduled_start) : null,
      JSON.stringify(selected_servicesIds ?? []),
      JSON.stringify(selected_staffIds ?? []),
      id,
    ],
  )
  return NextResponse.json({ id })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  await execute("DELETE FROM appointments WHERE id = ?", [id])
  return NextResponse.json({ ok: true })
}
