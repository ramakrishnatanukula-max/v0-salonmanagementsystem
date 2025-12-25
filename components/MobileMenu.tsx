"use client"

import { useState } from "react"
import { Menu, X, ShoppingBag, Layers, UserPlus, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const menuItems = [
    { icon: ShoppingBag, label: "Services", href: "/dashboard/services" },
    { icon: Layers, label: "Categories", href: "/dashboard/services/categories" },
    { icon: UserPlus, label: "Create Staff", href: "/dashboard/signup" },
  ]

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
        className={`md:hidden fixed top-14 left-0 right-0 mx-3 z-[70] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <nav className="py-1">
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
