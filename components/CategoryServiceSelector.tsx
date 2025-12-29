"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"

interface Service {
  id: number
  name: string
  category_id: number
  price: number | string
}

interface Category {
  id: number
  name: string
}

interface Staff {
  id: number
  name?: string
  first_name?: string
  last_name?: string
  service_ids?: number[] // Array of service IDs this staff can perform
}

interface SelectedService {
  serviceId: number
  serviceName: string
  categoryName: string
  staffId: number | null
  staffName: string | null
}

interface CategoryServiceSelectorProps {
  categories: Category[]
  services: Service[]
  staff: Staff[]
  selectedServices: SelectedService[]
  onServicesChange: (services: SelectedService[]) => void
}

export default function CategoryServiceSelector({
  categories,
  services,
  staff,
  selectedServices,
  onServicesChange,
}: CategoryServiceSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)

  const categoryServices = selectedCategory
    ? services.filter((s) => s.category_id === selectedCategory)
    : []

  const selectedCategoryName = categories.find((c) => c.id === selectedCategory)?.name || ""

  const addService = (service: Service) => {
    // Check if service is Added
    const isDuplicate = selectedServices.some(s => s.serviceId === service.id)
    if (isDuplicate) {
      return // Don't add duplicate services
    }
    
    const newService: SelectedService = {
      serviceId: service.id,
      serviceName: service.name,
      categoryName: selectedCategoryName,
      staffId: null,
      staffName: null,
    }
    onServicesChange([...selectedServices, newService])
  }

  const updateServiceStaff = (index: number, staffId: number) => {
    const staffMember = staff.find((s) => s.id === staffId)
    const staffName = staffMember?.name || `${staffMember?.first_name || ""} ${staffMember?.last_name || ""}`.trim()
    
    const updated = [...selectedServices]
    updated[index] = { ...updated[index], staffId, staffName }
    onServicesChange(updated)
  }

  const removeService = (index: number) => {
    onServicesChange(selectedServices.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-5">
      {/* Categories */}
      <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-emerald-50 shadow-sm">
        <label className="block text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
          <div className="w-1.5 h-5 bg-gradient-to-b from-indigo-600 to-emerald-600 rounded-full"></div>
          Select Category
        </label>
        <div className="flex flex-wrap gap-2.5">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 active:scale-95 ${
                selectedCategory === category.id
                  ? "bg-gradient-to-r from-indigo-600 to-emerald-600 text-white shadow-lg shadow-indigo-200"
                  : "bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services for Selected Category */}
      {selectedCategory && (
        <div className="p-5 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-emerald-50 shadow-sm space-y-3">
          <label className="block text-sm font-bold text-gray-800 mb-4 uppercase tracking-wide flex items-center gap-2">
            <div className="w-1.5 h-5 bg-gradient-to-b from-indigo-600 to-emerald-600 rounded-full"></div>
            {selectedCategoryName} Services
          </label>
          
          <div className="space-y-2.5">
            {categoryServices.map((service) => {
              const isAdded = selectedServices.some(s => s.serviceId === service.id)
              return (
              <div key={service.id} className="flex items-center gap-3 group">
                <button
                  type="button"
                  onClick={() => addService(service)}
                  disabled={isAdded}
                  className={`flex-1 text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                    isAdded 
                      ? "border-emerald-200 bg-emerald-50 text-gray-500 cursor-not-allowed"
                      : "border-gray-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transform hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isAdded ? "text-gray-500" : "text-gray-900"}`}>
                      {service.name}
                    </span>
                    <span className={`text-sm font-bold ${isAdded ? "text-gray-400" : "text-indigo-600"}`}>
                      ₹{service.price}
                    </span>
                  </div>
                  {isAdded && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-emerald-600 font-bold">Added</span>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => addService(service)}
                  disabled={isAdded}
                  className={`p-3 rounded-xl transition-all transform hover:scale-110 active:scale-95 ${
                    isAdded
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-br from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white shadow-lg shadow-indigo-200"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )})}
          </div>
        </div>
      )}

      {/* Selected Services with Staff Assignment */}
      {selectedServices.length > 0 && (
        <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-indigo-50 to-emerald-50 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <div className="w-1.5 h-5 bg-gradient-to-b from-indigo-600 to-emerald-600 rounded-full"></div>
              Selected Services
            </label>
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-md">
              {selectedServices.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {selectedServices.map((selected, index) => (
              <div key={index} className="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-md transition-all space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-base truncate">{selected.serviceName}</div>
                    <div className="text-xs text-gray-500 mt-0.5 px-2 py-0.5 bg-gray-100 rounded-md inline-block">
                      {selected.categoryName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                    title="Remove service"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                    Assign Staff (Optional)
                  </label>
                  <select
                    value={selected.staffId || ""}
                    onChange={(e) => updateServiceStaff(index, parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-300 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                  >
                    <option value="">No staff assigned</option>
                    {staff
                      .filter((s) => !s.service_ids || s.service_ids.length === 0 || s.service_ids.includes(selected.serviceId))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim()}
                        </option>
                      ))}
                  </select>
                  {staff.filter((s) => !s.service_ids || s.service_ids.length === 0 || s.service_ids.includes(selected.serviceId)).length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ No staff available for this service</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
