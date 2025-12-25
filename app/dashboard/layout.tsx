import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "../globals.css"
import BottomNav from "@/components/BottomNav"
import Sidebar from "@/components/Sidebar"
import MobileMenu from "@/components/MobileMenu"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyJWT } from "@/lib/auth"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Basic auth check - redirect to login if no valid token
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  
  if (!token) {
    redirect("/login")
  }
  
  const payload = verifyJWT(token)
  if (!payload) {
    redirect("/login")
  }

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <MobileMenu />
        <div className="flex min-h-screen bg-white md:bg-gray-50">
          <Sidebar />
          <main className="flex-1 w-full pb-20 md:pb-0 md:overflow-auto">
            {children}
          </main>
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
