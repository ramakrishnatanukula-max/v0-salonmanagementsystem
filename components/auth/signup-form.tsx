"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Toast from "@/components/Toast"
import { User, Mail, Phone, Lock, Shield, Eye, EyeOff, Crown, ClipboardList, Scissors, ChevronDown, ChevronUp, Check, Sparkles, AlertCircle } from "lucide-react"

type Service = { id: number; name: string; category_id: number }
type Category = { id: number; name: string; services: Service[] }

const ROLES = [
  {
    value: "admin" as const,
    label: "Admin / Owner",
    description: "Full access to all features and settings",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    borderColor: "border-amber-400",
    ringColor: "ring-amber-400",
  },
  {
    value: "receptionist" as const,
    label: "Receptionist",
    description: "Manage appointments, billing, and customers",
    icon: ClipboardList,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    borderColor: "border-blue-400",
    ringColor: "ring-blue-400",
  },
  {
    value: "staff" as const,
    label: "Staff Member",
    description: "View assigned appointments and perform services",
    icon: Scissors,
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
    borderColor: "border-violet-400",
    ringColor: "ring-violet-400",
  },
]

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
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

  const selectedRole = ROLES.find((r) => r.value === role)!

  const toggleService = (id: number) => {
    setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleCategoryExpand = (catId: number) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) next.delete(catId)
      else next.add(catId)
      return next
    })
  }

  const toggleCategoryAll = (cat: Category) => {
    const allSelected = cat.services.every((s) => selectedServices.includes(s.id))
    if (allSelected) {
      setSelectedServices((prev) => prev.filter((id) => !cat.services.some((s) => s.id === id)))
    } else {
      setSelectedServices((prev) => {
        const newIds = cat.services.map((s) => s.id).filter((id) => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
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

      setToast({ type: "success", message: `🎉 ${name} has been added as ${selectedRole.label}!` })
      setSuccess(`${name} has been added successfully as ${selectedRole.label}!`)

      // Reset form
      setName("")
      setEmail("")
      setMobile("")
      setPassword("")
      setRole("receptionist")
      setSelectedServices([])
      setExpandedCategories(new Set())
    } catch (err: any) {
      setError(err.message)
      setToast({ type: "error", message: err.message || "Failed to create account" })
    } finally {
      setLoading(false)
    }
  }

  // Validation helpers
  const isMobileValid = mobile.length === 10
  const isNameValid = name.trim().length >= 2
  const isPasswordValid = password.length >= 4
  const isFormValid = isNameValid && isMobileValid && isPasswordValid

  return (
    <form
      onSubmit={onSubmit}
      className="w-full flex flex-col gap-0"
      aria-label="Staff creation form"
    >
      {/* ─── STEP 1: Personal Details ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            1
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
            <p className="text-xs text-gray-500">Basic information about the team member</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <User size={14} className="text-indigo-500" />
              Full Name
              <span className="text-red-400 text-xs">*</span>
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                className={`w-full h-12 rounded-xl border-2 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-gray-50/50 ${name && !isNameValid ? "border-red-300" : name && isNameValid ? "border-emerald-300" : "border-gray-200 hover:border-indigo-300"
                  }`}
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                spellCheck={false}
              />
              {name && isNameValid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check size={16} className="text-emerald-500" />
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Mail size={14} className="text-purple-500" />
              Email
              <span className="text-xs text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              id="email"
              type="email"
              className="w-full h-12 rounded-xl border-2 border-gray-200 px-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all hover:border-purple-300 bg-gray-50/50"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              spellCheck={false}
            />
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mobile" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Phone size={14} className="text-pink-500" />
              Mobile Number
              <span className="text-red-400 text-xs">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">+91</div>
              <input
                id="mobile"
                type="tel"
                className={`w-full h-12 rounded-xl border-2 pl-12 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-gray-50/50 ${mobile && !isMobileValid ? "border-red-300" : mobile && isMobileValid ? "border-emerald-300" : "border-gray-200 hover:border-pink-300"
                  }`}
                placeholder="9988776655"
                value={mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "")
                  if (value.length <= 10) setMobile(value)
                }}
                required
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                spellCheck={false}
              />
              {mobile && isMobileValid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check size={16} className="text-emerald-500" />
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 select-none ml-0.5">
              {mobile ? `${mobile.length}/10 digits` : "10-digit mobile number"}
            </p>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Lock size={14} className="text-indigo-500" />
              Password
              <span className="text-red-400 text-xs">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`w-full h-12 rounded-xl border-2 px-4 pr-12 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-gray-50/50 ${password && !isPasswordValid ? "border-red-300" : password && isPasswordValid ? "border-emerald-300" : "border-gray-200 hover:border-indigo-300"
                  }`}
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && !isPasswordValid && (
              <p className="text-xs text-red-400 ml-0.5">Password must be at least 4 characters</p>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

      {/* ─── STEP 2: Role Selection ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            2
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Select Role</h2>
            <p className="text-xs text-gray-500">Choose the role and access level for this member</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map((r) => {
            const Icon = r.icon
            const isSelected = role === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                    ? `${r.borderColor} bg-gradient-to-br ${r.bgGradient} ring-2 ${r.ringColor} ring-offset-1 shadow-md`
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  }`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-gradient-to-br ${r.gradient} flex items-center justify-center shadow-sm`}>
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.gradient} flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <p className={`font-bold text-sm ${isSelected ? "text-gray-900" : "text-gray-700"}`}>
                  {r.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── STEP 3: Service Skills (Staff only) ─── */}
      {role === "staff" && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8" />

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                3
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">Service Skills</h2>
                <p className="text-xs text-gray-500">Select the services this staff member can perform</p>
              </div>
              {selectedServices.length > 0 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                  {selectedServices.length} selected
                </span>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  const allIds = categories.flatMap((c) => c.services.map((s) => s.id))
                  setSelectedServices(allIds)
                  setExpandedCategories(new Set(categories.map((c) => c.id)))
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors underline underline-offset-2"
              >
                Select All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedServices([])}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
              >
                Clear All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={() => {
                  if (expandedCategories.size === categories.length) {
                    setExpandedCategories(new Set())
                  } else {
                    setExpandedCategories(new Set(categories.map((c) => c.id)))
                  }
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
              >
                {expandedCategories.size === categories.length ? "Collapse All" : "Expand All"}
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isExpanded = expandedCategories.has(cat.id)
                const selectedCount = cat.services.filter((s) => selectedServices.includes(s.id)).length
                const allSelected = selectedCount === cat.services.length
                const someSelected = selectedCount > 0

                return (
                  <div key={cat.id} className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                    {/* Category Header */}
                    <div className="flex items-center bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className="flex-1 flex items-center gap-2.5 px-4 py-3 text-left"
                      >
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-violet-600" />
                        ) : (
                          <ChevronDown size={16} className="text-gray-400" />
                        )}
                        <span className="font-bold text-gray-800 text-sm">{cat.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCount > 0 ? "bg-violet-100 text-violet-700" : "bg-gray-200 text-gray-500"
                          }`}>
                          {selectedCount}/{cat.services.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleCategoryAll(cat)}
                        className={`mr-3 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${allSelected
                            ? "bg-violet-600 text-white"
                            : someSelected
                              ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        {allSelected ? "✓ All" : "All"}
                      </button>
                    </div>

                    {/* Services */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 divide-gray-100">
                        {cat.services.map((svc) => {
                          const isChecked = selectedServices.includes(svc.id)
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => toggleService(svc.id)}
                              className={`flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-violet-50/50 ${isChecked ? "bg-violet-50/60" : ""
                                }`}
                            >
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isChecked
                                  ? "bg-violet-600 border-violet-600"
                                  : "border-gray-300 bg-white"
                                }`}>
                                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                              </div>
                              <span className={`text-sm font-medium ${isChecked ? "text-violet-800" : "text-gray-700"}`}>
                                {svc.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ─── Status Messages ─── */}
      {error && (
        <div role="alert" className="flex items-center gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl mb-4 animate-in">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle size={16} className="text-white" />
          </div>
          <p className="text-sm text-red-700 font-semibold">{error}</p>
        </div>
      )}
      {success && (
        <div role="status" className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl mb-4 animate-in">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check size={16} className="text-white" strokeWidth={3} />
          </div>
          <div>
            <p className="text-sm text-emerald-700 font-semibold">{success}</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              You can assign skills from the <a href="/dashboard/staff/skills" className="underline font-bold">Staff Skills</a> page.
            </p>
          </div>
        </div>
      )}

      {/* ─── Submit ─── */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className={`w-full h-14 rounded-xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${isFormValid
              ? `bg-gradient-to-r ${selectedRole.gradient} text-white hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]`
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
            } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100`}
          aria-live="polite"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Create {selectedRole.label}</span>
            </>
          )}
        </button>

        {/* Form validation hint */}
        {!isFormValid && (
          <div className="mt-3 flex items-center gap-2 justify-center">
            <AlertCircle size={14} className="text-gray-400" />
            <p className="text-xs text-gray-400">
              {!isNameValid && "Name required • "}
              {!isMobileValid && "10-digit mobile required • "}
              {!isPasswordValid && "Password required"}
            </p>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </form>
  )
}
