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
