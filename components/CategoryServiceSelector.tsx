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
    <div className="space-y-4">
      {/* Categories */}
      <div className="p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
        <label className="block text-sm font-semibold text-gray-700 mb-3">Categories</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services for Selected Category */}
      {selectedCategory && (
        <div className="p-4 rounded-xl border-2 border-gray-200 bg-white space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Select Service and Staff - {selectedCategoryName}
          </label>
          
          {categoryServices.map((service) => (
            <div key={service.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addService(service)}
                className="flex-1 text-left px-4 py-2 rounded-lg border border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                <span className="font-medium">{service.name}</span>
                <span className="text-sm text-gray-500 ml-2">₹{service.price}</span>
              </button>
              <button
                type="button"
                onClick={() => addService(service)}
                className="p-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Services with Staff Assignment */}
      {selectedServices.length > 0 && (
        <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            Selected Services ({selectedServices.length})
          </label>
          
          {selectedServices.map((selected, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{selected.serviceName}</div>
                  <div className="text-xs text-gray-500">{selected.categoryName}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Assign Staff (Optional)
                </label>
                <select
                  value={selected.staffId || ""}
                  onChange={(e) => updateServiceStaff(index, parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                >
                  <option value="">No staff assigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
