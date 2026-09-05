import { db as prisma } from '@/lib/db'

export const RECOVERY_WINDOW_HOURS = 48

export type Opportunity = {
  id: string // prefix with fp_ or ac_ for uniqueness in UI if needed, but we can just use the underlying id
  type: 'FAILED_PAYMENT' | 'ABANDONED_CART'
  customerId: string
  customerName: string
  paymentId?: string
  cartId?: string
  orderId?: string
  amountPaise: number
  priorityScore: number
  priorityLevel: 'High' | 'Medium' | 'Low'
  priorityReason: string
}

function calculatePriority(amountPaise: number, isRepeatCustomer: boolean, hasSuccessfulPayments: boolean) {
  let score = 0
  let reason = []

  if (amountPaise >= 500000) {
    score += 50
    reason.push('High cart value (₹5,000+)')
  } else if (amountPaise >= 200000) {
    score += 30
    reason.push('Medium cart value (₹2,000+)')
  } else {
    score += 10
  }

  if (isRepeatCustomer) {
    score += 30
    reason.push('Repeat customer')
  }

  if (hasSuccessfulPayments) {
    score += 20
    reason.push('History of successful payments')
  }

  const priorityLevel = score >= 80 ? 'High' : score >= 50 ? 'Medium' : 'Low'

  return {
    priorityScore: score,
    priorityLevel,
    priorityReason: reason.length > 0 ? reason.join(', ') : 'Standard priority'
  }
}

export async function getRecoverableOpportunities(merchantId: string): Promise<Opportunity[]> {
  const windowDate = new Date(Date.now() - RECOVERY_WINDOW_HOURS * 60 * 60 * 1000)

  // Get active or successful recovery attempts to exclude them
  const excludedRecoveries = await prisma.recoveryAttempt.findMany({
    where: {
      merchantId,
      status: {
        in: ['PENDING', 'LINK_CREATED', 'MESSAGE_SENT', 'CUSTOMER_CLICKED', 'PAYMENT_SUCCESS']
      }
    },
    select: { paymentId: true, cartId: true }
  })

  const excludedPaymentIds = new Set(excludedRecoveries.map(r => r.paymentId).filter(Boolean))
  const excludedCartIds = new Set(excludedRecoveries.map(r => r.cartId).filter(Boolean))

  const opportunities: Opportunity[] = []

  // 1. FAILED PAYMENTS
  const failedPayments = await prisma.payment.findMany({
    where: {
      merchantId,
      status: 'FAILED',
      createdAt: { gte: windowDate },
      order: {
        status: { not: 'PAID' }
      }
    },
    include: {
      customer: {
        include: {
          orders: true,
          payments: { where: { status: 'SUCCESS' } }
        }
      }
    }
  })

  for (const fp of failedPayments) {
    if (excludedPaymentIds.has(fp.id)) continue

    // Check if the order has any SUCCESS payment
    const successfulPayment = await prisma.payment.findFirst({
      where: { orderId: fp.orderId, status: 'SUCCESS' }
    })
    
    if (successfulPayment) continue

    const isRepeat = fp.customer.orders.length > 1
    const hasSuccessful = fp.customer.payments.length > 0
    const priority = calculatePriority(fp.amountPaise, isRepeat, hasSuccessful)

    opportunities.push({
      id: `fp_${fp.id}`,
      type: 'FAILED_PAYMENT',
      customerId: fp.merchantCustomerId,
      customerName: fp.customer.name,
      paymentId: fp.id,
      orderId: fp.orderId || undefined,
      amountPaise: fp.amountPaise,
      priorityScore: priority.priorityScore,
      priorityLevel: priority.priorityLevel as 'High' | 'Medium' | 'Low',
      priorityReason: priority.priorityReason
    })
  }

  // 2. ABANDONED CARTS
  const abandonedCarts = await prisma.cart.findMany({
    where: {
      merchantId,
      status: 'ABANDONED',
      createdAt: { gte: windowDate }
    },
    include: {
      items: { include: { product: true } },
      customer: {
        include: {
          orders: true,
          payments: { where: { status: 'SUCCESS' } }
        }
      }
    }
  })

  for (const ac of abandonedCarts) {
    if (excludedCartIds.has(ac.id)) continue
    if (ac.items.length === 0) continue

    const amountPaise = ac.items.reduce((sum, item) => sum + (item.product.pricePaise * item.quantity), 0)
    
    const isRepeat = ac.customer.orders.length > 0 // if they ordered before, they are repeat buyer
    const hasSuccessful = ac.customer.payments.length > 0
    const priority = calculatePriority(amountPaise, isRepeat, hasSuccessful)

    opportunities.push({
      id: `ac_${ac.id}`,
      type: 'ABANDONED_CART',
      customerId: ac.merchantCustomerId,
      customerName: ac.customer.name,
      cartId: ac.id,
      amountPaise,
      priorityScore: priority.priorityScore,
      priorityLevel: priority.priorityLevel as 'High' | 'Medium' | 'Low',
      priorityReason: priority.priorityReason
    })
  }

  // Sort by priorityScore descending
  opportunities.sort((a, b) => b.priorityScore - a.priorityScore)

  return opportunities
}
