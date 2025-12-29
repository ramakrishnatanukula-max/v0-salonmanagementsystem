// "use client"

// import type React from "react"

// import useSWR from "swr"
// import { useMemo, useState } from "react"

// const fetcher = (url: string) => fetch(url).then((r) => r.json())

// export default function ServicesPage() {
//   const { data: categoriesRaw } = useSWR("/api/categories", fetcher)
//   const { data: services, mutate } = useSWR("/api/services", fetcher)
//   // Normalize categories to always be an array
//   const categories = Array.isArray(categoriesRaw)
//     ? categoriesRaw
//     : categoriesRaw
//     ? [categoriesRaw]
//     : []

//   const [form, setForm] = useState({
//     name: "",
//     category_id: "",
//     description: "",
//     duration_minutes: 30,
//     base_price: 0,
//     is_active: true,
//     allow_addons: true,
//   })
//   const [editId, setEditId] = useState<number | null>(null)
//   const [edit, setEdit] = useState<any>({})

//   const categoryMap = useMemo(() => {
//     const m: Record<number, string> = {}
//     categories.forEach((c: any) => (m[c.id] = c.name))
//     return m
//   }, [categories])

//   async function createService(e: React.FormEvent) {
//     e.preventDefault()
//     const res = await fetch("/api/services", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         ...form,
//         category_id: form.category_id ? Number(form.category_id) : null,
//       }),
//     })
//     if (res.ok) {
//       setForm({
//         name: "",
//         category_id: "",
//         description: "",
//         duration_minutes: 30,
//         base_price: 0,
//         is_active: true,
//         allow_addons: true,
//       })
//       mutate()
//     }
//   }

//   async function saveEdit(id: number) {
//     const res = await fetch(`/api/services/${id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         ...edit,
//         category_id: edit.category_id ? Number(edit.category_id) : null,
//         duration_minutes: Number(edit.duration_minutes),
//         base_price: Number(edit.base_price),
//         is_active: !!edit.is_active,
//         allow_addons: !!edit.allow_addons,
//       }),
//     })
//     if (res.ok) {
//       setEditId(null)
//       setEdit({})
//       mutate()
//     }
//   }

//   async function remove(id: number) {
//     if (!confirm("Delete this service?")) return
//     const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
//     if (res.ok) mutate()
//   }

//   return (
//     <main className="p-4 max-w-screen-sm mx-auto">
//       <header className="mb-4">
//         <h1 className="text-xl font-semibold text-pretty">Services</h1>
//         <p className="text-sm text-gray-500">Create, update, and delete services.</p>
//       </header>

//       <section className="mb-6">
//         <form onSubmit={createService} className="flex flex-col gap-2">
//           <input
//             className="border rounded px-3 py-2 text-sm"
//             placeholder="Service name"
//             value={form.name}
//             onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
//             required
//           />
//           <select
//             className="border rounded px-3 py-2 text-sm"
//             value={form.category_id}
//             onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
//           >
//             <option value="">No category</option>
//             {categories.map((c: any) => (
//               <option key={c.id} value={c.id}>
//                 {c.name}
//               </option>
//             ))}
//           </select>
//           <textarea
//             className="border rounded px-3 py-2 text-sm"
//             placeholder="Description"
//             value={form.description}
//             onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
//           />
//           <div className="grid grid-cols-2 gap-2">
//             <input
//               className="border rounded px-3 py-2 text-sm"
//               type="number"
//               placeholder="Duration (min)"
//               value={form.duration_minutes}
//               onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
//             />
//             <input
//               className="border rounded px-3 py-2 text-sm"
//               type="number"
//               placeholder="Base price"
//               value={form.base_price}
//               onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))}
//             />
//           </div>
//           <label className="flex items-center gap-2 text-sm">
//             <input
//               type="checkbox"
//               checked={form.is_active}
//               onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
//             />
//             Active
//           </label>
//           <label className="flex items-center gap-2 text-sm">
//             <input
//               type="checkbox"
//               checked={form.allow_addons}
//               onChange={(e) => setForm((f) => ({ ...f, allow_addons: e.target.checked }))}
//             />
//             Allow Add-ons
//           </label>
//           <button className="bg-black text-white rounded px-4 py-2 text-sm">Add Service</button>
//         </form>
//       </section>

