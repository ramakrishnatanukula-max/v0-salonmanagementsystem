"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { Home, ClipboardList, Layers, CreditCard, BarChart3 } from "lucide-react"

const fetcher = (u: string) => fetch(u).then((r) => r.json())

export default function BottomNav() {
  const pathname = usePathname()
  const { data } = useSWR("/api/auth/me", fetcher, { revalidateOnFocus: false })
  const role = data?.user?.role as "admin" | "receptionist" | "staff" | undefined

  // Base items
  const baseItems = [
    { label: "Appointments", href: "/dashboard/appointments", icon: Home },
    { label: "Services", href: "/dashboard/services", icon: ClipboardList },
    { label: "Categories", href: "/dashboard/services/categories", icon: Layers },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  ]

  // If staff, only show Appointments
  const navItems = role === "staff" ? baseItems.slice(0, 1) : baseItems

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-md bg-white/85 border border-indigo-200 shadow-2xl rounded-full px-2 py-1.5 flex items-center justify-between backdrop-blur-[10px] drop-shadow-lg"
      style={{
        boxShadow: "0 2px 16px 4px rgba(76,70,144,0.14)",
        transition: "all .22s cubic-bezier(.75,0,.15,1)",
        WebkitBackdropFilter: "blur(10px)",
        paddingBottom: "calc(0.375rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {navItems.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`group flex flex-col items-center justify-center min-w-[44px] px-3 py-1 transition-all rounded-full relative ${
              isActive
                ? "bg-gradient-to-tr from-indigo-500 to-green-500 text-white shadow-md scale-105"
                : "text-indigo-500 hover:text-indigo-700 active:scale-95"
            }`}
            style={{ fontWeight: isActive ? 700 : 500 }}
          >
            <span className="relative flex items-center justify-center">
              <Icon
                size={isActive ? 22 : 18}
                className={`transition-all duration-150 ${
                  isActive ? "text-white drop-shadow" : "text-indigo-500 group-hover:text-indigo-700"
                }`}
              />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/90 border border-indigo-200 shadow" />
              )}
            </span>
            <span
              className={`text-[10px] mt-0.5 tracking-wide transition-all ${
                isActive ? "text-white font-bold" : "text-indigo-600 font-medium group-hover:text-indigo-700"
              }`}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
