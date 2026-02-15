"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import {
    Loader2, User, Phone, Mail, Users, Calendar, Clock, LogOut,
    History, Scissors, CheckCircle, XCircle, AlertCircle, FileText,
    ChevronRight, MapPin, Sparkles, Receipt, Home, Star, Shield
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function encodeInvoiceId(id: number | string) {
    try {
        const str = JSON.stringify({ id: Number(id) })
        const base64 = typeof btoa === 'function'
            ? btoa(str)
            : Buffer.from(str).toString('base64')
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    } catch (e) {
        return String(id)
    }
}

function formatTime(dateStr: string) {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleTimeString("en-IN", {
        hour: '2-digit',
        minute: '2-digit'
    })
}

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
}

export default function CustomerDashboard() {
    const router = useRouter()
    const [phone, setPhone] = useState<string | null>(null)
    const [customerId, setCustomerId] = useState<string | null>(null)

    // UI State
    const [activeTab, setActiveTab] = useState<'appointments' | 'profile'>('appointments')

    useEffect(() => {
        const p = localStorage.getItem("customer_phone")
        const id = localStorage.getItem("customer_id")
        if (!p || !id) {
            router.push("/customer/login")
        } else {
            setPhone(p)
            setCustomerId(id)
        }
    }, [router])

    const { data: customerRes, isLoading: custLoading } = useSWR(
        phone ? `/api/customers/lookup?phone=${encodeURIComponent(phone)}` : null,
        fetcher
    )
    const customer = customerRes?.found ? customerRes.customer : null

    const { data: appointmentsRaw, isLoading: apptLoading } = useSWR(
        customerId ? `/api/appointments?customer_id=${customerId}` : null,
        fetcher
    )

    const appointments = useMemo(() => Array.isArray(appointmentsRaw) ? appointmentsRaw : [], [appointmentsRaw])

    const { data: servicesRaw } = useSWR("/api/services", fetcher)

    const serviceMap = useMemo(() => {
        const map: Record<number, string> = {}
        if (Array.isArray(servicesRaw)) {
            servicesRaw.forEach((s: any) => {
                map[s.id] = s.name
            })
        }
        return map
    }, [servicesRaw])

    // Process Appointments - Only History/Past as requested
    const historyAppts = useMemo(() => {
        const now = new Date()
        return appointments.filter((a: any) => new Date(a.scheduled_start) < now)
            .sort((a: any, b: any) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime())
    }, [appointments])

    function handleLogout() {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem("customer_phone")
            localStorage.removeItem("customer_id")
            localStorage.removeItem("customer_name")
            router.push("/customer/login")
        }
    }

    if ((!phone && !customerId) || custLoading || apptLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                    <p className="text-gray-500 font-medium animate-pulse">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-24 md:pb-10">
            {/* Top Header */}
            <header className="bg-white sticky top-0 z-30 shadow-sm/50 border-b border-gray-100 backdrop-blur-xl bg-white/80 transition-all">
                <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">{getGreeting()}</p>
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">
                            {customer?.first_name}
                            <span className="text-indigo-600">.</span>
                        </h1>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                        {customer?.first_name?.charAt(0)}
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-4 space-y-6">

                {/* APPOINTMENTS TAB */}
                {activeTab === 'appointments' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 px-1">
                            <History size={20} className="text-indigo-600" />
                            <h2 className="text-lg font-bold text-gray-900">Appointment History</h2>
                        </div>

                        {/* List */}
                        {historyAppts.length === 0 ? (
                            <div className="text-center py-16 px-6 bg-white rounded-3xl border border-gray-100 border-dashed shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-200">
                                    <History size={32} />
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg mb-1">No history</h3>
                                <p className="text-gray-500 text-sm max-w-[200px] mx-auto">
                                    No past appointments found.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {historyAppts.map((appt: any) => {
                                    const dateObj = new Date(appt.scheduled_start)
                                    const day = dateObj.getDate()
                                    const month = dateObj.toLocaleDateString('en-US', { month: 'short' })
                                    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

                                    // Status Logic
                                    const isCompleted = appt.status === 'completed'
                                    const isCanceled = appt.status === 'canceled'

                                    // Services
                                    let serviceNames = []
                                    try {
                                        const ids = typeof appt.selected_servicesIds === 'string'
                                            ? JSON.parse(appt.selected_servicesIds)
                                            : appt.selected_servicesIds || []
                                        serviceNames = ids.map((id: number) => serviceMap[id] || `Service`)
                                    } catch (e) { serviceNames = ["Services"] }

                                    return (
                                        <div key={appt.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                                            {/* Decorative Stripe */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCompleted ? 'bg-emerald-500' : isCanceled ? 'bg-red-400' : 'bg-indigo-500'}`}></div>

                                            <div className="flex gap-4 mb-4 pl-3">
                                                {/* Date Box */}
                                                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl w-16 h-16 flex-shrink-0 border border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                                    <span className="text-xs font-bold text-gray-400 uppercase group-hover:text-indigo-400 transition-colors">{month}</span>
                                                    <span className="text-2xl font-bold text-gray-900 leading-none group-hover:text-indigo-700 transition-colors">{day}</span>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-lg">{formatTime(appt.scheduled_start)}</h3>
                                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                                {weekday}
                                                            </p>
                                                        </div>
                                                        {appt.billing && (
                                                            <div className="text-right">
                                                                <span className="font-bold text-gray-900 block">₹{appt.billing.total_amount}</span>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${appt.billing.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {appt.billing.payment_status}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Services Tags */}
                                            <div className="flex flex-wrap gap-2 mb-4 pl-3">
                                                {serviceNames.map((name: string, i: number) => (
                                                    <span key={i} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="pt-3 border-t border-gray-50 flex items-center justify-between pl-3">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isCanceled ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{appt.status.replace('_', ' ')}</span>
                                                </div>

                                                {appt.billing && appt.billing.id && (
                                                    <a
                                                        href={`/invoice/${encodeInvoiceId(appt.billing.id)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
                                                    >
                                                        <FileText size={14} />
                                                        Invoice
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Simple Profile Header */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-5">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shadow-inner">
                                <User size={32} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{customer?.first_name} {customer?.last_name}</h2>
                                <p className="text-gray-500 text-sm font-medium mt-1 font-mono">{customer?.phone}</p>
                            </div>
                        </div>

                        {/* Family Section */}
                        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                    <Users size={20} className="text-indigo-600" />
                                    Family Members
                                </h3>
                                {(customer?.familyMembers?.length || 0) > 0 && <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-1 rounded-lg">{customer.familyMembers.length}</span>}
                            </div>

                            {!customer?.familyMembers || customer.familyMembers.length === 0 ? (
                                <div className="text-center py-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
                                    <p className="text-gray-400 text-xs font-medium">No family members added.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {customer.familyMembers.map((member: any) => (
                                        <div key={member.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 font-bold text-lg border border-pink-100">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 leading-tight">{member.name}</h4>
                                                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                                    <span className="capitalize">{member.relation}</span>
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                    <span>{member.age_group}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 text-red-600 font-bold text-sm bg-red-50 hover:bg-red-100 rounded-3xl transition-colors flex items-center justify-center gap-2 border border-red-100"
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>

                        <div className="h-20"></div>
                    </div>
                )}

            </main>

            {/* Floating Bottom Nav */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-gray-200/50 shadow-2xl shadow-gray-200 rounded-full px-6 py-3 flex items-center gap-8 z-50 transition-all ring-1 ring-black/5">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'appointments' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <History size={24} strokeWidth={activeTab === 'appointments' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">History</span>
                    {activeTab === 'appointments' && <span className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
                </button>
                <div className="w-px h-8 bg-gray-200"></div>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 transition-all relative ${activeTab === 'profile' ? 'text-indigo-600 scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Profile</span>
                    {activeTab === 'profile' && <span className="absolute -bottom-2 w-1 h-1 bg-indigo-600 rounded-full"></span>}
                </button>
            </div>
        </div>
    )
}
