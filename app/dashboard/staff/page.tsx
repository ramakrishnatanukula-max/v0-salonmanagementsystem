"use client"

import type React from "react"

import useSWR from "swr"
import { useState } from "react"
import { User, Mail, Phone, Shield, Pencil, Trash2, X, Check, Lock } from "lucide-react"
import Toast from "@/components/Toast"
import ConfirmDialog from "@/components/ConfirmDialog"
import LoadingSpinner from "@/components/LoadingSpinner"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function StaffPage() {
  const { data, mutate, isLoading } = useSWR("/api/staff", fetcher)
  const { data: currentUser } = useSWR("/api/auth/me", fetcher)
  const [editId, setEditId] = useState<number | null>(null)
  const [edit, setEdit] = useState<any>({})
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
  
  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin"
  async function save(id: number) {
    await fetch(`/api/staff/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(edit),
    })
    setEditId(null)
    mutate()
  }
  async function remove(id: number) {
    try {
      await fetch(`/api/staff/${id}`, { method: "DELETE" })
      setToast({ type: "success", message: "Staff deleted successfully!" })
      mutate()
    } catch (error) {
      setToast({ type: "error", message: "Failed to delete staff" })
    } finally {
      setDeleteConfirm(null)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-6 shadow-lg">
        <div className="max-w-screen-lg mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <User size={32} />
            Staff Management
          </h1>
          <p className="text-sm md:text-base text-white/90 mt-2">Update staff, receptionist, and admin details and credentials</p>
        </div>
      </header>
      
      <div className="max-w-screen-lg mx-auto px-4 py-6 pb-24">
        {isLoading && <LoadingSpinner message="Loading staff..." />}
        
        {!isLoading && (
        <>
        {/* Info message for non-admin users */}
        {!isAdmin && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 rounded-xl p-4 mb-6 shadow-sm">
            <p className="font-semibold flex items-center gap-2">
              <Shield size={18} />
              Limited Access
            </p>
            <p className="text-xs mt-1 text-blue-600">Only administrators can delete staff or change passwords.</p>
          </div>
        )}

        <section className="flex flex-col gap-4">
        {(data || []).map((s: any) => {
          const roleColors = {
            admin: "from-red-500 to-pink-500",
            receptionist: "from-blue-500 to-cyan-500",
            stylist: "from-purple-500 to-indigo-500",
            technician: "from-emerald-500 to-teal-500"
          }
          const roleColor = roleColors[s.role as keyof typeof roleColors] || "from-gray-500 to-slate-500"
          
          return (
          <article key={s.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100">
            {editId === s.id ? (
              <div className="p-4 md:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                    {edit.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Edit Staff Member</h3>
                    <p className="text-xs text-gray-500">Update details and credentials</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                    <input
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Full name"
                      value={edit.name ?? ""}
                      onChange={(e) => setEdit((x: any) => ({ ...x, name: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Mail size={14} />
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="email@example.com"
                      value={edit.email ?? ""}
                      onChange={(e) => setEdit((x: any) => ({ ...x, email: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Phone size={14} />
                      Phone
                    </label>
                    <input
                      type="tel"
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Phone number"
                      value={edit.phone ?? ""}
                      onChange={(e) => setEdit((x: any) => ({ ...x, phone: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                      <Shield size={14} />
                      Role
                    </label>
                    <select
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white"
                      value={edit.role ?? "stylist"}
                      onChange={(e) => setEdit((x: any) => ({ ...x, role: e.target.value }))}
                    >
                      <option value="admin">👑 Admin</option>
                      <option value="receptionist">📋 Receptionist</option>
                      <option value="staff">✂️ staff</option>
                    </select>
                  </div>
                  
                  {/* Only admin can change passwords */}
                  {isAdmin && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Lock size={14} />
                        New Password (Admin Only)
                      </label>
                      <input
                        type="password"
                        className="w-full border-2 border-amber-200 bg-amber-50 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        placeholder="Leave blank to keep current password"
                        value={edit.password ?? ""}
                        onChange={(e) => setEdit((x: any) => ({ ...x, password: e.target.value }))}
                      />
                      <p className="text-xs text-amber-600 mt-1">⚠️ Only enter a password if you want to change it</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-2 pt-4 border-t border-gray-200">
                    <button 
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold shadow-md hover:shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2" 
                      onClick={() => save(s.id)}
                    >
                      <Check size={18} />
                      Save Changes
                    </button>
                    <button 
                      className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2" 
                      onClick={() => setEditId(null)}
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg flex-shrink-0`}>
                      {s.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base md:text-lg truncate">
                        {s.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${roleColor} text-white shadow-sm`}>
                          <Shield size={12} />
                          {s.role}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          Active
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {s.email && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                            <Mail size={12} className="text-gray-400 flex-shrink-0" />
                            {s.email}
                          </p>
                        )}
                        {s.phone && (
                          <p className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400 flex-shrink-0" />
                            {s.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
                    <button
                      className="px-4 py-2 border-2 border-indigo-200 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-sm flex items-center justify-center gap-2"
                      onClick={() => {
                        setEditId(s.id)
                        setEdit(s)
                      }}
                    >
                      <Pencil size={16} />
                      <span className="hidden md:inline">Edit</span>
                    </button>
                    {/* Only admin can delete staff */}
                    {isAdmin && (
                      <button 
                        className="px-4 py-2 border-2 border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition-all shadow-sm flex items-center justify-center gap-2" 
                        onClick={() => setDeleteConfirm(s.id)}
                      >
                        <Trash2 size={16} />
                        <span className="hidden md:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        )})}
      </section>
      </>
      )}
      </div>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Staff Member"
          message="Are you sure you want to delete this staff member? This action cannot be undone and will remove all associated data."
          confirmText="Delete"
          type="danger"
          onConfirm={() => remove(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </main>
  )
}
