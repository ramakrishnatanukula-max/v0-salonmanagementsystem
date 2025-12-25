"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Toast from "@/components/Toast"

type Service = { id: number; name: string; category_id: number }
type Category = { id: number; name: string; services: Service[] }

export default function SignupForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [role, setRole] = useState<"admin" | "receptionist" | "staff">("receptionist")
  const [selectedServices, setSelectedServices] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [password, setPassword] = useState("")
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

  const toggleService = (id: number) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          mobile,
          role,
          services: role === "staff" ? selectedServices : undefined,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Signup failed")
      
      // Show success toast
      setToast({ type: "success", message: "Account created successfully!" })
      setSuccess("Account created successfully!")
      
      // Reset form
      setName("")
      setEmail("")
      setMobile("")
      setPassword("")
      setRole("receptionist")
      setSelectedServices([])
      
    } catch (err: any) {
      setError(err.message)
      setToast({ type: "error", message: err.message || "Failed to create account" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-lg flex flex-col gap-6"
      aria-label="Sign up form"
    >
      <h1 className="text-2xl font-extrabold text-indigo-700 text-center select-none">Create Account</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-semibold text-gray-700">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold text-gray-700">
          Email (optional)
        </label>
        <input
          id="email"
          type="email"
          className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="mobile" className="text-sm font-semibold text-gray-700">
          Mobile (primary)
        </label>
        <input
          id="mobile"
          type="tel"
          className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          placeholder="+91 998887777"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          required
          autoComplete="tel"
          inputMode="tel"
          pattern="[+0-9]*"
          spellCheck={false}
        />
        <p className="text-xs text-gray-400 select-none">Use country code, digits only.</p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="w-full h-11 rounded-lg border border-gray-300 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          placeholder="Enter a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="role" className="text-sm font-semibold text-gray-700">
          Role
        </label>
        <select
          id="role"
          className="h-11 rounded-lg border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          required
        >
          <option value="admin">Admin/Owner</option>
          <option value="receptionist">Receptionist</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {role === "staff" && (
        <section aria-label="Select services staff can perform" className="space-y-4">
          <h2 className="text-lg font-semibold text-indigo-700">Select services you can perform</h2>
          <div className="flex flex-col gap-4 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-indigo-50">
            {categories.map((cat) => (
              <fieldset key={cat.id} className="border border-gray-300 rounded-md">
                <legend className="px-3 py-2 bg-indigo-100 text-indigo-700 font-semibold text-sm">{cat.name}</legend>
                <div className="p-3 grid grid-cols-1 gap-2">
                  {cat.services.map((svc) => (
                    <label
                      key={svc.id}
                      htmlFor={`svc-${svc.id}`}
                      className="flex items-center gap-3 cursor-pointer select-none"
                    >
                      <input
                        id={`svc-${svc.id}`}
                        type="checkbox"
                        checked={selectedServices.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-indigo-400 focus:ring-2"
                      />
                      <span className="text-sm text-gray-800">{svc.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 font-semibold select-none">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-green-600 font-semibold select-none">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-lg bg-gradient-to-tr from-indigo-600 to-green-500 text-white font-extrabold shadow-lg hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
        aria-live="polite"
      >
        {loading ? "Creating..." : "Create account"}
      </button>

      <p className="text-sm text-center text-gray-600 select-none">
        Already have an account?{" "}
        <a href="/login" className="underline text-indigo-600 hover:text-indigo-700">
          Log in
        </a>
      </p>

      {/* Toast Notification */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </form>
  )
}
