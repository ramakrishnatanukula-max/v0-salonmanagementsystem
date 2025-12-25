"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { Home, ClipboardList, Layers, CreditCard, BarChart3, Users } from "lucide-react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function BottomNav() {
  const pathname = usePathname()
  const { data } = useSWR("/api/auth/me", fetcher, { revalidateOnFocus: false })
  const role = data?.role as "admin" | "receptionist" | "staff" | undefined

  // Base items - only core navigation items
  const allItems = [
    { label: "Appointments", href: "/dashboard/appointments", icon: Home, roles: ["admin", "receptionist", "staff"] },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard, roles: ["admin", "receptionist"] },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3, roles: ["admin"] },
  ]

  // Filter items based on role
  const navItems = role ? allItems.filter((item) => item.roles.includes(role)) : []

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 w-full bg-white/90 border-t border-indigo-200 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:hidden"
      style={{
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        className="mx-auto max-w-screen-sm px-2 py-1"
        style={{ paddingBottom: "calc(0.25rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex items-center justify-between">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex-1 flex flex-col items-center justify-center py-1 rounded-md transition-all ${
                  isActive ? "scale-[1.02]" : ""
                }`}
                style={{ fontWeight: isActive ? 700 : 500 }}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                    isActive
                      ? "bg-gradient-to-tr from-indigo-500 to-green-500 shadow-md"
                      : "bg-white border border-indigo-200"
                  }`}
                >
                  <Icon
                    size={isActive ? 18 : 16}
                    className={`transition-all duration-150 ${isActive ? "text-white" : "text-gray-700"}`}
                  />
                </span>
                <span
                  className={`text-[8px] mt-0.5 tracking-wide transition-all line-clamp-1 ${
                    isActive ? "text-gray-900 font-semibold" : "text-gray-700"
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
