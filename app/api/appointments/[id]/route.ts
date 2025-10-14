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

// Add PATCH handler to support partial updates and customer update
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json().catch(() => ({}) as any)

  const { status, notes, scheduled_start, scheduled_end } = body as {
    status?: string
    notes?: string | null
    scheduled_start?: string | Date | null
    scheduled_end?: string | Date | null
  }

  // Build dynamic update for appointments
  const setParts: string[] = []
  const paramsArr: any[] = []

  if (typeof status !== "undefined") {
    setParts.push("status=?")
    paramsArr.push(status)
  }
  if (typeof notes !== "undefined") {
    setParts.push("notes=?")
    paramsArr.push(notes)
  }
  if (typeof scheduled_start !== "undefined") {
    setParts.push("scheduled_start=?")
    paramsArr.push(scheduled_start ? new Date(scheduled_start) : null)
  }
  if (typeof scheduled_end !== "undefined") {
    setParts.push("scheduled_end=?")
    paramsArr.push(scheduled_end ? new Date(scheduled_end) : null)
  }

  if (setParts.length > 0) {
    await execute(`UPDATE appointments SET ${setParts.join(", ")} WHERE id=?`, [...paramsArr, id])
  }

  // Optionally update linked customer (name, phone, email)
  if (body?.customer && typeof body.customer === "object") {
    const apptRows = await query<{ customer_id: number }>("SELECT customer_id FROM appointments WHERE id=?", [id])
    if (apptRows.length) {
      const customerId = apptRows[0].customer_id
      const name: string = (body.customer.name || "").trim()
      const phone: string | undefined = typeof body.customer.phone === "string" ? body.customer.phone.trim() : undefined
      const email: string | undefined = typeof body.customer.email === "string" ? body.customer.email.trim() : undefined

      // Split name into first_name + last_name
      let first_name: string | undefined
      let last_name: string | undefined
      if (name) {
        const parts = name.split(" ")
        first_name = parts.shift() || ""
        last_name = parts.join(" ") || ""
      }

      const custSet: string[] = []
      const custParams: any[] = []
      if (typeof first_name !== "undefined") {
        custSet.push("first_name=?")
        custParams.push(first_name)
      }
      if (typeof last_name !== "undefined") {
        custSet.push("last_name=?")
        custParams.push(last_name)
      }
      if (typeof phone !== "undefined") {
        custSet.push("phone=?")
        custParams.push(phone || null)
      }
      if (typeof email !== "undefined") {
        custSet.push("email=?")
        custParams.push(email || null)
      }
      if (custSet.length > 0) {
        await execute(`UPDATE customers SET ${custSet.join(", ")} WHERE id=?`, [...custParams, customerId])
      }
    }
  }

  return NextResponse.json({ id })
}
