"use client"
import { Plus } from "lucide-react"
import React, { useMemo, useState } from "react"
import useSWR from "swr"

const fetcher = (u: string) => fetch(u).then((r) => r.json())
const fmt = (d: Date) => d.toISOString().slice(0, 10)
const fmtDisplay = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })

export default function AppointmentsPage() {
  const [date, setDate] = useState(fmt(new Date()))
  const { data: appts, mutate } = useSWR(`/api/appointments?date=${date}`, fetcher)
  const { data: services } = useSWR("/api/services", fetcher)
  const { data: staff } = useSWR("/api/staff", fetcher)

  const [showForm, setShowForm] = useState(false)
  const [detailsId, setDetailsId] = useState<number | null>(null)

  // Maps for quick lookup
  const serviceMap = useMemo(() => {
    const map: Record<number, string> = {}
    ;(Array.isArray(services) ? services : []).forEach((s: any) => (map[s.id] = s.name))
    return map
  }, [services])
  const staffMap = useMemo(() => {
    const map: Record<number, string> = {}
    ;(Array.isArray(staff) ? staff : []).forEach(
      (st: any) => (map[st.id] = st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()),
    )
    return map
  }, [staff])

  // 13-day calendar: today ±6 days
  const days = useMemo(() => {
    const base = new Date(date)
    const out: string[] = []
    for (let i = -4; i <= 4; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      out.push(fmt(d))
    }
    return out
  }, [date])

  // Delete appointment handler
  async function remove(id: number) {
    if (!confirm("Delete this appointment?")) return
    await fetch(`/api/appointments/${id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <main className="min-h-screen bg-gradient-to-tr from-green-100 via-blue-50 to-pink-100 p-0 relative flex flex-col">
      {/* Scrollable calendar bar */}
      <section className="sticky top-0 z-40 bg-white shadow-lg rounded-b-lg">
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {days.map((d) => (
            <button
              key={d}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg shadow-sm transition 
                            ${d === date ? "bg-blue-600 text-white font-bold scale-105" : "bg-gray-100 text-gray-600"} hover:bg-blue-100`}
              style={{ fontSize: 13 }}
              onClick={() => setDate(d)}
            >
              <span>{fmtDisplay(d)}</span>
              <span className="text-[10px]">{new Date(d).toLocaleDateString("en-US", { weekday: "short" })}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Appointments list */}
      <section className="mt-4 px-3 pb-24">
        {(Array.isArray(appts) ? appts : []).length === 0 && (
          <p className="text-center mt-12 text-gray-400 text-base animate-pulse">No appointments on this date</p>
        )}
        {(Array.isArray(appts) ? appts : []).map((a: any) => (
          <div
            key={a.id}
            className="bg-white rounded-2xl shadow mb-3 p-4 flex justify-between items-center transition hover:scale-[1.02] text-[15px]"
          >
            <div>
              <div className="font-bold text-base text-blue-700">{a.customer_name}</div>
              <div className="text-xs text-gray-400 mb-1">
                {fmtDisplay(a.scheduled_start)} •{" "}
                {new Date(a.scheduled_start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                • {a.status}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Services:</span>{" "}
                {(a.selected_servicesIds || []).map((sid: number) => serviceMap[sid] || sid).join(", ") || "-"}
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-medium text-green-600">Staff:</span>{" "}
                {(a.selected_staffIds || []).map((sid: number) => staffMap[sid] || sid).join(", ") || "-"}
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <button
                className="bg-blue-50 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs mb-1"
                title="Details"
                onClick={() => setDetailsId(a.id)}
              >
                Details
              </button>
              {/* Add Actual Services button */}
              <AddActualServicesButton
                appointmentId={a.id}
                services={services}
                staff={staff}
                onAdded={() => {
                  // optional: refresh anything if needed in future
                }}
              />
              <button
                className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs"
                onClick={() => remove(a.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
      <button
        onClick={() => setShowForm(true)}
        aria-label="Add new appointment"
        style={{ bottom: "14%" }}
        className="fixed bottom-10 right-7 z-50 bg-gradient-to-tr from-indigo-600 to-green-500 p-3.5 rounded-full shadow-2xl text-white text-3xl drop-shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <Plus size={24} />
      </button>

      {/* Form Modal isolated internal state */}
      {showForm && (
        <FormModalContainer
          services={services}
          staff={staff}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            mutate()
          }}
        />
      )}

      {/* Details Modal */}
      {detailsId !== null && (
        <DetailsModal
          appt={(Array.isArray(appts) ? appts : []).find((a) => a.id === detailsId)}
          onClose={() => setDetailsId(null)}
        />
      )}
    </main>
  )
}

// Form Modal Container with independent internal state (prevents parent re-renders messing inputs)
function FormModalContainer({
  services,
  staff,
  onClose,
  onCreated,
}: {
  services: any[]
  staff: any[]
  onClose: () => void
  onCreated: () => void
}) {
  const [customer, setCustomer] = useState({ first_name: "", last_name: "", email: "", phone: "" })
  const [notes, setNotes] = useState("")
  const [time, setTime] = useState("10:00")
  const [date, setDate] = useState(() => {
    const nowISO = new Date().toISOString().slice(0, 10)
    return nowISO
  })
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [selectedStaff, setSelectedStaff] = useState<number[]>([])

  function toggle<T extends number>(arr: T[], value: T): T[] {
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        notes,
        date,
        time,
        selected_servicesIds: selectedServices,
        selected_staffIds: selectedStaff,
      }),
    })
    if (res.ok) {
      onCreated()
    }
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <form
        onSubmit={create}
        className="bg-white flex flex-col p-6 pt-12 max-h-full overflow-y-auto flex-grow relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 text-3xl font-bold text-gray-500 hover:text-gray-900"
        >
          &times;
        </button>
        <h2 className="text-2xl font-semibold mb-4">New Appointment</h2>
        <input
          className="border rounded px-3 py-2 text-sm mb-3"
          placeholder="First name"
          value={customer.first_name}
          onChange={(e) => setCustomer((c) => ({ ...c, first_name: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-sm mb-3"
          placeholder="Last name"
          value={customer.last_name}
          onChange={(e) => setCustomer((c) => ({ ...c, last_name: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-sm mb-3"
          placeholder="Phone"
          value={customer.phone}
          onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-sm mb-3"
          placeholder="Email (optional)"
          value={customer.email}
          onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-2 mb-3">
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="time"
            className="border rounded px-3 py-2 text-sm"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <label className="text-sm font-medium mb-1">Select Services</label>
        <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto">
          {(Array.isArray(services) ? services : []).map((s: any) => (
            <button
              type="button"
              key={s.id}
              className={`px-3 py-2 rounded-2xl border text-sm shadow-sm ${
                selectedServices.includes(s.id) ? "bg-blue-700 text-white font-bold" : "bg-gray-50 text-blue-600"
              }`}
              onClick={() => setSelectedServices((arr) => toggle(arr, s.id))}
            >
              {s.name}
            </button>
          ))}
        </div>
        <label className="text-sm font-medium mb-1">Select Staff</label>
        <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto">
          {(Array.isArray(staff) ? staff : []).map((st: any) => (
            <button
              type="button"
              key={st.id}
              className={`px-3 py-2 rounded-2xl border text-sm shadow-sm ${
                selectedStaff.includes(st.id) ? "bg-green-600 text-white font-bold" : "bg-gray-50 text-green-700"
              }`}
              onClick={() => setSelectedStaff((arr) => toggle(arr, st.id))}
            >
              {st.name}
            </button>
          ))}
        </div>
        <textarea
          className="border rounded px-3 py-2 text-sm mb-5 flex-grow resize-none"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
        <button
          type="submit"
          className="bg-gradient-to-tr from-blue-600 to-green-400 text-white rounded-lg px-5 py-3 font-bold shadow"
        >
          Create Appointment
        </button>
      </form>
    </div>
  )
}

// Details Modal component unchanged
function DetailsModal({ appt, onClose }: { appt: any; onClose: () => void }) {
  const serviceMap = useMemo(() => {
    const map: Record<number, string> = {}
    ;(appt.services || []).forEach((s: any) => (map[s.id] = s.name))
    return map
  }, [appt.services])

  const staffMap = useMemo(() => {
    const map: Record<number, string> = {}
    ;(appt.staff || []).forEach(
      (st: any) => (map[st.id] = st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()),
    )
    return map
  }, [appt.staff])

  if (!appt) return null

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col" onClick={onClose}>
      <div
        className="bg-white flex flex-col p-6 pt-12 max-h-full overflow-y-auto relative flex-grow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 text-3xl font-bold text-gray-500 hover:text-gray-900"
        >
          &times;
        </button>
        <h2 className="text-2xl font-semibold mb-4">Appointment Details</h2>
        <div className="space-y-4 text-base text-gray-700">
          <div>
            <b>Customer:</b> {appt.customer_name}
          </div>
          <div>
            <b>Phone:</b> {appt.customer?.phone || "-"}
          </div>
          <div>
            <b>Email:</b> {appt.customer?.email || "-"}
          </div>
          <div>
            <b>Date:</b> {new Date(appt.scheduled_start).toLocaleDateString()}
          </div>
          <div>
            <b>Time:</b> {new Date(appt.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div>
            <b>Status:</b> {appt.status}
          </div>
          <div>
            <b>Notes:</b> {appt.notes || "-"}
          </div>
          <div>
            <b>Services:</b>{" "}
            {(appt.selected_servicesIds || []).map((sid: number) => serviceMap[sid] || sid).join(", ") || "-"}
          </div>
          <div>
            <b>Staff:</b> {(appt.selected_staffIds || []).map((sid: number) => staffMap[sid] || sid).join(", ") || "-"}
          </div>
          <div>
            <b>Created:</b> {appt.created_at ? new Date(appt.created_at).toLocaleString() : "-"}
          </div>
          <div>
            <b>Updated:</b> {appt.updated_at ? new Date(appt.updated_at).toLocaleString() : "-"}
          </div>
        </div>
      </div>
    </div>
  )
}

// New component for button + modal to add multiple actual services
function AddActualServicesButton({
  appointmentId,
  services,
  staff,
  onAdded,
}: {
  appointmentId: number
  services: any[]
  staff: any[]
  onAdded?: () => void
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button
        className="bg-green-50 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-xs"
        onClick={() => setOpen(true)}
      >
        Add Actual Services
      </button>
      {open && (
        <ActualServicesModal
          appointmentId={appointmentId}
          services={services}
          staff={staff}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false)
            onAdded?.()
          }}
        />
      )}
    </>
  )
}

// Modal that supports multiple rows: service + staff + price + notes + status
function ActualServicesModal({
  appointmentId,
  services,
  staff,
  onClose,
  onSaved,
}: {
  appointmentId: number
  services: any[]
  staff: any[]
  onClose: () => void
  onSaved: () => void
}) {
  type Row = {
    service_id: number | ""
    doneby_staff_id: number | "" | null
    price: string
    notes: string
    status: "scheduled" | "in_service" | "completed" | "canceled"
  }
  const emptyRow: Row = {
    service_id: "",
    doneby_staff_id: "",
    price: "",
    notes: "",
    status: "completed",
  }
  const [rows, setRows] = React.useState<Row[]>([emptyRow])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], ...patch }
      return next
    })
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow])
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const items = rows
        .filter((r) => r.service_id !== "")
        .map((r) => ({
          service_id: Number(r.service_id),
          doneby_staff_id: r.doneby_staff_id === "" || r.doneby_staff_id === null ? null : Number(r.doneby_staff_id),
          price: r.price !== "" ? Number(r.price) : null,
          notes: r.notes || null,
          status: r.status,
        }))
      if (!items.length) {
        setError("Please add at least one service.")
        setSaving(false)
        return
      }
      const res = await fetch(`/api/appointments/${appointmentId}/actual-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Failed to save")
      }
      onSaved()
    } catch (e: any) {
      setError(e.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-5 w-[95vw] max-w-2xl max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add Actual Services</h3>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-black">
            &times;
          </button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-start border rounded p-2">
              <select
                className="border rounded px-2 py-2 text-sm"
                value={row.service_id}
                onChange={(e) => updateRow(i, { service_id: e.target.value })}
                aria-label="Service"
              >
                <option value="">Select service</option>
                {(Array.isArray(services) ? services : []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded px-2 py-2 text-sm"
                value={row.doneby_staff_id ?? ""}
                onChange={(e) => updateRow(i, { doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value) })}
                aria-label="Staff"
              >
                <option value="">Select staff (optional)</option>
                {(Array.isArray(staff) ? staff : []).map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
                  </option>
                ))}
              </select>

              <input
                className="border rounded px-2 py-2 text-sm"
                type="number"
                step="0.01"
                placeholder="Price (optional)"
                value={row.price}
                onChange={(e) => updateRow(i, { price: e.target.value })}
                aria-label="Price"
              />

              <select
                className="border rounded px-2 py-2 text-sm"
                value={row.status}
                onChange={(e) => updateRow(i, { status: e.target.value as Row["status"] })}
                aria-label="Status"
              >
                <option value="scheduled">scheduled</option>
                <option value="in_service">in_service</option>
                <option value="completed">completed</option>
                <option value="canceled">canceled</option>
              </select>

              <div className="flex gap-2">
                <button type="button" className="border rounded px-3 py-2 text-sm" onClick={() => removeRow(i)}>
                  Remove
                </button>
              </div>

              <textarea
                className="border rounded px-2 py-2 text-sm md:col-span-5"
                placeholder="Notes (optional)"
                value={row.notes}
                onChange={(e) => updateRow(i, { notes: e.target.value })}
                rows={2}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <button className="border rounded px-4 py-2 text-sm" type="button" onClick={addRow}>
            + Add another service
          </button>
          <div className="flex gap-2">
            <button className="border rounded px-4 py-2 text-sm" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className="bg-blue-600 text-white rounded px-4 py-2 text-sm disabled:opacity-60"
              type="button"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
