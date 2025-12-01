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

    // Generate services HTML
    const servicesHtml = services
      .map(
        (s: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px; text-align: left;">${s.service_name}</td>
        <td style="padding: 10px; text-align: right;">₹${s.price.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right;">${s.gst}%</td>
        <td style="padding: 10px; text-align: right;">₹${s.totalTax.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold;">₹${s.lineTotal.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("")

    const discountHtml =
      discount > 0
        ? `
      <tr style="background-color: #f3e8ff; border-bottom: 1px solid #e879f9;">
        <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Discount:</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #a855f7;">-₹${discount.toFixed(2)}</td>
      </tr>
    `
        : ""

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Uni Salon | Invoice Receipt</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, -apple-system, sans-serif;
        background: #0f172a;
        color: #111827;
        line-height: 1.6;
      }
      .wrapper {
        width: 100%;
        background: linear-gradient(135deg, #0f172a 0%, #1a1a2e 100%);
        padding: 20px 10px;
        min-height: 100vh;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      }
      .header {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        padding: 24px 16px;
        text-align: center;
        color: white;
      }
      .logo-section {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        margin-bottom: 10px;
      }
      .logo-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        color: white;
      }
      .salon-name {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: 1px;
      }
      .salon-tagline {
        font-size: 12px;
        opacity: 0.95;
        margin-top: 4px;
      }
      .ribbon {
        background: rgba(0, 0, 0, 0.1);
        padding: 8px;
        font-size: 11px;
        letter-spacing: 1px;
        opacity: 0.9;
      }
      .content {
        padding: 24px 16px;
      }
      .greeting {
        font-size: 16px;
        color: #1f2937;
        margin-bottom: 8px;
      }
      .greeting strong {
        color: #059669;
      }
      .intro-text {
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 20px;
      }
      .section {
        margin-bottom: 24px;
      }
      .section-title {
        font-size: 14px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid #10b981;
        display: inline-block;
      }
      .details-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
      }
      .detail-label {
        color: #6b7280;
        font-weight: 600;
      }
      .detail-value {
        color: #1f2937;
        font-weight: 500;
      }
      .services-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 16px;
        font-size: 13px;
      }
      .services-table thead {
        background: #f3f4f6;
        border-bottom: 2px solid #d1d5db;
      }
      .services-table th {
        padding: 10px 6px;
        text-align: left;
        font-weight: 600;
        color: #374151;
        font-size: 12px;
      }
      .services-table th.numeric {
        text-align: right;
      }
      .services-table td {
        padding: 10px 6px;
        border-bottom: 1px solid #e5e7eb;
        color: #1f2937;
      }
      .services-table td.numeric {
        text-align: right;
        font-weight: 500;
      }
      .services-table tr:nth-child(even) {
        background: #fafafa;
      }
      .summary-section {
        background: #ecfdf5;
        border: 1px solid #d1fae5;
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
      }
      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 13px;
      }
      .summary-label {
        color: #059669;
        font-weight: 600;
      }
      .summary-value {
        color: #047857;
        font-weight: 600;
      }
      .final-amount-box {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        margin: 20px 0;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
      }
      .final-label {
        font-size: 12px;
        opacity: 0.95;
        letter-spacing: 1px;
      }
      .final-amount {
        font-size: 32px;
        font-weight: 700;
        margin-top: 8px;
      }
      .payment-badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 11px;
        margin-top: 8px;
        font-weight: 600;
      }
      .contact-section {
        background: #f9fafb;
        border-radius: 8px;
        padding: 16px;
        font-size: 12px;
        color: #6b7280;
        margin: 20px 0;
      }
      .contact-title {
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
      }
      .contact-item {
        margin-bottom: 4px;
      }
      .footer {
        background: #1f2937;
        color: #d1d5db;
        padding: 16px;
        text-align: center;
        font-size: 11px;
        border-top: 1px solid #374151;
      }
      .footer a {
        color: #10b981;
        text-decoration: none;
      }
      @media (max-width: 480px) {
        .wrapper {
          padding: 10px 5px;
        }
        .container {
          border-radius: 8px;
        }
        .content {
          padding: 16px 12px;
        }
        .header {
          padding: 16px 12px;
        }
        .salon-name {
          font-size: 20px;
        }
        .logo-circle {
          width: 40px;
          height: 40px;
          font-size: 18px;
        }
        .services-table {
          font-size: 12px;
        }
        .services-table th,
        .services-table td {
          padding: 8px 4px;
        }
        .final-amount {
          font-size: 24px;
        }
        .detail-row {
          font-size: 12px;
        }
        .summary-row {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-circle">💇</div>
          </div>
          <div class="salon-name">UNI SALON</div>
          <div class="salon-tagline">Hair · Skin · Bridal · Grooming</div>
          <div class="ribbon">HYDERABAD STUDIO • INVOICE RECEIPT</div>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Greeting -->
          <div class="greeting">
            Hi <strong>${customer_name}</strong>,
          </div>
          <div class="intro-text">
            Thank you for choosing Uni Salon! Your appointment has been completed and payment has been received. Here's your invoice summary.
          </div>

          <!-- Appointment Details -->
          <div class="section">
            <div class="section-title">📅 Appointment Details</div>
            <div class="details-box">
              <div class="detail-row">
                <span class="detail-label">Appointment Date</span>
                <span class="detail-value">${appointment_date}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Payment Method</span>
                <span class="detail-value" style="text-transform: capitalize;">${payment_method}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value" style="color: #10b981; font-weight: 700;">✓ Paid</span>
              </div>
            </div>
          </div>

          <!-- Services -->
          <div class="section">
            <div class="section-title">💅 Services & Charges</div>
            <table class="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th class="numeric">Price</th>
                  <th class="numeric">Tax</th>
                  <th class="numeric">Total</th>
                </tr>
              </thead>
              <tbody>
                ${servicesHtml}
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div class="summary-section">
            <div class="summary-row">
              <span class="summary-label">Subtotal</span>
              <span class="summary-value">₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Total (GST Included)</span>
              <span class="summary-value">₹${total.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
            <div class="summary-row" style="padding-top: 10px; border-top: 1px solid #a7f3d0;">
              <span class="summary-label">Discount</span>
              <span class="summary-value">-₹${discount.toFixed(2)}</span>
            </div>
            ` : ""}
          </div>

          <!-- Final Amount -->
          <div class="final-amount-box">
            <div class="final-label">FINAL AMOUNT PAID</div>
            <div class="final-amount">₹${final_amount.toFixed(2)}</div>
            <div class="payment-badge">✓ PAYMENT CONFIRMED</div>
          </div>

          <!-- Contact Info -->
          <div class="contact-section">
            <div class="contact-title">📍 Uni Salon - Hyderabad</div>
            <div class="contact-item">123 Somajiguda Main Road</div>
            <div class="contact-item">Somajiguda, Hyderabad, TG 500082</div>
            <div class="contact-item">📞 +91 40 1234 5678</div>
            <div class="contact-item">✉️ contact@unisalon.in</div>
            <div class="contact-item">🌐 <a href="https://unisalon.in">https://unisalon.in</a></div>
          </div>

          <!-- Note -->
          <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin: 16px 0; font-size: 12px; color: #92400e;">
            <strong>💡 Keep this invoice handy!</strong> You can use it for reference, gift cards, or future offers at Uni Salon.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          Glowing looks, minimal effort. <strong style="color: #10b981;">Uni Salon</strong><br />
          This is an automated invoice email. For queries, contact us through our website.
        </div>
      </div>
    </div>
  </body>
</html>
`


    // Send email
    console.log("[Email] Attempting to send invoice to:", to)
    const mailResult = await transporter.sendMail({
      from: process.env.EMAIL_USER || "tejachennu223@gmail.com",
      to,
      subject: `Invoice Receipt - ${customer_name}`,
      html: emailHtml,
    })
    
    console.log("[Email] Email sent successfully:", mailResult.messageId)
    return Response.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Email send error:", error)
    return Response.json(
      { error: "Failed to send email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
