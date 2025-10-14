"use client"
import React, { useState } from "react"
import useSWR from "swr"
import { X, ChevronDown, ChevronUp } from "lucide-react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

function useActuals(appointmentId: number, enabled: boolean) {
  const key = enabled ? `/api/appointments/${appointmentId}/actual-services` : null
  // @ts-ignore SWR conditional key
  return useSWR(key, fetcher)
}

function computeTotals(items: any[]) {
  let subtotal = 0
  let tax = 0
  for (const it of items || []) {
    const price = Number(it.price || 0)
    const gst = Number(it.gst_percentage || 0)
    const sgst = Number(it.sgst_percentage || 0)
    subtotal += price
    tax += price * ((gst + sgst) / 100)
  }
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  }
}

export default function BillingPage() {
  const { data: appts, mutate } = useSWR(`/api/billing/today-completed`, fetcher)
  const [selected, setSelected] = useState<any>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  return (
    <main className="min-h-screen bg-background p-0 flex flex-col">
      <h1 className="text-2xl font-bold text-green-700 px-4 py-4">Billing - Today&apos;s Completed Appointments</h1>
      <section className="px-4">
        {(Array.isArray(appts) ? appts : []).length === 0 && (
          <p className="text-center mt-12 text-gray-400 text-base">No completed appointments to bill today</p>
        )}
        {(Array.isArray(appts) ? appts : []).map((a: any) => {
          const isOpen = openId === a.id
          return (
            <div key={a.id} className="bg-card rounded-xl shadow mb-3">
              <button
                className="w-full flex items-center justify-between p-4"
                onClick={() => setOpenId(isOpen ? null : a.id)}
              >
                <div className="text-left">
                  <div className="font-semibold text-foreground">{a.customer_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.scheduled_start).toLocaleDateString()} •{" "}
                    {new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                    {a.status}
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="text-muted-foreground" />
                ) : (
                  <ChevronDown className="text-muted-foreground" />
                )}
              </button>

              {isOpen ? <AppointmentServicesPanel appointment={a} onPaid={() => mutate()} /> : null}
            </div>
          )
        })}
      </section>

      {selected && (
        <BillingModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null)
            mutate()
          }}
        />
      )}
    </main>
  )
}

function AppointmentServicesPanel({ appointment, onPaid }: { appointment: any; onPaid: () => void }) {
  const { data: items, isLoading } = useActuals(appointment.id, true)
  const totals = computeTotals(items || [])
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="px-4 pb-4">
      <div className="rounded-lg border bg-background">
        {isLoading ? (
          <div className="p-3 text-sm text-muted-foreground">Loading services…</div>
        ) : Array.isArray(items) && items.length > 0 ? (
          <ul className="divide-y">
            {items.map((it: any) => {
              const price = Number(it.price || 0)
              const gst = Number(it.gst_percentage || 0)
              const sgst = Number(it.sgst_percentage || 0)
              const lineTax = price * ((gst + sgst) / 100)
              const lineTotal = price + lineTax
              return (
                <li key={it.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{it.service_name}</div>
                      <div className="text-xs text-muted-foreground">
                        GST {gst}% • SGST {sgst}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-foreground">₹{lineTotal.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        Base ₹{price.toFixed(2)} • Tax ₹{lineTax.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {it.notes ? <div className="mt-1 text-xs text-muted-foreground">Note: {it.notes}</div> : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="p-3 text-sm text-muted-foreground">No services recorded.</div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div className="rounded-md bg-muted p-2">
          <div className="text-[11px] text-muted-foreground">Subtotal</div>
          <div className="font-semibold text-foreground">₹{totals.subtotal.toFixed(2)}</div>
        </div>
        <div className="rounded-md bg-muted p-2">
          <div className="text-[11px] text-muted-foreground">Tax</div>
          <div className="font-semibold text-foreground">₹{totals.tax.toFixed(2)}</div>
        </div>
        <div className="rounded-md bg-muted p-2">
          <div className="text-[11px] text-muted-foreground">Total Payable</div>
          <div className="font-semibold text-foreground">₹{totals.total.toFixed(2)}</div>
        </div>
      </div>

      <button
        className="mt-3 w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground"
        onClick={() => setShowModal(true)}
      >
        Pay
      </button>

      {showModal ? (
        <BillingModal
          appointment={{ ...appointment, computed_total: totals.total }}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false)
            onPaid()
          }}
        />
      ) : null}
    </div>
  )
}

// Billing Modal
function BillingModal({ appointment, onClose, onSaved }) {
  const { data: actuals } = useSWR(`/api/appointments/${appointment.id}/actual-services`, fetcher)
  const [form, setForm] = useState({
    total_amount: "",
    paid_amount: "",
    payment_method: "",
    payment_status: "pending",
    notes: "",
  })
  const [saving, setSaving] = useState(false)

  React.useEffect(() => {
    if (appointment?.computed_total && !form.total_amount) {
      setForm((f) => ({ ...f, total_amount: String(appointment.computed_total) }))
    } else if (Array.isArray(actuals) && !form.total_amount) {
      const sum = actuals.reduce((acc, s) => acc + (Number(s.price) || 0), 0)
      setForm((f) => ({ ...f, total_amount: sum ? String(sum) : "" }))
    }
  }, [appointment?.computed_total, actuals])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/appointments/${appointment.id}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        appointment_actualtaken_services_Id: actuals?.[0]?.id || null,
      }),
    })
    setSaving(false)
    if (onSaved) onSaved()
  }

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/60 backdrop-blur flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <form
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSave}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-green-700">Finish Billing</h2>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400">
            <X size={28} />
          </button>
        </div>
        <div>
          <label className="block font-bold mb-1">Total Amount</label>
          <input
            type="number"
            step="0.01"
            className="border rounded px-3 py-2 w-full"
            value={form.total_amount}
            onChange={(e) => setForm((f) => ({ ...f, total_amount: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Paid Amount</label>
          <input
            type="number"
            step="0.01"
            className="border rounded px-3 py-2 w-full"
            value={form.paid_amount}
            onChange={(e) => setForm((f) => ({ ...f, paid_amount: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Payment Method</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.payment_method}
            onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
          >
            <option value="">Select</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="upi">UPI</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block font-bold mb-1">Payment Status</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.payment_status}
            onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className="block font-bold mb-1">Notes</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <button
          type="submit"
          className="bg-gradient-to-tr from-green-600 to-blue-500 text-white rounded-lg px-5 py-2 font-bold shadow"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Billing"}
        </button>
      </form>
    </div>
  )
}
