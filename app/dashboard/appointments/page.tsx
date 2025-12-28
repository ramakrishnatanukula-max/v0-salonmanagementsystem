"use client"
import React, { useMemo, useState, useEffect } from "react"
import useSWR from "swr"
import { Pencil, Trash2, Plus, X, AlertCircle, CheckCircle2, AlertTriangle, Check, Loader, Info, Calendar, User, Clock, MessageSquare, CheckCircle, ClipboardList, Users, Search } from "lucide-react"
import Toast from "@/components/Toast"
import ConfirmDialog from "@/components/ConfirmDialog"
import LoadingSpinner from "@/components/LoadingSpinner"
import FamilyMemberSelector from "@/components/FamilyMemberSelector"
import CategoryServiceSelector from "@/components/CategoryServiceSelector"
import { formatDateIST, formatDateDisplayIST, formatTimeDisplayIST, formatWeekdayIST, getISTDateTime, createISOFromIST } from "@/lib/timezone"

const fetcher = (u) => fetch(u).then((r) => r.json())

export default function AppointmentsPage() {
  const [date, setDate] = useState(formatDateIST())
  const { data: appts, mutate, isLoading: apptsLoading } = useSWR(`/api/appointments?date=${date}`, fetcher)
  const { data: services, isLoading: servicesLoading } = useSWR("/api/services", fetcher)
  const { data: categories, isLoading: categoriesLoading } = useSWR("/api/categories", fetcher)
  const { data: staff, isLoading: staffLoading } = useSWR("/api/staff/staff-only", fetcher)
  const { data: currentUser } = useSWR("/api/auth/me", fetcher)
  const [showForm, setShowForm] = useState(false)
  const [detailsId, setDetailsId] = useState(null)
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [updatingPayment, setUpdatingPayment] = useState<number | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  const isLoading = apptsLoading || servicesLoading || categoriesLoading || staffLoading

  // Find current staff member if user is staff role
  const currentStaffMember = useMemo(() => {
    if (currentUser?.role === 'staff' && currentUser?.user_id && Array.isArray(staff)) {
      return staff.find(s => s.id === currentUser.user_id)
    }
    return null
  }, [currentUser, staff])

  // Filter out completed appointments with paid status
  const filteredAppts = useMemo(() => {
    if (!Array.isArray(appts)) return []
    return appts.filter(a => {
      const isPaid = a.billing?.payment_status === "paid"
      const isCompleted = a.status === "completed"
      // Hide appointments that are both completed and paid
      return !(isCompleted && isPaid)
    })
  }, [appts])

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
      out.push(formatDateIST(d))
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
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" })
      if (res.ok) {
        setToastConfig({ type: "success", message: "Appointment deleted successfully!" })
        mutate()
      } else {
        setToastConfig({ type: "error", message: "Failed to delete appointment." })
      }
    } catch (err) {
      setToastConfig({ type: "error", message: "Error deleting appointment." })
    } finally {
      setDeleteConfirm(null)
    }
  }

  async function markAsPaid(appointmentId: number) {
    setUpdatingPayment(appointmentId)
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: "paid" })
      })
      if (res.ok) {
        setToastConfig({ type: "success", message: "Payment marked as paid!" })
        mutate()
      } else {
        setToastConfig({ type: "error", message: "Failed to update payment status." })
      }
    } catch (err) {
      setToastConfig({ type: "error", message: "Error updating payment status." })
    } finally {
      setUpdatingPayment(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 relative flex flex-col">
      {/* Sticky calendar header */}
      <section className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="bg-black rounded-xl p-2 shadow-md flex-shrink-0">
              <img
                src="/siteicon.png"
                alt="unisalon Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Appointments
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">Schedule and manage appointments</p>
            </div>
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
              <span className="font-semibold">{formatDateDisplayIST(d)}</span>
              <span className="text-[10px] opacity-80">{formatWeekdayIST(d)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Appointments list */}
      <section className="flex-1 px-3 py-3 pb-24 overflow-auto">
        {isLoading && <LoadingSpinner message="Loading appointments..." />}
        {!isLoading && filteredAppts.length === 0 && (
          <div className="text-center mt-12 px-4">
            <AlertCircle className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No appointments on this date</p>
            <p className="text-gray-400 text-sm mt-1">Tap the + button to create one</p>
          </div>
        )}
        {!isLoading && filteredAppts.map((a) => {
          const isBilled = a.billing?.id
          const isPending = isBilled && a.billing?.payment_status === "pending"
          const isPaid = isBilled && a.billing?.payment_status === "paid"
          return (
          <article
            key={a.id}
            className={`rounded-xl p-3.5 shadow-sm transition-all duration-200 mb-3 border ${
              isPaid
                ? "bg-gray-50 text-gray-400 border-gray-200 opacity-70"
                : "bg-white hover:shadow-md border-gray-100"
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-grow min-w-0">
                <p className={`font-semibold text-base truncate ${isPaid ? "text-gray-400" : "text-gray-900"}`}>
                  {a.customer_name}
                  {a.family_member && <span className="text-sm font-normal text-purple-600"> → {a.family_member.name}</span>}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                    {formatTimeDisplayIST(a.scheduled_start)}
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
                  {a.family_member && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                      {a.family_member.age_group}
                    </span>
                  )}
                  {isPending && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-semibold uppercase">
                      Payment Pending
                    </span>
                  )}
                  {isPaid && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-semibold uppercase">
                      Paid
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2 line-clamp-1">
                  <span className="font-medium">Services:</span> {(a.selected_servicesIds || []).map((sid) => serviceMap[sid] || sid).join(", ") || "-"}
                </p>
                <p className="text-xs text-gray-600 line-clamp-1">
                  <span className="font-medium">Staff:</span> {(a.selected_staffIds || []).map((sid) => staffMap[sid] || sid).join(", ") || "-"}
                </p>
              </div>
              {!isPaid && (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <button
                  className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors active:scale-95"
                  title="View Details"
                  onClick={() => setDetailsId(a.id)}
                >
                  Details
                </button>
                {isPending && (
                  <button
                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors active:scale-95 flex items-center gap-1"
                    onClick={() => markAsPaid(a.id)}
                    disabled={updatingPayment === a.id}
                  >
                    {updatingPayment === a.id ? (
                      <>
                        <Loader size={12} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={12} />
                        Mark Paid
                      </>
                    )}
                  </button>
                )}
                {!isBilled && (
                  <div>
                    <AddActualServicesButton
                      appointmentId={a.id}
                      services={services}
                      staff={staff}
                      currentStaffMember={currentStaffMember}
                      currentUser={currentUser}
                      onAdded={() => mutate()}
                    />
                  </div>
                )}
                <button
                  className="text-red-600 hover:text-red-700 font-medium text-xs hover:bg-red-50 px-2 py-1 rounded-lg transition"
                  onClick={() => setDeleteConfirm(a.id)}
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

      {/* Floating Add Button - Hidden for staff role */}
      {currentUser?.role !== 'staff' && (
        <button
          onClick={() => setShowForm(true)}
          aria-label="Add new appointment"
          className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-gradient-to-tr from-indigo-600 to-emerald-500 p-3.5 rounded-full shadow-lg text-white hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center group"
        >
          <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {/* Form Modal */}
      {showForm && (
        <FormModalContainer
          services={services}
          categories={categories}
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Appointment"
          message="Are you sure you want to delete this appointment? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={() => remove(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </main>
  )
}

// Add Actual Services button + modal
function AddActualServicesButton({ appointmentId, services, staff, currentStaffMember, currentUser, onAdded }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button
        className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-sm transition-all active:scale-95"
        onClick={() => setOpen(true)}
      >
        Services
      </button>
      {open && (
        <ActualServicesModal
          appointmentId={appointmentId}
          services={services}
          staff={staff}
          currentStaffMember={currentStaffMember}
          currentUser={currentUser}
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

function FormModalContainer({ services, categories, staff, onClose, onCreated, onError }) {
  // Step tracking: 1=phone lookup, 2=family member selection, 3=service selection
  const [step, setStep] = useState(1)
  const [mobileNumber, setMobileNumber] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [customer, setCustomer] = useState<any>(null)
  const [selectedMember, setSelectedMember] = useState<any>(null) // null for self, object for family member
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { date: todayIST, time: nowIST } = getISTDateTime()
  const [date, setDate] = useState(todayIST)
  const [time, setTime] = useState(nowIST)
  const isToday = date === todayIST
  
  const [selectedServices, setSelectedServices] = useState<Array<{serviceId: number, serviceName: string, categoryName: string, staffId: number | null, staffName: string | null}>>([])
  const [loading, setLoading] = useState(false)

  // Fetch customer details by mobile number
  const handleFetchDetails = async () => {
    if (!mobileNumber.trim()) {
      onError?.("Please enter a mobile number")
      return
    }
    
    setLookupLoading(true)
    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(mobileNumber)}`)
      const data = await res.json()
      
      if (data.found && data.customer) {
        setCustomer(data.customer)
        setFamilyMembers(data.customer.familyMembers || [])
        setStep(2) // Move to family member selection
      } else {
        // New customer - create minimal customer object
        setCustomer({
          id: null,
          first_name: "",
          last_name: "",
          email: "",
          phone: mobileNumber,
          familyMembers: []
        })
        setFamilyMembers([])
        setStep(2)
      }
    } catch (err) {
      onError?.("Failed to fetch customer details")
    } finally {
      setLookupLoading(false)
    }
  }

  // Add family member - must create customer first if new
  const handleAddFamilyMember = async (memberData: any) => {
    let customerId = customer?.id
    
    // If customer doesn't exist yet, create them first
    if (!customerId) {
      if (!customer?.first_name?.trim()) {
        onError?.("Please enter customer name first")
        return
      }
      
      try {
        const customerRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: customer.first_name,
            last_name: customer.last_name || "",
            email: customer.email || "",
            phone: mobileNumber,
            gender: customer.gender || null
          })
        })
        
        if (customerRes.ok) {
          const newCustomer = await customerRes.json()
          customerId = newCustomer.id
          setCustomer({ ...customer, id: customerId })
        } else {
          const error = await customerRes.json().catch(() => ({}))
          onError?.(error.error || "Failed to create customer")
          return
        }
      } catch (err) {
        onError?.("Failed to create customer")
        return
      }
    }
    
    // Now add the family member
    try {
      const res = await fetch(`/api/customers/${customerId}/family-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData)
      })
      
      if (res.ok) {
        const newMember = await res.json()
        setFamilyMembers([...familyMembers, newMember])
        return newMember
      } else {
        const error = await res.json().catch(() => ({}))
        onError?.(error.error || "Failed to add family member")
      }
    } catch (err) {
      onError?.("Failed to add family member")
    }
  }

  // Validate and proceed to service selection
  const handleProceedToServices = () => {
    if (!customer?.id && !customer?.first_name) {
      onError?.("Please enter customer details")
      return
    }
    setStep(3)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!customer?.first_name?.trim()) newErrors.first_name = "First name is required"
    if (!mobileNumber.trim()) newErrors.phone = "Phone is required"
    if (mobileNumber.trim().length !== 10) newErrors.phone = "Phone must be 10 digits"
    if (selectedServices.length === 0) newErrors.services = "Select at least one service"
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
      // Ensure customer exists (should already be created by now)
      let customerId = customer?.id
      if (!customerId) {
        // Last resort: create customer if somehow not created yet
        const customerRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: customer.first_name,
            last_name: customer.last_name || "",
            email: customer.email || "",
            phone: mobileNumber,
            gender: customer.gender || null
          })
        })
        if (customerRes.ok) {
          const newCustomer = await customerRes.json()
          customerId = newCustomer.id
        } else {
          const error = await customerRes.json().catch(() => ({}))
          onError?.(error.error || "Failed to create customer")
          setLoading(false)
          return
        }
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          family_member_id: selectedMember?.id || null,
          is_for_self: !selectedMember,
          notes,
          date: date, // YYYY-MM-DD
          time: time, // HH:mm
          selected_services: selectedServices, // [{serviceId, staffId}]
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
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="bg-white w-full max-w-2xl mx-auto overflow-hidden shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Professional Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={20} />
            Create New Appointment
            {step > 1 && <span className="text-sm font-normal opacity-90">- Step {step}/3</span>}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-all"
          >
            <X size={28} />
          </button>
        </div>

        <form className="space-y-5 p-4 md:p-6" onSubmit={create}>
          {/* STEP 1: Mobile Number Lookup */}
          {step === 1 && (
            <div className="space-y-4 md:space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Search size={28} className="text-white md:w-8 md:h-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800">Find Customer</h3>
                <p className="text-xs md:text-sm text-gray-500">Enter mobile number to get started</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border-2 border-indigo-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Mobile Number *
                </label>
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm md:text-base">
                      +91
                    </div>
                    <input
                      type="tel"
                      className="w-full border-2 border-indigo-200 rounded-xl pl-12 md:pl-14 pr-16 md:pr-20 py-3 md:py-4 text-base md:text-lg font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                      placeholder="Enter 10-digit number"
                      value={mobileNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 10) setMobileNumber(value)
                      }}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleFetchDetails())}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      autoFocus
                    />
                    {mobileNumber && (
                      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-xs font-medium">
                        <span className={mobileNumber.length === 10 ? "text-green-600" : "text-gray-400"}>
                          {mobileNumber.length}/10
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchDetails}
                    disabled={lookupLoading || mobileNumber.length !== 10}
                    className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {lookupLoading ? (
                      <>
                        <Loader size={20} className="animate-spin" />
                        <span className="text-sm md:text-base">Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search size={20} />
                        <span className="text-sm md:text-base">Search</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Family Member Selection */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Customer Info Display */}
              <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-4 border border-emerald-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <User size={16} />
                  Customer Information
                </h3>
                {customer?.id ? (
                  <div className="space-y-2">
                    <p className="text-sm"><span className="font-semibold">Name:</span> {customer.first_name} {customer.last_name}</p>
                    <p className="text-sm"><span className="font-semibold">Email:</span> {customer.email || "N/A"}</p>
                    <p className="text-sm"><span className="font-semibold">Phone:</span> {mobileNumber}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                      <input
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                        placeholder="First name"
                        value={customer?.first_name || ""}
                        onChange={(e) => setCustomer({...customer, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name (Optional)</label>
                      <input
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                        placeholder="Last name (optional)"
                        value={customer?.last_name || ""}
                        onChange={(e) => setCustomer({...customer, last_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Gender</label>
                      <select
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                        value={customer?.gender || ""}
                        onChange={(e) => setCustomer({...customer, gender: e.target.value})}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                        placeholder="Email (optional)"
                        value={customer?.email || ""}
                        onChange={(e) => setCustomer({...customer, email: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Family Member Selector */}
              <FamilyMemberSelector
                familyMembers={familyMembers}
                selectedMember={selectedMember}
                isForSelf={!selectedMember}
                onSelectSelf={() => setSelectedMember(null)}
                onSelectMember={setSelectedMember}
                onAddMember={handleAddFamilyMember}
                customerName={`${customer?.first_name || ""} ${customer?.last_name || ""}`.trim()}
              />

              {/* Date & Time */}
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

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-200">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all"
                  onClick={() => setStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProceedToServices}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-emerald-600 text-white font-medium text-sm shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
                >
                  Next: Select Services
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Service Selection */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Booking For Display */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                <p className="text-sm">
                  <span className="font-semibold">Booking for:</span>{" "}
                  {selectedMember ? `${selectedMember.name} (${selectedMember.age_group})` : `${customer?.first_name} ${customer?.last_name || ""}`.trim()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {date} at {time}
                </p>
              </div>

              {/* Category-Based Service Selector */}
              <CategoryServiceSelector
                categories={categories || []}
                services={services || []}
                staff={staff || []}
                selectedServices={selectedServices}
                onServicesChange={setSelectedServices}
              />

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
                  onClick={() => setStep(2)}
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedServices.length === 0}
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
            </div>
          )}
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
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [form, setForm] = useState(() => {
    const istDateTime = appt ? getISTDateTime(appt.scheduled_start) : { date: "", time: "" };
    return {
      status: appt?.status || "",
      date: istDateTime.date,
      time: istDateTime.time,
      notes: appt?.notes || "",
      customer_name: appt?.customer_name || "",
      phone: appt?.phone || "",
      email: appt?.email || "",
    };
  })

  React.useEffect(() => {
    if (appt) {
      const istDateTime = getISTDateTime(appt.scheduled_start);
      setForm({
        status: appt.status || "",
        date: istDateTime.date,
        time: istDateTime.time,
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
    setToastConfig(null)
    // Combine date and time into ISO string (treating input as IST)
    const scheduled_start = createISOFromIST(form.date, form.time)
    const res = await fetch(`/api/appointments/${appt.id}`, {
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
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Failed to update appointment" }))
      setToastConfig({ type: "error", message: errorData.error || "Failed to update appointment" })
      setSaving(false)
      return
    }
    
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
              onClick={onClose}
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
      
      {/* Toast Notification */}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setToastConfig(null)}
        />
      )}
    </div>
  )
}

// Actual Services Modal and its sub-components (EditServiceModal, AddServiceModal) unchanged
function ActualServicesModal({ appointmentId, services, staff, currentStaffMember, currentUser, onClose, onSaved }) {
  const { data: actuals, mutate, isLoading } = useSWR(`/api/appointments/${appointmentId}/actual-services`, fetcher)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [deleteActualConfirm, setDeleteActualConfirm] = useState(null)
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  // Show all actuals to all users including staff
  const filteredActuals = useMemo(() => {
    if (!Array.isArray(actuals)) return []
    return actuals
  }, [actuals])
  
  // Check if user can edit/delete a service
  const canModifyService = (svc) => {
    // Admin and receptionist can modify everything
    if (currentUser?.role === 'admin' || currentUser?.role === 'receptionist') {
      return true
    }
    // Staff can only modify their own services
    if (currentUser?.role === 'staff' && currentStaffMember) {
      return svc.doneby_staff_id === currentStaffMember.id
    }
    return false
  }

  async function deleteActual(id) {
    await fetch(`/api/appointments/${appointmentId}/actual-services`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    await mutate()
    setDeleteActualConfirm(null)
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
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-indigo-600 mb-3"></div>
              <p className="text-gray-500 text-sm font-medium">Loading services...</p>
            </div>
          ) : filteredActuals.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-base font-medium">No services added yet</p>
              <p className="text-gray-400 text-xs mt-1">Click the button below to add one</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActuals.map((svc) => {
                const staffMember = staff.find(st => st.id === svc.doneby_staff_id)
                const staffName = staffMember?.name || "Unassigned"
                
                return (
                <div
                  key={svc.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-base truncate">{svc.service_name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Service #{svc.id}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full uppercase flex-shrink-0 ${
                          svc.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : svc.status === "in_service"
                              ? "bg-blue-100 text-blue-700"
                              : svc.status === "canceled"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {svc.status === "completed" && <CheckCircle size={12} />}
                        {svc.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price</span>
                        <span className="text-lg font-bold text-gray-900">₹{svc.price || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Staff</span>
                        <span className="text-sm font-semibold text-gray-900">{staffName}</span>
                      </div>
                      {svc.gst_percentage && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">GST</span>
                          <span className="text-sm font-medium text-gray-900">{svc.gst_percentage}%</span>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    {svc.notes && (
                      <div className="bg-amber-50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-semibold text-amber-700 mb-1">Notes</p>
                        <p className="text-sm text-amber-900">{svc.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {canModifyService(svc) && (
                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          onClick={() => setEditRow(svc)}
                          type="button"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          onClick={() => setDeleteActualConfirm(svc.id)}
                          type="button"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )})}
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

        {/* Delete Confirmation for Actual Service */}
        {deleteActualConfirm && (
          <ConfirmDialog
            title="Delete Service"
            message="Are you sure you want to delete this actual service?"
            confirmText="Delete"
            type="danger"
            onConfirm={() => deleteActual(deleteActualConfirm)}
            onCancel={() => setDeleteActualConfirm(null)}
          />
        )}

        {editRow && (
          <EditServiceModal
            row={editRow}
            services={services}
            staff={staff}
            currentStaffMember={currentStaffMember}
            appointmentId={appointmentId}
            onClose={() => setEditRow(null)}
            onSaved={async () => {
              setEditRow(null)
              await mutate()
            }}
            onError={(msg) => setToastConfig({ type: "error", message: msg })}
          />
        )}
        {showAddModal && (
          <AddServiceModal
            services={services}
            staff={staff}
            currentStaffMember={currentStaffMember}
            appointmentId={appointmentId}
            onClose={() => setShowAddModal(false)}
            onSaved={async () => {
              setShowAddModal(false)
              await mutate()
              if (onSaved) onSaved()
            }}
            onError={(msg) => setToastConfig({ type: "error", message: msg })}
          />
        )}
      </div>
      
      {/* Toast Notification */}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setToastConfig(null)}
        />
      )}
    </div>
  )
}

function EditServiceModal({ row, services, staff, appointmentId, onClose, onSaved, currentStaffMember, onError }) {
  const [form, setForm] = React.useState({
    ...row,
    price: row.price?.toString() || "",
  })
  const [saving, setSaving] = React.useState(false)
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to update service" }))
        const errorMsg = errorData.error || "Failed to update service"
        setToastConfig({ type: "error", message: errorMsg })
        if (onError) onError(errorMsg)
        setSaving(false)
        return
      }
      if (onSaved) onSaved()
    } catch {
      const errorMsg = "Error updating service"
      setToastConfig({ type: "error", message: errorMsg })
      if (onError) onError(errorMsg)
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Staff {currentStaffMember ? "" : "(Optional)"}
          </label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={form.doneby_staff_id ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            disabled={!!currentStaffMember}
          >
            <option value="">No staff assigned</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
              </option>
            ))}
          </select>
          {currentStaffMember && (
            <p className="text-xs text-gray-500 mt-1">Staff assignment cannot be changed</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed focus:outline-none"
            value={form.price}
            readOnly
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Price is determined by the selected service</p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
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
                {status === "in_service" ? "In Service" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
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
      
      {/* Toast Notification - z-index higher than modal */}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setToastConfig(null)}
        />
      )}
    </div>
  )
}

function AddServiceModal({ services, staff, currentStaffMember, appointmentId, onClose, onSaved, onError }) {
  const [form, setForm] = React.useState({
    service_id: "",
    doneby_staff_id: currentStaffMember?.id || "",
    price: "",
    notes: "",
    status: "completed",
  })
  const [saving, setSaving] = React.useState(false)
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

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
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to add service" }))
        const errorMsg = errorData.error || "Failed to add service"
        setToastConfig({ type: "error", message: errorMsg })
        if (onError) onError(errorMsg)
        setSaving(false)
        return
      }
      if (onSaved) onSaved()
    } catch {
      const errorMsg = "Error adding service"
      setToastConfig({ type: "error", message: errorMsg })
      if (onError) onError(errorMsg)
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
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Staff {currentStaffMember ? "" : "(Optional)"}
          </label>
          <select
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
            value={form.doneby_staff_id ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                doneby_staff_id: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            disabled={!!currentStaffMember}
          >
            <option value="">No staff assigned</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name || `${st.first_name || ""} ${st.last_name || ""}`.trim()}
              </option>
            ))}
          </select>
          {currentStaffMember && (
            <p className="text-xs text-gray-500 mt-1">You can only add services for yourself</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹)</label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed focus:outline-none"
            value={form.price}
            readOnly
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Price is determined by the selected service</p>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
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
                {status === "in_service" ? "In Service" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
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
      
      {/* Toast Notification - z-index higher than modal */}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setToastConfig(null)}
        />
      )}
    </div>
  )
}
