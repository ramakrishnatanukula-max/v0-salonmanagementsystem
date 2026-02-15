import { NextResponse } from "next/server"
import { query, execute } from "@/lib/db"

// GET current skills (service IDs) for a staff member
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = Number(idStr)

    // First get the staff member's mobile number
    const staffRows = await query<any>("SELECT mobile FROM users WHERE id = ? AND role = 'staff'", [id])
    if (!staffRows.length) {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const mobile = staffRows[0].mobile

    // Get assigned service IDs
    const rows = await query<any>(
        "SELECT service_id FROM staff_services WHERE mobile = ?",
        [mobile]
    )

    return NextResponse.json({
        staff_id: id,
        mobile,
        service_ids: rows.map((r: any) => r.service_id),
    })
}

// PUT - replace all skills for a staff member
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = Number(idStr)

    const body = await req.json().catch(() => ({}))
    const { service_ids } = body

    if (!Array.isArray(service_ids)) {
        return NextResponse.json({ error: "service_ids must be an array" }, { status: 400 })
    }

    // Get the staff member's mobile
    const staffRows = await query<any>("SELECT mobile FROM users WHERE id = ? AND role = 'staff'", [id])
    if (!staffRows.length) {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    const mobile = staffRows[0].mobile

    // Delete existing skills
    await execute("DELETE FROM staff_services WHERE mobile = ?", [mobile])

    // Insert new skills
    if (service_ids.length > 0) {
        const values = service_ids.map((sid: number) => [mobile, sid])
        await execute(
            `INSERT INTO staff_services (mobile, service_id) VALUES ${values.map(() => "(?, ?)").join(", ")}`,
            values.flat()
        )
    }

    return NextResponse.json({
        ok: true,
        staff_id: id,
        service_ids,
        count: service_ids.length,
    })
}
