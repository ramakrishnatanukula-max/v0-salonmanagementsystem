export interface InvoiceData {
  billId: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  appointmentDate: string
  appointmentTime: string
  familyMemberName?: string
  services: Array<{
    name: string
    staffName?: string
    baseAmount: number
    gstPercent: number
    gstAmount: number
    total: number
  }>
  baseTotal: number
  gstTotal: number
  subtotal: number
  discount: number
  finalAmount: number
  paymentMethod: string
  paymentStatus: string
  paidAmount?: number
}

// Generate PDF from server API
export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
  try {
    const response = await fetch('/api/generate-invoice-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Invoice_${data.billId}_${data.customerName.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw error
  }
}

// Function to share PDF via WhatsApp Web (opens in browser)
export async function shareInvoicePDFViaWhatsApp(data: InvoiceData, phoneNumber: string): Promise<void> {
  try {
    // Generate PDF from API
    const response = await fetch('/api/generate-invoice-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate PDF')
    }
    
    const blob = await response.blob()
    
    // Create WhatsApp message with invoice details
    const message = `*Hello ${data.customerName}!*\n\nThank you for visiting our salon! We hope you loved your experience.\n\n========================================\n*INVOICE DETAILS*\n========================================\n\nInvoice Number: *#${data.billId}*\nDate: ${data.appointmentDate}\nTime: ${data.appointmentTime}${data.familyMemberName ? `\nService For: ${data.familyMemberName}` : ''}\n\n========================================\n*SERVICES PROVIDED*\n========================================\n\n${data.services.map((s, i) => `${i + 1}. ${s.name}${s.staffName ? ` (by ${s.staffName})` : ''}\n   Rs.${s.total.toFixed(2)}`).join('\n\n')}\n\n========================================\n*PAYMENT SUMMARY*\n========================================\n\n${data.discount > 0 ? `Subtotal: Rs.${data.subtotal.toFixed(2)}\nDiscount: -Rs.${data.discount.toFixed(2)}\n` : ''}Payment Method: ${data.paymentMethod.toUpperCase()}\nPayment Status: ${data.paymentStatus.toUpperCase()}\n\n*TOTAL AMOUNT: Rs.${data.finalAmount.toFixed(2)}*\n\n`
    
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    
    // Download the PDF first
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Invoice_${data.billId}_${data.customerName.replace(/\s+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    // Open WhatsApp after a short delay
    setTimeout(() => {
      window.open(whatsappUrl, '_blank')
    }, 800)
  } catch (error) {
    console.error('Error sharing on WhatsApp:', error)
    throw error
  }
}

// Share invoice link via WhatsApp Web (opens in browser) - no PDF generated
export function shareInvoiceLinkViaWhatsApp(data: InvoiceData, phoneNumber: string, baseUrl?: string): void {
  try {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : (baseUrl || '')

    // Build URL-safe token from billing id (fall back to billId or appointment id)
    const id = data.billId
    const payload = { id }
    const raw = typeof window !== 'undefined' ? window.btoa(JSON.stringify(payload)) : Buffer.from(JSON.stringify(payload)).toString('base64')
    const token = raw.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const invoiceUrl = origin ? `${origin}/invoice/${token}` : `/invoice/${token}`

    const message = `Thank you for visiting UniSalon! Here is your invoice: ${invoiceUrl}\nYou can download it from the link.`

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`

    // Open WhatsApp Web with the message
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank')
    } else {
      // No-op on server
      console.log('WhatsApp share URL:', whatsappUrl)
    }
  } catch (error) {
    console.error('Error sharing invoice link on WhatsApp:', error)
    throw error
  }
}
