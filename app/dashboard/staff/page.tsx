"use client"

import type React from "react"

import useSWR from "swr"
import { useState } from "react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function StaffPage() {
  const { data, mutate } = useSWR("/api/staff", fetcher)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "stylist",
    is_active: true,
    allow_overbooking: false,
  })
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<any>({})

  async function create(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        is_active: form.is_active ? 1 : 0,
        allow_overbooking: form.allow_overbooking ? 1 : 0,
      }),
    })
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "stylist",
      is_active: true,
      allow_overbooking: false,
    })
    mutate()
  }
  async function save(id: number) {
    await fetch(`/api/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    })
    setEditId(null)
    mutate()
  }
  async function remove(id: number) {
    if (!confirm("Delete this staff?")) return
    await fetch(`/api/staff/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <main className="p-4 max-w-screen-sm mx-auto">
      <h1 className="text-xl font-semibold mb-3">Staff</h1>
      <form onSubmit={create} className="flex flex-col gap-2 mb-6">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
          />
        </div>
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Email (optional)"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          className="border rounded px-3 py-2 text-sm"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          <option value="admin">Admin</option>
          <option value="receptionist">Receptionist</option>
          <option value="stylist">Stylist</option>
          <option value="technician">Technician</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.allow_overbooking}
            onChange={(e) => setForm((f) => ({ ...f, allow_overbooking: e.target.checked }))}
          />
          Allow overbooking
        </label>
        <button className="bg-black text-white rounded px-4 py-2 text-sm">Add Staff</button>
      </form>

      <section className="flex flex-col gap-2">
        {(data || []).map((s: any) => (
          <article key={s.id} className="border rounded p-3">
            {editId === s.id ? (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    value={edit.first_name ?? ""}
                    onChange={(e) => setEdit((x: any) => ({ ...x, first_name: e.target.value }))}
                  />
                  <input
                    className="border rounded px-3 py-2 text-sm"
                    value={edit.last_name ?? ""}
                    onChange={(e) => setEdit((x: any) => ({ ...x, last_name: e.target.value }))}
                  />
                </div>
                <input
                  className="border rounded px-3 py-2 text-sm"
                  value={edit.email ?? ""}
                  onChange={(e) => setEdit((x: any) => ({ ...x, email: e.target.value }))}
                />
                <input
                  className="border rounded px-3 py-2 text-sm"
                  value={edit.phone ?? ""}
                  onChange={(e) => setEdit((x: any) => ({ ...x, phone: e.target.value }))}
                />
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={edit.role ?? "stylist"}
                  onChange={(e) => setEdit((x: any) => ({ ...x, role: e.target.value }))}
                >
                  <option value="admin">Admin</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="stylist">Stylist</option>
                  <option value="technician">Technician</option>
                </select>
                <div className="flex gap-2">
                  <button className="bg-black text-white rounded px-3 py-2 text-sm" onClick={() => save(s.id)}>
                    Save
                  </button>
                  <button className="border rounded px-3 py-2 text-sm" onClick={() => setEditId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">
                    {s.first_name} {s.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.role} • {s.email || "—"} • {s.phone || "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="border rounded px-3 py-2 text-sm"
                    onClick={() => {
                      setEditId(s.id)
                      setEdit(s)
                    }}
                  >
                    Edit
                  </button>
                  <button className="text-red-600 text-sm" onClick={() => remove(s.id)}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  )
}
