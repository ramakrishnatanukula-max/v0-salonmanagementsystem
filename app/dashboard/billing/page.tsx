"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { Plus, X } from "lucide-react";

const fetcher = (u: string) => fetch(u).then(r => r.json());
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export default function BillingPage() {
  const today = fmt(new Date());
  // Get completed appointments for today that are not yet billed
  const { data: appts, mutate } = useSWR(`/api/billing/today-completed`, fetcher);
  const [selected, setSelected] = useState<any>(null);

  return (
    <main className="min-h-screen bg-gradient-to-tr from-green-100 via-blue-50 to-pink-100 p-0 flex flex-col">
      <h1 className="text-2xl font-bold text-blue-700 px-4 py-4">Billing - Today's Completed Appointments</h1>
      <section className="px-4">
        {(Array.isArray(appts) ? appts : []).length === 0 && (
          <p className="text-center mt-12 text-gray-400 text-base animate-pulse">No completed appointments to bill today</p>
        )}
        {(Array.isArray(appts) ? appts : []).map((a: any) => (
          <div key={a.id} className="bg-white rounded-xl shadow mb-3 p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-base text-blue-700">{a.customer_name}</div>
              <div className="text-xs text-gray-400 mb-1">
                {new Date(a.scheduled_start).toLocaleDateString()} • {new Date(a.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {a.status}
              </div>
              <div className="text-sm text-gray-600">Total: ₹{a.total_amount || "-"}</div>
            </div>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded font-bold"
              onClick={() => setSelected(a)}
            >
              Bill
            </button>
          </div>
        ))}
      </section>
      {selected && (
        <BillingModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            mutate();
          }}
        />
      )}
    </main>
  );
}

// Billing Modal for finishing billing
function BillingModal({ appointment, onClose, onSaved }) {
  const { data: actuals } = useSWR(`/api/appointments/${appointment.id}/actual-services`, fetcher);
  const [form, setForm] = useState({
    total_amount: "",
    paid_amount: "",
    payment_method: "",
    payment_status: "pending",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (actuals && !form.total_amount) {
      const sum = actuals.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
      setForm(f => ({ ...f, total_amount: sum ? String(sum) : "" }));
    }
  }, [actuals]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/appointments/${appointment.id}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        appointment_actualtaken_services_Id: actuals?.[0]?.id || null, // or handle as needed
      }),
    });
    setSaving(false);
    if (onSaved) onSaved();
  }

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur flex items-center justify-center"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
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
            onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))}
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
            onChange={e => setForm(f => ({ ...f, paid_amount: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Payment Method</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={form.payment_method}
            onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
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
            onChange={e => setForm(f => ({ ...f, payment_status: e.target.value }))}
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
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
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
  );
}
