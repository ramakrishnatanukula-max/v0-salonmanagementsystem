import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Get family members for a customer
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const familyMembers = await query(
      "SELECT id, name, gender, age, age_group, relation, created_at FROM family_members WHERE customer_id = ? ORDER BY created_at DESC",
      [id]
    )
    return NextResponse.json(familyMembers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Add a family member
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, gender, age, age_group, relation } = body

    if (!name || !gender || !age_group || !relation) {
      return NextResponse.json(
        { error: "Name, gender, age group, and relation are required" },
        { status: 400 }
      )
    }

    const result = await query(
      "INSERT INTO family_members (customer_id, name, gender, age, age_group, relation) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, gender, age || null, age_group, relation]
    )

    return NextResponse.json({ id: result.insertId, name, gender, age, age_group, relation, message: "Family member added" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
