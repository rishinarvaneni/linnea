'use server'

import { getMerchantContext } from '@/lib/merchant-context'
import { db as prisma } from '@/lib/db'
import { createOrderFromCart } from '@/lib/checkout/order'
import { createRazorpayPaymentLink } from '@/lib/razorpay/payment-links'
import { revalidatePath } from 'next/cache'

export async function recoverOpportunity(opportunityId: string, type: 'FAILED_PAYMENT' | 'ABANDONED_CART') {
  try {
    const { merchantId } = await getMerchantContext()
    if (!merchantId) throw new Error("Unauthorized")

    let orderIdToRecover: string | null = null
    let customerId: string | null = null
    let amountPaise = 0
    let cartIdRef: string | null = null
    let paymentIdRef: string | null = null

    // 1. Resolve Opportunity
    if (type === 'FAILED_PAYMENT') {
      const paymentId = opportunityId.replace('fp_', '')
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true }
      })

      if (!payment || payment.merchantId !== merchantId) {
        throw new Error("Invalid or unauthorized payment opportunity.")
      }
      
      if (!payment.orderId || !payment.order) {
        throw new Error("Cannot recover payment: No associated order found.")
      }

      if (payment.order.status === 'PAID') {
        throw new Error("Order is already paid.")
      }

      orderIdToRecover = payment.orderId
      customerId = payment.merchantCustomerId
      amountPaise = payment.order.totalPaise
      paymentIdRef = payment.id

    } else if (type === 'ABANDONED_CART') {
      const cartId = opportunityId.replace('ac_', '')
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        include: { items: { include: { product: true } } }
      })

      if (!cart || cart.merchantId !== merchantId) {
        throw new Error("Invalid or unauthorized cart opportunity.")
      }

      customerId = cart.merchantCustomerId
      cartIdRef = cart.id

      // Calculate amount authoritative from database
      amountPaise = cart.items.reduce((sum, item) => sum + (item.product.pricePaise * item.quantity), 0)

      // Idempotency: Check if we already created an order for this abandoned cart recovery
      const existingAttempt = await prisma.recoveryAttempt.findFirst({
        where: { 
          cartId: cart.id, 
          merchantId,
          order: { status: 'PENDING' }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (existingAttempt && existingAttempt.orderId) {
        orderIdToRecover = existingAttempt.orderId
      } else {
        // Create new order from cart
        const orderData = await createOrderFromCart(customerId, merchantId, 'STOREFRONT')
        orderIdToRecover = orderData.orderId
      }
    } else {
      throw new Error("Unknown opportunity type")
    }

    if (!orderIdToRecover) {
      throw new Error("Failed to resolve or create order for recovery.")
    }

    // 2. Generate Payment Link
    let paymentUrl: string | null = null
    try {
      paymentUrl = await createRazorpayPaymentLink(merchantId, orderIdToRecover)
    } catch (e: any) {
      throw new Error(`Payment Link Generation Failed: ${e.message}`)
    }

    // 3. Record Recovery Attempt
    // Check if an attempt already exists for this exact setup to prevent spam
    const existingRecoveryLink = await prisma.recoveryAttempt.findFirst({
      where: {
        merchantId,
        orderId: orderIdToRecover,
        status: 'LINK_CREATED'
      }
    })

    if (!existingRecoveryLink) {
      await prisma.recoveryAttempt.create({
        data: {
          merchantId,
          merchantCustomerId: customerId,
          cartId: cartIdRef,
          paymentId: paymentIdRef,
          orderId: orderIdToRecover,
          reason: type,
          strategy: 'PAYMENT_LINK',
          status: 'LINK_CREATED',
          amountPaise
        }
      })
    }

    revalidatePath('/dashboard/agents/recovery')
    return { success: true, paymentUrl }

  } catch (error: any) {
    console.error('Recovery error:', error)
    return { success: false, error: error.message || 'Recovery failed due to an unknown error.' }
  }
}
