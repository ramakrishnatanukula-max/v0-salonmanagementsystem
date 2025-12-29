"use client";

import React, { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { Plus, X, AlertTriangle, Check, AlertCircle, CheckCircle2, Loader, Info, Search, Layers, TrendingUp, Sparkles } from "lucide-react";

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
  React.useEffect(() => {
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
function CategorySkeleton() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-md animate-pulse">
      <div className="flex justify-between items-start gap-3 mb-4">
        <div className="flex-grow space-y-3">
          <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-5 bg-gray-100 rounded-full w-1/2"></div>
        </div>
        <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
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

export default function CategoriesPage() {
  const { data: dataRaw, isLoading, mutate } = useSWR("/api/categories", fetcher);
  const { data: servicesRaw } = useSWR("/api/services", fetcher);
  const data = Array.isArray(dataRaw) ? dataRaw : dataRaw ? [dataRaw] : [];
  const services = Array.isArray(servicesRaw) ? servicesRaw : servicesRaw ? [servicesRaw] : [];

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate service counts per category
  const categoryServiceCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    services.forEach((service: any) => {
      const categoryId = service.category_id;
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] || 0) + 1;
      }
    });
    return counts;
  }, [services]);

  // Filter categories based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter((c: any) => 
      c.name.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowHeader(currentScrollY <= lastScrollY || currentScrollY <= 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  async function handleDelete(id: number) {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteCategoryId(null);
        setToastConfig({ type: "success", message: "Category deleted successfully! ✓" });
        await mutate();
      } else {
        setToastConfig({ type: "error", message: "Failed to delete category. Please try again." });
      }
    } catch (err) {
      setToastConfig({ type: "error", message: "Error deleting category. Please try again." });
    } finally {
      setIsDeleting(false);
    }
  }

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
              Service Categories
            </h1>
            <p className="text-sm text-gray-500">Organize and manage your salon service categories</p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-lg px-4 py-2 shadow-md">
              <div className="flex items-center gap-2 text-white">
                <Layers size={18} />
                <div className="text-right">
                  <p className="text-xs font-medium opacity-90">Total</p>
                  <p className="text-lg font-bold leading-none">{data.length}</p>
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
            placeholder="Search categories..."
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

      {/* Categories List */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-32">
        {isLoading ? (
          <>
            <CategorySkeleton />
            <CategorySkeleton />
            <CategorySkeleton />
          </>
        ) : filteredData.length === 0 ? (
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
                {searchQuery ? "No categories found" : "No categories yet"}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {searchQuery 
                  ? `No categories match "${searchQuery}". Try a different search.`
                  : "Create your first category to start organizing your salon services"
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Create First Category
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredData.map((c) => {
            const serviceCount = categoryServiceCounts[c.id] || 0;
            return (
              <article
                key={c.id}
                className="group bg-white rounded-xl p-5 shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 flex flex-col h-full relative overflow-hidden"
                aria-label={`Category ${c.name}`}
              >
                {/* Decorative gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex flex-col gap-4 flex-grow">
                  <div className="flex-grow space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {c.name}
                      </h3>
                      <div className="flex-shrink-0 bg-gradient-to-br from-indigo-100 to-emerald-100 px-2 py-1 rounded-lg">
                        <Layers size={16} className="text-indigo-600" />
                      </div>
                    </div>
                    
                    {/* Service Count Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        serviceCount > 0 
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}>
                        <TrendingUp size={14} />
                        <span>{serviceCount} {serviceCount === 1 ? 'Service' : 'Services'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                    <button
                      aria-label={`Edit category ${c.name}`}
                      className="flex-1 md:flex-initial px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-lg font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                      onClick={() => setEditCategory(c)}
                    >
                      Edit
                    </button>
                    <button
                      aria-label={`Delete category ${c.name}`}
                      className="flex-1 md:flex-initial text-red-600 hover:text-white hover:bg-red-600 font-semibold text-sm border border-red-200 hover:border-red-600 px-4 py-2 rounded-lg transition-all active:scale-95"
                      onClick={() => setDeleteCategoryId(c.id)}
                    >
                      Delete
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
        aria-label="Add new category"
        className="fixed bottom-20 sm:bottom-8 right-6 z-50 bg-gradient-to-tr from-indigo-600 to-emerald-500 p-4 rounded-full shadow-2xl text-white hover:shadow-3xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center group"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
        <span className="sr-only">Add new category</span>
      </button>

      {/* Modals */}
      {showAddForm && (
        <CategoryFormModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            setToastConfig({ type: "success", message: "Category created successfully! ✓" });
            mutate();
          }}
          onError={(msg) => setToastConfig({ type: "error", message: msg })}
        />
      )}

      {editCategory && (
        <CategoryFormModal
          initialData={editCategory}
          onClose={() => setEditCategory(null)}
          onSuccess={() => {
            setEditCategory(null);
            setToastConfig({ type: "success", message: "Category updated successfully! ✓" });
            mutate();
          }}
          onError={(msg) => setToastConfig({ type: "error", message: msg })}
        />
      )}

      {deleteCategoryId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteCategoryId)}
          onCancel={() => setDeleteCategoryId(null)}
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

function CategoryFormModal({
  initialData = null,
  onClose,
  onSuccess,
  onError,
}: {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
  onError?: (msg: string) => void;
}) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name: initialData.name ?? "",
        }
      : {
          name: "",
        }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Category name is required";
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
      const url = initialData ? `/api/categories/${initialData.id}` : "/api/categories";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const error = await res.json().catch(() => ({}));
        onError?.(error.error || "Failed to save category. Please try again.");
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
        aria-label={initialData ? "Edit category form" : "Add category form"}
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
          {initialData ? "✏️ Edit Category" : "✨ Add New Category"}
        </h2>

        <p className="text-center text-gray-600 text-sm mb-4">
          {initialData 
            ? "Update the category details below" 
            : "Create a new category to organize your services"
          }
        </p>

        {/* Category Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Layers size={16} className="text-indigo-600" />
            Category Name *
          </label>
          <input
            className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition ${
              errors.name
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            }`}
            placeholder="e.g., Hair Services, Spa & Massage, Nail Art"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (errors.name) setErrors((e) => ({ ...e, name: "" }));
            }}
            required
            autoFocus
            spellCheck={false}
            maxLength={50}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors.name}
            </p>
          )}
          {!errors.name && form.name && (
            <p className="text-xs text-gray-500 mt-1.5">
              {form.name.length}/50 characters
            </p>
          )}
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
              {initialData ? "Saving Changes..." : "Creating Category..."}
            </>
          ) : (
            <>
              <Check size={20} strokeWidth={2.5} />
              {initialData ? "Save Changes" : "Create Category"}
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
          Delete Category?
        </h3>

        <p id="delete-confirm-desc" className="text-center text-gray-600 text-sm leading-relaxed">
          This action cannot be undone. The category will be permanently removed.
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
