import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  // Get staff members
  const rows = await query<any>(
    "SELECT id, name, mobile AS phone, email, role, created_at FROM users WHERE role = 'staff' ORDER BY name",
  )
  
  // Get service capabilities for each staff member
  const staffWithServices = await Promise.all(
    rows.map(async (staff) => {
      const services = await query<any>(
        "SELECT service_id FROM staff_services WHERE mobile = ?",
        [staff.phone]
      )
      return {
        ...staff,
        service_ids: services.map((s: any) => s.service_id)
      }
    })
  )
  
  return NextResponse.json(staffWithServices)
}
