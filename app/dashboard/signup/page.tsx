"use client"

import SignupForm from "@/components/auth/signup-form"
import { useState, useEffect } from "react"
import { AlertCircle, Lock } from "lucide-react"

type Service = { id: number; name: string; category_id: number; price: number | string; duration_min: number | null }
type Category = { id: number; name: string }

export default function Page() {
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    // Check authorization on client side
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const user = await response.json()
          if (user.role === "admin") {
            setAuthorized(true)
            // Fetch categories
            const catRes = await fetch("/api/categories")
            const catData = await catRes.json()
            const servicesRes = await fetch("/api/services")
            const servicesData = await servicesRes.json()
            
            const catsArray = Array.isArray(catData) ? catData : [catData]
            const grouped = catsArray.map((c: any) => ({
              id: c.id,
              name: c.name,
              services: (servicesData || []).filter((s: any) => s.category_id === c.id),
            }))
            setCategories(grouped)
          } else {
            setAuthorized(false)
          }
        } else {
          setAuthorized(false)
        }
      } catch (err) {
        setAuthorized(false)
      }
    }
    checkAuth()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setShowHeader(currentScrollY <= lastScrollY || currentScrollY <= 10)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  if (authorized === null) {
    return (
      <main className="min-h-dvh bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block p-3 bg-indigo-100 rounded-full mb-4 animate-pulse">
            <Lock className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </main>
    )
  }

  if (!authorized) {
    return (
      <main className="min-h-dvh bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-100 rounded-full">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">Access Denied</h1>
          <p className="text-gray-600 text-center mb-6">
            Only administrators can add new staff members to the system.
          </p>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
          <a
            href="/dashboard"
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-center block"
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-300/30 to-purple-300/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-pink-300/30 to-purple-300/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-8 shadow-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Lock size={28} className="text-white" />
                </div>
                Staff Registration
              </h1>
              <p className="text-base md:text-lg text-white/90 mt-2">Add new team members to your salon</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <div className="relative flex items-start justify-center px-4 pt-8 pb-32">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 md:p-10 w-full max-w-3xl">
          <SignupForm categories={categories} />
        </div>
      </div>
    </main>
  )
}
