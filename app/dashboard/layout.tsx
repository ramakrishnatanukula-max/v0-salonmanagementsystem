import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "../globals.css"
import BottomNav from "@/components/BottomNav"
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
        <div className="min-h-dvh" style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}
