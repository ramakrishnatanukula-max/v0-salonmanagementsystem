import { getCurrentUser } from "@/lib/auth"

export default async function Page() {
  const user = await getCurrentUser()
  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {!user && <p className="text-sm">You are not signed in.</p>}
      {user && (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Mobile:</span> {user.sub}
          </p>
          <p>
            <span className="font-medium">Role:</span> {user.role}
          </p>
          <p>
            <span className="font-medium">Welcome</span> {user.name || ""}
          </p>
          <p className="text-(--color-muted-foreground)">Step 2 (Services CRUD) will appear here.</p>
        </div>
      )}
    </main>
  )
}
