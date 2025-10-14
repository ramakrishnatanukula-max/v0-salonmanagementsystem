"use client"
import React, { useMemo, useState } from "react"
import useSWR from "swr"
import { Pencil, Trash2, Plus, X } from "lucide-react"

const fetcher = (u) => fetch(u).then((r) => r.json())
const fmt = (d) => d.toISOString().slice(0, 10)
const fmtDisplay = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })

export default function AppointmentsPage() {
  const [date, setDate] = useState(fmt(new Date()))
  const { data: appts, mutate } = useSWR(`/api/appointments?date=${date}`, fetcher)
  const { data: services } = useSWR("/api/services", fetcher)
  const { data: staff } = useSWR("/api/staff", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [detailsId, setDetailsId] = useState(null)

  const serviceMap = useMemo(() => {
    const map = {}
    ;(Array.isArray(services) ? services : []).forEach((s) => (map[s.id] = s.name))
    return map
  }, [services])
  const staffMap = useMemo(() => {
    const map = {}
    ;(Array.isArray(staff) ? staff : []).forEach(
      (st) => (map[st.id] = st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()),
    )
    return map
  }, [staff])

  const days = useMemo(() => {
    const base = new Date(date)
    const out = []
    for (let i = -4; i <= 4; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      out.push(fmt(d))
    }
    return out
  }, [date])

  async function remove(id) {
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
                ${d === date ? "bg-blue-600 text-white font-bold scale-105" : "bg-gray-100 text-gray-600"}
              `}
              onClick={() => setDate(d)}
              style={{ fontSize: 13 }}
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
        {(Array.isArray(appts) ? appts : []).map((a) => (
          <div key={a.id} className="bg-white rounded-2xl shadow mb-3 p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center gap-2">
              <div>
                <div className="font-bold text-base text-blue-700">{a.customer_name}</div>
                <div className="text-xs text-gray-400 mb-1">
                  {fmtDisplay(a.scheduled_start)} •
                  {new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                  {a.status}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium text-blue-600">Services:</span>{" "}
                  {(a.selected_servicesIds || []).map((sid) => serviceMap[sid] || sid).join(", ") || "-"}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-green-600">Staff:</span>{" "}
                  {(a.selected_staffIds || []).map((sid) => staffMap[sid] || sid).join(", ") || "-"}
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button
                  className="bg-blue-50 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded text-xs mb-1"
                  title="Details"
                  onClick={() => setDetailsId(a.id)}
                >
                  Details
                </button>
                <div>
                  <AddActualServicesButton
                    appointmentId={a.id}
                    services={services}
                    staff={staff}
                    onAdded={() => mutate()}
                  />
                </div>
                <button
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs"
                  onClick={() => remove(a.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
      <button
        onClick={() => setShowForm(true)}
        aria-label="Add new appointment"
        className="fixed bottom-24 right-7 z-50 bg-gradient-to-tr from-indigo-600 to-green-500 p-4 rounded-full shadow-xl text-white text-3xl focus:outline-none"
      >
        <Plus size={28} />
      </button>

      {/* Form Modal */}
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

// Add Actual Services button + modal
function AddActualServicesButton({ appointmentId, services, staff, onAdded }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button
        className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-medium"
        onClick={() => setOpen(true)}
      >
        Actuals
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

// CLEAN MODALS BELOW

function FormModalContainer({ services, staff, onClose, onCreated }) {
  const [customer, setCustomer] = useState({ first_name: "", last_name: "", email: "", phone: "" })
  const [notes, setNotes] = useState("")
  const [time, setTime] = useState("10:00")
  const [date, setDate] = useState(() => fmt(new Date()))
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedStaff, setSelectedStaff] = useState([])

  function toggle(arr, value) {
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
  }

  async function create(e) {
    e.preventDefault()
    await fetch("/api/appointments", {
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
    onCreated()
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        onSubmit={create}
        className="bg-white w-full h-full max-w-md mx-auto p-6 flex flex-col gap-3 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-blue-700">New Appointment</h2>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400">
            <X size={28} />
          </button>
        </div>
        <input
          className="border rounded px-3 py-2 text-base"
          placeholder="First name"
          value={customer.first_name}
          onChange={(e) => setCustomer((c) => ({ ...c, first_name: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-base"
          placeholder="Last name"
          value={customer.last_name}
          onChange={(e) => setCustomer((c) => ({ ...c, last_name: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-base"
          placeholder="Phone"
          value={customer.phone}
          onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
          required
        />
        <input
          className="border rounded px-3 py-2 text-base"
          placeholder="Email (optional)"
          value={customer.email}
          onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            className="border rounded px-3 py-2 text-base"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <input
            type="time"
            className="border rounded px-3 py-2 text-base"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <label className="text-base font-medium mt-1">Select Services</label>
        <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto">
          {(Array.isArray(services) ? services : []).map((s) => (
            <button
              type="button"
              key={s.id}
              className={`px-3 py-2 rounded-2xl border text-sm shadow-sm
                ${selectedServices.includes(s.id) ? "bg-blue-700 text-white font-bold" : "bg-gray-50 text-blue-600"}
              `}
              onClick={() => setSelectedServices((arr) => toggle(arr, s.id))}
            >
              {s.name}
            </button>
          ))}
        </div>
        <label className="text-base font-medium mt-1">Select Staff</label>
        <div className="flex flex-wrap gap-2 mb-2 max-h-24 overflow-y-auto">
          {(Array.isArray(staff) ? staff : []).map((st) => (
            <button
              type="button"
              key={st.id}
              className={`px-3 py-2 rounded-2xl border text-sm shadow-sm
                ${selectedStaff.includes(st.id) ? "bg-green-600 text-white font-bold" : "bg-gray-50 text-green-700"}
              `}
              onClick={() => setSelectedStaff((arr) => toggle(arr, st.id))}
            >
              {st.name}
            </button>
          ))}
        </div>
        <textarea
          className="border rounded px-3 py-2 text-base mb-2 resize-none"
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

function DetailsModal({ appt, onClose }) {
  const serviceMap = useMemo(() => {
    const map = {}
    ;(appt?.services || []).forEach((s) => (map[s.id] = s.name))
    return map
  }, [appt?.services])
  const staffMap = useMemo(() => {
    const map = {}
    ;(appt?.staff || []).forEach(
      (st) => (map[st.id] = st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()),
    )
    return map
  }, [appt?.staff])
  const [edit, setEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => ({
    status: appt?.status || "",
    date: appt ? new Date(appt.scheduled_start).toISOString().slice(0, 10) : "",
    time: appt ? new Date(appt.scheduled_start).toTimeString().slice(0, 5) : "",
    notes: appt?.notes || "",
    customer_name: appt?.customer_name || "",
    phone: appt?.customer?.phone || "",
    email: appt?.customer?.email || "",
  }))

  React.useEffect(() => {
    if (appt) {
      setForm({
        status: appt.status || "",
        date: new Date(appt.scheduled_start).toISOString().slice(0, 10),
        time: new Date(appt.scheduled_start).toTimeString().slice(0, 5),
        notes: appt.notes || "",
        customer_name: appt.customer_name || "",
        phone: appt.customer?.phone || "",
        email: appt.customer?.email || "",
      })
    }
  }, [appt])

  if (!appt) return null

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    // Combine date and time into ISO string
    const scheduled_start = new Date(`${form.date}T${form.time}`).toISOString()
    await fetch(`/api/appointments/${appt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        scheduled_start,
        notes: form.notes,
        customer: {
          name: form.customer_name,
          phone: form.phone,
          email: form.email,
        },
      }),
    })
    setSaving(false)
    setEdit(false)
    if (typeof window !== "undefined") window.location.reload() // or trigger mutate if you want to be more efficient
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white w-full h-full max-w-md mx-auto flex flex-col p-6 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 text-3xl font-bold text-gray-500 hover:text-gray-900"
        >
          <X size={28} />
        </button>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-semibold text-blue-700">Appointment Details</h2>
        </div>
        <form className="space-y-4 text-base text-gray-700" onSubmit={handleSave}>
          <div>
            <label className="block font-bold mb-1">Customer Name</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={form.customer_name}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Phone</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Email</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block font-bold mb-1">Date</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block font-bold mb-1">Time</label>
              <input
                type="time"
                className="border rounded px-3 py-2"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <label className="block font-bold mb-1">Status</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="scheduled">scheduled</option>
              <option value="in_service">in_service</option>
              <option value="completed">completed</option>
              <option value="canceled">canceled</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Notes</label>
            <textarea
              className="border rounded px-3 py-2 w-full"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-gray-700"
              onClick={() => setEdit(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-bold" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Actual Services Modal and its sub-components (EditServiceModal, AddServiceModal) unchanged
function ActualServicesModal({ appointmentId, services, staff, onClose, onSaved }) {
  const { data: actuals, mutate } = useSWR(`/api/appointments/${appointmentId}/actual-services`, fetcher)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRow, setEditRow] = useState(null)

  async function deleteActual(id) {
    if (!confirm("Delete this actual service?")) return
    await fetch(`/api/appointments/${appointmentId}/actual-services`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    await mutate()
  }

  return (
    <div
      className="fixed inset-0 z-[210] bg-black/80 backdrop-blur-lg flex items-center justify-center"
      // Close only if click exactly on backdrop (not modal!)
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full h-full max-w-md mx-auto overflow-y-auto flex flex-col p-6 relative"
        // Prevent modal closure on any interaction inside
        onClick={(e) => e.stopPropagation()}
        tabIndex={0} // enables focus for accessibility
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-blue-700">Actual Services</h3>
          <button onClick={onClose} className="text-3xl text-gray-600 font-bold" aria-label="Close Modal" type="button">
            <X size={30} />
          </button>
        </div>
        {/* Service card list */}
        <div className="mb-4 space-y-4">
          {(Array.isArray(actuals) ? actuals : []).map((svc) => (
            <div key={svc.id} className="bg-gray-50 border border-blue-100 rounded-xl shadow p-4 flex flex-col gap-2">
              <span className="font-bold text-blue-800 text-base">{svc.service_name}</span>
              <span className="text-xs text-gray-700">
                Staff: {svc.doneby_staff_id || "-"} | ₹{svc.price} | {svc.status}
              </span>
              {svc.notes && <span className="text-xs text-gray-500 break-words">Notes: {svc.notes}</span>}
              <div className="flex gap-3 mt-1">
                <button
                  className="p-2 bg-blue-100 rounded-full"
                  onClick={() => setEditRow(svc)}
                  title="Edit"
                  type="button"
                >
                  <Pencil className="text-blue-600" size={18} />
                </button>
                <button
                  className="p-2 bg-red-100 rounded-full"
                  onClick={() => deleteActual(svc.id)}
                  title="Delete"
                  type="button"
                >
                  <Trash2 className="text-red-600" size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-tr from-blue-600 to-green-500 p-4 rounded-full shadow-lg text-white text-2xl"
          aria-label="Add new service"
        >
          <Plus size={28} />
        </button>
        {editRow && (
          <EditServiceModal
            row={editRow}
            services={services}
            staff={staff}
            appointmentId={appointmentId}
            onClose={() => setEditRow(null)}
            onSaved={async () => {
              setEditRow(null)
              await mutate()
            }}
          />
        )}
        {showAddModal && (
          <AddServiceModal
            services={services}
            staff={staff}
            appointmentId={appointmentId}
            onClose={() => setShowAddModal(false)}
            onSaved={async () => {
              setShowAddModal(false)
              await mutate()
              if (onSaved) onSaved()
            }}
          />
        )}
      </div>
    </div>
  )
}

function EditServiceModal({ row, services, staff, appointmentId, onClose, onSaved }) {
  const [form, setForm] = React.useState({
    ...row,
    price: row.price?.toString() || "",
  })
  const [saving, setSaving] = React.useState(false)

  // Auto-populate price when service changes
  React.useEffect(() => {
    if (form.service_id) {
      const svc = services.find((s) => String(s.id) === String(form.service_id))
      if (svc && (form.price === "" || String(row.service_id) !== String(form.service_id))) {
        setForm((f) => ({ ...f, price: svc.price != null ? String(svc.price) : "" }))
      }
    }
    // eslint-disable-next-line
  }, [form.service_id, services])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/actual-services`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              ...form,
              service_id: Number(form.service_id),
              doneby_staff_id: form.doneby_staff_id === "" ? null : Number(form.doneby_staff_id),
              price: form.price === "" ? null : Number(form.price),
            },
          ],
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      if (onSaved) onSaved()
    } catch {
      // error handling if needed
    }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-modal="true"
      role="dialog"
    >
      <form
        className="bg-white w-full h-full max-w-md mx-auto px-6 py-5 overflow-y-auto flex flex-col gap-4 relative"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-indigo-700 font-bold text-xl">Edit Actual Service</h2>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-400 text-3xl" type="button">
            <X size={28} />
          </button>
        </div>
        <select
          className="border rounded-xl px-3 py-2 text-base"
          value={form.service_id}
          onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
          required
        >
          <option value="">Select Service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.price ? `— ₹${s.price}` : ""}
            </option>
          ))}
        </select>
        <select
          className="border rounded-xl px-3 py-2 text-base"
          value={form.doneby_staff_id ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
        >
          <option value="">Staff (optional)</option>
          {staff.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          className="border rounded-xl px-3 py-2 text-base"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        />
        <select
          className="border rounded-xl px-3 py-2 text-base"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="scheduled">scheduled</option>
          <option value="in_service">in_service</option>
          <option value="completed">completed</option>
          <option value="canceled">canceled</option>
        </select>
        <textarea
          placeholder="Notes"
          className="border rounded-xl px-3 py-2 text-base resize-none"
          rows={4}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-tr from-blue-600 to-green-500 text-white rounded-xl py-3 font-bold shadow"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>
    </div>
  )
}

function AddServiceModal({ services, staff, appointmentId, onClose, onSaved }) {
  const [form, setForm] = React.useState({
    service_id: "",
    doneby_staff_id: "",
    price: "",
    notes: "",
    status: "completed",
  })
  const [saving, setSaving] = React.useState(false)

  // Auto-populate price when service changes
  React.useEffect(() => {
    if (form.service_id) {
      const svc = services.find((s) => String(s.id) === String(form.service_id))
      if (svc && form.price === "") {
        setForm((f) => ({ ...f, price: svc.price != null ? String(svc.price) : "" }))
      }
    }
    // eslint-disable-next-line
  }, [form.service_id, services])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/actual-services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              ...form,
              service_id: Number(form.service_id),
              doneby_staff_id: form.doneby_staff_id === "" ? null : Number(form.doneby_staff_id),
              price: form.price === "" ? null : Number(form.price),
            },
          ],
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
      if (onSaved) onSaved()
    } catch {
      // error handling if needed
    }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-[410] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-modal="true"
      role="dialog"
    >
      <form
        className="bg-white w-full h-full max-w-md mx-auto px-6 py-5 overflow-y-auto flex flex-col gap-4 relative"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
        aria-label="Add actual service"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-green-700 font-bold text-xl flex items-center gap-1">
            <Plus size={20} /> Add Service
          </h2>
          <button onClick={onClose} aria-label="Close modal" className="text-gray-400 text-3xl" type="button">
            <X size={28} />
          </button>
        </div>
        <select
          className="border rounded-xl px-3 py-2 text-base"
          value={form.service_id}
          onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
          required
        >
          <option value="">Select Service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} {s.price ? `— ₹${s.price}` : ""}
            </option>
          ))}
        </select>
        <select
          className="border rounded-xl px-3 py-2 text-base"
          value={form.doneby_staff_id ?? ""}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value),
            }))
          }
        >
          <option value="">Staff (optional)</option>
          {staff.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          className="border rounded-xl px-3 py-2 text-base"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
        />
        <select
          className="border rounded-xl px-3 py-2 text-base"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="scheduled">scheduled</option>
          <option value="in_service">in_service</option>
          <option value="completed">completed</option>
          <option value="canceled">canceled</option>
        </select>
        <textarea
          placeholder="Notes"
          rows={4}
          className="border rounded-xl px-3 py-2 text-base resize-none"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-tr from-green-600 to-blue-500 text-white rounded-xl py-3 font-bold shadow"
        >
          {saving ? "Saving..." : "Add Service"}
        </button>
      </form>
    </div>
  )
}
