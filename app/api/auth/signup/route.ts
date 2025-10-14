import { NextResponse } from "next/server"
import { execute, query } from "@/lib/db"

type Body = {
  name: string
  email?: string
  mobile: string
  role: "admin" | "receptionist" | "staff"
  services?: number[] // only if role=staff
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const name = (body.name || "").trim()
    const mobile = (body.mobile || "").trim()
    const email = (body.email || "").trim() || null
    const role = body.role

    if (!name || !mobile || !role) {
      return NextResponse.json({ error: "name, mobile, role are required" }, { status: 400 })
    }
    if (!/^\+?\d{7,15}$/.test(mobile)) {
      return NextResponse.json({ error: "invalid mobile format" }, { status: 400 })
    }
    if (!["admin", "receptionist", "staff"].includes(role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 })
    }

    const exists = await query<{ mobile: string }>("SELECT mobile FROM users WHERE mobile = ?", [mobile])
    if (exists.length > 0) {
      return NextResponse.json({ error: "Mobile already registered" }, { status: 409 })
    }

    await execute("INSERT INTO users (mobile, name, email, role) VALUES (?, ?, ?, ?)", [mobile, name, email, role])

    if (role === "staff" && Array.isArray(body.services) && body.services.length > 0) {
      const values = body.services.map((sid) => [mobile, sid])
      // bulk insert
      await execute(
        `INSERT INTO staff_services (mobile, service_id) VALUES ${values.map(() => "(?, ?)").join(", ")}`,
        values.flat(),
      )
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
