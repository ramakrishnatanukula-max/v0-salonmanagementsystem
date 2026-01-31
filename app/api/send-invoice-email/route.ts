const crypto = require('crypto')

let nodemailer: any = null
let transporter: any = null

try {
  nodemailer = require("nodemailer")
  // Configure your email service (Gmail, SendGrid, etc.)
  // For Gmail: use app-specific password
  // For production: use environment variables
  const emailUser = process.env.EMAIL_USER || "tejachennu223@gmail.com"
  const emailPass = process.env.EMAIL_PASSWORD || "wrjv odtm cdvl cnbe"
  
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })
  
  console.log("[Email] Nodemailer configured with user:", emailUser)
} catch (err) {
  console.warn("[Email] Nodemailer not available:", err)
}

export async function POST(request: Request) {
  try {
    if (!transporter) {
      return Response.json(
        { error: "Email service not configured" },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      to,
      customer_name,
      appointment_date,
      services,
      subtotal,
      total,
      discount,
      final_amount,
      payment_method,
    } = body

    if (!to || !customer_name) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate services HTML (guard against missing data)
    let servicesHtml = ""
    try {
      if (Array.isArray(services) && services.length > 0) {
        servicesHtml = services
          .map((s: any) => {
            const name = s.service_name || s.name || "Service"
            const price = Number(s.price ?? s.baseAmount ?? s.lineTotal ?? 0)
            const gst = Number(s.gst ?? s.gstPercent ?? s.gst_percentage ?? 0)
            const totalTax = Number(s.totalTax ?? s.gstAmount ?? 0)
            const lineTotal = Number(s.lineTotal ?? s.total ?? price)
            return `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; text-align: left;">${name}</td>
        <td style="padding: 10px; text-align: right;">₹${price.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right;">${gst}%</td>
        <td style="padding: 10px; text-align: right;">₹${totalTax.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">₹${lineTotal.toFixed(2)}</td>
      </tr>
    `
          })
          .join("")
      }
    } catch (e) {
      console.warn("[Email] Error building servicesHtml:", e)
      servicesHtml = ""
    }

    const discountNum = Number(discount ?? 0)
    const discountHtml =
      discountNum > 0
        ? `
      <tr style="background-color: #f3e8ff; border-bottom: 1px solid #e879f9;">
        <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Discount:</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #a855f7;">-₹${discountNum.toFixed(2)}</td>
      </tr>
    `
        : ""

    // Prefer an invoice link in email instead of embedding full HTML
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, "")
    const billId = (body as any).billId || (body as any).bill_id || (body as any).billing_id || (body as any).billing?.id

    let invoiceUrl = ''
    if (billId) {
      try {
        // Build URL-safe base64 token payload (legacy encoded URL like eyJpZCI6MTR9)
        const payload = JSON.stringify({ id: Number(billId) })
        const raw = Buffer.from(payload).toString('base64')
        const token = raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
        invoiceUrl = `${baseUrl}/invoice/${encodeURIComponent(token)}`
      } catch (err) {
        console.warn('[Email] Failed to create encoded invoice token, falling back to plain id', err)
        invoiceUrl = `${baseUrl}/invoice/${encodeURIComponent(String(billId))}`
      }
    }

    const plainText = billId
      ? `Hi ${customer_name},\n\nYour invoice is ready. View or download it here: ${invoiceUrl}\n\nThank you, UNISALON`
      : `Hi ${customer_name},\n\nYour invoice is ready. Please visit the dashboard to view or download your invoice.\n\nThank you, UNISALON`

    const htmlBody = billId
      ? `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2 style="color:#0b0b0b;">UNISALON - Invoice</h2>
        <p>Hi <strong>${customer_name}</strong>,</p>
        <p>Your invoice is ready. Click the button below to view or download the invoice.</p>
        <p><a href="${invoiceUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:white;border-radius:6px;text-decoration:none;font-weight:700;">View Invoice</a></p>
        <p style="color:#6b7280;font-size:13px;margin-top:10px;">If the button doesn't work, use this link: <a href="${invoiceUrl}">${invoiceUrl}</a></p>
        <p style="margin-top:18px;color:#6b7280;">Thanks,<br/>UNISALON</p>
      </div>
    `
      : `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2 style="color:#0b0b0b;">UNISALON - Invoice</h2>
        <p>Hi <strong>${customer_name}</strong>,</p>
        <p>Your invoice is ready. Please sign in to the dashboard or contact us to get the invoice link.</p>
        <p style="margin-top:18px;color:#6b7280;">Thanks,<br/>UNISALON</p>
      </div>
    `

    // Send email with plain-text + simple HTML that contains a link to the public invoice page
    console.log("[Email] Attempting to send invoice to:", to, "invoiceUrl:", invoiceUrl)
    const mailResult = await transporter.sendMail({
      from: process.env.EMAIL_USER || "tejachennu223@gmail.com",
      to,
      subject: `Invoice Receipt - ${customer_name}`,
      text: plainText,
      html: htmlBody,
    })

    console.log("[Email] Email sent successfully:", mailResult && mailResult.messageId)
    return Response.json({ success: true, message: "Email sent successfully", invoiceUrl })
  } catch (error) {
    console.error("Email send error:", error)
    return Response.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
