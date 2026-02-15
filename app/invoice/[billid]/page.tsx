"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import LoadingSpinner from "@/components/LoadingSpinner"
import Toast from "@/components/Toast"
import { formatDateDisplayIST, formatTimeDisplayIST } from "@/lib/timezone"
import { downloadInvoicePDF, shareInvoiceLinkViaWhatsApp, type InvoiceData } from "@/lib/pdf-generator"

export default function PublicInvoicePage() {
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

      // Determine candidate id. Two token formats supported:
      // 1) legacy URL-safe base64 JSON (payload only) -> decoded locally
      // 2) signed token format payload.signature -> resolve on server via API
      let idCandidate: number | null = null

      const isSignedToken = billid.includes('.')
      if (isSignedToken) {
        try {
          const res = await fetch(`/api/resolve-invoice-token?token=${encodeURIComponent(billid)}`)
          if (res.ok) {
            const json = await res.json()
            if (json && json.id) idCandidate = Number(json.id)
          } else {
            console.warn('Failed to resolve signed token', await res.text())
          }
        } catch (err) {
          console.error('Error resolving signed token', err)
        }
      } else {
        // Try to decode the bill id - supports URL-safe base64 (JSON), or plain number
        const tryDecode = (s: string) => {
          try {
            const padded = s.replace(/-/g, "+").replace(/_/g, "/") + Array((4 - (s.length % 4)) % 4 + 1).join("=")
            const decoded = atob(padded)
            try {
              return JSON.parse(decoded)
            } catch {
              return decoded
            }
          } catch (e) {
            return s
          }
        }

        const decoded = tryDecode(billid)

        if (typeof decoded === 'object' && decoded !== null) {
          if ('id' in decoded) idCandidate = Number((decoded as any).id)
          else if ('billId' in decoded) idCandidate = Number((decoded as any).billId)
        } else if (typeof decoded === 'string') {
          if (/^\d+$/.test(decoded)) idCandidate = Number(decoded)
          else if (/^\d+$/.test(billid)) idCandidate = Number(billid)
        }
      }

      try {
        // Prefer resolving by billing id
        const billingId = idCandidate || Number(billid)
        if (!isNaN(billingId)) {
          const listRes = await fetch(`/api/appointments?billing_id=${billingId}`)
          if (listRes.ok) {
            const list = await listRes.json()
            if (Array.isArray(list) && list.length > 0) {
              const data = list[0]
              setAppointment(data)
              const servicesRes = await fetch(`/api/appointments/${data.id}/actual-services`)
              if (servicesRes.ok) {
                const services = await servicesRes.json()
                setActualServices(services || [])
                const staffIds = [...new Set((services || []).filter((s: any) => s.doneby_staff_id).map((s: any) => s.doneby_staff_id))]
                if (staffIds.length > 0) {
                  try {
                    // Fetch all staff once (much lighter on DB connections list vs N detail queries)
                    const staffRes = await fetch(`/api/staff`)
                    if (staffRes.ok) {
                      const allStaff = await staffRes.json()
                      // Filter locally
                      const relevantStaff = Array.isArray(allStaff)
                        ? allStaff.filter((s: any) => staffIds.includes(s.id))
                        : []
                      setAppointmentStaff(relevantStaff)
                    }
                  } catch (e) {
                    console.error("Error fetching staff list", e)
                  }
                }
              }
              setLoading(false)
              return
            }
          }
        }

        // Fallback to appointment id
        if (idCandidate) {
          const res = await fetch(`/api/appointments/${idCandidate}`)
          if (res.ok) {
            const data = await res.json()
            setAppointment(data)
            if (data) {
              const servicesRes = await fetch(`/api/appointments/${data.id}/actual-services`)
              if (servicesRes.ok) {
                const services = await servicesRes.json()
                setActualServices(services || [])
                const staffIds = [...new Set((services || []).filter((s: any) => s.doneby_staff_id).map((s: any) => s.doneby_staff_id))]
                if (staffIds.length > 0) {
                  try {
                    const staffRes = await fetch(`/api/staff`)
                    if (staffRes.ok) {
                      const allStaff = await staffRes.json()
                      const relevantStaff = Array.isArray(allStaff)
                        ? allStaff.filter((s: any) => staffIds.includes(s.id))
                        : []
                      setAppointmentStaff(relevantStaff)
                    }
                  } catch (e) {
                    console.error("Error fetching staff list", e)
                  }
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

  // Auto-print if requested
  useEffect(() => {
    if (!loading && appointment) {
      const searchParams = new URLSearchParams(window.location.search)
      if (searchParams.get('print') === 'true') {
        // slight delay to ensure rendering is complete
        setTimeout(() => {
          window.print()
        }, 500)
      }
    }
  }, [loading, appointment])

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

  invoiceData.baseTotal = invoiceData.services.reduce((sum, s) => sum + s.baseAmount, 0)
  invoiceData.gstTotal = invoiceData.services.reduce((sum, s) => sum + s.gstAmount, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-screen-md mx-auto">
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          {/* Header Container */}
          <div
            className="p-5 md:p-6 print:p-6 border-b-4 border-emerald-600 bg-[#0b0b0b] text-white"
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-6">
              {/* LEFT : LOGO + BUSINESS DETAILS */}
              <div className="flex gap-4 items-start w-full md:w-auto">
                {/* LOGO */}
                <div className="w-[72px] h-[72px] shrink-0 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxKCpWlrl5Q6h27fXSHKJzR4JbuhWHONz4Ow&s"
                    alt="Unisalon Logo"
                    className="w-[60px] h-auto object-contain"
                  />
                </div>

                {/* BUSINESS INFO */}
                <div>
                  <div className="text-xl md:text-2xl font-bold tracking-wide">UNISALON</div>
                  <div className="text-xs font-semibold opacity-90 mt-0.5">By Shashi</div>

                  <div className="text-xs mt-1.5 leading-relaxed text-white/90 max-w-md">
                    110, Road No. 16, Alkapur Twp, Manikonda,
                    <br />
                    Hyderabad – 500 089
                  </div>

                  <div className="text-xs mt-1.5 text-white/90">
                    📧 info@unisalon.in &nbsp; | &nbsp; 📞 +91 76708 26262
                  </div>
                </div>
              </div>

              {/* RIGHT : INVOICE DETAILS */}
              <div className="text-left md:text-right print:text-right w-full md:w-auto min-w-[180px] mt-2 md:mt-0 print:mt-0">
                <h1 className="text-xl font-bold flex items-center md:justify-end print:justify-end gap-2">
                  Invoice
                  <span className="text-emerald-400 text-sm font-semibold">#{invoiceData.billId}</span>
                </h1>

                <div className="text-xs mt-1.5 opacity-90">{invoiceData.appointmentDate}</div>
                <div className="text-xs mt-0.5 opacity-90">{invoiceData.appointmentTime}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex flex-col md:flex-row print:flex-row justify-between gap-6">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Bill To</p>
                <p className="font-bold text-gray-800">{invoiceData.customerName}</p>
                {invoiceData.customerPhone && <p className="text-sm text-gray-600">{invoiceData.customerPhone}</p>}
              </div>
              <div className="text-left md:text-right print:text-right">
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

            <div className="space-y-4 pt-4 border-t border-gray-200">

              {/* GST Breakdown Box - mimicking PDF style */}
              {invoiceData.gstTotal > 0 && (
                <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '4px', border: '1px solid #fcd34d', WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
                  <p className="text-xs font-bold text-amber-800 uppercase mb-2">GST Breakdown</p>
                  <div className="flex justify-between text-xs text-amber-900">
                    <span>GST:</span>
                    <span className="font-semibold">₹{invoiceData.gstTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Subtotals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Amount (excl. GST):</span>
                  <span className="font-semibold text-gray-900">₹{invoiceData.baseTotal.toFixed(2)}</span>
                </div>
                {invoiceData.gstTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total GST:</span>
                    <span className="font-semibold text-gray-900">₹{invoiceData.gstTotal.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold pt-2 border-t border-gray-100">
                  <span className="text-gray-800">Subtotal (incl. GST):</span>
                  <span>₹{invoiceData.subtotal.toFixed(2)}</span>
                </div>

                {invoiceData.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount:</span>
                    <span>-₹{invoiceData.discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Final Amount Bar */}
              <div
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Final Amount:</span>
                <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{invoiceData.finalAmount.toFixed(2)}</span>
              </div>

              {/* Payment Information */}
              <div
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '16px',
                  borderRadius: '6px',
                  marginTop: '16px',
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact"
                }}
              >
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Information</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-gray-600">Paid Amount:</div>
                  <div className="font-semibold text-gray-900">₹{invoiceData.paidAmount?.toFixed(2) || invoiceData.finalAmount.toFixed(2)}</div>

                  <div className="text-gray-600">Payment Method:</div>
                  <div className="font-semibold text-gray-900 uppercase">{invoiceData.paymentMethod}</div>

                  <div className="text-gray-600">Payment Status:</div>
                  <div className={`font-semibold uppercase ${invoiceData.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                    {invoiceData.paymentStatus}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
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
