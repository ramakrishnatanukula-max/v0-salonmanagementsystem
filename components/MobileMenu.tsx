"use client"

import { useState } from "react"
import { Menu, X, ShoppingBag, Layers, UserPlus, LogOut, Scissors } from "lucide-react"
import { useRouter } from "next/navigation"
import useSWR from "swr"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { data } = useSWR("/api/auth/me", fetcher, { revalidateOnFocus: false })
  const role = data?.role as "admin" | "receptionist" | "staff" | undefined

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const allMenuItems = [
    { icon: ShoppingBag, label: "Services", href: "/dashboard/services", roles: ["admin"] },
    { icon: Layers, label: "Categories", href: "/dashboard/services/categories", roles: ["admin"] },
    { icon: UserPlus, label: "Role Management", href: "/dashboard/staff", roles: ["admin"] },
    { icon: Scissors, label: "Staff Skills", href: "/dashboard/staff/skills", roles: ["admin"] },
    { icon: UserPlus, label: "Staff Creation", href: "/dashboard/signup", roles: ["admin"] },
    { icon: UserPlus, label: "Customer Management", href: "/dashboard/customers", roles: ["admin", "receptionist", "staff"] },

  ]

  // Filter menu items based on role
  const menuItems = role ? allMenuItems.filter((item) => item.roles.includes(role)) : []

  // Always show menu for logout, even if no other items
  if (!role) {
    return null
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-3 right-3 z-[100] p-2.5 bg-white rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-700" />
        ) : (
          <Menu className="w-5 h-5 text-gray-700" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-[60]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden fixed top-14 left-0 right-0 mx-3 z-[70] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200 ${isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        {/* User Info Header */}
        {data?.name && (
          <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-emerald-50 border-b border-gray-200">
            <p className="font-semibold text-gray-900 text-sm">{data.name}</p>
            <p className="text-xs text-gray-600 capitalize">{data.role}</p>
          </div>
        )}

        <nav className="py-1">
          {menuItems.length > 0 && (
            <>
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                )
              })}
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}
          <button
            onClick={() => {
              handleLogout()
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-red-600 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </nav>
      </div>
    </>
  )
}
