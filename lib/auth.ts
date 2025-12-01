import crypto from "crypto"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me"

type JWTPayload = {
  sub: string // mobile
  role: "admin" | "receptionist" | "staff"
  name?: string | null
  exp: number // epoch seconds
}

function base64url(input: Buffer | string) {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

export function signJWT(payload: Omit<JWTPayload, "exp">, ttlSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" }
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const body: JWTPayload = { ...payload, exp }

  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(body))
  const toSign = `${headerB64}.${payloadB64}`
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(toSign).digest()
  const sigB64 = base64url(signature)
  return `${toSign}.${sigB64}`
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const [h, p, s] = token.split(".")
    if (!h || !p || !s) return null
    const toSign = `${h}.${p}`
    const expected = base64url(crypto.createHmac("sha256", JWT_SECRET).update(toSign).digest())
    if (expected !== s) return null
    const payload = JSON.parse(Buffer.from(p, "base64").toString()) as JWTPayload
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies()
  // HttpOnly, Secure in prod
  jar.set("session", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getCurrentUser() {
  const jar = await cookies()
  const token = jar.get("session")?.value
  if (!token) return null
  return verifyJWT(token)
}
