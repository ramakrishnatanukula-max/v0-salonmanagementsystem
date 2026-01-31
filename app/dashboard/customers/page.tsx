"use client"

import type React from "react"
import useSWR from "swr"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Search, User, Phone, Mail, Users, History, TrendingUp, Calendar, X, ChevronDown, ChevronUp, Scissors, DollarSign, Clock, IndianRupee, FileText, ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react"
import Toast from "@/components/Toast"
import LoadingSpinner from "@/components/LoadingSpinner"
import { formatDateDisplayIST, formatTimeDisplayIST } from "@/lib/timezone"
import { downloadInvoicePDF, shareInvoiceLinkViaWhatsApp, type InvoiceData } from "@/lib/pdf-generator"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function CustomersPage() {
  const { data: customers, mutate, isLoading } = useSWR("/api/customers", fetcher)
  const { data: userInfo } = useSWR("/api/auth/me", fetcher)
  const [searchPhone, setSearchPhone] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [actualServices, setActualServices] = useState<any[]>([])
  const [appointmentStaff, setAppointmentStaff] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingAppointment, setIsLoadingAppointment] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    family: true,
    history: true,
    analytics: true
  })
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
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

  // Fetch customer details when selected
  const { data: customerDetails, isLoading: detailsLoading } = useSWR(
    selectedCustomer ? `/api/customers/${selectedCustomer.id}` : null,
    fetcher,
    { revalidateOnMount: true, dedupingInterval: 0 }
  )

  // Fetch family members
  const { data: familyMembers, isLoading: familyLoading } = useSWR(
    selectedCustomer ? `/api/customers/${selectedCustomer.id}/family-members` : null,
    fetcher,
    { revalidateOnMount: true, dedupingInterval: 0 }
  )

  // Fetch appointments history (filtered by staff_id for staff role)
  const { data: appointments, mutate: mutateAppointments, isLoading: appointmentsLoading } = useSWR(
    selectedCustomer ? `/api/appointments?customer_id=${selectedCustomer.id}${userInfo?.role === 'staff' && userInfo?.user_id ? `&staff_id=${userInfo.user_id}` : ''}` : null,
    fetcher,
    { revalidateOnMount: true, dedupingInterval: 0 }
  )

  // Handle customer selection
  const handleSelectCustomer = (customer: any) => {
    // Reset all previous customer data
    setSelectedAppointment(null)
    setActualServices([])
    setAppointmentStaff([])
    // Set new customer
    setSelectedCustomer(customer)
    // Force revalidation of appointments
    setTimeout(() => {
      mutateAppointments()
    }, 100)
  }

  // Search customers by phone
  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      setToast({ type: "error", message: "Please enter a phone number" })
      return
    }
    
    setIsSearching(true)
    try {
      const res = await fetch(`/api/customers/lookup?phone=${encodeURIComponent(searchPhone)}`)
      const data = await res.json()
      
      if (data.found && data.customer) {
        handleSelectCustomer(data.customer)
      } else {
        setToast({ type: "info", message: "Customer not found" })
        setSelectedCustomer(null)
      }
    } catch (error) {
      setToast({ type: "error", message: "Failed to search customer" })
    } finally {
      setIsSearching(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const router = useRouter()

  // Navigate to dedicated bill detail page instead of opening modal
  const handleAppointmentClick = (appt: any) => {
    try {
      // Build a URL-safe base64 token from appointment id (or billing id when available)
      const payload = { id: appt.billing?.id || appt.id }
      const b64 = typeof window !== 'undefined' ? window.btoa(JSON.stringify(payload)) : Buffer.from(JSON.stringify(payload)).toString('base64')
      // URL-safe: + -> -, / -> _, remove trailing =
      const urlSafe = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      router.push(`/dashboard/customers/${urlSafe}`)
    } catch (err) {
      console.error('Failed to navigate to bill detail', err)
      setToast({ type: 'error', message: 'Failed to open invoice detail' })
    }
  }

  // Calculate analytics
  const completedAppointments = appointments?.filter((a: any) => a.status === 'completed') || []
  const analytics = appointments ? {
    totalAppointments: completedAppointments.length,
    completedAppointments: completedAppointments.length,
    totalSpent: completedAppointments
      .filter((a: any) => a.billing?.paid_amount)
      .reduce((sum: number, a: any) => sum + Number(a.billing.paid_amount || 0), 0),
    lastVisit: completedAppointments.length > 0 
      ? completedAppointments.sort((a: any, b: any) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())[0]
      : null
  } : null

  // Pagination logic
  const sortedCustomers = customers ? [...customers].sort((a: any, b: any) => b.id - a.id) : []
  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCustomers = sortedCustomers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-3 md:p-6">
      {/* Header */}
      <div className={`mb-6 sticky top-4 z-10 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm max-w-screen-xl mx-auto transition-all duration-300 transform ${
        showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              Customer Management
            </h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Search and view complete customer information</p>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pb-24">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Search size={24} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-800">Search Customer</h2>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                className="w-full border-2 border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Enter mobile number"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={18} />
                  Search
                </>
              )}
            </button>
          </div>
        </div>

        {/* Customers Table */}
        {!selectedCustomer && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 mb-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-indigo-600" />
                  <h2 className="text-xl font-bold text-gray-800">All Customers</h2>
                  <span className="px-3 py-1 rounded-full bg-indigo-200 text-indigo-800 text-sm font-semibold">
                    {sortedCustomers.length} Total
                  </span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12">
                <LoadingSpinner message="Loading customers..." />
              </div>
            ) : sortedCustomers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No customers found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentCustomers.map((customer: any) => (
                        <tr key={customer.id} className="hover:bg-indigo-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-gray-900">#{customer.id}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {customer.first_name?.[0]?.toUpperCase() || "?"}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {customer.first_name} {customer.last_name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-700">{customer.phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Mail size={14} className="text-gray-400" />
                              <span className="text-sm text-gray-700">{customer.email || "-"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleSelectCustomer(customer)}
                              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:brightness-110 transition-all"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, sortedCustomers.length)} of {sortedCustomers.length} customers
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                            currentPage === page
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                              : "border border-gray-300 hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {isLoading && <LoadingSpinner message="Loading customers..." />}

        {/* Customer Details */}
        {selectedCustomer && (
          <div className="space-y-4">
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 md:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-lg">
                    {selectedCustomer.first_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                      {selectedCustomer.first_name} {selectedCustomer.last_name}
                    </h2>
                    <p className="text-sm text-white/90">Customer ID: #{selectedCustomer.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null)
                    setSelectedAppointment(null)
                    setActualServices([])
                    setAppointmentStaff([])
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 md:p-6 space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone size={18} className="text-indigo-600" />
                  <span className="font-semibold">{selectedCustomer.phone}</span>
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Mail size={18} className="text-indigo-600" />
                    <span>{selectedCustomer.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-blue-600" />
                    <span className="text-xs font-semibold text-gray-600">Total Visits</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAppointments}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Scissors size={18} className="text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-600">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completedAppointments}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={18} className="text-purple-600" />
                    <span className="text-xs font-semibold text-gray-600">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">₹{analytics.totalSpent.toFixed(0)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={18} className="text-amber-600" />
                    <span className="text-xs font-semibold text-gray-600">Last Visit</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {analytics.lastVisit ? formatDateDisplayIST(analytics.lastVisit.scheduled_start) : "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Family Members Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <button
                onClick={() => toggleSection('family')}
                className="w-full px-4 md:px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users size={22} className="text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-800">Family Members</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-xs font-semibold">
                    {familyMembers?.length || 0}
                  </span>
                </div>
                {expandedSections.family ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.family && (
                <div className="p-4 md:p-6">
                  {familyLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-purple-600 mb-3"></div>
                      <p className="text-gray-500 text-sm font-medium">Loading family members...</p>
                    </div>
                  ) : !familyMembers || familyMembers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No family members added</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {familyMembers.map((member: any) => (
                        <div key={member.id} className="border-2 border-purple-100 rounded-lg p-4 hover:border-purple-300 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {member.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900">{member.name}</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                  {member.gender || "N/A"}
                                </span>
                                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                                  {member.age_group || "N/A"}
                                </span>
                                {member.relation && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    {member.relation}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Service History Section */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
              <button
                onClick={() => toggleSection('history')}
                className="w-full px-4 md:px-6 py-4 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 transition-all"
              >
                <div className="flex items-center gap-3">
                  <History size={22} className="text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-800">Service History</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-xs font-semibold">
                    {completedAppointments?.length || 0}
                  </span>
                </div>
                {expandedSections.history ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              
              {expandedSections.history && (
                <div className="p-4 md:p-6">
                  {appointmentsLoading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600 mb-3"></div>
                      <p className="text-gray-500 text-sm font-medium">Loading appointments...</p>
                    </div>
                  ) : !completedAppointments || completedAppointments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No completed service history</p>
                  ) : (
                    <div className="space-y-3">
                      {completedAppointments
                        .sort((a: any, b: any) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())
                        .map((appt: any) => (
                        <button
                          key={appt.id}
                          onClick={() => handleAppointmentClick(appt)}
                          className="w-full border-2 border-gray-100 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer text-left"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-500">
                                  {formatDateDisplayIST(appt.scheduled_start)} • {formatTimeDisplayIST(appt.scheduled_start)}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  appt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  appt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {appt.status}
                                </span>
                              </div>
                              
                              {appt.family_member && (
                                <p className="text-sm text-purple-600 font-medium mb-1">
                                  For: {appt.family_member.name}
                                </p>
                              )}
                              
                              <p className="text-sm text-gray-600 mt-2">
                                Click to view details →
                              </p>
                            </div>
                            
                            {appt.billing?.final_amount && (
                              <div className="text-right">
                                <p className="text-xs text-gray-500">Amount</p>
                                <p className="text-lg font-bold text-indigo-600">₹{Number(appt.billing.final_amount).toFixed(0)}</p>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedAppointment(null); setActualServices([]); setAppointmentStaff([]); }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Appointment Details</h2>
                  <p className="text-sm text-indigo-100 mt-1">
                    {formatDateDisplayIST(selectedAppointment.scheduled_start)} • {formatTimeDisplayIST(selectedAppointment.scheduled_start)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {isLoadingAppointment ? (
                <div className="py-12">
                  <LoadingSpinner message="Loading appointment details..." />
                </div>
              ) : (
                <>
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-600">Status:</span>
                <span className={`px-4 py-2 rounded-full font-semibold text-sm ${
                  selectedAppointment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                  selectedAppointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  selectedAppointment.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                </span>
              </div>

              {/* Family Member Info */}
              {selectedAppointment.family_member && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-purple-900 mb-1">Family Member</h3>
                  <p className="text-lg font-bold text-purple-700">{selectedAppointment.family_member.name}</p>
                  {selectedAppointment.family_member.relationship && (
                    <p className="text-sm text-purple-600 mt-1">Relationship: {selectedAppointment.family_member.relationship}</p>
                  )}
                </div>
              )}

              {/* Actual Services Taken Section */}
              {actualServices.length > 0 ? (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Scissors size={20} className="text-indigo-600" />
                    Actual Services Taken
                  </h3>
                  <div className="space-y-3">
                    {actualServices.map((service: any) => {
                      const staff = appointmentStaff.find((s: any) => s.id === service.doneby_staff_id)
                      return (
                        <div key={service.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-lg">{service.service_name}</p>
                              {staff && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Users size={16} className="text-purple-600" />
                                  <p className="text-sm text-purple-700 font-medium">
                                    Done by: {staff.name}
                                  </p>
                                </div>
                              )}
                              {service.notes && (
                                <p className="text-xs text-gray-600 mt-2 italic">Note: {service.notes}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  service.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                  service.status === 'in_service' ? 'bg-blue-100 text-blue-700' :
                                  service.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {service.status?.replace('_', ' ') || 'N/A'}
                                </span>
                                {service.gst_percentage && (
                                  <span className="text-xs text-gray-500">GST: {service.gst_percentage}%</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-indigo-600">₹{Number(service.price || 0).toFixed(0)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                selectedAppointment.services && selectedAppointment.services.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Scissors size={20} className="text-indigo-600" />
                      Services Scheduled
                    </h3>
                    <div className="space-y-2">
                      {selectedAppointment.services.map((service: any, idx: number) => (
                        <div key={idx} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{service.name}</p>
                              {service.category && (
                                <p className="text-xs text-gray-500 mt-1">Category: {service.category}</p>
                              )}
                            </div>
                            <p className="text-xl font-bold text-indigo-600">₹{Number(service.price).toFixed(0)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* Staff Section - Only show if no actual services or as additional info */}
              {appointmentStaff.length > 0 && actualServices.length === 0 && selectedAppointment.staff && selectedAppointment.staff.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Users size={20} className="text-purple-600" />
                    Staff Members
                  </h3>
                  <div className="space-y-2">
                    {selectedAppointment.staff.map((staffMember: any, idx: number) => (
                      <div key={idx} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="font-semibold text-gray-800">
                          {staffMember.name || `${staffMember.first_name || ''} ${staffMember.last_name || ''}`.trim()}
                        </p>
                        {staffMember.role && (
                          <p className="text-xs text-gray-500 mt-1">Role: {staffMember.role}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoice / Billing Information */}
              {selectedAppointment.billing && (
                <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg" id="invoice-content">
                  {/* Invoice Header */}
                  <div className="bg-white px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="UNISALON" width={96} height={48} onError={(e:any)=>{e.currentTarget.onerror=null; e.currentTarget.src='/logo.svg'}} className="h-12 w-auto" />
                        <div>
                          <div className="text-lg font-bold">UNISALON <span className="text-sm font-normal block">By Shashi</span></div>
                          <div className="text-sm text-gray-600">110, Road No. 16, Alkapur Twp, Manikonda, Hyderabad – 500 089</div>
                          <div className="text-sm text-gray-600">📧 info@unisalon.in • 📞 +91 76708 26262</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <h3 className="text-2xl font-bold flex items-center gap-2">
                          <FileText size={24} />
                          INVOICE
                        </h3>
                        {selectedAppointment.billing.id && (
                          <p className="text-sm text-emerald-600 mt-1">Bill #{selectedAppointment.billing.id}</p>
                        )}
                        <div className="text-sm mt-1">{formatDateDisplayIST(selectedAppointment.scheduled_start)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Body */}
                  <div className="p-6 space-y-4" id="invoice-details">
                    {/* Customer Info */}
                    <div className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Bill To</p>
                        <p className="font-bold text-gray-800">{selectedAppointment.customer_name || selectedCustomer?.first_name + ' ' + selectedCustomer?.last_name}</p>
                        {selectedAppointment.phone && (
                          <p className="text-sm text-gray-600">{selectedAppointment.phone}</p>
                        )}
                        {selectedAppointment.family_member && (
                          <p className="text-sm text-purple-600 font-medium mt-1">Service for: {selectedAppointment.family_member.name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Appointment</p>
                        <p className="font-semibold text-gray-800">#{selectedAppointment.id}</p>
                        <p className="text-sm text-gray-600">{formatTimeDisplayIST(selectedAppointment.scheduled_start)}</p>
                      </div>
                    </div>

                    {/* Services Table */}
                    {actualServices.length > 0 && (
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
                            {actualServices.map((service: any) => {
                              const staff = appointmentStaff.find((s: any) => s.id === service.doneby_staff_id)
                              return (
                                <tr key={service.id} className="border-b border-gray-200">
                                  <td className="py-3 pr-4">
                                    <p className="font-medium text-gray-800">{service.service_name}</p>
                                    {service.gst_percentage && (
                                      <p className="text-xs text-gray-500">GST: {service.gst_percentage}%</p>
                                    )}
                                  </td>
                                  <td className="py-3 text-sm text-gray-600">
                                    {staff?.name || '-'}
                                  </td>
                                  <td className="py-3 text-right font-semibold text-gray-800">
                                    ₹{Number(service.price || 0).toFixed(2)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Billing Calculations with Detailed GST Breakdown */}
                    <div className="space-y-3 pt-4">
                      {/* Calculate GST breakdown from actual services */}
                      {(() => {
                        let totalBase = 0
                        let totalGST = 0
                        const gstBreakdown: { [key: string]: number } = {}
                        
                        actualServices.forEach((service: any) => {
                          const totalPrice = Number(service.price || 0)
                          const gstPercent = Number(service.gst_percentage || 0)
                          
                          if (gstPercent > 0) {
                            const baseAmount = totalPrice / (1 + gstPercent / 100)
                            const gstAmount = totalPrice - baseAmount
                            totalBase += baseAmount
                            totalGST += gstAmount
                            
                            // Group by GST percentage
                            const key = `${gstPercent}%`
                            gstBreakdown[key] = (gstBreakdown[key] || 0) + gstAmount
                          } else {
                            totalBase += totalPrice
                          }
                        })
                        
                        const finalTotal = Number(selectedAppointment.billing.total_amount || selectedAppointment.billing.final_amount || 0)
                        const discount = Number(selectedAppointment.billing.discount_amount || 0)
                        
                        return (
                          <>
                            {/* Base Amount */}
                            {totalBase > 0 && (
                              <div className="flex justify-between text-sm bg-blue-50 px-3 py-2 rounded">
                                <span className="text-gray-700 font-medium">Base Amount (excl. GST):</span>
                                <span className="font-semibold text-gray-900">₹{totalBase.toFixed(2)}</span>
                              </div>
                            )}
                            
                            {/* GST Breakdown by percentage */}
                            {Object.keys(gstBreakdown).length > 0 && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                                <div className="text-xs font-bold text-amber-900 uppercase tracking-wide">GST Breakdown</div>
                                {Object.entries(gstBreakdown).map(([rate, amount]) => (
                                  <div key={rate} className="flex justify-between text-sm">
                                    <span className="text-amber-700">GST @ {rate}:</span>
                                    <span className="font-semibold text-amber-900">₹{amount.toFixed(2)}</span>
                                  </div>
                                ))}
                                <div className="flex justify-between text-sm border-t border-amber-300 pt-2">
                                  <span className="text-amber-800 font-bold">Total GST:</span>
                                  <span className="font-bold text-amber-900">₹{totalGST.toFixed(2)}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Subtotal */}
                            <div className="flex justify-between text-sm bg-gray-100 px-3 py-2 rounded">
                              <span className="text-gray-700 font-medium">Subtotal (incl. GST):</span>
                              <span className="font-semibold text-gray-900">₹{(totalBase + totalGST).toFixed(2)}</span>
                            </div>
                            
                            {/* Discount */}
                            {discount > 0 && (
                              <div className="flex justify-between text-sm bg-green-50 px-3 py-2 rounded">
                                <span className="text-green-700 font-medium">Discount:</span>
                                <span className="font-semibold text-green-700">-₹{discount.toFixed(2)}</span>
                              </div>
                            )}
                          </>
                        )
                      })()}
                      
                      {/* Final Total Amount */}
                      <div className="border-t-2 border-gray-400 pt-3 mt-3 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-xl font-bold text-gray-900">Final Amount:</span>
                          <span className="text-3xl font-bold text-emerald-700">₹{Number(selectedAppointment.billing.total_amount || selectedAppointment.billing.final_amount || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                        {selectedAppointment.billing.paid_amount && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Paid Amount:</span>
                            <span className="font-semibold text-green-600">₹{Number(selectedAppointment.billing.paid_amount).toFixed(2)}</span>
                          </div>
                        )}
                        {selectedAppointment.billing.payment_method && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-semibold text-gray-800 uppercase">{selectedAppointment.billing.payment_method}</span>
                          </div>
                        )}
                        {selectedAppointment.billing.payment_status && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Payment Status:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              selectedAppointment.billing.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                              selectedAppointment.billing.payment_status === 'partially_paid' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {selectedAppointment.billing.payment_status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Billing Notes */}
                      {selectedAppointment.billing.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Payment Notes:</p>
                          <p className="text-sm text-blue-800">{selectedAppointment.billing.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Footer */}
                  <div className="bg-gray-100 px-6 py-3 text-center border-t-2 border-gray-300">
                    <p className="text-xs text-gray-600">Thank you for your business!</p>
                    {selectedAppointment.billing.updated_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {formatDateDisplayIST(selectedAppointment.billing.updated_at)}
                      </p>
                    )}
                  </div>
                  
                  {/* Action Buttons - Download & WhatsApp Share */}
                  <div className="px-6 py-4 bg-white border-t border-gray-200 flex gap-3">
                    <button
                      onClick={() => {
                        // Prepare invoice data
                        const invoiceData: InvoiceData = {
                          billId: selectedAppointment.billing.id || selectedAppointment.id,
                          customerName: selectedAppointment.customer_name || `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`,
                          customerPhone: selectedCustomer?.phone || selectedAppointment.phone || '',
                          customerEmail: selectedCustomer?.email || selectedAppointment.email,
                          appointmentDate: formatDateDisplayIST(selectedAppointment.scheduled_start),
                          appointmentTime: formatTimeDisplayIST(selectedAppointment.scheduled_start),
                          familyMemberName: selectedAppointment.family_member?.name,
                          services: actualServices.map((service: any) => {
                            const totalPrice = Number(service.price || 0)
                            const gstPercent = Number(service.gst_percentage || 0)
                            const baseAmount = gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice
                            const gstAmount = totalPrice - baseAmount
                            const staff = appointmentStaff.find((s: any) => s.id === service.doneby_staff_id)
                            
                            return {
                              name: service.service_name,
                              staffName: staff?.name,
                              baseAmount,
                              gstPercent,
                              gstAmount,
                              total: totalPrice
                            }
                          }),
                          baseTotal: actualServices.reduce((sum: number, s: any) => {
                            const totalPrice = Number(s.price || 0)
                            const gstPercent = Number(s.gst_percentage || 0)
                            return sum + (gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice)
                          }, 0),
                          gstTotal: actualServices.reduce((sum: number, s: any) => {
                            const totalPrice = Number(s.price || 0)
                            const gstPercent = Number(s.gst_percentage || 0)
                            const baseAmount = gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice
                            return sum + (totalPrice - baseAmount)
                          }, 0),
                          subtotal: actualServices.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0),
                          discount: Number(selectedAppointment.billing?.discount_amount || 0),
                          finalAmount: Number(selectedAppointment.billing?.total_amount || selectedAppointment.billing?.final_amount || 0),
                          paymentMethod: selectedAppointment.billing?.payment_method || 'Cash',
                          paymentStatus: selectedAppointment.billing?.payment_status || 'paid',
                          paidAmount: Number(selectedAppointment.billing?.paid_amount || selectedAppointment.billing?.final_amount || 0)
                        }
                        
                        // Download PDF
                        downloadInvoicePDF(invoiceData)
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Download Invoice
                    </button>
                    <button
                      onClick={async () => {
                        const phone = selectedCustomer?.phone || selectedAppointment.phone || ''
                        
                        if (!phone) {
                          setToast({ type: "error", message: "Customer phone number not available" })
                          return
                        }
                        
                        // Prepare invoice data
                        const invoiceData: InvoiceData = {
                          billId: selectedAppointment.billing.id || selectedAppointment.id,
                          customerName: selectedAppointment.customer_name || `${selectedCustomer?.first_name} ${selectedCustomer?.last_name}`,
                          customerPhone: selectedCustomer?.phone || selectedAppointment.phone || '',
                          customerEmail: selectedCustomer?.email || selectedAppointment.email,
                          appointmentDate: formatDateDisplayIST(selectedAppointment.scheduled_start),
                          appointmentTime: formatTimeDisplayIST(selectedAppointment.scheduled_start),
                          familyMemberName: selectedAppointment.family_member?.name,
                          services: actualServices.map((service: any) => {
                            const totalPrice = Number(service.price || 0)
                            const gstPercent = Number(service.gst_percentage || 0)
                            const baseAmount = gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice
                            const gstAmount = totalPrice - baseAmount
                            const staff = appointmentStaff.find((s: any) => s.id === service.doneby_staff_id)
                            
                            return {
                              name: service.service_name,
                              staffName: staff?.name,
                              baseAmount,
                              gstPercent,
                              gstAmount,
                              total: totalPrice
                            }
                          }),
                          baseTotal: actualServices.reduce((sum: number, s: any) => {
                            const totalPrice = Number(s.price || 0)
                            const gstPercent = Number(s.gst_percentage || 0)
                            return sum + (gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice)
                          }, 0),
                          gstTotal: actualServices.reduce((sum: number, s: any) => {
                            const totalPrice = Number(s.price || 0)
                            const gstPercent = Number(s.gst_percentage || 0)
                            const baseAmount = gstPercent > 0 ? totalPrice / (1 + gstPercent / 100) : totalPrice
                            return sum + (totalPrice - baseAmount)
                          }, 0),
                          subtotal: actualServices.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0),
                          discount: Number(selectedAppointment.billing?.discount_amount || 0),
                          finalAmount: Number(selectedAppointment.billing?.total_amount || selectedAppointment.billing?.final_amount || 0),
                          paymentMethod: selectedAppointment.billing?.payment_method || 'Cash',
                          paymentStatus: selectedAppointment.billing?.payment_status || 'paid',
                          paidAmount: Number(selectedAppointment.billing?.paid_amount || selectedAppointment.billing?.final_amount || 0)
                        }
                        
                        // Share invoice link via WhatsApp
                        shareInvoiceLinkViaWhatsApp(invoiceData, phone)
                        setToast({ type: "success", message: "Opening WhatsApp with invoice link..." })
                      }}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <Share2 size={20} />
                      Share PDF on WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {selectedAppointment.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes:</h3>
                  <p className="text-gray-600 text-sm">{selectedAppointment.notes}</p>
                </div>
              )}
              </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t">
              <button
                onClick={() => { setSelectedAppointment(null); setActualServices([]); setAppointmentStaff([]); }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </main>
  )
}
