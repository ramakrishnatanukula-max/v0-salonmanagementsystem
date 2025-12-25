import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Update family member
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, gender, age, age_group } = body

    await query(
      "UPDATE family_members SET name = ?, gender = ?, age = ?, age_group = ? WHERE id = ?",
      [name, gender, age || null, age_group, id]
    )

    return NextResponse.json({ message: "Family member updated" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Delete family member
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await query("DELETE FROM family_members WHERE id = ?", [id])
    return NextResponse.json({ message: "Family member deleted" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
