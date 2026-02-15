import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
    try {
        // Get all existing UNISL phone numbers to find the next available sequential ID
        const existingRows = await query<any>(
            `SELECT phone FROM customers WHERE phone LIKE 'UNISL%'`
        )
        const existingIds = new Set(existingRows.map((r: any) => r.phone))

        // Start from 1 and find the first unused sequential number
        let nextNumber = 1
        let nextId = `UNISL${String(nextNumber).padStart(5, "0")}`

        while (existingIds.has(nextId)) {
            nextNumber++
            nextId = `UNISL${String(nextNumber).padStart(5, "0")}`
        }

        return NextResponse.json({ nextId })
    } catch (error: any) {
        console.error("Next UNISL ID error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
