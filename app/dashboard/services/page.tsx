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

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, Plus, X, Check } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ServicesPage() {
  const { data: categoriesRaw } = useSWR("/api/categories", fetcher);
  const { data: services, mutate } = useSWR("/api/services", fetcher);

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

  async function handleDelete(id: number) {
    if (!id) return;
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteServiceId(null);
      mutate();
    }
  }

  return (
    <main className="p-4 max-w-screen-sm mx-auto relative min-h-screen bg-gradient-to-tr from-green-50 via-blue-50 to-pink-50">
      <header className="mb-5">
        <h1 className="text-xl font-bold tracking-wide text-indigo-700 mb-1">Services</h1>
        <p className="text-sm text-gray-500">Manage your services with ease.</p>
      </header>

      <section className="flex flex-col gap-3 mb-24">
        {(Array.isArray(services) ? services : []).map((s: any) => (
          <article
            key={s.id}
            className="bg-white rounded-xl p-4 shadow-md flex justify-between items-start gap-3 hover:shadow-lg transition-shadow"
            aria-label={`Service ${s.name}`}
          >
            <div className="flex-grow">
              <p className="font-semibold text-base text-indigo-800 leading-tight">{s.name}</p>
              <p className="text-xs text-gray-400 mt-1 select-none">
                {s.duration_minutes} min • ${Number(s.base_price).toFixed(2)} •{" "}
                <span className={s.is_active ? "text-green-600" : "text-red-500"}>
                  {s.is_active ? "Active" : "Inactive"}
                </span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{categoryMap[s.category_id] || "No category"}</p>
              {s.description && (
                <p className="text-sm mt-1 text-gray-700 leading-relaxed">{s.description}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                aria-label={`Edit service ${s.name}`}
                className="border rounded-lg px-3 py-1 text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold shadow-sm transition"
                onClick={() => setEditService(s)}
              >
                Edit
              </button>
              <button
                aria-label={`Delete service ${s.name}`}
                className="flex items-center gap-1 text-red-600 font-semibold hover:text-red-700 focus:outline-none"
                onClick={() => setDeleteServiceId(s.id)}
              >
                <AlertTriangle size={16} /> Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddForm(true)}
        aria-label="Add new service"
       style={{ bottom: "14%" }}
        className="fixed bottom-9 right-6 z-50 bg-gradient-to-tr from-indigo-600 to-green-500 p-3.5 rounded-full shadow-xl text-white text-3xl drop-shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <Plus size={24} />
      </button>

      {/* Add Service Modal */}
      {showAddForm && (
        <ServiceFormModal
          categories={categories}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            mutate();
          }}
        />
      )}

      {/* Edit Service Modal */}
      {editService && (
        <ServiceFormModal
          categories={categories}
          initialData={editService}
          onClose={() => setEditService(null)}
          onSuccess={() => {
            setEditService(null);
            mutate();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteServiceId !== null && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteServiceId)}
          onCancel={() => setDeleteServiceId(null)}
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
}: {
  categories: any[];
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name: initialData.name ?? "",
          category_id: initialData.category_id?.toString() ?? "",
          description: initialData.description ?? "",
          duration_minutes: initialData.duration_minutes ?? 30,
          base_price: initialData.base_price ?? 0,
          is_active: initialData.is_active ?? true,
          allow_addons: initialData.allow_addons ?? true,
        }
      : {
          name: "",
          category_id: "",
          description: "",
          duration_minutes: 30,
          base_price: 0,
          is_active: true,
          allow_addons: true,
        }
  );
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
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
          base_price: Number(form.base_price),
          is_active: !!form.is_active,
          allow_addons: !!form.allow_addons,
        }),
      });
      if (res.ok) onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gradient-to-tr from-black/60 via-black/50 to-black/60 backdrop-blur-sm flex flex-col p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submitHandler}
        className="bg-white rounded-xl shadow-xl p-5 max-w-xs mx-auto flex flex-col gap-3 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
        aria-label={initialData ? "Edit service form" : "Add service form"}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close form"
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-indigo-700 text-center mb-3">
          {initialData ? "Edit Service" : "Add Service"}
        </h2>
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-400 focus:ring-2 transition"
          placeholder="Service name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          autoFocus
          spellCheck={false}
        />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-400 focus:ring-2 transition"
          value={form.category_id}
          onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
        >
          <option value="">No category</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:ring-indigo-400 focus:ring-2 transition"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          spellCheck={false}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-400 focus:ring-2 transition"
            placeholder="Duration (min)"
            min={1}
            value={form.duration_minutes}
            onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
            required
          />
          <input
            type="number"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-400 focus:ring-2 transition"
            placeholder="Base price"
            min={0}
            step={0.01}
            value={form.base_price}
            onChange={(e) => setForm((f) => ({ ...f, base_price: Number(e.target.value) }))}
            required
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 focus:ring-indigo-400 focus:ring-2 transition"
          />
          Active
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={form.allow_addons}
            onChange={(e) => setForm((f) => ({ ...f, allow_addons: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 focus:ring-indigo-400 focus:ring-2 transition"
          />
          Allow Add-ons
        </label>

        <button
          type="submit"
          disabled={false}
          className="bg-gradient-to-tr from-indigo-700 to-green-500 text-white rounded-lg py-2.5 font-bold shadow hover:brightness-105 transition"
        >
          {initialData ? "Save Changes" : "Add Service"}
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
      className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-5 max-w-xs w-full flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-desc"
      >
        <AlertTriangle className="text-red-700" size={44} strokeWidth={1.8} />
        <h3
          id="delete-confirm-title"
          className="text-xl font-bold text-center text-gray-900 select-none tracking-wide"
        >
          Confirm Deletion
        </h3>
        <p id="delete-confirm-desc" className="text-center text-gray-700 leading-relaxed">
          Are you sure you want to delete this service? This action cannot be undone.
        </p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 rounded-lg py-2 text-gray-700 font-bold hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white rounded-lg py-2 font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition"
          >
            <Check size={18} strokeWidth={1.8} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
