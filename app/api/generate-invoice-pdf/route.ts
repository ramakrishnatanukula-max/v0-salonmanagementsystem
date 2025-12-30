import { NextResponse } from "next/server"
import puppeteer from "puppeteer"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, sans-serif; 
      padding: 0;
      background: white;
    }
    .invoice-container { 
      width: 100%; 
      max-width: 800px; 
      margin: 0 auto;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 32px; margin-bottom: 5px; }
    .header .bill-id { font-size: 14px; opacity: 0.9; }
    .date-section { text-align: right; margin-top: -40px; }
    .date-label { font-size: 11px; opacity: 0.9; }
    .date-value { font-size: 14px; font-weight: bold; }
    
    .info-section {
      display: flex;
      justify-content: space-between;
      margin: 30px;
      gap: 40px;
    }
    .info-col { flex: 1; }
    .info-label { 
      font-size: 11px; 
      font-weight: bold; 
      color: #6b7280; 
      margin-bottom: 5px;
      text-transform: uppercase;
    }
    .info-value { 
      font-size: 14px; 
      margin-bottom: 8px;
      color: #1f2937;
    }
    .info-name { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
    .family-member {
      color: #3b82f6;
      font-weight: 600;
      margin-top: 10px;
    }
    
    .services-table {
      width: calc(100% - 60px);
      margin: 20px 30px;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
    }
    .services-table th {
      background: #f3f4f6;
      color: #1f2937;
      padding: 12px;
      text-align: left;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid #d1d5db;
    }
    .services-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    .services-table td:nth-child(2),
    .services-table td:nth-child(3),
    .services-table td:nth-child(4),
    .services-table th:nth-child(2),
    .services-table th:nth-child(3),
    .services-table th:nth-child(4) {
      text-align: right;
    }
    .service-name { font-weight: 600; color: #1f2937; }
    .service-staff { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .service-gst { font-size: 11px; color: #f59e0b; margin-top: 3px; }
    
    .gst-breakdown {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 30px;
    }
    .gst-breakdown-title {
      font-size: 11px;
      font-weight: bold;
      color: #f59e0b;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .gst-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #1f2937;
    }
    .gst-row.total {
      border-top: 2px solid #fbbf24;
      padding-top: 8px;
      margin-top: 8px;
      font-weight: bold;
    }
    
    .summary-section {
      margin: 20px 30px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
    }
    .summary-row.subtotal {
      font-weight: bold;
      border-top: 1px solid #d1d5db;
      padding-top: 12px;
      margin-top: 8px;
    }
    .summary-row.discount {
      color: #059669;
    }
    
    .final-amount {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 20px 30px;
    }
    .final-amount-label { font-size: 16px; font-weight: bold; }
    .final-amount-value { font-size: 24px; font-weight: bold; }
    
    .payment-info {
      background: #f3f4f6;
      padding: 20px;
      margin: 20px 30px;
      border-radius: 8px;
    }
    .payment-title {
      font-size: 11px;
      font-weight: bold;
      color: #4b5563;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .payment-row {
      display: flex;
      gap: 20px;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .payment-label { color: #6b7280; min-width: 120px; }
    .payment-value { color: #1f2937; font-weight: 600; }
    .payment-value.paid { color: #059669; font-weight: bold; }
    
    .footer {
      background: #f9fafb;
      text-align: center;
      padding: 20px;
      margin-top: 30px;
      border-top: 1px solid #e5e7eb;
    }
    .footer-title {
      font-size: 14px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .footer-date {
      font-size: 11px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>INVOICE</h1>
      <div class="bill-id">Bill #${data.billId}</div>
      <div class="date-section">
        <div class="date-label">Date</div>
        <div class="date-value">${data.appointmentDate}</div>
      </div>
    </div>
    
    <div class="info-section">
      <div class="info-col">
        <div class="info-label">Bill To:</div>
        <div class="info-name">${data.customerName}</div>
        <div class="info-value">${data.customerPhone}</div>
        ${data.customerEmail ? `<div class="info-value">${data.customerEmail}</div>` : ''}
        ${data.familyMemberName ? `<div class="family-member">Service for: ${data.familyMemberName}</div>` : ''}
      </div>
      <div class="info-col">
        <div class="info-label">Appointment:</div>
        <div class="info-value">#${data.billId}</div>
        <div class="info-value">${data.appointmentTime}</div>
      </div>
    </div>
    
    <table class="services-table">
      <thead>
        <tr>
          <th>SERVICE</th>
          <th>BASE</th>
          <th>GST</th>
          <th>TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${data.services.map((service: any) => `
          <tr>
            <td>
              <div class="service-name">${service.name}</div>
              ${service.staffName ? `<div class="service-staff">Staff: ${service.staffName}</div>` : ''}
              ${service.gstPercent > 0 ? `<div class="service-gst">GST: ${service.gstPercent}%</div>` : ''}
            </td>
            <td>₹${service.baseAmount.toFixed(2)}</td>
            <td>${service.gstPercent > 0 ? `₹${service.gstAmount.toFixed(2)}` : '-'}</td>
            <td>₹${service.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    ${data.gstTotal > 0 ? `
    <div class="gst-breakdown">
      <div class="gst-breakdown-title">🧾 GST Breakdown</div>
      ${(() => {
        const gstBreakdown: { [key: string]: number } = {}
        data.services.forEach((service: any) => {
          if (service.gstPercent > 0) {
            const key = `${service.gstPercent}%`
            gstBreakdown[key] = (gstBreakdown[key] || 0) + service.gstAmount
          }
        })
        return Object.entries(gstBreakdown).map(([rate, amount]) => `
          <div class="gst-row">
            <span>GST @ ${rate}:</span>
            <span>₹${amount.toFixed(2)}</span>
          </div>
        `).join('')
      })()}
      <div class="gst-row total">
        <span>Total GST:</span>
        <span>₹${data.gstTotal.toFixed(2)}</span>
      </div>
    </div>
    ` : ''}
    
    <div class="summary-section">
      <div class="summary-row">
        <span>Base Amount (excl. GST):</span>
        <span>₹${data.baseTotal.toFixed(2)}</span>
      </div>
      ${data.gstTotal > 0 ? `
      <div class="summary-row">
        <span>Total GST:</span>
        <span>₹${data.gstTotal.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="summary-row subtotal">
        <span>Subtotal (incl. GST):</span>
        <span>₹${data.subtotal.toFixed(2)}</span>
      </div>
      ${data.discount > 0 ? `
      <div class="summary-row discount">
        <span>Discount:</span>
        <span>-₹${data.discount.toFixed(2)}</span>
      </div>
      ` : ''}
    </div>
    
    <div class="final-amount">
      <div class="final-amount-label">Final Amount:</div>
      <div class="final-amount-value">₹${data.finalAmount.toFixed(2)}</div>
    </div>
    
    <div class="payment-info">
      <div class="payment-title">Payment Information</div>
      ${data.paidAmount ? `
      <div class="payment-row">
        <span class="payment-label">Paid Amount:</span>
        <span class="payment-value">₹${data.paidAmount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="payment-row">
        <span class="payment-label">Payment Method:</span>
        <span class="payment-value">${data.paymentMethod.toUpperCase()}</span>
      </div>
      <div class="payment-row">
        <span class="payment-label">Payment Status:</span>
        <span class="payment-value paid">${data.paymentStatus.toUpperCase()}</span>
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-title">Thank you for your business!</div>
      <div class="footer-date">Last updated: ${data.appointmentDate}</div>
    </div>
  </div>
</body>
</html>
    `
    
    // Launch Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    })
    
    await browser.close()
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Invoice_${data.billId}_${data.customerName.replace(/\s+/g, '_')}.pdf`
      }
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate PDF' }, { status: 500 })
  }
}
