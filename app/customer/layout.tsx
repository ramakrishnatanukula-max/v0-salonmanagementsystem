import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'My Portal',
    description: 'Access your profile, family members, and appointment history.',
}

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans antialiased selection:bg-indigo-100 selection:text-indigo-700">
            {children}
        </div>
    )
}
