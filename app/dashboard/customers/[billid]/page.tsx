"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/LoadingSpinner"
import Toast from "@/components/Toast"
import { formatDateDisplayIST, formatTimeDisplayIST } from "@/lib/timezone"
import { downloadInvoicePDF, shareInvoiceLinkViaWhatsApp, type InvoiceData } from "@/lib/pdf-generator"

export default function BillDetailPage() {
  const params = useParams() as { billid?: string }
  const router = useRouter()
  const { billid } = params || {}

  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [appointment, setAppointment] = useState<any | null>(null)
  const [actualServices, setActualServices] = useState<any[]>([])
  const [appointmentStaff, setAppointmentStaff] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!billid) {
        setToast({ type: "error", message: "No bill id provided" })
        setLoading(false)
        return
      }

      // Try to decode the bill id - supports base64 (possibly JSON), or plain number
      const tryDecode = (s: string) => {
        try {
          // handle URL-safe base64
          const padded = s.replace(/-/g, "+").replace(/_/g, "/") + Array((4 - (s.length % 4)) % 4 + 1).join("=")
          const decoded = atob(padded)
          try {
            return JSON.parse(decoded)
          } catch {
            return decoded
          }
        } catch (e) {
          // not base64
          return s
        }
      }

      const decoded = tryDecode(billid)

      // Determine numeric id candidates
      let idCandidate: number | null = null

      if (typeof decoded === 'object' && decoded !== null) {
        if ('id' in decoded) idCandidate = Number((decoded as any).id)
        else if ('billId' in decoded) idCandidate = Number((decoded as any).billId)
      } else if (typeof decoded === 'string') {
        // if decoded is numeric string
        if (/^\d+$/.test(decoded)) idCandidate = Number(decoded)
        else if (/^\d+$/.test(billid)) idCandidate = Number(billid)
      }

      try {
        // Prefer resolving by billing id first (token usually contains billing id)
        const billingId = idCandidate || Number(billid)
        if (!isNaN(billingId)) {
          const listRes = await fetch(`/api/appointments?billing_id=${billingId}`)
          if (listRes.ok) {
            const list = await listRes.json()
            if (Array.isArray(list) && list.length > 0) {
              const data = list[0]
              setAppointment(data)
              // fetch actual services and staff
              const servicesRes = await fetch(`/api/appointments/${data.id}/actual-services`)
              if (servicesRes.ok) {
                const services = await servicesRes.json()
                setActualServices(services || [])
                const staffIds = [...new Set((services || []).filter((s: any) => s.doneby_staff_id).map((s: any) => s.doneby_staff_id))]
                if (staffIds.length > 0) {
                  const staffPromises = staffIds.map((id: any) => fetch(`/api/staff/${id}`).then(r => r.json()))
                  const staffData = await Promise.all(staffPromises)
                  setAppointmentStaff(staffData.filter((s: any) => s && !s.error))
                }
              }
              setLoading(false)
              return
            }
          }
        }

        // Fallback: try fetching appointment directly by id (if the token contained appointment id)
        if (idCandidate) {
          const res = await fetch(`/api/appointments/${idCandidate}`)
          if (res.ok) {
            const data = await res.json()
            setAppointment(data)
            // fetch actual-services and staff if present
            if (data) {
              const servicesRes = await fetch(`/api/appointments/${data.id}/actual-services`)
              if (servicesRes.ok) {
                const services = await servicesRes.json()
                setActualServices(services || [])
                const staffIds = [...new Set((services || []).filter((s: any) => s.doneby_staff_id).map((s: any) => s.doneby_staff_id))]
                if (staffIds.length > 0) {
                  const staffPromises = staffIds.map((id: any) => fetch(`/api/staff/${id}`).then(r => r.json()))
                  const staffData = await Promise.all(staffPromises)
                  setAppointmentStaff(staffData.filter((s: any) => s && !s.error))
                }
              }
            }
            setLoading(false)
            return
          }
        }

        setToast({ type: "error", message: "Failed to load invoice for provided id." })
      } catch (error) {
        console.error(error)
        setToast({ type: "error", message: "Error fetching invoice details." })
      } finally {
        setLoading(false)
      }
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billid])

  if (loading) return <div className="p-12"><LoadingSpinner message="Loading invoice..." /></div>

  if (!appointment) return (
    <div className="max-w-screen-md mx-auto p-6">
      <div className="bg-white rounded-xl shadow p-6 text-center">
        <h2 className="text-lg font-bold mb-2">Invoice not found</h2>
        <p className="text-sm text-gray-600 mb-4">We couldn't find an invoice for that id.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-indigo-600 text-white rounded">Go Back</button>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )

  // Prepare invoice data for PDF helpers
  const invoiceData: InvoiceData = {
    billId: appointment.billing?.id || appointment.id,
    customerName: appointment.customer_name || `${appointment.customer_first_name || ''} ${appointment.customer_last_name || ''}`.trim() || 'Customer',
    customerPhone: appointment.phone || appointment.customer_phone || '',
    customerEmail: appointment.customer_email || appointment.email,
    appointmentDate: formatDateDisplayIST(appointment.scheduled_start),
    appointmentTime: formatTimeDisplayIST(appointment.scheduled_start),
    familyMemberName: appointment.family_member?.name,
    services: (actualServices.length > 0 ? actualServices : (appointment.services || [])).map((s: any) => {
      const totalPrice = Number(s.price || 0)
      const gstPercent = Number(s.gst_percentage || 0)
      const baseAmount = gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice
      const gstAmount = totalPrice - baseAmount
      const staff = appointmentStaff.find((st: any) => st.id === s.doneby_staff_id)
      return {
        name: s.service_name || s.name,
        staffName: staff?.name,
        baseAmount,
        gstPercent,
        gstAmount,
        total: totalPrice
      }
    }),
    baseTotal: 0,
    gstTotal: 0,
    subtotal: (actualServices.length > 0 ? actualServices : (appointment.services || [])).reduce((sum: number, s: any) => sum + Number(s.price || 0), 0),
    discount: Number(appointment.billing?.discount_amount || 0),
    finalAmount: Number(appointment.billing?.total_amount || appointment.billing?.final_amount || 0),
    paymentMethod: appointment.billing?.payment_method || 'Cash',
    paymentStatus: appointment.billing?.payment_status || 'paid',
    paidAmount: Number(appointment.billing?.paid_amount || 0)
  }

  // compute baseTotal and gstTotal
  invoiceData.baseTotal = invoiceData.services.reduce((sum, s) => sum + s.baseAmount, 0)
  invoiceData.gstTotal = invoiceData.services.reduce((sum, s) => sum + s.gstAmount, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-screen-md mx-auto">
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold flex items-center gap-3">Invoice <span className="text-sm text-emerald-100 ml-2">#{invoiceData.billId}</span></h1>
              <div className="text-right">
                <div className="text-sm">{invoiceData.appointmentDate}</div>
                <div className="text-sm">{invoiceData.appointmentTime}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Bill To</p>
                <p className="font-bold text-gray-800">{invoiceData.customerName}</p>
                {invoiceData.customerPhone && <p className="text-sm text-gray-600">{invoiceData.customerPhone}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Appointment</p>
                <p className="font-semibold text-gray-800">#{appointment.id}</p>
                <p className="text-sm text-gray-600">{invoiceData.appointmentTime}</p>
              </div>
            </div>

            <div>
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-2 text-xs font-bold text-gray-600 uppercase">Service</th>
                    <th className="text-left py-2 text-xs font-bold text-gray-600 uppercase">Staff</th>
                    <th className="text-right py-2 text-xs font-bold text-gray-600 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.services.map((s, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{s.name}</p>
                        {s.gstPercent > 0 && <p className="text-xs text-gray-500">GST: {s.gstPercent}%</p>}
                      </td>
                      <td className="py-3 text-sm text-gray-600">{s.staffName || '-'}</td>
                      <td className="py-3 text-right font-semibold text-gray-800">₹{s.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Subtotal:</span>
                <span className="font-semibold">₹{invoiceData.subtotal.toFixed(2)}</span>
              </div>
              {invoiceData.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Discount:</span>
                  <span className="font-semibold text-green-700">-₹{invoiceData.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-3 border-t">
                <span>Total:</span>
                <span className="text-2xl text-emerald-700">₹{invoiceData.finalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => downloadInvoicePDF(invoiceData)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg"
              >
                Download PDF
              </button>
              {invoiceData.customerPhone && !invoiceData.customerPhone.startsWith('UNISL') && (
                <button
                  onClick={() => {
                    const phone = invoiceData.customerPhone || ''
                    if (!phone) {
                      setToast({ type: 'error', message: 'Customer phone not available for WhatsApp share' })
                      return
                    }
                    shareInvoiceLinkViaWhatsApp(invoiceData, phone)
                    setToast({ type: 'success', message: 'Opening WhatsApp with invoice link...' })
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 rounded-lg hover:shadow-lg"
                >
                  Share via WhatsApp
                </button>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3 text-center border-t-2 border-gray-200">
            <p className="text-xs text-gray-600">Invoice generated from appointment #{appointment.id}</p>
          </div>
        </div>
        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      </div>
    </main>
  )
}
