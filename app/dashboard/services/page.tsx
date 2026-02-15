"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { AlertTriangle, Plus, X, Check, AlertCircle, Loader, Search, Package, TrendingUp, Tag, Clock, DollarSign, Sparkles, ToggleLeft, ToggleRight, Trash2, Eye, EyeOff, Layers } from "lucide-react";
import Toast from "@/components/Toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const allServices = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    return services;
  }, [services]);

  // Stats
  const activeCount = useMemo(() => allServices.filter((s: any) => s.is_active === 1 || s.is_active === true).length, [allServices]);
  const inactiveCount = useMemo(() => allServices.filter((s: any) => s.is_active === 0 || s.is_active === false).length, [allServices]);

  // Filter services based on search and status
  const filteredServices = useMemo(() => {
    let result = allServices;

    // Status filter
    if (statusFilter === "active") {
      result = result.filter((s: any) => s.is_active === 1 || s.is_active === true);
    } else if (statusFilter === "inactive") {
      result = result.filter((s: any) => s.is_active === 0 || s.is_active === false);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s: any) => {
        const categoryName = categoryMap[s.category_id] || "";
        return (
          s.name.toLowerCase().includes(query) ||
          categoryName.toLowerCase().includes(query) ||
          (s.description && s.description.toLowerCase().includes(query))
        );
      });
    }

    return result;
  }, [allServices, searchQuery, statusFilter, categoryMap]);

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

  async function handleToggleActive(id: number, currentStatus: boolean) {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        setToastConfig({
          type: "success",
          message: !currentStatus ? "Service activated ✓" : "Service deactivated ✓",
        });
        await mutate();
      } else {
        setToastConfig({ type: "error", message: "Failed to update status." });
      }
    } catch (err) {
      setToastConfig({ type: "error", message: "Error updating status." });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteServiceId(null);
        setToastConfig({ type: "success", message: "Service deactivated (soft deleted) ✓" });
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

  return (
    <main className="p-3 md:p-6 max-w-7xl mx-auto relative min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header
        className={`mb-6 sticky top-4 z-10 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm transition-all duration-300 transform ${showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
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
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold leading-none">{allServices.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center gap-2 text-white">
                <Eye size={16} />
                <div className="text-right">
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Active</p>
                  <p className="text-lg font-bold leading-none">{activeCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg px-3 py-2 shadow-md">
              <div className="flex items-center gap-2 text-white">
                <EyeOff size={16} />
                <div className="text-right">
                  <p className="text-[10px] font-medium opacity-90 uppercase tracking-wider">Inactive</p>
                  <p className="text-lg font-bold leading-none">{inactiveCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search + Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
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

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2">
          {(["all", "active", "inactive"] as const).map((mode) => {
            const count = mode === "all" ? allServices.length : mode === "active" ? activeCount : inactiveCount;
            return (
              <button
                key={mode}
                onClick={() => setStatusFilter(mode)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1.5 ${statusFilter === mode
                    ? mode === "active"
                      ? "bg-emerald-600 text-white shadow-md"
                      : mode === "inactive"
                        ? "bg-gray-600 text-white shadow-md"
                        : "bg-indigo-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
              >
                {mode === "active" && <Eye size={14} />}
                {mode === "inactive" && <EyeOff size={14} />}
                {mode === "all" && <Layers size={14} />}
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                <span className={`ml-0.5 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === mode ? "bg-white/20" : "bg-gray-100"
                  }`}>
                  {count}
                </span>
              </button>
            );
          })}
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
                {searchQuery || statusFilter !== "all" ? (
                  <Search className="text-indigo-600" size={36} />
                ) : (
                  <Sparkles className="text-emerald-600" size={36} />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {searchQuery || statusFilter !== "all" ? "No services found" : "No services yet"}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No services match "${searchQuery}". Try a different search.`
                  : statusFilter !== "all"
                    ? `No ${statusFilter} services found.`
                    : "Create your first service to start offering salon treatments"
                }
              </p>
              {!searchQuery && statusFilter === "all" && (
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
          filteredServices.map((s: any) => {
            const isActive = s.is_active === 1 || s.is_active === true;
            const isToggling = togglingId === s.id;

            return (
              <article
                key={s.id}
                className={`group bg-white rounded-xl p-5 shadow-md hover:shadow-2xl transition-all duration-300 border hover:-translate-y-1 flex flex-col h-full relative overflow-hidden ${isActive
                    ? "border-gray-100 hover:border-indigo-200"
                    : "border-gray-200 bg-gray-50/50"
                  }`}
                aria-label={`Service ${s.name}`}
              >
                {/* Decorative gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 ${isActive
                    ? "bg-gradient-to-r from-indigo-600 to-emerald-600 opacity-0 group-hover:opacity-100"
                    : "bg-gray-300 opacity-100"
                  }`} />

                {/* Inactive badge */}
                {!isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                      <EyeOff size={12} />
                      Inactive
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-4 flex-grow">
                  <div className="flex-grow space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-bold text-lg transition-colors leading-tight ${isActive
                          ? "text-gray-900 group-hover:text-indigo-600"
                          : "text-gray-500"
                        }`}>
                        {s.name}
                      </h3>
                      {isActive && (
                        <div className="flex-shrink-0 bg-gradient-to-br from-emerald-100 to-green-100 px-2 py-1 rounded-lg">
                          <Eye size={14} className="text-emerald-600" />
                        </div>
                      )}
                    </div>

                    {/* Service Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                        <Clock size={12} />
                        <span>{s.duration_minutes} min</span>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                          ? "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                        <DollarSign size={12} />
                        <span>₹{Number(s.price).toFixed(0)}</span>
                      </div>
                      {s.gst_percentage > 0 && (
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive
                            ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border border-amber-200"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}>
                          <TrendingUp size={12} />
                          <span>GST {s.gst_percentage}%</span>
                        </div>
                      )}
                    </div>

                    {/* Category Badge */}
                    {categoryMap[s.category_id] && (
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-fit ${isActive
                          ? "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border border-purple-200"
                          : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                        <Tag size={12} />
                        <span>{categoryMap[s.category_id]}</span>
                      </div>
                    )}

                    {s.description && (
                      <p className={`text-sm leading-relaxed line-clamp-2 ${isActive ? "text-gray-600" : "text-gray-400"}`}>{s.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {/* Toggle Active/Inactive */}
                    <button
                      onClick={() => handleToggleActive(s.id, isActive)}
                      disabled={isToggling}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 flex-shrink-0 ${isActive
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          : "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                        }`}
                      title={isActive ? "Deactivate service" : "Activate service"}
                    >
                      {isToggling ? (
                        <Loader size={16} className="animate-spin" />
                      ) : isActive ? (
                        <ToggleRight size={18} />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                      <span className="hidden sm:inline">{isActive ? "Active" : "Inactive"}</span>
                    </button>

                    {/* Edit */}
                    <button
                      aria-label={`Edit service ${s.name}`}
                      className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                      onClick={() => setEditService(s)}
                    >
                      Edit
                    </button>

                    {/* Soft Delete */}
                    <button
                      aria-label={`Delete service ${s.name}`}
                      className="flex items-center justify-center px-3 py-2 text-red-500 hover:text-white hover:bg-red-500 font-semibold text-sm border border-red-200 hover:border-red-500 rounded-lg transition-all active:scale-95"
                      onClick={() => setDeleteServiceId(s.id)}
                      title="Soft delete (deactivate)"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })
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
        is_active: initialData.is_active === 1 || initialData.is_active === true,
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

  // Filter to only show active categories in the dropdown
  const activeCategories = categories.filter((c: any) => c.is_active === 1 || c.is_active === true);

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
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${errors.name
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
            {activeCategories.map((c: any) => (
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
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${errors.duration_minutes
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
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${errors.price
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
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${errors.gst_percentage
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

        {/* Active Status Toggle */}
        <div
          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${form.is_active
              ? "bg-emerald-50 border-emerald-200"
              : "bg-gray-50 border-gray-200"
            }`}
          onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
        >
          <div className="flex items-center gap-3">
            {form.is_active ? (
              <ToggleRight size={24} className="text-emerald-600" />
            ) : (
              <ToggleLeft size={24} className="text-gray-400" />
            )}
            <div>
              <span className={`text-sm font-semibold ${form.is_active ? "text-emerald-700" : "text-gray-600"}`}>
                {form.is_active ? "Active" : "Inactive"}
              </span>
              <p className="text-xs text-gray-500">
                {form.is_active ? "Service is visible to customers" : "Service is hidden from listings"}
              </p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${form.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
        </div>

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
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
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
        <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertTriangle className="text-orange-600" size={32} strokeWidth={1.5} />
        </div>

        <h3
          id="delete-confirm-title"
          className="text-xl font-bold text-center text-gray-900 tracking-tight"
        >
          Deactivate Service?
        </h3>

        <p id="delete-confirm-desc" className="text-center text-gray-600 text-sm leading-relaxed">
          This will <span className="font-bold text-orange-600">soft delete</span> the service by marking it as inactive.
          It can be reactivated later. The service will not appear in active listings.
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
            className="flex-1 bg-orange-600 text-white rounded-lg py-2.5 font-bold flex items-center justify-center gap-2 hover:bg-orange-700 transition disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader size={18} className="animate-spin" /> Deactivating...
              </>
            ) : (
              <>
                <EyeOff size={18} /> Deactivate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
