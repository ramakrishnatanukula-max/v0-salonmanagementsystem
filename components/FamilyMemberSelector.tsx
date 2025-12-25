"use client"

import { useState } from "react"
import { UserPlus, X, Users, Loader } from "lucide-react"

interface FamilyMember {
  id?: number
  name: string
  gender: "male" | "female" | "other"
  age: number | null
  age_group: "kid" | "adult" | "men" | "women"
  relation?: "son" | "daughter" | "wife" | "husband" | "cousin" | "other"
}

interface FamilyMemberSelectorProps {
  familyMembers: FamilyMember[]
  selectedMember: FamilyMember | null
  isForSelf: boolean
  onSelectSelf: () => void
  onSelectMember: (member: FamilyMember) => void
  onAddMember: (member: FamilyMember) => void
  customerName: string
}

export default function FamilyMemberSelector({
  familyMembers,
  selectedMember,
  isForSelf,
  onSelectSelf,
  onSelectMember,
  onAddMember,
  customerName,
}: FamilyMemberSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newMember, setNewMember] = useState<FamilyMember>({
    name: "",
    gender: "male",
    age: null,
    age_group: "adult",
    relation: "other",
  })

  const handleAddMember = async () => {
    if (!newMember.name) return
    setIsAdding(true)
    try {
      await onAddMember(newMember)
      setNewMember({ name: "", gender: "male", age: null, age_group: "adult", relation: "other" })
      setShowAddForm(false)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-700">
        <Users className="inline w-4 h-4 mr-1" />
        Booking For
      </label>

      {/* Self Option */}
      <button
        type="button"
        onClick={onSelectSelf}
        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
          isForSelf
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-200 hover:border-indigo-300"
        }`}
      >
        <div className="font-medium text-gray-900">Self - {customerName}</div>
        <div className="text-xs text-gray-500">Book appointment for yourself</div>
      </button>

      {/* Family Members */}
      {familyMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Family Members
          </p>
          {familyMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectMember(member)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                !isForSelf && selectedMember?.id === member.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {member.relation && `${member.relation} • `}
                    {member.age_group}
                    {member.age && ` • ${member.age} years`} • {member.gender}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add Family Member */}
      {!showAddForm ? (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-600 hover:text-indigo-600 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Family Member</span>
        </button>
      ) : (
        <div className="p-4 rounded-lg border-2 border-indigo-300 bg-indigo-50 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">Add Family Member</h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            type="text"
            placeholder="Name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={newMember.gender}
              onChange={(e) =>
                setNewMember({ ...newMember, gender: e.target.value as any })
              }
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <input
              type="number"
              placeholder="Age"
              value={newMember.age || ""}
              onChange={(e) =>
                setNewMember({ ...newMember, age: e.target.value ? parseInt(e.target.value) : null })
              }
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
            />
          </div>

          <select
            value={newMember.age_group}
            onChange={(e) =>
              setNewMember({ ...newMember, age_group: e.target.value as any })
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            <option value="kid">Kid</option>
            <option value="adult">Adult</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
          </select>

          <select
            value={newMember.relation || "other"}
            onChange={(e) =>
              setNewMember({ ...newMember, relation: e.target.value as any })
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
          >
            <option value="son">Son</option>
            <option value="daughter">Daughter</option>
            <option value="wife">Wife</option>
            <option value="husband">Husband</option>
            <option value="cousin">Cousin</option>
            <option value="other">Other</option>
          </select>

          <button
            type="button"
            onClick={handleAddMember}
            disabled={!newMember.name || isAdding}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </button>
        </div>
      )}
    </div>
  )
}
