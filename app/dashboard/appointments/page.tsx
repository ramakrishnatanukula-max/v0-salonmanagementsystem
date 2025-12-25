"use client"
import React, { useMemo, useState, useEffect } from "react"
import useSWR from "swr"
import { Pencil, Trash2, Plus, X, AlertCircle, CheckCircle2, AlertTriangle, Check, Loader, Info, Calendar, User, Clock, MessageSquare, CheckCircle, ClipboardList, Users } from "lucide-react"

const fetcher = (u) => fetch(u).then((r) => r.json())
const fmt = (d) => d.toISOString().slice(0, 10)
const fmtDisplay = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })

// Toast Notification Component
function Toast({
  type,
  message,
  onClose,
}: {
  type: "success" | "error" | "info"
  message: string
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const config = {
    success: {
      bg: "bg-gradient-to-r from-emerald-500 to-green-500",
      border: "border-l-4 border-emerald-600",
      icon: <CheckCircle2 size={20} className="flex-shrink-0" />,
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-rose-500",
      border: "border-l-4 border-red-600",
      icon: <AlertCircle size={20} className="flex-shrink-0" />,
    },
    info: {
      bg: "bg-gradient-to-r from-blue-500 to-cyan-500",
      border: "border-l-4 border-blue-600",
      icon: <Info size={20} className="flex-shrink-0" />,
    },
  }

  const { bg, border, icon } = config[type]

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm ${bg} ${border} text-white rounded-lg shadow-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 z-[999]`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {icon}
      <span className="text-sm font-medium flex-grow">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition flex-shrink-0"
        aria-label="Close notification"
        type="button"
      >
        <X size={18} />
      </button>
    </div>
  )
}

export default function AppointmentsPage() {
  const [date, setDate] = useState(fmt(new Date()))
  const { data: appts, mutate, isLoading: apptsLoading } = useSWR(`/api/appointments?date=${date}`, fetcher)
  const { data: services, isLoading: servicesLoading } = useSWR("/api/services", fetcher)
  const { data: staff, isLoading: staffLoading } = useSWR("/api/staff", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [detailsId, setDetailsId] = useState(null)
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const isLoading = apptsLoading || servicesLoading || staffLoading

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

  // Scroll to center (today's date) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollWidth = scrollContainerRef.current.scrollWidth
      const clientWidth = scrollContainerRef.current.clientWidth
      scrollContainerRef.current.scrollLeft = (scrollWidth - clientWidth) / 2
    }
  }, [])

  async function remove(id) {
    if (!confirm("Delete this appointment?")) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
      if (res.ok) {
        setToastConfig({ type: "success", message: "Appointment deleted successfully! ✓" })
        mutate()
      } else {
        setToastConfig({ type: "error", message: "Failed to delete appointment. Please try again." })
      }
    } catch (err) {
      setToastConfig({ type: "error", message: "Error deleting appointment. Please try again." })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 relative flex flex-col">
      {/* Sticky calendar header */}
      <section className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-3 pt-3 pb-2">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
              Appointments
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Schedule and manage appointments</p>
          </div>
        </div>
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide" ref={scrollContainerRef}>
          {days.map((d) => (
            <button
              key={d}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg transition flex-shrink-0 min-w-[70px] ${
                d === date
                  ? "bg-gradient-to-r from-indigo-600 to-emerald-500 text-white font-semibold shadow-md"
                  : "bg-white text-gray-700 border border-gray-200"
              }`}
              onClick={() => setDate(d)}
              style={{ fontSize: 13, minWidth: "70px" }}
            >
              <span className="font-semibold">{fmtDisplay(d)}</span>
              <span className="text-[10px] opacity-80">{new Date(d).toLocaleDateString("en-US", { weekday: "short" })}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Appointments list */}
      <section className="flex-1 px-3 py-3 pb-24 overflow-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center mt-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <Loader className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-indigo-600" size={24} />
            </div>
            <p className="text-gray-500 font-medium mt-4">Loading appointments...</p>
            <p className="text-gray-400 text-sm mt-1">Please wait</p>
          </div>
        )}
        {!isLoading && (Array.isArray(appts) ? appts : []).length === 0 && (
          <div className="text-center mt-12 px-4">
            <AlertCircle className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No appointments on this date</p>
            <p className="text-gray-400 text-sm mt-1">Tap the + button to create one</p>
          </div>
        )}
        {!isLoading && (Array.isArray(appts) ? appts : []).map((a) => {
          const isBilled = a.billing?.id
          return (
          <article
            key={a.id}
            className={`rounded-xl p-3.5 shadow-sm transition-all duration-200 mb-3 border ${
              isBilled
                ? "bg-gray-50 text-gray-400 border-gray-200 opacity-70"
                : "bg-white hover:shadow-md border-gray-100"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-grow min-w-0">
                <p className={`font-semibold text-base truncate ${isBilled ? "text-gray-400" : "text-gray-900"}`}>{a.customer_name}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase ${
                    a.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : a.status === "confirmed"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2 line-clamp-1">
                  <span className="font-medium">Services:</span> {(a.selected_servicesIds || []).map((sid) => serviceMap[sid] || sid).join(", ") || "-"}
                </p>
                <p className="text-xs text-gray-600 line-clamp-1">
                  <span className="font-medium">Staff:</span> {(a.selected_staffIds || []).map((sid) => staffMap[sid] || sid).join(", ") || "-"}
                </p>
              </div>
              {!isBilled && (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <button
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors active:scale-95"
                  title="View Details"
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
                  className="text-red-600 hover:text-red-700 font-medium text-xs hover:bg-red-50 px-2 py-1 rounded-lg transition"
                  onClick={() => remove(a.id)}
                >
                  Delete
                </button>
              </div>
              )}
            </div>
          </article>
        )
        })}
      </section>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowForm(true)}
        aria-label="Add new appointment"
        className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-gradient-to-tr from-indigo-600 to-emerald-500 p-3.5 rounded-full shadow-lg text-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center group"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Form Modal */}
      {showForm && (
        <FormModalContainer
          services={services}
          staff={staff}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            setToastConfig({ type: "success", message: "Appointment created successfully! ✓" })
            mutate()
          }}
          onError={(msg) => setToastConfig({ type: "error", message: msg })}
        />
      )}
      {/* Details Modal */}
      {detailsId !== null && (
        <DetailsModal
          appt={(Array.isArray(appts) ? appts : []).find((a) => a.id === detailsId)}
          onClose={() => setDetailsId(null)}
        />
      )}

      {/* Toast Notification */}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setToastConfig(null)}
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
        className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-all active:scale-95"
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

const getNowIST = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60 * 1000);

  const y = ist.getFullYear();
  const m = String(ist.getMonth() + 1).padStart(2, "0");
  const d = String(ist.getDate()).padStart(2, "0");
  const hh = String(ist.getHours()).padStart(2, "0");
  const mm = String(ist.getMinutes()).padStart(2, "0");

  return {
    date: `${y}-${m}-${d}`,   // yyyy-mm-dd for date input [web:4]
    time: `${hh}:${mm}`,      // HH:mm for time input [web:30]
  };
};
// CLEAN MODALS BELOW

function FormModalContainer({ services, staff, onClose, onCreated, onError }) {
  const [customer, setCustomer] = useState({ first_name: "", last_name: "", email: "", phone: "" })
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { date: todayIST, time: nowIST } = getNowIST()

  const [date, setDate] = useState(todayIST)
  const [time, setTime] = useState(nowIST)

  const isToday = date === todayIST
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedStaff, setSelectedStaff] = useState([])
  const [loading, setLoading] = useState(false)

  function toggle(arr, value) {
    return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!customer.first_name.trim()) newErrors.first_name = "First name is required"
    if (!customer.phone.trim()) newErrors.phone = "Phone is required"
    if (selectedServices.length === 0) newErrors.services = "Select at least one service"
    if (selectedStaff.length === 0) newErrors.staff = "Select at least one staff member"
    return newErrors
  }

  async function create(e) {
    e.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      onError?.("Please fix the errors in the form")
      return
    }

    setLoading(true)
    try {
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
      } else {
        const error = await res.json().catch(() => ({}))
        onError?.(error.error || "Failed to create appointment. Please try again.")
      }
    } catch (err) {
      onError?.("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white w-full max-w-2xl mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto rounded-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={20} />
            Create New Appointment
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={28} />
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={create}>
          {/* Customer Info Section */}
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-3 border border-emerald-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <User size={14} />
              Customer Information
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                <input
                  className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition ${
                    errors.first_name ? "border-red-400 bg-red-50" : "border-gray-300"
                  }`}
                  placeholder="First name"
                  value={customer.first_name}
                  onChange={(e) => {
                    setCustomer((c) => ({ ...c, first_name: e.target.value }))
                    if (errors.first_name) setErrors((e) => ({ ...e, first_name: "" }))
                  }}
                  required
                  autoFocus
                />
                {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  placeholder="Last name"
                  value={customer.last_name}
                  onChange={(e) => setCustomer((c) => ({ ...c, last_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                  <input
                    className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition ${
                      errors.phone ? "border-red-400 bg-red-50" : "border-gray-300"
                    }`}
                    placeholder="Phone number"
                    value={customer.phone}
                    onChange={(e) => {
                      setCustomer((c) => ({ ...c, phone: e.target.value }))
                      if (errors.phone) setErrors((e) => ({ ...e, phone: "" }))
                    }}
                    required
                  />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                    placeholder="Email (optional)"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Clock size={14} />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  value={date}
                  min={todayIST}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  value={time}
                  min={isToday ? nowIST : undefined}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Services Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <ClipboardList size={14} />
              Services * {selectedServices.length > 0 && <span className="text-indigo-600 normal-case">({selectedServices.length})</span>}
            </label>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-3 border border-indigo-200 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(services) ? services : []).length === 0 ? (
                  <p className="text-gray-400 text-sm w-full text-center py-3">No services available</p>
                ) : (
                  (Array.isArray(services) ? services : []).map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all transform hover:scale-105 shadow-sm ${
                        selectedServices.includes(s.id)
                          ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-800 shadow-md"
                          : "bg-white text-indigo-700 border-indigo-300 hover:border-indigo-500 hover:shadow"
                      }`}
                      onClick={() => setSelectedServices((arr) => toggle(arr, s.id))}
                    >
                      {selectedServices.includes(s.id) ? "✓" : "+"} {s.name}
                    </button>
                  ))
                )}
              </div>
            </div>
            {errors.services && <p className="text-xs text-red-600 mt-1">{errors.services}</p>}
          </div>

          {/* Staff Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Users size={14} />
              Staff * {selectedStaff.length > 0 && <span className="text-emerald-600 normal-case">({selectedStaff.length})</span>}
            </label>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200 max-h-32 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(staff) ? staff : []).length === 0 ? (
                  <p className="text-gray-400 text-sm w-full text-center py-3">No staff available</p>
                ) : (
                  (Array.isArray(staff) ? staff : []).map((st) => (
                    <button
                      type="button"
                      key={st.id}
                      className={`px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all transform hover:scale-105 shadow-sm ${
                        selectedStaff.includes(st.id)
                          ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-800 shadow-md"
                          : "bg-white text-emerald-700 border-emerald-300 hover:border-emerald-500 hover:shadow"
                      }`}
                      onClick={() => setSelectedStaff((arr) => toggle(arr, st.id))}
                    >
                      {selectedStaff.includes(st.id) ? "✓" : "+"} {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
                    </button>
                  ))
                )}
              </div>
            </div>
            {errors.staff && <p className="text-xs text-red-600 mt-1">{errors.staff}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <MessageSquare size={14} />
              Notes (Optional)
            </label>
            <textarea
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
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
    phone: appt?.phone || "",
    email: appt?.email || "",
  }))

  React.useEffect(() => {
    if (appt) {
      setForm({
        status: appt.status || "",
        date: new Date(appt.scheduled_start).toISOString().slice(0, 10),
        time: new Date(appt.scheduled_start).toTimeString().slice(0, 5),
        notes: appt.notes || "",
        customer_name: appt.customer_name || "",
        phone: appt.phone || "",
        email: appt.email || "",
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
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar size={20} />
            Appointment Details
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={28} />
          </button>
        </div>

        <form className="space-y-5 p-6" onSubmit={handleSave}>
          {/* Customer Info Section */}
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-3 border border-emerald-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <User size={14} />
              Customer Information
            </h3>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Clock size={14} />
              Schedule
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Time *</label>
                <input
                  type="time"
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Status Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <CheckCircle size={14} />
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["scheduled", "in_service", "completed", "canceled"].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`px-3 py-2 rounded-lg border-2 font-medium text-xs transition-all ${
                    form.status === status
                      ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white border-indigo-700"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400"
                  }`}
                  onClick={() => setForm((f) => ({ ...f, status }))}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <MessageSquare size={14} />
              Notes
            </label>
            <textarea
              className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Add any notes..."
              spellCheck={false}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
              onClick={() => setEdit(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Save Changes
                </>
              )}
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
      className="fixed inset-0 z-[210] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        tabIndex={0}
      >
        {/* Professional Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-3 flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckCircle size={20} />
            Actual Services
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
            aria-label="Close Modal"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Service List */}
        <div className="overflow-y-auto flex-1 p-6">
          {(Array.isArray(actuals) ? actuals : []).length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-base font-medium">No services added yet</p>
              <p className="text-gray-400 text-xs mt-1">Click the button below to add one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Array.isArray(actuals) ? actuals : []).map((svc) => (
                <div
                  key={svc.id}
                  className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-emerald-800 text-sm">{svc.service_name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg">
                          ₹{svc.price}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-lg ${
                            svc.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : svc.status === "in_service"
                                ? "bg-blue-100 text-blue-800"
                                : svc.status === "canceled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {svc.status.replace("_", " ")}
                        </span>
                      </div>
                      {svc.notes && (
                        <p className="text-xs text-gray-600 mt-1.5 break-words">
                          <span className="font-semibold">Notes:</span> {svc.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-all"
                        onClick={() => setEditRow(svc)}
                        title="Edit"
                        type="button"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                        onClick={() => deleteActual(svc.id)}
                        title="Delete"
                        type="button"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Action Button */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="absolute bottom-8 right-8 z-50 bg-gradient-to-r from-indigo-600 to-emerald-600 p-4 rounded-full shadow-lg hover:shadow-xl text-white transform hover:scale-110 transition-all"
          aria-label="Add new service"
          title="Add new service"
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
      className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-modal="true"
      role="dialog"
    >
      <form
        className="bg-white w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
            <Pencil size={18} />
            Edit Service
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 transition-all"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Service *</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
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
        </div>

        {/* Staff Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Staff (Optional)</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.doneby_staff_id ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
          >
            <option value="">No staff assigned</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_service">In Service</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            placeholder="Add notes..."
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            spellCheck={false}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-lg py-2.5 font-semibold text-sm shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
        >
          {saving ? (
            <>
              <Loader size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              Save Changes
            </>
          )}
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
      className="fixed inset-0 z-[410] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-modal="true"
      role="dialog"
    >
      <form
        className="bg-white w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl flex flex-col p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
            <Plus size={18} />
            Add Service
          </h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-gray-400 hover:text-gray-600 transition-all"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Service *</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
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
        </div>

        {/* Staff Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Staff (Optional)</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.doneby_staff_id ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
          >
            <option value="">No staff assigned</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="scheduled">Scheduled</option>
            <option value="in_service">In Service</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (Optional)</label>
          <textarea
            placeholder="Add notes..."
            rows={3}
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            spellCheck={false}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-lg py-2.5 font-semibold text-sm shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
        >
          {saving ? (
            <>
              <Loader size={16} className="animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Service
            </>
          )}
        </button>
      </form>
    </div>
  )
}
