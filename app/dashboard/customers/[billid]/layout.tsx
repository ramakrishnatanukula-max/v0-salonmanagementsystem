import React from 'react'

export const dynamic = 'force-dynamic'

export default function BillRouteLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout for public invoice view under /dashboard/customers/[billid]
  // Intentionally does NOT include the dashboard sidebar or auth wrappers.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-screen-md mx-auto">
        {children}
      </div>
    </div>
  )
}
