import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import '../globals.css'
import BottomNav from '@/components/BottomNav'
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyJWT } from "@/lib/auth"

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Auth check (server component)
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  let isAuth = false;
  if (token) {
    try {
      verifyJWT(token);
      isAuth = true;
    } catch {
      isAuth = false;
    }
  }
  if (!isAuth) {
    redirect("/login");
  }

  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <BottomNav/>
      </body>
    </html>
  )
}