//       <section className="flex flex-col gap-2">
//         {(Array.isArray(services) ? services : []).map((s: any) => (
//           <article key={s.id} className="border rounded p-3">
//             {editId === s.id ? (
//               <div className="flex flex-col gap-2">
//                 <input
//                   className="border rounded px-3 py-2 text-sm"
//                   value={edit.name ?? ""}
//                   onChange={(e) => setEdit((x: any) => ({ ...x, name: e.target.value }))}
//                 />
//                 <select
//                   className="border rounded px-3 py-2 text-sm"
//                   value={edit.category_id ?? ""}
//                   onChange={(e) => setEdit((x: any) => ({ ...x, category_id: e.target.value }))}
//                 >
//                   <option value="">Select category</option>
//                   {categories.map((c: any) => (
//                     <option key={c.id} value={c.id}>
//                       {c.name}
//                     </option>
//                   ))}
//                 </select>
//                 <textarea
//                   className="border rounded px-3 py-2 text-sm"
//                   value={edit.description ?? ""}
//                   onChange={(e) => setEdit((x: any) => ({ ...x, description: e.target.value }))}
//                 />
//                 <div className="grid grid-cols-2 gap-2">
//                   <input
//                     className="border rounded px-3 py-2 text-sm"
//                     type="number"
//                     value={edit.duration_minutes ?? 30}
//                     onChange={(e) => setEdit((x: any) => ({ ...x, duration_minutes: Number(e.target.value) }))}
//                   />
//                   <input
//                     className="border rounded px-3 py-2 text-sm"
//                     type="number"
//                     value={edit.base_price ?? 0}
//                     onChange={(e) => setEdit((x: any) => ({ ...x, base_price: Number(e.target.value) }))}
//                   />
//                 </div>
//                 <label className="flex items-center gap-2 text-sm">
//                   <input
//                     type="checkbox"
//                     checked={!!edit.is_active}
//                     onChange={(e) => setEdit((x: any) => ({ ...x, is_active: e.target.checked }))}
//                   />
//                   Active
//                 </label>
//                 <label className="flex items-center gap-2 text-sm">
//                   <input
//                     type="checkbox"
//                     checked={!!edit.allow_addons}
//                     onChange={(e) => setEdit((x: any) => ({ ...x, allow_addons: e.target.checked }))}
//                   />
//                   Allow Add-ons
//                 </label>
//                 <div className="flex gap-2">
//                   <button onClick={() => saveEdit(s.id)} className="bg-black text-white rounded px-3 py-2 text-sm">
//                     Save
//                   </button>
//                   <button onClick={() => setEditId(null)} className="border rounded px-3 py-2 text-sm">
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <p className="font-medium">{s.name}</p>
//                   <p className="text-xs text-gray-500">
//                     {s.duration_minutes} min • ${Number(s.base_price).toFixed(2)} •{" "}
//                     {s.is_active ? "Active" : "Inactive"}
//                   </p>
//                   <p className="text-xs text-gray-500">{categoryMap[s.category_id] || "No category"}</p>
//                   {s.description ? <p className="text-sm mt-1">{s.description}</p> : null}
//                 </div>
//                 <div className="flex flex-col items-end gap-2">
//                   <button
//                     className="border rounded px-3 py-2 text-sm"
//                     onClick={() => {
//                       setEditId(s.id)
//                       setEdit({
//                         name: s.name,
//                         category_id: s.category_id ?? "",
//                         description: s.description ?? "",
//                         duration_minutes: s.duration_minutes,
//                         base_price: s.base_price,
//                         is_active: !!s.is_active,
//                         allow_addons: !!s.allow_addons,
//                       })
//                     }}
//                   >
//                     Edit
//                   </button>
//                   <button className="text-red-600 text-sm" onClick={() => remove(s.id)}>
//                     Delete
//                   </button>
//                 </div>
//               </div>
//             )}
//           </article>
//         ))}
//       </section>
//     </main>
//   )
// }

