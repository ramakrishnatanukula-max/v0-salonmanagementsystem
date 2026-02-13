"use client"
import React, { useState } from "react"
import useSWR from "swr"
import { X, ChevronDown, ChevronUp, Mail, Check, AlertCircle, Printer } from "lucide-react"
import Toast from "@/components/Toast"
import ConfirmDialog from "@/components/ConfirmDialog"
import LoadingSpinner from "@/components/LoadingSpinner"
import { formatDateDisplayIST, formatTimeDisplayIST, formatDateTimeIST } from "@/lib/timezone"
import { shareInvoiceLinkViaWhatsApp } from "@/lib/pdf-generator"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

function useActuals(appointmentId: number, enabled: boolean) {
  const key = enabled ? `/api/appointments/${appointmentId}/actual-services` : null
  // @ts-ignore SWR conditional key
  return useSWR(key, fetcher)
}

function computeTotals(items: any[]) {
  let total = 0
  for (const it of items || []) {
    const price = Number(it.price || 0)
    total += price
  }
  return {
    subtotal: total,
    tax: 0, // Tax is already included in price
    total: total,
  }
}

export default function BillingPage() {
  const { data: appts, mutate, isLoading } = useSWR(`/api/billing/today-completed`, fetcher)
  const [selected, setSelected] = useState<any>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "paid">("all")
  const [toastConfig, setToastConfig] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)

  // Calculate billing summary from actual services
  const appointmentsList = Array.isArray(appts) ? appts : []

  // Calculate total invoiced from actual_services_total (which includes all actual services performed)
  const totalBilled = appointmentsList.reduce((sum: number, a: any) => {
    // Use actual_services_total if available (from API), otherwise use billing amount
    const amount = a.actual_services_total || a.billing?.final_amount || a.billing?.total_amount || a.final_amount || a.total_amount || 0
    return sum + Number(amount || 0)
  }, 0)

  const totalPaid = appointmentsList.reduce((sum: number, a: any) => {
    const status = a.billing?.payment_status || a.payment_status
    if (status === "paid") {
      // Use actual_services_total for paid amount calculation too
      const amount = a.actual_services_total || a.billing?.final_amount || a.billing?.total_amount || a.final_amount || a.total_amount || 0
      return sum + Number(amount || 0)
    }
    return sum
  }, 0)

  const totalPending = Number(totalBilled || 0) - Number(totalPaid || 0)
  const completedBilling = appointmentsList.filter((a: any) => a.billing?.id || a.billing_id).length
  const pendingBilling = appointmentsList.filter((a: any) => !(a.billing?.id || a.billing_id)).length

  // Filter appointments
  const paidAppointments = appointmentsList.filter((a: any) => {
    const status = a.billing?.payment_status || a.payment_status
    return status === "paid"
  })
  const displayList = activeTab === "paid" ? paidAppointments : appointmentsList

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 p-0 flex flex-col">
      {/* Professional Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-emerald-600 px-6 py-3 shadow-lg">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          💳 Billing
        </h1>
        <p className="text-emerald-100 text-xs mt-0.5">Complete today's billing</p>
      </div>

      {/* Billing Summary Cards */}
      <section className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Today's Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Billed */}
            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 p-3">
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Total Invoiced</div>
              <div className="text-lg font-bold text-blue-900 mt-1">₹{totalBilled.toFixed(2)}</div>
              <div className="text-xs text-blue-600 mt-0.5">{appointmentsList.length} appointments</div>
            </div>

            {/* Paid */}
            <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-300 p-3">
              <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Paid</div>
              <div className="text-lg font-bold text-emerald-900 mt-1">₹{totalPaid.toFixed(2)}</div>
              <div className="text-xs text-emerald-600 mt-0.5">✓ {appointmentsList.filter((a: any) => a.billing?.payment_status === "paid").length} done</div>
            </div>


            {/* Completion Status */}
            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-300 p-3">
              <div className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Billed</div>
              <div className="text-lg font-bold text-purple-900 mt-1">{completedBilling}/{appointmentsList.length}</div>
              <div className="text-xs text-purple-600 mt-0.5">{Math.round((completedBilling / (appointmentsList.length || 1)) * 100)}% complete</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 px-4 sm:px-6 py-4 max-w-4xl mx-auto w-full">
        {isLoading && <LoadingSpinner message="Loading billing data..." />}

        {!isLoading && appointmentsList.length === 0 && (
          <div className="mt-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-center text-gray-400 text-lg font-medium">No completed appointments to bill today</p>
            <p className="text-gray-400 text-sm mt-2">Completed appointments will appear here</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-3">
            {displayList.map((a: any) => {
              const isOpen = openId === a.id
              const isBilled = !!(a.billing?.id || a.billing_id)
              const isPaid = (a.billing?.payment_status || a.payment_status) === "paid"
              const amount = a.billing?.final_amount || a.billing?.total_amount || a.final_amount || a.total_amount

              return (
                <div
                  key={a.id}
                  className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border ${isPaid ? "border-emerald-300 bg-emerald-50/30" : isBilled ? "border-blue-300" : "border-gray-200"
                    }`}
                >
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-emerald-50 transition-colors rounded-xl"
                    onClick={() => setOpenId(isOpen ? null : a.id)}
                  >
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-base text-gray-900">{a.customer_name}</div>
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800 flex items-center gap-1">
                            ✓ Paid
                          </span>
                        )}
                        {isBilled && !isPaid && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-200 text-blue-800">
                            📝 Billed
                          </span>
                        )}
                        {!isBilled && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">
                            ⏳ Pending
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                        <span>📅 {formatDateDisplayIST(a.scheduled_start)}</span>
                        <span>🕐 {formatTimeDisplayIST(a.scheduled_start)}</span>
                        {amount && (
                          <span className="font-semibold text-gray-700">₹{Number(amount || 0).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <div className="ml-2">
                      {isOpen ? (
                        <ChevronUp className="text-indigo-600 flex-shrink-0" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400 flex-shrink-0" size={20} />
                      )}
                    </div>
                  </button>

                  {isOpen ? (
                    <AppointmentServicesPanel
                      appointment={a}
                      onPaid={() => mutate()}
                      onNotify={(msg, type) => setToastConfig({ type, message: msg })}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {selected && (
        <BillingModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            mutate()
          }}
          onNotify={(msg, type) => setToastConfig({ type, message: msg })}
        />
      )}

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

function AppointmentServicesPanel({
  appointment,
  onPaid,
  onNotify,
}: {
  appointment: any
  onPaid: () => void
  onNotify: (msg: string, type: "success" | "error" | "info") => void
}) {
  const { data: items, isLoading } = useActuals(appointment.id, true)
  const totals = computeTotals(items || [])
  const [showModal, setShowModal] = useState(false)

  // Check if already billed/paid - handle both nested and flat structures
  const isBilled = !!(appointment.billing?.id || appointment.billing_id)
  const isPaid = (appointment.billing?.payment_status || appointment.payment_status) === "paid"

  // Calculate base amount and GST from total price (price includes GST)
  const itemsWithTax = (Array.isArray(items) ? items : []).map((it: any) => {
    const totalPrice = Number(it.price || 0)
    const gstPercentage = Number(it.gst_percentage || 0)
    // Calculate base amount: total / (1 + gst%/100)
    const baseAmount = gstPercentage > 0 ? totalPrice / (1 + gstPercentage / 100) : totalPrice
    const gstAmount = totalPrice - baseAmount
    return {
      ...it,
      baseAmount,
      gstAmount,
      gstPercentage,
      lineTotal: totalPrice
    }
  })

  async function sendEmailInline() {
    const email = appointment.customer_email || appointment.customer_email_address
    if (!email) {
      onNotify("Customer email not available - cannot send", "error")
      return
    }

    try {
      onNotify("Sending invoice email...", "info")
      const res = await fetch("/api/send-invoice-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: email,
          billId: appointment.billing?.id || appointment.billing_id,
          customer_name: appointment.customer_name,
          appointment_date: formatDateTimeIST(appointment.scheduled_start),
          services: itemsWithTax.map((s: any) => ({
            name: s.service_name || s.name || '',
            baseAmount: Number(s.baseAmount || s.price || 0),
            gstPercent: Number(s.gstPercentage || s.gst || 0),
            gstAmount: Number(s.gstAmount || s.totalTax || 0),
            total: Number(s.lineTotal || s.total || 0),
          })),
          subtotal: itemsWithTax.reduce((sum: number, s: any) => sum + (s.lineTotal || 0), 0),
          total: appointment.billing?.total_amount || appointment.total_amount || 0,
          discount: appointment.billing?.discount || 0,
          final_amount: appointment.billing?.paid_amount || appointment.billing?.final_amount || appointment.final_amount || appointment.total_amount || 0,
          payment_method: appointment.billing?.payment_method || appointment.payment_method,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        onNotify("📧 Invoice email sent to customer", "success")
      } else {
        console.error('Email API error', data)
        onNotify("Failed to send email: " + (data.error || "Unknown error"), "error")
      }
    } catch (err) {
      console.error("Error sending invoice email:", err)
      onNotify("Error sending email", "error")
    }
  }

  return (
    <div className="px-4 pb-4 border-t border-gray-200">
      <div className="mt-4 rounded-lg border border-gray-300 bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-3 text-center text-gray-500 text-sm">Loading services…</div>
        ) : itemsWithTax.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {itemsWithTax.map((it: any) => (
              <li key={it.id} className="p-3 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-gray-900">{it.service_name}</div>
                    {it.notes && <div className="text-xs text-gray-600 mt-1">📝 {it.notes}</div>}
                    <div className="text-xs text-gray-600 mt-1.5 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span>Base Amount:</span>
                        <span className="font-semibold">₹{it.baseAmount.toFixed(2)}</span>
                      </div>
                      {it.gstPercentage > 0 && (
                        <div className="flex items-center gap-2">
                          <span>GST ({it.gstPercentage}%):</span>
                          <span className="font-semibold text-blue-600">₹{it.gstAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm text-gray-900">₹{it.lineTotal.toFixed(2)}</div>
                    <div className="text-xs text-emerald-600 font-semibold">Total</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-3 text-center text-gray-500 text-sm">No completed services to bill.</div>
        )}
      </div>

      {/* Billing Status */}
      {isBilled && (
        <div className={`mt-4 rounded-lg p-3 border ${isPaid ? "bg-emerald-50 border-emerald-300" : "bg-blue-50 border-blue-300"}`}>
          <div className={`text-xs font-bold uppercase tracking-wide ${isPaid ? "text-emerald-700" : "text-blue-700"}`}>
            {isPaid ? "✓ Payment Completed" : "📝 Billed (Pending Payment)"}
          </div>
          <div className="mt-2 space-y-1 text-sm">
            <div>Amount: <span className="font-bold">₹{Number(appointment.billing?.final_amount || appointment.billing?.total_amount || appointment.final_amount || appointment.total_amount || 0).toFixed(2)}</span></div>
            {(appointment.billing?.payment_method || appointment.payment_method) && <div>Method: <span className="font-semibold capitalize">{appointment.billing?.payment_method || appointment.payment_method}</span></div>}
            {(appointment.billing?.updated_at || appointment.updated_at) && <div>Date: <span className="text-xs text-gray-600">{formatDateDisplayIST(appointment.billing?.updated_at || appointment.updated_at)}</span></div>}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
              onClick={() => {
                try {
                  const billId = appointment.billing?.id || appointment.billing_id
                  if (!billId) {
                    onNotify('Billing id not available to share', 'error')
                    return
                  }

                  const customerPhone = appointment.customer_phone || appointment.customer_mobile || appointment.customer_contact || appointment.phone || ''

                  const invoiceData: any = {
                    billId: billId,
                    customerName: appointment.customer_name || '',
                    customerPhone: customerPhone,
                    customerEmail: appointment.customer_email || appointment.customer_email_address || '',
                    appointmentDate: formatDateDisplayIST(appointment.scheduled_start),
                    appointmentTime: formatTimeDisplayIST(appointment.scheduled_start),
                    services: (Array.isArray(itemsWithTax) ? itemsWithTax : []).map((s: any) => ({
                      name: s.service_name || s.name || '',
                      staffName: s.staff_name || s.staffName || undefined,
                      baseAmount: Number(s.baseAmount || s.price || 0),
                      gstPercent: Number(s.gstPercentage || s.gst || 0),
                      gstAmount: Number(s.gstAmount || s.totalTax || 0),
                      total: Number(s.lineTotal || s.total || 0),
                    })),
                    baseTotal: 0,
                    gstTotal: 0,
                    subtotal: appointment.billing?.total_amount || appointment.total_amount || 0,
                    discount: appointment.billing?.discount || 0,
                    finalAmount: appointment.billing?.paid_amount || appointment.billing?.final_amount || appointment.final_amount || appointment.total_amount || 0,
                    paymentMethod: appointment.billing?.payment_method || appointment.payment_method || '',
                    paymentStatus: appointment.billing?.payment_status || appointment.payment_status || '',
                  }

                  shareInvoiceLinkViaWhatsApp(invoiceData, customerPhone || '')
                } catch (err) {
                  console.error('Error sharing invoice link:', err)
                  onNotify('Failed to open WhatsApp share', 'error')
                }
              }}
            >
              📤 Share via WhatsApp
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                try {
                  sendEmailInline()
                } catch (err) {
                  console.error('Error triggering email send:', err)
                  onNotify('Failed to send invoice email', 'error')
                }
              }}
            >
              ✉️ Send Email
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded-md bg-slate-600 text-white text-sm font-semibold hover:bg-slate-700 transition flex items-center gap-1"
              onClick={() => {
                const billId = appointment.billing?.id || appointment.billing_id
                if (billId) {
                  window.open(`/invoice/${billId}?print=true`, '_blank')
                } else {
                  onNotify("Bill ID not found", "error")
                }
              }}
            >
              <Printer size={14} /> Print Bill
            </button>
          </div>
        </div>
      )}

      {/* Totals Summary */}
      <div className="mt-4 space-y-2">
        {itemsWithTax.length > 0 && (() => {
          const totalBase = itemsWithTax.reduce((sum, it) => sum + it.baseAmount, 0)
          const totalGST = itemsWithTax.reduce((sum, it) => sum + it.gstAmount, 0)
          return (
            <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-300 p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700">Base Amount:</span>
                <span className="font-semibold text-gray-900">₹{totalBase.toFixed(2)}</span>
              </div>
              {totalGST > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Total GST:</span>
                  <span className="font-semibold text-blue-600">₹{totalGST.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-300 flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">Grand Total:</span>
                <span className="font-bold text-xl text-gray-900">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          )
        })()}

        {!isBilled && itemsWithTax.length > 0 && (
          <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 p-4 shadow text-white">
            <div className="text-xs font-semibold opacity-90">Amount to Pay</div>
            <div className="font-bold text-2xl mt-1">₹{totals.total.toFixed(2)}</div>
          </div>
        )}
      </div>

      <button
        disabled={isPaid}
        className={`mt-3 w-full rounded-lg px-4 py-2 font-semibold text-sm shadow transition-all ${isPaid
            ? "bg-gray-300 text-gray-600 cursor-not-allowed opacity-60"
            : isBilled
              ? "bg-amber-600 text-white hover:bg-amber-700 hover:shadow-md"
              : "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white hover:shadow-md hover:brightness-110"
          }`}
        onClick={() => setShowModal(true)}
      >
        {isPaid ? "✓ Payment Done" : isBilled ? "Update Payment Status" : "💳 Proceed to Payment"}
      </button>

      {showModal ? (
        <BillingModal
          appointment={{ ...appointment, computed_total: totals.total, tax_amount: totals.tax }}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            onPaid()
          }}
          onNotify={onNotify}
        />
      ) : null}
    </div>
  )
}

// Billing Modal
function BillingModal({ appointment, onClose, onSaved, onNotify }) {
  const { data: actuals } = useSWR(`/api/appointments/${appointment.id}/actual-services`, fetcher)
  const [form, setForm] = useState({
    total_amount: "",
    discount: "",
    payment_method: "",
    payment_status: "paid",
    notes: "",
    send_email: true,
  })
  const [saving, setSaving] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  React.useEffect(() => {
    if (Array.isArray(actuals) && actuals.length > 0 && !form.total_amount) {
      // Price already includes GST, so just sum up all prices
      let total = 0
      for (const service of actuals) {
        const price = Number(service.price || 0)
        total += price
      }
      setForm((f) => ({ ...f, total_amount: String(total) }))
    }
  }, [actuals])

  const total = Number(form.total_amount || 0)
  const discountAmount = Number(form.discount || 0)
  const finalAmount = Math.max(0, total - discountAmount)

  // Calculate detailed breakdown for each service (price already includes GST)
  const servicesBreakdown = (Array.isArray(actuals) ? actuals : []).map((it: any) => {
    const totalPrice = Number(it.price || 0)
    const gst = Number(it.gst_percentage || 0)
    // Calculate base amount: total / (1 + gst%/100)
    const baseAmount = gst > 0 ? totalPrice / (1 + gst / 100) : totalPrice
    const gstAmount = totalPrice - baseAmount
    return {
      ...it,
      price: baseAmount,
      gst,
      totalTax: gstAmount,
      lineTotal: totalPrice,
    }
  })

  async function sendEmail(invoiceData: any) {
    if (!appointment.customer_email) {
      console.log("[Billing] No customer email found for appointment:", appointment.id)
      onNotify("Customer email not available - invoice not sent", "info")
      return
    }

    setEmailSending(true)
    try {
      console.log("[Billing] Sending invoice email to:", appointment.customer_email)
      const res = await fetch("/api/send-invoice-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: appointment.customer_email,
          billId: appointment.billing?.id || appointment.billing_id,
          customer_name: appointment.customer_name,
          appointment_date: formatDateTimeIST(appointment.scheduled_start),
          services: servicesBreakdown,
          subtotal: total - servicesBreakdown.reduce((sum: number, s: any) => sum + s.totalTax, 0),
          total: total,
          discount: discountAmount,
          final_amount: finalAmount,
          payment_method: form.payment_method,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        console.log("[Billing] Invoice email sent successfully")
        onNotify("📧 Invoice sent to customer email", "success")
      } else {
        console.error("[Billing] Email send failed:", data)
        onNotify("Failed to send email: " + (data.error || "Unknown error"), "error")
      }
    } catch (err) {
      console.error("[Billing] Error sending email:", err)
      onNotify("Error sending email: " + (err instanceof Error ? err.message : "Unknown error"), "error")
    } finally {
      setEmailSending(false)
    }
  }

  function handleSubmit(e: any) {
    e.preventDefault()
    setShowConfirm(true)
  }

  async function handleSave() {
    setShowConfirm(false)
    setSaving(true)
    try {
      // Check if billing already exists (for pending payments)
      const isBilled = !!(appointment.billing?.id || appointment.billing_id)
      const isPaid = (appointment.billing?.payment_status || appointment.payment_status) === "paid"

      // Use PATCH if billing exists and not paid, otherwise POST
      const method = isBilled && !isPaid ? "PATCH" : "POST"

      const res = await fetch(`/api/appointments/${appointment.id}/billing`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total_amount: total,
          discount: discountAmount,
          final_amount: finalAmount,
          payment_method: form.payment_method,
          payment_status: form.payment_status,
          notes: form.notes,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        onNotify(method === "PATCH" ? "✅ Payment status updated successfully" : "✅ Billing completed successfully", "success")

        // Send email if checkbox is checked
        if (form.send_email && appointment.customer_email) {
          await sendEmail({ total, discount: discountAmount, final_amount: finalAmount })
        }

        if (onSaved) onSaved()
      } else if (res.status === 409) {
        onNotify("⚠️ Billing already exists for this appointment. Only one payment per appointment allowed.", "error")
      } else {
        onNotify(data.error || "Failed to complete billing", "error")
      }
    } catch (err) {
      onNotify("Error saving billing", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {showQR ? (
        <div
          className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
              UPI Payment QR
            </h2>
            <button type="button" onClick={() => setShowQR(false)} className="text-gray-400 hover:text-gray-600">
              <X size={28} />
            </button>
          </div>
          <img src="/upi.jpg" alt="UPI QR Code" className="w-full max-w-xs rounded-lg shadow-lg border-4 border-gray-200" />
          <div className="w-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl p-4 text-center shadow-lg">
            <p className="text-white text-sm font-semibold opacity-90">Amount to Pay</p>
            <p className="text-3xl font-bold text-white mt-2">₹{finalAmount.toFixed(2)}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowQR(false)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white rounded-xl px-5 py-3 font-bold shadow-lg transition-all"
          >
            Close QR
          </button>
        </div>
      ) : (
        <form
          className="bg-white rounded-xl shadow-2xl p-4 w-full max-w-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
              💳 Billing Invoice
            </h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Customer & Date Info */}
          <div className="grid grid-cols-2 gap-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Customer</div>
              <div className="font-bold text-gray-900 mt-0.5 text-sm">{appointment.customer_name}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Date & Time</div>
              <div className="font-bold text-gray-900 mt-0.5 text-sm">
                {formatDateDisplayIST(appointment.scheduled_start)} • {formatTimeDisplayIST(appointment.scheduled_start)}
              </div>
            </div>
          </div>

          {/* Services Breakdown Table */}
          <div className="border border-gray-300 rounded-lg overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="text-left px-2 py-2 font-bold text-gray-700">Service</th>
                    <th className="text-right px-2 py-2 font-bold text-gray-700">Price</th>
                    <th className="text-right px-2 py-2 font-bold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {servicesBreakdown.length > 0 ? (
                    servicesBreakdown.map((service, idx) => (
                      <tr key={service.id || idx} className="hover:bg-gray-50 transition">
                        <td className="px-2 py-2 text-gray-900">
                          <div className="font-semibold text-xs">{service.service_name}</div>
                          {service.notes && <div className="text-xs text-gray-600 mt-0.5">📝 {service.notes}</div>}
                        </td>
                        <td className="text-right px-2 py-2 font-semibold text-gray-600">₹{service.price.toFixed(2)}</td>
                        <td className="text-right px-2 py-2 font-bold text-gray-900">₹{service.lineTotal.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-2 py-3 text-center text-gray-500 font-medium text-xs">
                        No services recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Section - Only show Total (tax included) */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border-2 border-emerald-300 shadow-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-700">Total Amount</span>
              <span className="font-bold text-lg text-emerald-900">₹{total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-emerald-600 mt-1">(including all taxes)</div>
          </div>

          {/* Discount Section */}
          <div>
            <label className="block font-semibold mb-1 text-gray-800 text-sm">Discount Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={total}
              className="border-2 border-purple-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-purple-400 font-semibold text-sm"
              placeholder="0.00"
              value={form.discount}
              onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
            />
          </div>

          {/* Discount Display */}
          {discountAmount > 0 && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-purple-700">Discount Applied</span>
                <span className="font-bold text-purple-900 text-sm">-₹{discountAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Final Amount */}
          <div className="bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-lg px-4 py-3 shadow-lg">
            <div className="text-white text-xs font-semibold opacity-90">Final Amount to Pay</div>
            <div className="text-2xl font-bold text-white mt-1">₹{finalAmount.toFixed(2)}</div>
            {discountAmount > 0 && (
              <div className="text-white text-xs opacity-90 mt-1">
                ✓ Discount of ₹{discountAmount.toFixed(2)} applied
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-semibold mb-1 text-gray-800 text-sm">Payment Method</label>
            <select
              className="border-2 border-indigo-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm"
              value={form.payment_method}
              onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
              required
            >
              <option value="">Select Payment Method</option>
              <option value="cash">💰 Cash</option>
              <option value="card">💳 Card</option>
              <option value="upi">📱 UPI</option>
              <option value="other">Other</option>
            </select>
          </div>

          {form.payment_method === "upi" && (
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg px-3 py-2 font-semibold shadow-lg hover:shadow-xl transition text-sm"
            >
              📲 Show UPI QR Code
            </button>
          )}

          {/* Payment Status - Fixed as Paid */}
          <div>
            <label className="block font-semibold mb-1 text-gray-800 text-sm">Payment Status</label>
            <div className="border-2 border-emerald-300 bg-emerald-50 rounded-lg px-3 py-2 w-full font-semibold text-sm text-emerald-700 flex items-center gap-2">
              <span className="text-lg">✅</span> Paid
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold mb-1 text-gray-800 text-sm">Notes (Optional)</label>
            <textarea
              className="border-2 border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-gray-400 font-medium text-sm"
              rows={2}
              placeholder="Add any notes..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {/* Email Checkbox */}
          {appointment.customer_email && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.send_email}
                  onChange={(e) => setForm((f) => ({ ...f, send_email: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">📧 Send Invoice Email</div>
                  <div className="text-xs text-gray-600">Invoice will be sent to {appointment.customer_email}</div>
                </div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all text-sm"
              onClick={onClose}
              disabled={saving || emailSending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition-all text-sm"
              disabled={saving || emailSending}
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  ✓ Complete Billing
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="Complete Billing"
          message={`Are you sure you want to complete billing for ${appointment.customer_name}?\n\nFinal Amount: ₹${finalAmount.toFixed(2)}\nPayment Method: ${form.payment_method || 'Not selected'}`}
          onConfirm={handleSave}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}
