import { NextResponse } from "next/server"
import { query } from "@/lib/db"

type Category = { id: number; name: string }
type Service = { id: number; name: string; category_id: number; price: string | number; duration_min: number | null }

export async function GET() {
  try {
    const categories = await query<Category>("SELECT id, name FROM service_categories ORDER BY name")
    const services = await query<Service>(
      "SELECT id, name, category_id, price, duration_min FROM services ORDER BY name",
    )

    const grouped = categories.map((c) => ({
      id: c.id,
      name: c.name,
      services: services.filter((s) => s.category_id === c.id),
    }))
    return NextResponse.json({ categories: grouped })
  } catch (e: any) {
    return NextResponse.json({ error: "Failed to load services meta" }, { status: 500 })
  }
}
