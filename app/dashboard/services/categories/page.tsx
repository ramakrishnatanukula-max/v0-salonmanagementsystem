"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { Plus, X, AlertTriangle, Check, AlertCircle, CheckCircle2, Loader, Info } from "lucide-react";

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
    <div className="bg-white rounded-xl p-4 shadow-md animate-pulse">
      <div className="flex justify-between items-center gap-3">
        <div className="flex-grow space-y-2">
          <div className="h-5 bg-gray-200 rounded-lg w-3/4"></div>
          <div className="h-3 bg-gray-100 rounded-lg w-1/2"></div>
        </div>
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 rounded-lg w-16"></div>
          <div className="h-6 bg-gray-100 rounded-lg w-12"></div>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { data: dataRaw, isLoading, mutate } = useSWR("/api/categories", fetcher);
  const data = Array.isArray(dataRaw) ? dataRaw : dataRaw ? [dataRaw] : [];

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);
  const [toastConfig, setToastConfig] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    <main className="p-4 max-w-sm mx-auto relative min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header
        className={`mb-6 sticky top-4 z-10 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm transition-all duration-300 transform ${
          showHeader ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent mb-1">
          Service Categories
        </h1>
        <p className="text-sm text-gray-500">Organize your salon services</p>
      </header>

      {/* Categories List */}
      <section className="flex flex-col gap-3 mb-32">
        {isLoading ? (
          <>
            <CategorySkeleton />
            <CategorySkeleton />
            <CategorySkeleton />
          </>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium">No categories yet</p>
            <p className="text-gray-400 text-sm mt-1">Tap the + button to create your first category</p>
          </div>
        ) : (
          data.map((c) => (
            <article
              key={c.id}
              className="bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-purple-200 hover:-translate-y-0.5"
              aria-label={`Category ${c.name}`}
            >
              <div className="flex justify-between items-center gap-3">
                <div className="flex-grow">
                  <p className="font-semibold text-lg text-gray-900">{c.name}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    aria-label={`Edit category ${c.name}`}
                    className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all active:scale-95"
                    onClick={() => setEditCategory(c)}
                  >
                    Edit
                  </button>
                  <button
                    aria-label={`Delete category ${c.name}`}
                    className="text-red-600 hover:text-red-700 font-semibold text-sm hover:bg-red-50 px-2 py-1 rounded-lg transition"
                    onClick={() => setDeleteCategoryId(c.id)}
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
        aria-label="Add new category"
        className="fixed bottom-20 sm:bottom-8 right-6 z-50 bg-gradient-to-tr from-indigo-600 to-emerald-500 p-4 rounded-full shadow-2xl text-white hover:shadow-3xl hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center group"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
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

        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent text-center mb-2">
          {initialData ? "✏️ Edit Category" : "➕ Add New Category"}
        </h2>

        {/* Category Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
          <input
            className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
              errors.name
                ? "border-red-400 focus:ring-red-300 bg-red-50"
                : "border-gray-300 focus:ring-indigo-400 focus:border-indigo-400"
            }`}
            placeholder="e.g., Hair Services, Massage"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (errors.name) setErrors((e) => ({ ...e, name: "" }));
            }}
            required
            autoFocus
            spellCheck={false}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-emerald-600 text-white rounded-lg py-3 font-bold shadow-lg hover:shadow-xl hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              {initialData ? "Saving..." : "Creating..."}
            </>
          ) : (
            <>
              {initialData ? "Save Changes" : "Add Category"}
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
