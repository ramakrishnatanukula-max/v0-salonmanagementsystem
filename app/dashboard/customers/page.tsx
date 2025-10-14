"use client"

import type React from "react"

import useSWR from "swr"
import { useState } from "react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function CustomersPage() {
  const { data, mutate } = useSWR("/api/customers", fetcher)
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", marketing_opt_in: false })
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<any>({})
  async function create(e: React.FormEvent) {
    e.preventDefault()
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, marketing_opt_in: form.marketing_opt_in ? 1 : 0 }),
    })
    setForm({ first_name: "", last_name: "", email: "", phone: "", marketing_opt_in: false })
    mutate()
  }
  async function save(id: number) {
    await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    })
    setEditId(null)
    mutate()
  }
  async function remove(id: number) {
    if (!confirm("Delete this customer?")) return
    await fetch(`/api/customers/${id}`, { method: "DELETE" })
    mutate()
  }
  return (
    <main className="p-4 max-w-screen-sm mx-auto">
      <h1 className="text-xl font-semibold mb-3">Customers</h1>
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.marketing_opt_in}
            onChange={(e) => setForm((f) => ({ ...f, marketing_opt_in: e.target.checked }))}
          />
          Marketing opt-in
        </label>
        <button className="bg-black text-white rounded px-4 py-2 text-sm">Add Customer</button>
      </form>

      <section className="flex flex-col gap-2">
        {(data || []).map((c: any) => (
          <article key={c.id} className="border rounded p-3">
            {editId === c.id ? (
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
                <div className="flex gap-2">
                  <button className="bg-black text-white rounded px-3 py-2 text-sm" onClick={() => save(c.id)}>
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
                    {c.first_name} {c.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.email || "—"} • {c.phone || "—"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="border rounded px-3 py-2 text-sm"
                    onClick={() => {
                      setEditId(c.id)
                      setEdit(c)
                    }}
                  >
                    Edit
                  </button>
                  <button className="text-red-600 text-sm" onClick={() => remove(c.id)}>
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
