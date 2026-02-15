"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, AlertCircle, ArrowRight } from "lucide-react"
import Toast from "@/components/Toast"

export default function CustomerLoginPage() {
    const [identifier, setIdentifier] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [toast, setToast] = useState<{ type: "success" | "error" | "info", message: string } | null>(null)
    const router = useRouter()

    useEffect(() => {
        // If already logged in, redirect to dashboard
        const stored = localStorage.getItem("customer_phone")
        if (stored) {
            router.replace("/customer/dashboard")
        }
    }, [router])

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (!identifier.trim()) {
            setError("Please enter your mobile number or UNISL ID")
            return
        }

        setLoading(true)
        setError("")

        try {
            const formatted = identifier.trim()
            const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(formatted)}`)
            const data = await res.json()

            if (res.ok && data.found && data.customer) {
                // Store session info
                localStorage.setItem("customer_phone", data.customer.phone)
                localStorage.setItem("customer_id", String(data.customer.id))
                localStorage.setItem("customer_name", data.customer.first_name)

                setToast({ type: "success", message: `Welcome back, ${data.customer.first_name}!` })

                // Short delay for UX before redirect
                setTimeout(() => {
                    router.push("/customer/dashboard")
                }, 800)
            } else {
                setError("Customer not found. Please verify your details or contact reception.")
            }
        } catch (err) {
            setError("Unable to connect. Please check your internet connection.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 relative z-10 transition-all hover:shadow-3xl">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6 transform rotate-3 hover:rotate-6 transition-transform duration-300">
                        <span className="text-3xl font-bold text-white tracking-tighter">us</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
                    <p className="text-gray-500 mt-2 font-medium">Access your profile and history</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">
                            Mobile Number or UNISL ID
                        </label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => {
                                    const val = e.target.value
                                    if (val.toUpperCase().startsWith('UNISL')) {
                                        setIdentifier(val.toUpperCase()) // Force uppercase for ID consistency
                                    } else {
                                        setIdentifier(val)
                                    }
                                    if (error) setError("")
                                }}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium placeholder:text-gray-400 text-lg"
                                placeholder="e.g. 9876543210 or UNISL001"
                                autoFocus
                            />
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-red-500 text-sm font-medium mt-2 bg-red-50 p-3 rounded-xl border border-red-100 animate-in slide-in-from-top-2">
                                <AlertCircle size={16} className="flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !identifier}
                        className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                View Dashboard
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 font-medium">
                        Protected by secure login • unisalon
                    </p>
                </div>
            </div>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </main>
    )
}
