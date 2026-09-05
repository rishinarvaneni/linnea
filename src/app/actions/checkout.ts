'use server'

import { getSession } from '@/lib/session'
import { getStoreContext } from '@/lib/store-context'
import { createOrderFromCart } from '@/lib/checkout/order'
import { createRazorpayPaymentLink } from '@/lib/razorpay/payment-links'
import { db as prisma } from '@/lib/db'

export type CheckoutResult = 
  | {
      success: true
      paymentUrl: string
      orderNumber: string
      amountPaise: number
    }
  | {
      success: false
      error: string
    }

export async function createCheckoutAction(): Promise<CheckoutResult> {
  try {
    const session = await getSession()
    if (!session || !session.userId) {
      return { success: false, error: 'Please sign in to continue.' }
    }

    const store = await getStoreContext()
    if (!store) {
      return { success: false, error: 'Store context not found.' }
    }
    const merchantId = store.merchantId

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return { success: false, error: 'User not found.' }
    }

    const merchantCustomer = await prisma.merchantCustomer.findFirst({
      where: { merchantId, email: user.email }
    })

    if (!merchantCustomer) {
      return { success: false, error: 'Your cart is empty.' }
    }

    const customerId = merchantCustomer.id

    // Verify active cart
    const cart = await prisma.cart.findFirst({
      where: {
        merchantCustomerId: customerId,
        merchantId,
        status: 'ACTIVE'
      },
      include: {
        items: {
          include: { product: true }
        }
      }
    })

    if (!cart || cart.items.length === 0) {
      return { success: false, error: 'Your cart is empty.' }
    }

    // Verify inventory
    for (const item of cart.items) {
      if (item.product.inventory < item.quantity) {
        return { success: false, error: `One of the items is no longer in stock: ${item.product.name}.` }
      }
    }

    // Create order authoritative backend
    let orderData
    try {
      orderData = await createOrderFromCart(customerId, merchantId, 'STOREFRONT')
    } catch (e: any) {
      return { success: false, error: e.message || 'Unable to create checkout. Please try again.' }
    }

    // Create Razorpay payment link
    let paymentUrl: string
    try {
      paymentUrl = await createRazorpayPaymentLink(merchantId, orderData.orderId)
    } catch (e: any) {
      if (e.message && e.message.includes('not configured')) {
        return { success: false, error: 'Razorpay Test Mode is not configured.' }
      }
      return { success: false, error: 'Unable to create payment link. Please try again.' }
    }

    return {
      success: true,
      paymentUrl,
      orderNumber: orderData.orderNumber,
      amountPaise: orderData.amountPaise
    }
  } catch (error) {
    console.error('[Checkout Action Error]', error)
    return { success: false, error: 'An unexpected error occurred during checkout.' }
  }
}
