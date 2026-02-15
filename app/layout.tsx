import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Unisalon - Premium Salon Management',
    template: '%s | Unisalon'
  },
  description: 'Manage appointments, billing, staff, and customers efficiently.',
  icons: {
    icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxKCpWlrl5Q6h27fXSHKJzR4JbuhWHONz4Ow&s',
    apple: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxKCpWlrl5Q6h27fXSHKJzR4JbuhWHONz4Ow&s'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
      </body>
    </html>
  )
}
