import { NextRequest, NextResponse } from 'next/server'
const crypto = require('crypto')

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get('token')
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 })

    const secret = process.env.INVOICE_TOKEN_SECRET || process.env.INVOICE_SIGNING_SECRET
    if (!secret) return new Response(JSON.stringify({ error: 'Token verification not configured' }), { status: 500 })

    // token format: payload.signature (both base64url)
    const parts = token.split('.')
    if (parts.length !== 2) return new Response(JSON.stringify({ error: 'Invalid token format' }), { status: 400 })

    const [payloadB64url, sigB64url] = parts

    // verify signature
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64url).digest('base64')
    const expectedSigUrl = expectedSig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    // Timing-safe compare
    const bufA = Buffer.from(sigB64url)
    const bufB = Buffer.from(expectedSigUrl)
    if (bufA.length !== bufB.length || crypto.timingSafeEqual(bufA, bufB) === false) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
    }

    // decode payload
    const padded = payloadB64url.replace(/-/g, '+').replace(/_/g, '/') + Array((4 - (payloadB64url.length % 4)) % 4 + 1).join('=')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    let obj = null
    try {
      obj = JSON.parse(decoded)
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid token payload' }), { status: 400 })
    }

    if (!obj || (!('id' in obj) && !('billId' in obj))) {
      return new Response(JSON.stringify({ error: 'Token missing id' }), { status: 400 })
    }

    const id = Number(obj.id ?? obj.billId)
    if (isNaN(id)) return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 })

    return new Response(JSON.stringify({ id }), { status: 200 })
  } catch (err: any) {
    console.error('[ResolveToken] error', err)
    return new Response(JSON.stringify({ error: 'Internal error', details: err?.message || String(err) }), { status: 500 })
  }
}
