import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { setSessionCookie, signJWT } from "@/lib/auth"

type Body = { mobile: string }

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const mobile = (body.mobile || "").trim()
    if (!/^\+?\d{7,15}$/.test(mobile)) {
      return NextResponse.json({ error: "invalid mobile format" }, { status: 400 })
    }

    const users = await query<{ mobile: string; role: "admin" | "receptionist" | "staff"; name: string | null }>(
      "SELECT mobile, role, name FROM users WHERE mobile = ?",
      [mobile],
    )
    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const u = users[0]
    const token = signJWT({ sub: u.mobile, role: u.role, name: u.name || null })
    await setSessionCookie(token)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