"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { AlertTriangle, Plus, X, Check, AlertCircle, CheckCircle2, Loader, Info, Search, Package, TrendingUp, Tag, Clock, DollarSign, Sparkles } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Toast Notification Component
function Toast({
  type,
  message,
  onClose,
}: {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: {
      bg: "bg-gradient-to-r from-emerald-500 to-green-500",
      border: "border-l-4 border-emerald-600",
      icon: <CheckCircle2 size={20} className="flex-shrink-0" />,
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-rose-500",
      border: "border-l-4 border-red-600",
      icon: <AlertCircle size={20} className="flex-shrink-0" />,
    },
    info: {
      bg: "bg-gradient-to-r from-indigo-600 to-emerald-600",
      border: "border-l-4 border-blue-600",
      icon: <Info size={20} className="flex-shrink-0" />,
    },
  };

  const { bg, border, icon } = config[type];

  return (
    <div
      className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm ${bg} ${border} text-white rounded-lg shadow-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 z-[999]`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      {icon}
      <span className="text-sm font-medium flex-grow">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition flex-shrink-0"
        aria-label="Close notification"
        type="button"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// Loading Skeleton Component
function ServiceSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md animate-pulse">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex-grow space-y-3">
          <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="flex gap-2">
            <div className="h-5 bg-gray-100 rounded-full w-16"></div>
            <div className="h-5 bg-gray-100 rounded-full w-16"></div>
            <div className="h-5 bg-gray-100 rounded-full w-16"></div>
          </div>
          <div className="h-4 bg-gray-100 rounded-lg w-1/2"></div>
        </div>
      </div>
      <div className="pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <div className="flex-1 h-9 bg-gray-200 rounded-lg"></div>
          <div className="flex-1 h-9 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const { data: categoriesRaw, isLoading: categoriesLoading } = useSWR("/api/categories", fetcher);
  const { data: services, mutate, isLoading: servicesLoading } = useSWR("/api/services", fetcher);

  const categories = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : categoriesRaw
    ? [categoriesRaw]
    : [];

  const categoryMap = useMemo(() => {
    const m: Record<number, string> = {};
    categories.forEach((c: any) => {
      m[c.id] = c.name;
    });
    return m;
  }, [categories]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editService, setEditService] = useState<any | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<number | null>(null);
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter services based on search
  const filteredServices = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    if (!searchQuery.trim()) return services;
    const query = searchQuery.toLowerCase();
    return services.filter((s: any) => {
      const categoryName = categoryMap[s.category_id] || "";
      return (
        s.name.toLowerCase().includes(query) ||
        categoryName.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query))
      );
    });
  }, [services, searchQuery, categoryMap]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!services || !Array.isArray(services)) return { total: 0, active: 0, avgPrice: 0 };
    const active = services.filter((s: any) => s.is_active).length;
    const totalPrice = services.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);
    const avgPrice = services.length > 0 ? totalPrice / services.length : 0;
    return { total: services.length, active, avgPrice };
  }, [services]);

  async function handleDelete(id: number) {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteServiceId(null);
        setToastConfig({ type: "success", message: "Service deleted successfully! ✓" });
        await mutate();
      } else {
        setToastConfig({ type: "error", message: "Failed to delete service. Please try again." });
      }
    } catch (err) {
      setToastConfig({ type: "error", message: "Error deleting service. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  }

  const isLoading = servicesLoading || categoriesLoading;
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowHeader(currentScrollY <= lastScrollY || currentScrollY <= 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <main className="p-3 md:p-6 max-w-7xl mx-auto relative min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header
        className={`mb-6 sticky top-4 z-10 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm transition-all duration-300 transform ${
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent mb-1">
              Services
            </h1>
            <p className="text-sm text-gray-500">Manage and organize your salon services</p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center gap-2 text-white">
                <Package size={16} />
                <div className="text-right">
                  <p className="text-[10px] font-medium opacity-90">Total</p>
                  <p className="text-lg font-bold leading-none">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle2 size={16} />
                <div className="text-right">
                  <p className="text-[10px] font-medium opacity-90">Active</p>
                  <p className="text-lg font-bold leading-none">{stats.active}</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search services by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Services List */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-32">
        {isLoading ? (
          <>
            <ServiceSkeleton />
            <ServiceSkeleton />
            <ServiceSkeleton />
          </>
        ) : filteredServices.length === 0 ? (
          <div className="col-span-full">
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-emerald-100 rounded-full mb-4">
                {searchQuery ? (
                  <Search className="text-indigo-600" size={36} />
                ) : (
                  <Sparkles className="text-emerald-600" size={36} />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchQuery ? "No services found" : "No services yet"}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery 
                  ? `No services match "${searchQuery}". Try a different search.`
                  : "Create your first service to start offering salon treatments"
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create First Service
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredServices.map((s: any) => (
            <article
              key={s.id}
              className="group bg-white rounded-xl p-5 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 flex flex-col h-full relative overflow-hidden"
              aria-label={`Service ${s.name}`}
            >
              {/* Decorative gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex flex-col gap-4 flex-grow">
                <div className="flex-grow space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {s.name}
                    </h3>
                    {s.is_active && (
                      <div className="flex-shrink-0 bg-gradient-to-br from-emerald-100 to-green-100 px-2 py-1 rounded-lg">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Service Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
                      <Clock size={12} />
                      <span>{s.duration_minutes} min</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200">
                      <DollarSign size={12} />
                      <span>₹{Number(s.price).toFixed(0)}</span>
                    </div>
                    {s.gst_percentage > 0 && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200">
                        <TrendingUp size={12} />
                        <span>GST {s.gst_percentage}%</span>
                      </div>
                    )}
                  </div>

                  {/* Category Badge */}
                  {categoryMap[s.category_id] && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200 w-fit">
                      <Tag size={12} />
                      <span>{categoryMap[s.category_id]}</span>
                    </div>
                  )}
                  
                  {s.description && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{s.description}</p>
                  )}
                </div>
                
                <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                  <button
                    aria-label={`Edit service ${s.name}`}
                    className="flex-1 md:flex-initial px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                    onClick={() => setEditService(s)}
                  >
                    Edit
                  </button>
                  <button
                    aria-label={`Delete service ${s.name}`}
                    className="flex-1 md:flex-initial text-red-600 hover:text-white hover:bg-red-600 font-semibold text-sm border border-red-200 hover:border-red-600 px-4 py-2 rounded-lg transition-all active:scale-95"
                    onClick={() => setDeleteServiceId(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        aria-label="Add new service"
        className="fixed bottom-20 sm:bottom-8 right-6 z-50 bg-gradient-to-tr from-indigo-600 to-emerald-500 p-4 rounded-full shadow-2xl text-white hover:shadow-3xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center group"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="sr-only">Add new service</span>
      </button>

      {/* Modals */}
      {showAddForm && (
        <ServiceFormModal
          categories={categories}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            setToastConfig({ type: "success", message: "Service created successfully! ✓" });
            mutate();
          }}
          onError={(msg) => setToastConfig({ type: "error", message: msg })}
        />
      )}

      {editService && (
        <ServiceFormModal
          categories={categories}
          initialData={editService}
          onClose={() => setEditService(null)}
          onSuccess={() => {
            setEditService(null);
            setToastConfig({ type: "success", message: "Service updated successfully! ✓" });
            mutate();
          }}
          onError={(msg) => setToastConfig({ type: "error", message: msg })}
        />
      )}

      {deleteServiceId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteServiceId)}
          onCancel={() => setDeleteServiceId(null)}
          isLoading={isDeleting}
        />
      )}

      {/* Toast Notification */}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          onClose={() => setToastConfig(null)}
        />
      )}
    </main>
  );
}

