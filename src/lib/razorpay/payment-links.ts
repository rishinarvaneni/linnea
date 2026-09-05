import { getRazorpayClient } from './client'
import { db as prisma } from '@/lib/db'

export async function createRazorpayPaymentLink(merchantId: string, orderId: string) {
  const rzp = getRazorpayClient()
  if (!rzp) {
    throw new Error('Razorpay is not configured. Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.')
  }

  // 1. Fetch Authoritative Order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true }
  })

  if (!order) {
    throw new Error('Order not found.')
  }
  
  // 2. Verify Merchant Ownership
  if (order.merchantId !== merchantId) {
    throw new Error('Unauthorized: Order does not belong to this merchant.')
  }

  // 3. Verify Order Eligibility
  if (order.status !== 'PENDING') {
    throw new Error(`Order cannot be paid. Current status: ${order.status}`)
  }

  // Check if a payment link already exists for this order that is not expired/cancelled
  const existingLinks = await prisma.paymentLink.findMany({
    where: { orderId: order.id, status: 'CREATED' }
  })
  
  if (existingLinks.length > 0) {
    return existingLinks[0].url
  }

  // 4. Create Razorpay Payment Link
  const amountPaise = order.totalPaise // Using authoritative integer paise amount from database

  const paymentLinkRequest = {
    amount: amountPaise,
    currency: 'INR',
    accept_partial: false,
    description: `Payment for Order ${order.id}`,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      contact: order.customer.phone || undefined
    },
    notify: {
      sms: false,
      email: false
    },
    reminder_enable: false,
    reference_id: order.id,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop`,
    callback_method: 'get'
  }

  const razorpayLink = await rzp.paymentLink.create(paymentLinkRequest)

  // 5. Store in Database
  const paymentLink = await prisma.paymentLink.create({
    data: {
      merchantId,
      orderId: order.id,
      razorpayPaymentLinkId: razorpayLink.id,
      url: razorpayLink.short_url,
      status: 'CREATED'
    }
  })

  return paymentLink.url
}
