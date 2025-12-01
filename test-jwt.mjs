import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";

function base64url(input) {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJWT(payload, ttlSeconds = 60 * 60 * 24 * 7) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const body = { ...payload, exp };

  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(body));
  const toSign = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(toSign)
    .digest();
  const sigB64 = base64url(signature);
  return `${toSign}.${sigB64}`;
}

function verifyJWT(token) {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const toSign = `${h}.${p}`;
    const expected = base64url(
      crypto.createHmac("sha256", JWT_SECRET).update(toSign).digest()
    );
    if (expected !== s) return null;
    const payload = JSON.parse(Buffer.from(p, "base64").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Test JWT
console.log("Testing JWT creation and verification...");
const testToken = signJWT({
  sub: "6303012453",
  role: "admin",
  name: "Test User",
});
console.log("Token created:", testToken.substring(0, 50) + "...");

const verified = verifyJWT(testToken);
console.log("Token verified:", verified);

if (verified && verified.role === "admin" && verified.sub === "6303012453") {
  console.log("✓ JWT is working correctly!");
} else {
  console.log("✗ JWT verification failed!");
}
