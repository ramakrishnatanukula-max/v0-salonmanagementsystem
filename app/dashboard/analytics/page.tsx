"use client"

import useSWR from "swr"
import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, DollarSign, Zap, Calendar, ArrowRight, Filter, X } from "lucide-react"
import LoadingSpinner from "@/components/LoadingSpinner"
import { formatDateIST, getMonthBoundsIST } from "@/lib/timezone"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function AnalyticsPage() {
  const [mode, setMode] = useState<"today" | "thisMonth" | "lastMonth" | "day" | "month" | "range">("today")
  const [day, setDay] = useState<string>(() => formatDateIST())
  const [month, setMonth] = useState<string>(() => {
    const d = new Date()
    const istDate = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    return `${istDate.getFullYear()}-${String(istDate.getMonth() + 1).padStart(2, "0")}`
  })
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    return formatDateIST(weekAgo)
  })
  const [toDate, setToDate] = useState<string>(() => formatDateIST())
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setShowHeader(currentScrollY <= lastScrollY || currentScrollY <= 10)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const { from, to, title } = useMemo(() => {
    const now = new Date()
    if (mode === "today") {
      const f = formatDateIST(now)
      return { from: f, to: f, title: "Today" }
    }
    if (mode === "thisMonth") {
      const { from, to } = getMonthBoundsIST(now)
      return { from, to, title: "This Month" }
    }
    if (mode === "lastMonth") {
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const { from, to } = getMonthBoundsIST(last)
      return { from, to, title: "Last Month" }
    }
    if (mode === "day") {
      return { from: day, to: day, title: `Day: ${day}` }
    }
    if (mode === "range") {
      return { from: fromDate, to: toDate, title: `${fromDate} to ${toDate}` }
    }
    const [y, m] = month.split("-").map(Number)
    const base = new Date(y, (m || 1) - 1, 1)
    const { from, to } = getMonthBoundsIST(base)
    return { from, to, title: `Month: ${month}` }
  }, [mode, day, month, fromDate, toDate])

  const { data, isLoading, error } = useSWR(from && to ? `/api/analytics?from=${from}&to=${to}` : null, fetcher)
  const kpis = data?.kpis || { appointments: 0, completed: 0, revenue: 0, performedRevenue: 0, servicesPerformed: 0 }
  const statusData = Array.isArray(data?.status) ? data.status : []
  const paymentStatusData = Array.isArray(data?.paymentStatus) ? data.paymentStatus : []
  const billingStats = data?.billingStats || { billed: 0, unbilled: 0, in_service: 0, canceled: 0 }
  const topServices = Array.isArray(data?.topServices) ? data.topServices : []
  const staff = Array.isArray(data?.staff) ? data.staff : []

  // Handle loading and error states
  const showContent = !isLoading && !error

  // Calculate completion percentage
  const completionPercentage = kpis.appointments > 0 ? Math.round((kpis.completed / kpis.appointments) * 100) : 0
  
  // Group payment statuses
  const paymentStats = {
    paid: paymentStatusData.find((p: any) => p.status === "paid")?.count || 0,
    pending: paymentStatusData.find((p: any) => p.status === "pending")?.count || 0,
  }
  
  // Top 5 services
  const topFiveServices = (topServices || []).slice(0, 5)

  return (
    <main className="min-h-dvh bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
      {/* Header */}
      <div className={`mb-6 sticky top-4 z-10 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm max-w-7xl mx-auto transition-all duration-300 transform ${
        showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">{title}</p>
          </div>
          <Calendar className="w-6 h-6 text-indigo-600" />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all text-xs font-medium"
        >
          <Filter className="w-4 h-4" />
          {showAdvancedFilter ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Advanced Filter Section */}
        {showAdvancedFilter && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Filter Options</h3>
            
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setMode("today")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "today"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setMode("thisMonth")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "thisMonth"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300"
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setMode("lastMonth")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "lastMonth"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-700 border border-gray-200 hover:border-indigo-300"
                }`}
              >
                Last Month
              </button>
            </div>

            {/* Date Range */}
            <div className="flex flex-wrap gap-3 items-end mb-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-700">From Date:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                  }}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-indigo-300 bg-white"
                />
              </label>
              <ArrowRight className="w-4 h-4 text-gray-400 mb-1.5" />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-700">To Date:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                  }}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-indigo-300 bg-white"
                />
              </label>
            </div>

            {/* Apply Filter Button */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMode("range")
                  setShowAdvancedFilter(false)
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-all shadow-md"
              >
                Apply Filter
              </button>
              <button
                onClick={() => setShowAdvancedFilter(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && <LoadingSpinner message="Loading analytics..." />}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-600 font-medium">Failed to load analytics data</p>
        </div>
      )}

      {/* KPI Cards */}
      {showContent && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Appointments Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Appointments</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{kpis.appointments}</div>
          <p className="text-xs text-gray-500 mt-1">scheduled</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-full"></div>
        </div>

        {/* Completed Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Completed</h3>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-600">{kpis.completed}</div>
          <p className="text-xs text-gray-500 mt-1">{completionPercentage}% rate</p>
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Revenue</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">₹{Number(kpis.revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          <p className="text-xs text-gray-500 mt-1">billed</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"></div>
        </div>

        {/* Services Card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Services</h3>
            <div className="p-2 bg-pink-100 rounded-lg">
              <Zap className="w-4 h-4 text-pink-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{kpis.servicesPerformed}</div>
          <p className="text-xs text-gray-500 mt-1">performed</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full"></div>
        </div>
      </div>

      {/* Billing Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Billed Appointments */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Billed</h3>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-600">{billingStats.billed}</div>
          <p className="text-xs text-gray-500 mt-1">appointments</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"></div>
        </div>

        {/* Unbilled Appointments */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Unbilled</h3>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-amber-600">{billingStats.unbilled}</div>
          <p className="text-xs text-gray-500 mt-1">completed</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
        </div>

        {/* In Service Appointments */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">In Service</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-blue-600">{billingStats.in_service}</div>
          <p className="text-xs text-gray-500 mt-1">ongoing</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-indigo-600 to-emerald-600 rounded-full"></div>
        </div>

        {/* Canceled Appointments */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs md:text-sm text-gray-600 font-medium">Canceled</h3>
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-red-600">{billingStats.canceled}</div>
          <p className="text-xs text-gray-500 mt-1">appointments</p>
          <div className="mt-3 h-1 bg-gradient-to-r from-red-400 to-red-600 rounded-full"></div>
        </div>
      </div>

      {/* Status Overview & Payment Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Appointment Status */}
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm md:text-base font-bold text-gray-900 mb-4">Appointment Status</h2>
          <div className="space-y-3">
            {statusData.length > 0 ? (
              statusData.map((status: any, idx: number) => {
                const percentage = kpis.appointments > 0 ? (status.count / kpis.appointments) * 100 : 0
                const statusColors: Record<string, string> = {
                  scheduled: "bg-blue-500",
                  completed: "bg-emerald-500",
                  in_service: "bg-orange-500",
                  canceled: "bg-red-500",
                }
                const bgColor = statusColors[status.status] || "bg-gray-500"
                
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-gray-700 capitalize">{status.status}</span>
                        <span className="text-xs font-bold text-gray-900">{status.count}</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${bgColor} transition-all`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-xs text-gray-500">No data available</p>
            )}
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatusData.length > 0 && (
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <h2 className="text-sm md:text-base font-bold text-gray-900 mb-4">Payment Status</h2>
            <div className="grid grid-cols-2 gap-3">
              {paymentStatusData.map((payment: any) => {
                const paymentColors: Record<string, { bg: string; text: string; icon: string }> = {
                  paid: { bg: "bg-emerald-50", text: "text-emerald-700", icon: "✓" },
                  pending: { bg: "bg-amber-50", text: "text-amber-700", icon: "⏳" },
                  completed: { bg: "bg-blue-50", text: "text-blue-700", icon: "✓" },
                  failed: { bg: "bg-red-50", text: "text-red-700", icon: "✗" },
                }
                const colors = paymentColors[payment.status] || { bg: "bg-gray-50", text: "text-gray-700", icon: "?" }
                
                return (
                  <div key={payment.status} className={`${colors.bg} rounded-lg p-3 border ${colors.text.replace("text", "border").replace("700", "200")}`}>
                    <div className={`inline-block w-7 h-7 rounded-full ${colors.bg} flex items-center justify-center ${colors.text} text-sm font-bold mb-1.5`}>
                      {colors.icon}
                    </div>
                    <p className="text-xs font-medium text-gray-600 capitalize">{payment.status}</p>
                    <p className={`text-xl font-bold ${colors.text}`}>{payment.count}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Top Services */}
      {topFiveServices.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-sm md:text-base font-bold text-gray-900 mb-4">Top Services</h2>
          <div className="space-y-3">
            {topFiveServices.map((service: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{service.name}</p>
                  <p className="text-xs text-gray-500">{service.count} times</p>
                </div>
                <div className="flex-shrink-0">
                  <div className="inline-block px-2.5 py-1 bg-indigo-50 rounded-full">
                    <p className="text-xs font-bold text-indigo-600">{service.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Staff Performance */}
      {/* {staff.length > 0 && (
        <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm md:text-base font-bold text-gray-900 mb-4">Staff Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 md:px-3 font-semibold text-gray-700 text-xs">Staff</th>
                  <th className="text-center py-2 px-2 md:px-3 font-semibold text-gray-700 text-xs">Services</th>
                  <th className="text-right py-2 px-2 md:px-3 font-semibold text-gray-700 text-xs">Actual</th>
                  <th className="text-right py-2 px-2 md:px-3 font-semibold text-gray-700 text-xs">Billed</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                    <td className="py-2.5 px-2 md:px-3">
                      <p className="font-medium text-gray-900 text-xs md:text-sm">{member.name}</p>
                    </td>
                    <td className="py-2.5 px-2 md:px-3 text-center">
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {member.services_count}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 md:px-3 text-right">
                      <p className="font-medium text-gray-900 text-xs md:text-sm">₹{Number(member.actual_revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                    </td>
                    <td className="py-2.5 px-2 md:px-3 text-right">
                      <p className="font-medium text-emerald-600 text-xs md:text-sm">₹{Number(member.billed_revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      </>
      )}
    </main>
  )
}
