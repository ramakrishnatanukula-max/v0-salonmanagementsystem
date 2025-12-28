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
      className="w-full flex flex-col gap-6"
      aria-label="Sign up form"
    >
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent select-none">Create New Account</h1>
        <p className="text-gray-600 mt-2 text-sm">Fill in the details below to add a new staff member</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-bold text-gray-800">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300 bg-gray-50/50"
            placeholder="Enter full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            spellCheck={false}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-bold text-gray-800">
            Email <span className="text-xs text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 bg-gray-50/50"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="mobile" className="text-sm font-bold text-gray-800">
            Mobile Number <span className="text-xs text-red-500 font-normal">*</span>
          </label>
          <input
            id="mobile"
            type="tel"
            className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all hover:border-pink-300 bg-gray-50/50"
            placeholder="9988776655"
            value={mobile}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              if (value.length <= 10) setMobile(value)
            }}
            required
            autoComplete="tel"
            inputMode="numeric"
            maxLength={10}
            pattern="[0-9]{10}"
            spellCheck={false}
          />
          <p className="text-xs text-gray-500 select-none">Enter 10-digit mobile number</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-bold text-gray-800">
            Password <span className="text-xs text-red-500 font-normal">*</span>
          </label>
          <input
            id="password"
            type="password"
            className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300 bg-gray-50/50"
            placeholder="Create a secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="role" className="text-sm font-bold text-gray-800">
          User Role <span className="text-xs text-red-500 font-normal">*</span>
        </label>
        <select
          id="role"
          className="h-12 rounded-xl border-2 border-gray-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-purple-300 bg-gray-50/50 cursor-pointer"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          required
        >
          <option value="admin">👑 Admin/Owner</option>
          <option value="receptionist">📋 Receptionist</option>
          <option value="staff">✂️ Staff Member</option>
        </select>
      </div>

      {role === "staff" && (
        <section aria-label="Select services staff can perform" className="space-y-4 mt-2">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-indigo-200">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">✂️</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Service Specializations</h2>
              <p className="text-xs text-gray-500">Select all services this staff member can perform</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 max-h-96 overflow-y-auto border-2 border-indigo-100 rounded-2xl p-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            {categories.map((cat) => (
              <fieldset key={cat.id} className="border-2 border-indigo-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <legend className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-t-xl -mt-[2px] mx-[2px]">
                  {cat.name}
                </legend>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.services.map((svc) => (
                    <label
                      key={svc.id}
                      htmlFor={`svc-${svc.id}`}
                      className="flex items-center gap-3 cursor-pointer select-none p-2 rounded-lg hover:bg-indigo-50 transition-colors group"
                    >
                      <input
                        id={`svc-${svc.id}`}
                        type="checkbox"
                        checked={selectedServices.includes(svc.id)}
                        onChange={() => toggleService(svc.id)}
                        className="h-5 w-5 rounded-md border-2 border-indigo-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-800 font-medium group-hover:text-indigo-700 transition-colors">{svc.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">⚠️</span>
          </div>
          <p className="text-sm text-red-700 font-semibold select-none">{error}</p>
        </div>
      )}
      {success && (
        <div role="status" className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl">✓</span>
          </div>
          <p className="text-sm text-emerald-700 font-semibold select-none">{success}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
        aria-live="polite"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Create Account</span>
          </>
        )}
      </button>

      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 select-none">
          Need to go back?{" "}
          <a href="/dashboard" className="font-semibold text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text hover:from-indigo-700 hover:to-purple-700 transition-all">
            Return to Dashboard
          </a>
        </p>
      </div>

      {/* Toast Notification */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </form>
  )
}
