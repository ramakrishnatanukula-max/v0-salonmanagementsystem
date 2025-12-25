import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get("phone")

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Find customer by mobile number
    const customers = await query(
      "SELECT id, first_name, last_name, email, phone FROM customers WHERE phone = ? LIMIT 1",
      [phone]
    )

    if (customers.length === 0) {
      return NextResponse.json({ found: false, customer: null })
    }

    const customer = customers[0]
    
    // Get family members for this customer
    const familyMembers = await query(
      "SELECT id, name, gender, age, age_group, relation FROM family_members WHERE customer_id = ? ORDER BY created_at DESC",
      [customer.id]
    )

    return NextResponse.json({
      found: true,
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
        phone: customer.phone,
        familyMembers
      }
    })
  } catch (error: any) {
    console.error("Customer lookup error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
