import LoginForm from "@/components/auth/login-form"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyJWT } from "@/lib/auth"

export default async function Page() {
  // Check if already logged in
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  
  if (token) {
    const payload = verifyJWT(token)
    if (payload) {
      redirect("/dashboard/appointments")
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center pt-10">
      <LoginForm />
    </main>
  )
}
