import SignupForm from "@/components/auth/signup-form"
import { query } from "@/lib/db"

type Service = { id: number; name: string; category_id: number; price: number | string; duration_min: number | null }
type Category = { id: number; name: string }

export default async function Page() {
  // Load categories and services server-side to avoid client fetching in useEffect
  const categories = await query<Category>("SELECT id, name FROM service_categories ORDER BY name")
  const services = await query<Service>("SELECT id, name, category_id, price, duration_min FROM services ORDER BY name")
  const grouped = categories.map((c) => ({
    id: c.id,
    name: c.name,
    services: services.filter((s) => s.category_id === c.id),
  }))

  return (
    <main className="min-h-dvh flex items-start justify-center pt-10">
      <SignupForm categories={grouped} />
    </main>
  )
}
