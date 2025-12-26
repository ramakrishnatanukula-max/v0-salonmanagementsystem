"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { Home, ClipboardList, Layers, CreditCard, BarChart3, Users, LogOut } from "lucide-react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function Sidebar() {
  const pathname = usePathname()
  const { data } = useSWR("/api/auth/me", fetcher, { revalidateOnFocus: false })
  const role = data?.role as "admin" | "receptionist" | "staff" | undefined

  // All menu items
  const allItems = [
    { label: "Appointments", href: "/dashboard/appointments", icon: Home, roles: ["admin", "receptionist", "staff"] },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard, roles: ["admin", "receptionist"] },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin"] },
    { label: "Customers", href: "/dashboard/customers", icon: Users, roles: ["admin", "receptionist"] },
    { label: "Services", href: "/dashboard/services", icon: ClipboardList, roles: ["admin"] },
    { label: "Categories", href: "/dashboard/services/categories", icon: Layers, roles: ["admin"] },
    { label: "Staff", href: "/dashboard/staff", icon: Users, roles: ["admin"] },
    { label: "User Management", href: "/dashboard/signup", icon: Users, roles: ["admin"] },
  ]

  // Filter items based on role
  const navItems = role ? allItems.filter((item) => item.roles.includes(role)) : []

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-gradient-to-b from-indigo-50 to-green-50 border-r border-indigo-200 h-screen sticky top-0">
      <div className="p-6 border-b border-indigo-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-green-600 bg-clip-text text-transparent">
          Salon Manager
        </h1>
        {data?.name && (
          <p className="text-sm text-gray-600 mt-1">Welcome, {data.name}</p>
        )}
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 to-green-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-white/50"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-indigo-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}
