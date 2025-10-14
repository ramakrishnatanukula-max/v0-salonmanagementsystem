// "use client"

// import type React from "react"

// import useSWR from "swr"
// import { useState } from "react"

// const fetcher = (url: string) => fetch(url).then((r) => r.json())

// export default function CategoriesPage() {
//   const { data: dataRaw, isLoading, mutate } = useSWR("/api/categories", fetcher)
//   const data = Array.isArray(dataRaw) ? dataRaw : dataRaw ? [dataRaw] : []
//   const [name, setName] = useState("")
//   const [sort, setSort] = useState<number>(0)
//   const [editingId, setEditingId] = useState<number | null>(null)
//   const [editName, setEditName] = useState("")
//   const [editSort, setEditSort] = useState<number>(0)
//   const [err, setErr] = useState<string | null>(null)

//   async function addCategory(e: React.FormEvent) {
//     e.preventDefault()
//     setErr(null)
//     const res = await fetch("/api/categories", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ name, sort_order: sort }),
//     })
//     if (!res.ok) {
//       const j = await res.json().catch(() => ({}))
//       setErr(j.error || "Failed to add")
//       return
//     }
//     setName("")
//     setSort(0)
//     mutate()
//   }

//   async function saveEdit(id: number) {
//     const res = await fetch(`/api/categories/${id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ name: editName, sort_order: editSort }),
//     })
//     if (res.ok) {
//       setEditingId(null)
//       mutate()
//     }
//   }

//   async function remove(id: number) {
//     if (!confirm("Delete this category?")) return
//     const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
//     if (res.ok) mutate()
//   }

//   return (
//     <main className="p-4 max-w-screen-sm mx-auto">
//       <header className="mb-4">
//         <h1 className="text-xl font-semibold text-pretty">Service Categories</h1>
//         <p className="text-sm text-gray-500">Create, update, and delete categories.</p>
//       </header>

//       <section className="mb-6">
//         <form onSubmit={addCategory} className="flex flex-col gap-2">
//           {err && <p className="text-red-600 text-sm">{err}</p>}
//           <input
//             className="border rounded px-3 py-2 text-sm"
//             placeholder="Category name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             required
//           />
//           <input
//             className="border rounded px-3 py-2 text-sm"
//             placeholder="Sort order"
//             type="number"
//             value={sort}
//             onChange={(e) => setSort(Number(e.target.value))}
//           />
//           <button className="bg-black text-white rounded px-4 py-2 text-sm">Add Category</button>
//         </form>
//       </section>

//       <section>
//         {isLoading ? (
//           <p className="text-sm text-gray-500">Loading...</p>
//         ) : (
//           <ul className="flex flex-col gap-2">
//             {data.map((c: any) => (
//               <li key={c.id} className="border rounded p-3">
//                 {editingId === c.id ? (
//                   <div className="flex flex-col gap-2">
//                     <input
//                       className="border rounded px-3 py-2 text-sm"
//                       value={editName}
//                       onChange={(e) => setEditName(e.target.value)}
//                     />
//                     <input
//                       className="border rounded px-3 py-2 text-sm"
//                       type="number"
//                       value={editSort}
//                       onChange={(e) => setEditSort(Number(e.target.value))}
//                     />
//                     <div className="flex gap-2">
//                       <button
//                         type="button"
//                         onClick={() => saveEdit(c.id)}
//                         className="bg-black text-white rounded px-3 py-2 text-sm"
//                       >
//                         Save
//                       </button>
//                       <button
//                         type="button"
//                         onClick={() => setEditingId(null)}
//                         className="border rounded px-3 py-2 text-sm"
//                       >
//                         Cancel
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium">{c.name}</p>
//                       <p className="text-xs text-gray-500">Sort: {c.sort_order}</p>
//                     </div>
//                     <div className="flex gap-2">
//                       <button
//                         className="border rounded px-3 py-2 text-sm"
//                         onClick={() => {
//                           setEditingId(c.id)
//                           setEditName(c.name)
//                           setEditSort(c.sort_order)
//                         }}
//                       >
//                         Edit
//                       </button>
//                       <button className="text-red-600 text-sm" onClick={() => remove(c.id)}>
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </li>
//             ))}
//           </ul>
//         )}
//       </section>
//     </main>
//   )
// }