function ServiceFormModal({
  categories,
  initialData = null,
  onClose,
  onSuccess,
  onError,
}: {
  categories: any[];
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  onError?: (msg: string) => void;
}) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name: initialData.name ?? "",
          category_id: initialData.category_id?.toString() ?? "",
          description: initialData.description ?? "",
          duration_minutes: initialData.duration_minutes ?? 30,
          price: initialData.price ?? initialData.base_price ?? 0,
          gst_percentage: initialData.gst_percentage ?? 0,
          is_active: initialData.is_active ?? true,
        }
      : {
          name: "",
          category_id: "",
          description: "",
          duration_minutes: 30,
          price: 0,
          gst_percentage: 0,
          is_active: true,
        }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Service name is required";
    if (form.price < 0) newErrors.price = "Price cannot be negative";
    if (form.duration_minutes < 1) newErrors.duration_minutes = "Duration must be at least 1 minute";
    if (form.gst_percentage < 0 || form.gst_percentage > 100)
      newErrors.gst_percentage = "GST must be between 0 and 100";
    return newErrors;
  };

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      onError?.("Please fix the errors in the form");
      return;
    }

    setLoading(true);
    try {
      const url = initialData ? `/api/services/${initialData.id}` : "/api/services";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id ? Number(form.category_id) : null,
          duration_minutes: Number(form.duration_minutes),
          price: Number(form.price),
          gst_percentage: Number(form.gst_percentage),
          is_active: !!form.is_active,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json().catch(() => ({}));
        onError?.(error.error || "Failed to save service. Please try again.");
      }
    } catch (err) {
      onError?.("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-tr from-black/70 via-black/50 to-black/70 backdrop-blur-sm flex flex-col p-4 items-center justify-center sm:justify-start sm:pt-12"
      onClick={onClose}
    >
      <form
        onSubmit={submitHandler}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 overflow-y-auto max-h-[90vh] relative"
        onClick={(e) => e.stopPropagation()}
        aria-label={initialData ? "Edit service form" : "Add service form"}
        noValidate
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-lg"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent text-center mb-4">
          {initialData ? "✏️ Edit Service" : "✨ Add New Service"}
        </h2>

        <p className="text-center text-gray-600 text-sm mb-4">
          {initialData 
            ? "Update the service details below" 
            : "Create a new service for your salon"
          }
        </p>

        {/* Service Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Package size={16} className="text-indigo-600" />
            Service Name *
          </label>
          <input
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              errors.name
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            }`}
            placeholder="e.g., Hair Cut & Styling, Body Massage, Manicure"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (errors.name) setErrors((e) => ({ ...e, name: "" }));
            }}
            required
            autoFocus
            spellCheck={false}
            maxLength={100}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name}
            </p>
          )}
          {!errors.name && form.name && (
            <p className="text-xs text-gray-500 mt-1.5">
              {form.name.length}/100 characters
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Tag size={16} className="text-indigo-600" />
            Category
          </label>
          <select
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition bg-white"
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          >
            <option value="">Select a category (optional)</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            placeholder="Describe the service..."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            spellCheck={false}
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            Duration (minutes) *
          </label>
          <input
            type="number"
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              errors.duration_minutes
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            }`}
            placeholder="30"
            min={1}
            step={5}
            value={form.duration_minutes}
            onChange={(e) => {
              setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }));
              if (errors.duration_minutes) setErrors((e) => ({ ...e, duration_minutes: "" }));
            }}
            required
          />
          {errors.duration_minutes && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.duration_minutes}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <DollarSign size={16} className="text-indigo-600" />
            Price (₹) *
          </label>
          <input
            type="number"
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              errors.price
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            }`}
            placeholder="500.00"
            min={0}
            step={10}
            value={form.price}
            onChange={(e) => {
              setForm((f) => ({ ...f, price: Number(e.target.value) }));
              if (errors.price) setErrors((e) => ({ ...e, price: "" }));
            }}
            required
          />
          {errors.price && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.price}
            </p>
          )}
        </div>

        {/* GST Percentage */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-600" />
            GST (%)
          </label>
          <input
            type="number"
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              errors.gst_percentage
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            }`}
            placeholder="18"
            min={0}
            max={100}
            step={1}
            value={form.gst_percentage}
            onChange={(e) => {
              setForm((f) => ({ ...f, gst_percentage: Number(e.target.value) }));
              if (errors.gst_percentage) setErrors((e) => ({ ...e, gst_percentage: "" }));
            }}
          />
          {errors.gst_percentage && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.gst_percentage}
            </p>
          )}
        </div>

        {/* Active Status */}
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 transition cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">Active Service</span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-xl py-3.5 font-bold shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              {initialData ? "Saving Changes..." : "Creating Service..."}
            </>
          ) : (
            <>
              <Check size={20} strokeWidth={2.5} />
              {initialData ? "Save Changes" : "Create Service"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4 animate-in fade-in scale-in duration-300"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-desc"
      >
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="text-red-600" size={32} strokeWidth={1.5} />
        </div>

        <h3
          id="delete-confirm-title"
          className="text-xl font-bold text-center text-gray-900 tracking-tight"
        >
          Delete Service?
        </h3>

        <p id="delete-confirm-desc" className="text-center text-gray-600 text-sm leading-relaxed">
          This action cannot be undone. The service will be permanently removed from your salon.
        </p>

        <div className="flex gap-3 w-full pt-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 border border-gray-300 rounded-lg py-2.5 text-gray-700 font-bold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 bg-red-600 text-white rounded-lg py-2.5 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Check size={18} strokeWidth={2} /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
