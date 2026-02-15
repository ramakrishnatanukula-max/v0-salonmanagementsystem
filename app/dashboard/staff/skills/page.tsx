"use client"

import React, { useState, useMemo, useEffect } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { Scissors, User, Check, Search, ChevronDown, ChevronUp, Filter, Save, X, Sparkles } from "lucide-react"
import Toast from "@/components/Toast"
import LoadingSpinner from "@/components/LoadingSpinner"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function StaffSkillsPage() {
    const { data: staffList, isLoading: staffLoading } = useSWR("/api/staff/staff-only", fetcher)
    const { data: services, isLoading: servicesLoading } = useSWR("/api/services", fetcher)
    const { data: categories } = useSWR("/api/categories", fetcher)

    const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null)
    const [editedServiceIds, setEditedServiceIds] = useState<number[]>([])
    const [isDirty, setIsDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
    const [filterMode, setFilterMode] = useState<"all" | "assigned" | "unassigned">("all")
    const [showMobileModal, setShowMobileModal] = useState(false)

    // Currently selected staff member
    const selectedStaff = useMemo(() => {
        if (!staffList || !selectedStaffId) return null
        return staffList.find((s: any) => s.id === selectedStaffId)
    }, [staffList, selectedStaffId])

    // Group services by category
    const groupedServices = useMemo(() => {
        if (!services || !Array.isArray(services)) return {}
        const groups: Record<string, any[]> = {}
        for (const svc of services) {
            const catName = svc.category_name || "Uncategorized"
            if (!groups[catName]) groups[catName] = []
            groups[catName].push(svc)
        }
        return groups
    }, [services])

    // Filter services based on search and filter mode
    const filteredGroupedServices = useMemo(() => {
        const result: Record<string, any[]> = {}
        for (const [catName, svcs] of Object.entries(groupedServices)) {
            const filtered = svcs.filter((svc: any) => {
                const matchesSearch = !searchTerm || svc.name.toLowerCase().includes(searchTerm.toLowerCase())
                const isAssigned = editedServiceIds.includes(svc.id)
                const matchesFilter = filterMode === "all" || (filterMode === "assigned" && isAssigned) || (filterMode === "unassigned" && !isAssigned)
                return matchesSearch && matchesFilter
            })
            if (filtered.length > 0) result[catName] = filtered
        }
        return result
    }, [groupedServices, searchTerm, filterMode, editedServiceIds])

    // Lock body scroll when mobile modal is open
    useEffect(() => {
        if (showMobileModal) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
        return () => { document.body.style.overflow = "" }
    }, [showMobileModal])

    // Select a staff member and load their current skills
    function handleSelectStaff(staff: any, mobile: boolean = false) {
        setSelectedStaffId(staff.id)
        setEditedServiceIds(staff.service_ids || [])
        setIsDirty(false)
        setSearchTerm("")
        setFilterMode("all")
        // Expand all categories by default
        if (services) {
            const catIds = new Set<number>()
            for (const svc of services) {
                if (svc.category_id) catIds.add(svc.category_id)
            }
            setExpandedCategories(catIds)
        }
        if (mobile) {
            setShowMobileModal(true)
        }
    }

    function closeMobileModal() {
        setShowMobileModal(false)
    }

    function toggleService(serviceId: number) {
        setEditedServiceIds((prev) => {
            const exists = prev.includes(serviceId)
            return exists ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
        })
        setIsDirty(true)
    }

    function toggleCategory(categoryServices: any[]) {
        const allSelected = categoryServices.every((s: any) => editedServiceIds.includes(s.id))
        if (allSelected) {
            setEditedServiceIds((prev) => prev.filter((id) => !categoryServices.some((s: any) => s.id === id)))
        } else {
            setEditedServiceIds((prev) => {
                const newIds = categoryServices.map((s: any) => s.id).filter((id: number) => !prev.includes(id))
                return [...prev, ...newIds]
            })
        }
        setIsDirty(true)
    }

    function selectAll() {
        if (!services) return
        setEditedServiceIds(services.map((s: any) => s.id))
        setIsDirty(true)
    }

    function deselectAll() {
        setEditedServiceIds([])
        setIsDirty(true)
    }

    async function handleSave() {
        if (!selectedStaffId) return
        setSaving(true)
        try {
            const res = await fetch(`/api/staff/${selectedStaffId}/skills`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ service_ids: editedServiceIds }),
            })
            const data = await res.json()
            if (res.ok) {
                setToast({ type: "success", message: `✅ Skills updated! ${data.count} service(s) assigned.` })
                setIsDirty(false)
                globalMutate("/api/staff/staff-only")
                // Close modal on mobile after save
                setShowMobileModal(false)
            } else {
                setToast({ type: "error", message: data.error || "Failed to update skills" })
            }
        } catch (err) {
            setToast({ type: "error", message: "Error saving skills" })
        } finally {
            setSaving(false)
        }
    }

    function toggleCategoryExpand(catId: number) {
        setExpandedCategories((prev) => {
            const next = new Set(prev)
            if (next.has(catId)) next.delete(catId)
            else next.add(catId)
            return next
        })
    }

    const isLoading = staffLoading || servicesLoading

    // ─── Shared Skills Editor Content (used in both desktop inline & mobile modal) ───
    function renderSkillsEditor() {
        if (!selectedStaff) return null
        return (
            <>
                {/* Search + Filter Bar */}
                <div className="px-4 sm:px-5 pt-4 pb-2">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search services..."
                                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={14} className="text-gray-500 flex-shrink-0" />
                            {(["all", "assigned", "unassigned"] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setFilterMode(mode)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === mode
                                            ? "bg-violet-600 text-white shadow-md"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 flex items-center gap-3">
                        <button
                            onClick={selectAll}
                            className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition-colors underline underline-offset-2"
                        >
                            Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                            onClick={deselectAll}
                            className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors underline underline-offset-2"
                        >
                            Deselect All
                        </button>
                        {isDirty && (
                            <>
                                <span className="text-gray-300">|</span>
                                <span className="text-xs text-amber-600 font-semibold animate-pulse">⚠ Unsaved changes</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Services Grid */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3">
                    {Object.keys(filteredGroupedServices).length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-gray-500 font-medium">No services match your search</p>
                            <p className="text-gray-400 text-sm mt-1">Try a different search term or filter</p>
                        </div>
                    ) : (
                        Object.entries(filteredGroupedServices).map(([catName, catServices]) => {
                            const catId = catServices[0]?.category_id || 0
                            const isExpanded = expandedCategories.has(catId)
                            const allSelected = catServices.every((s: any) => editedServiceIds.includes(s.id))
                            const someSelected = catServices.some((s: any) => editedServiceIds.includes(s.id))
                            const selectedCount = catServices.filter((s: any) => editedServiceIds.includes(s.id)).length

                            return (
                                <div key={catName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Category Header */}
                                    <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                                        <button
                                            onClick={() => toggleCategoryExpand(catId)}
                                            className="flex items-center gap-2 flex-1 text-left"
                                        >
                                            {isExpanded ? (
                                                <ChevronUp size={18} className="text-violet-600" />
                                            ) : (
                                                <ChevronDown size={18} className="text-gray-400" />
                                            )}
                                            <span className="font-bold text-gray-800 text-sm">{catName}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedCount > 0 ? "bg-violet-100 text-violet-700" : "bg-gray-200 text-gray-500"
                                                }`}>
                                                {selectedCount}/{catServices.length}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => toggleCategory(catServices)}
                                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${allSelected
                                                    ? "bg-violet-600 text-white"
                                                    : someSelected
                                                        ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                                                }`}
                                        >
                                            {allSelected ? "✓ All" : "Select All"}
                                        </button>
                                    </div>

                                    {/* Services List */}
                                    {isExpanded && (
                                        <div className="divide-y divide-gray-100">
                                            {catServices.map((svc: any) => {
                                                const isChecked = editedServiceIds.includes(svc.id)
                                                return (
                                                    <button
                                                        key={svc.id}
                                                        onClick={() => toggleService(svc.id)}
                                                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-violet-50/50 ${isChecked ? "bg-violet-50/80" : ""
                                                            }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${isChecked
                                                                ? "bg-violet-600 border-violet-600 shadow-sm"
                                                                : "border-gray-300 bg-white"
                                                            }`}>
                                                            {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                                                        </div>

                                                        {/* Service Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold ${isChecked ? "text-violet-900" : "text-gray-800"}`}>
                                                                {svc.name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                {svc.description && (
                                                                    <span className="text-xs text-gray-500">{svc.description}</span>
                                                                )}
                                                                {svc.gender && svc.gender !== "Unisex" && (
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${svc.gender === "Male" ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                                                                        }`}>
                                                                        {svc.gender}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Price + Duration */}
                                                        <div className="text-right flex-shrink-0">
                                                            <p className={`text-sm font-bold ${isChecked ? "text-violet-700" : "text-gray-700"}`}>
                                                                ₹{Number(svc.price || 0).toFixed(0)}
                                                            </p>
                                                            {svc.duration_min && (
                                                                <p className="text-xs text-gray-400">{svc.duration_min} min</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </>
        )
    }

    // ─── Render Save/Reset Action Bar ───
    function renderActionBar(showResetInline = true) {
        return (
            <div className="flex items-center gap-2 w-full">
                {isDirty && showResetInline && (
                    <button
                        onClick={() => {
                            setEditedServiceIds(selectedStaff?.service_ids || [])
                            setIsDirty(false)
                        }}
                        className="px-3 py-2.5 border-2 border-gray-300 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-1.5"
                    >
                        <X size={16} />
                        Reset
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    className={`flex-1 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${isDirty
                            ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg hover:brightness-110"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50 p-0 flex flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-3 shadow-lg">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles size={22} />
                    Staff Skills
                </h1>
                <p className="text-purple-100 text-xs mt-0.5">Assign services each staff member can perform</p>
            </div>

            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner message="Loading staff and services..." />
                </div>
            )}

            {!isLoading && (
                <>
                    {/* ─── DESKTOP LAYOUT (lg+): Side-by-side panels ─── */}
                    <div className="hidden lg:flex flex-1">
                        {/* Staff List Panel */}
                        <div className="w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
                            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50">
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                    <User size={16} className="text-violet-600" />
                                    Staff Members
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Select a staff member to manage their skills</p>
                            </div>

                            <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
                                {(!staffList || staffList.length === 0) ? (
                                    <div className="p-8 text-center">
                                        <div className="text-4xl mb-3">👤</div>
                                        <p className="text-gray-500 text-sm font-medium">No staff members found</p>
                                        <p className="text-gray-400 text-xs mt-1">Add staff with the &quot;staff&quot; role to manage their skills</p>
                                    </div>
                                ) : (
                                    staffList.map((staff: any) => {
                                        const isSelected = selectedStaffId === staff.id
                                        const skillCount = staff.service_ids?.length || 0
                                        return (
                                            <button
                                                key={staff.id}
                                                onClick={() => handleSelectStaff(staff)}
                                                className={`w-full text-left p-4 transition-all hover:bg-violet-50 ${isSelected
                                                        ? "bg-gradient-to-r from-violet-100 to-purple-100 border-l-4 border-violet-600"
                                                        : "border-l-4 border-transparent"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md flex-shrink-0 ${isSelected
                                                            ? "bg-gradient-to-br from-violet-600 to-purple-600"
                                                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                                                        }`}>
                                                        {staff.name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold text-sm truncate ${isSelected ? "text-violet-900" : "text-gray-900"}`}>
                                                            {staff.name}
                                                        </p>
                                                        <span className="text-xs text-gray-500">{staff.phone || "No phone"}</span>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${skillCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                                        }`}>
                                                        {skillCount} {skillCount === 1 ? "skill" : "skills"}
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </div>

                        {/* Skills Editor Panel (Desktop) */}
                        <div className="flex-1 flex flex-col">
                            {!selectedStaff ? (
                                <div className="flex-1 flex items-center justify-center p-8">
                                    <div className="text-center">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                                            <Scissors size={40} className="text-violet-400" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-700 mb-2">Select a Staff Member</h3>
                                        <p className="text-sm text-gray-500 max-w-sm">Choose a staff member from the list to assign or update the services they can perform</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Staff Info Bar (Desktop) */}
                                    <div className="bg-white border-b border-gray-200 px-6 py-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                    {selectedStaff.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 text-lg">{selectedStaff.name}</h3>
                                                    <p className="text-xs text-gray-500 flex items-center gap-2">
                                                        <span>{selectedStaff.phone || "No phone"}</span>
                                                        <span>•</span>
                                                        <span className="font-semibold text-violet-600">{editedServiceIds.length} service(s) assigned</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {renderActionBar()}
                                            </div>
                                        </div>
                                    </div>

                                    {renderSkillsEditor()}
                                </>
                            )}
                        </div>
                    </div>

                    {/* ─── MOBILE LAYOUT: Staff cards list ─── */}
                    <div className="lg:hidden flex-1 px-3 py-4 space-y-3">
                        {(!staffList || staffList.length === 0) ? (
                            <div className="p-8 text-center">
                                <div className="text-4xl mb-3">👤</div>
                                <p className="text-gray-500 text-sm font-medium">No staff members found</p>
                                <p className="text-gray-400 text-xs mt-1">Add staff with the &quot;staff&quot; role to manage their skills</p>
                            </div>
                        ) : (
                            staffList.map((staff: any) => {
                                const skillCount = staff.service_ids?.length || 0
                                // Show assigned service names (up to 3)
                                const assignedNames = (services || [])
                                    .filter((svc: any) => staff.service_ids?.includes(svc.id))
                                    .map((svc: any) => svc.name)
                                    .slice(0, 3)
                                const remaining = skillCount - assignedNames.length

                                return (
                                    <button
                                        key={staff.id}
                                        onClick={() => handleSelectStaff(staff, true)}
                                        className="w-full text-left bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 overflow-hidden transition-all active:scale-[0.98]"
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                                                    {staff.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-gray-900 text-base truncate">{staff.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{staff.phone || "No phone"}</p>
                                                </div>
                                                <div className="flex flex-col items-end flex-shrink-0 gap-1">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${skillCount > 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                                        }`}>
                                                        {skillCount} {skillCount === 1 ? "skill" : "skills"}
                                                    </span>
                                                    <span className="text-xs text-violet-500 font-medium">Tap to edit →</span>
                                                </div>
                                            </div>

                                            {/* Preview of assigned services */}
                                            {assignedNames.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {assignedNames.map((name: string, i: number) => (
                                                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium border border-violet-100">
                                                            <Scissors size={10} />
                                                            {name}
                                                        </span>
                                                    ))}
                                                    {remaining > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                                                            +{remaining} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>

                    {/* ─── MOBILE MODAL: Full-screen skills editor ─── */}
                    {showMobileModal && selectedStaff && (
                        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom">
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 py-3 flex items-center gap-3 shadow-lg safe-area-top">
                                <button
                                    onClick={closeMobileModal}
                                    className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all flex-shrink-0"
                                >
                                    <X size={20} />
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-base truncate">{selectedStaff.name}</h3>
                                    <p className="text-purple-200 text-xs">
                                        {editedServiceIds.length} service(s) assigned
                                        {isDirty && <span className="ml-2 text-amber-300 font-semibold">• Unsaved</span>}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                    {selectedStaff.name?.[0]?.toUpperCase() || "?"}
                                </div>
                            </div>

                            {/* Skills Editor */}
                            <div className="flex-1 overflow-y-auto bg-gray-50">
                                {renderSkillsEditor()}
                            </div>

                            {/* Fixed Bottom Save Bar */}
                            <div className="bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
                                {renderActionBar(true)}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Toast */}
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* CSS for slide-in animation */}
            <style jsx>{`
        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-in.slide-in-from-bottom {
          animation: slideInFromBottom 0.3s ease-out;
        }
        .safe-area-top {
          padding-top: max(12px, env(safe-area-inset-top));
        }
        .safe-area-bottom {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
      `}</style>
        </main>
    )
}