"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Plus, X, AlertTriangle, Check } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CategoriesPage() {
  const { data: dataRaw, isLoading, mutate } = useSWR("/api/categories", fetcher);
  const data = Array.isArray(dataRaw) ? dataRaw : dataRaw ? [dataRaw] : [];

  // Modal states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editCategory, setEditCategory] = useState<any | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

  async function handleDelete(id: number) {
    if (!id) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteCategoryId(null);
      mutate();
    }
  }

  return (
    <main className="p-5 max-w-screen-sm mx-auto relative min-h-screen bg-gradient-to-tr from-green-50 via-blue-50 to-pink-50">
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-wide text-indigo-700 mb-1">Service Categories</h1>
        <p className="text-sm text-gray-500">Create, update, and delete categories.</p>
      </header>

      <section className="flex flex-col gap-3 mb-28">
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center">Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">No categories found.</p>
        ) : (
          data.map((c) => (
            <article
              key={c.id}
              className="bg-white rounded-xl p-4 shadow-md flex justify-between items-center hover:shadow-lg transition-shadow"
              aria-label={`Category ${c.name}`}
            >
              <div>
                <p className="font-semibold text-base text-indigo-800">{c.name}</p>
                <p className="text-xs text-gray-400 mt-1 select-none">Sort order: {c.sort_order}</p>
              </div>
              <div className="flex gap-3">
                <button
                  aria-label={`Edit category ${c.name}`}
                  className="border rounded-lg px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold shadow-sm transition"
                  onClick={() => setEditCategory(c)}
                >
                  Edit
                </button>
                <button
                  aria-label={`Delete category ${c.name}`}
                  className="flex items-center gap-1 text-red-600 font-semibold hover:text-red-700 focus:outline-none"
                  onClick={() => setDeleteCategoryId(c.id)}
                >
                  <AlertTriangle size={16} /> Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        aria-label="Add new category"
        style={{ bottom: "14%" }}
        className="fixed bottom-10 right-7 z-50 bg-gradient-to-tr from-indigo-600 to-green-500 p-3.5 rounded-full shadow-2xl text-white text-3xl drop-shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <Plus size={24} />
      </button>

      {/* Add Category Modal */}
      {showAddForm && (
        <CategoryFormModal
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            mutate();
          }}
        />
      )}

      {/* Edit Category Modal */}
      {editCategory && (
        <CategoryFormModal
          initialData={editCategory}
          onClose={() => setEditCategory(null)}
          onSuccess={() => {
            setEditCategory(null);
            mutate();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteCategoryId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteCategoryId)}
          onCancel={() => setDeleteCategoryId(null)}
        />
      )}
    </main>
  );
}

function CategoryFormModal({
  initialData = null,
  onClose,
  onSuccess,
}: {
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name: initialData.name ?? "",
          sort_order: initialData.sort_order ?? 0,
        }
      : {
          name: "",
          sort_order: 0,
        }
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const url = initialData ? `/api/categories/${initialData.id}` : "/api/categories";
      const method = initialData ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          sort_order: Number(form.sort_order),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Failed to save category");
      } else {
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-tr from-black/60 via-black/50 to-black/60 backdrop-blur-sm flex flex-col p-5"
      onClick={onClose}
    >
      <form
        onSubmit={submitHandler}
        className="bg-white rounded-xl shadow-xl p-6 max-w-xs mx-auto flex flex-col gap-4 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        aria-label={initialData ? "Edit category form" : "Add category form"}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 transition"
        >
          <X size={26} />
        </button>

        <h2 className="text-xl font-extrabold text-indigo-700 mb-3 text-center">
          {initialData ? "Edit Category" : "Add Category"}
        </h2>

        {err && <p className="text-red-600 text-center font-semibold">{err}</p>}

        <input
          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-indigo-400 focus:ring-2 transition"
          placeholder="Category name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          spellCheck={false}
          autoFocus
        />
        <input
          type="number"
          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-indigo-400 focus:ring-2 transition"
          placeholder="Sort order"
          value={form.sort_order}
          onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
          min={0}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-tr from-indigo-700 to-green-500 text-white rounded-lg py-3 font-extrabold shadow-lg hover:brightness-105 transition"
        >
          {loading ? "Saving..." : initialData ? "Save Changes" : "Add Category"}
        </button>
      </form>
    </div>
  );
}

function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-xs w-full flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-desc"
      >
        <AlertTriangle className="text-red-700" size={52} strokeWidth={1.8} />
        <h3
          id="delete-confirm-title"
          className="text-2xl font-extrabold text-center text-gray-900 select-none tracking-wide"
        >
          Confirm Deletion
        </h3>
        <p
          id="delete-confirm-desc"
          className="text-center text-gray-700 leading-relaxed"
        >
          Are you sure you want to delete this category? This action cannot be undone.
        </p>
        <div className="flex gap-5 w-full">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-lg py-3 text-gray-700 font-extrabold hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white rounded-lg py-3 font-extrabold flex items-center justify-center gap-3 hover:bg-red-700 transition"
          >
            <Check size={20} strokeWidth={1.8} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
