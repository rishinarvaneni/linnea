import { db as prisma } from './db'

export function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(paise / 100)
}

export async function getMerchantMetrics(merchantId: string) {
  // Total revenue
  const revenueResult = await prisma.order.aggregate({
    _sum: { totalPaise: true },
    where: { merchantId, status: 'PAID' }
  })
  const totalRevenuePaise = revenueResult._sum.totalPaise || 0

  // Recovered revenue
  const recoveredResult = await prisma.recoveryAttempt.aggregate({
    _sum: { amountPaise: true },
    where: { merchantId, status: 'PAYMENT_SUCCESS' }
  })
  const recoveredRevenuePaise = recoveredResult._sum.amountPaise || 0

  // Successful orders
  const successfulOrdersCount = await prisma.order.count({
    where: { merchantId, status: 'PAID' }
  })

  // Failed payments
  const failedPaymentsCount = await prisma.payment.count({
    where: { merchantId, status: 'FAILED' }
  })

  // Pending payments
  const pendingPaymentsCount = await prisma.payment.count({
    where: { merchantId, status: 'PENDING' }
  })

  // Abandoned carts
  const abandonedCartsCount = await prisma.cart.count({
    where: { merchantId, status: 'ABANDONED' }
  })

  // AI Buyer revenue
  const aiBuyerRevenueResult = await prisma.order.aggregate({
    _sum: { totalPaise: true },
    where: { merchantId, status: 'PAID', origin: 'AI_BUYER' }
  })
  const aiBuyerRevenuePaise = aiBuyerRevenueResult._sum.totalPaise || 0

  // AI Buyer order count
  const aiBuyerOrderCount = await prisma.order.count({
    where: { merchantId, status: 'PAID', origin: 'AI_BUYER' }
  })

  // Average order value
  const averageOrderValuePaise = successfulOrdersCount > 0 
    ? Math.floor(totalRevenuePaise / successfulOrdersCount)
    : 0

  const totalAttempts = successfulOrdersCount + abandonedCartsCount
  const conversionRate = totalAttempts > 0 
    ? Math.round((successfulOrdersCount / totalAttempts) * 100)
    : 0

  return {
    totalRevenuePaise,
    recoveredRevenuePaise,
    successfulOrdersCount,
    failedPaymentsCount,
    pendingPaymentsCount,
    abandonedCartsCount,
    aiBuyerRevenuePaise,
    aiBuyerOrderCount,
    averageOrderValuePaise,
    conversionRate
  }
}

export async function getMerchantOrders(merchantId: string) {
  return prisma.order.findMany({
    where: { merchantId },
    include: {
      customer: true,
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getMerchantPayments(merchantId: string) {
  return prisma.payment.findMany({
    where: { merchantId },
    include: {
      order: true,
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getMerchantCustomers(merchantId: string) {
  return prisma.merchantCustomer.findMany({
    where: { merchantId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getMerchantAgentActivity(merchantId: string) {
  return prisma.agentAction.findMany({
    where: { merchantId },
    include: {
      agentRun: true,
      message: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
}

export async function getMerchantUpsellOpportunities(merchantId: string) {
  const orders = await prisma.order.findMany({
    where: { merchantId, status: 'PAID' },
    include: {
      customer: true,
      items: {
        include: { product: true }
      }
    }
  })

  const coOccurrence: Record<string, Record<string, number>> = {}
  orders.forEach(order => {
    const productIds = order.items.map(item => item.productId)
    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const id1 = productIds[i]
        const id2 = productIds[j]
        if (!coOccurrence[id1]) coOccurrence[id1] = {}
        if (!coOccurrence[id2]) coOccurrence[id2] = {}
        coOccurrence[id1][id2] = (coOccurrence[id1][id2] || 0) + 1
        coOccurrence[id2][id1] = (coOccurrence[id2][id1] || 0) + 1
      }
    }
  })

  const opportunities: Array<{
    customerId: string
    customerName: string
    purchasedProductId: string
    purchasedProductName: string
    recommendedProductId: string
    recommendedProductName: string
    type: 'UPSELL' | 'CROSS_SELL'
    reason: string
    opportunityValuePaise: number
  }> = []

  const customerPurchases: Record<string, Set<string>> = {}
  orders.forEach(order => {
    if (!customerPurchases[order.merchantCustomerId]) {
      customerPurchases[order.merchantCustomerId] = new Set()
    }
    order.items.forEach(item => {
      customerPurchases[order.merchantCustomerId].add(item.productId)
    })
  })

  const allProducts = await prisma.product.findMany({
    where: { merchantId, active: true }
  })
  
  const productMap = new Map(allProducts.map(p => [p.id, p]))

  for (const [customerId, purchasedIds] of Object.entries(customerPurchases)) {
    for (const purchasedId of Array.from(purchasedIds)) {
      const purchasedProduct = productMap.get(purchasedId)
      if (!purchasedProduct) continue

      let bestRecommendation = null
      let reason = ''
      let type: 'UPSELL' | 'CROSS_SELL' = 'CROSS_SELL'

      if (coOccurrence[purchasedId]) {
        let maxCo = 0
        let maxCoId = null
        for (const [otherId, count] of Object.entries(coOccurrence[purchasedId])) {
          if (!purchasedIds.has(otherId) && count > maxCo) {
            maxCo = count
            maxCoId = otherId
          }
        }
        if (maxCoId) {
          bestRecommendation = productMap.get(maxCoId)
          reason = `Frequently bought with ${purchasedProduct.name}`
          type = 'CROSS_SELL'
        }
      }

      if (!bestRecommendation && purchasedProduct.category) {
        const higherPriced = allProducts.find(p => 
          p.category === purchasedProduct.category && 
          p.pricePaise > purchasedProduct.pricePaise &&
          !purchasedIds.has(p.id)
        )
        if (higherPriced) {
          bestRecommendation = higherPriced
          reason = `Premium alternative in ${purchasedProduct.category}`
          type = 'UPSELL'
        }
      }

      if (bestRecommendation) {
        const customer = orders.find(o => o.merchantCustomerId === customerId)?.customer
        if (!customer) continue

        const exists = opportunities.some(o => 
          o.customerId === customerId && 
          o.recommendedProductId === bestRecommendation!.id
        )
        
        if (!exists) {
          opportunities.push({
            customerId,
            customerName: customer.name || customer.email,
            purchasedProductId: purchasedProduct.id,
            purchasedProductName: purchasedProduct.name,
            recommendedProductId: bestRecommendation.id,
            recommendedProductName: bestRecommendation.name,
            type,
            reason,
            opportunityValuePaise: bestRecommendation.pricePaise
          })
        }
      }
    }
  }

  return opportunities.slice(0, 10)
}

export async function getMerchantRevenueOpportunities(merchantId: string) {
  const failedPayments = await prisma.payment.count({
    where: { merchantId, status: 'FAILED' }
  })
  const abandonedCarts = await prisma.cart.count({
    where: { merchantId, status: 'ABANDONED' }
  })
  
  const upsellOpps = await getMerchantUpsellOpportunities(merchantId)

  return {
    failedPayments,
    abandonedCarts,
    upsellOpportunities: upsellOpps.length
  }
}

export async function getAudienceForCampaign(merchantId: string, boughtCategory?: string, notBoughtCategory?: string) {
  // Find customers who bought boughtCategory
  let eligibleCustomers = await prisma.merchantCustomer.findMany({
    where: { merchantId },
    include: {
      orders: {
        where: { status: 'PAID' },
        include: {
          items: {
            include: { product: true }
          }
        }
      }
    }
  })

  // Filter based on criteria
  const audience = eligibleCustomers.filter(customer => {
    let hasBought = false
    let hasNotBought = true

    if (!boughtCategory && !notBoughtCategory) return true

    for (const order of customer.orders) {
      for (const item of order.items) {
        const cat = item.product.category?.toLowerCase() || ''
        const name = item.product.name.toLowerCase()
        
        if (boughtCategory) {
          const target = boughtCategory.toLowerCase()
          if (cat.includes(target) || name.includes(target)) {
            hasBought = true
          }
        }

        if (notBoughtCategory) {
          const target = notBoughtCategory.toLowerCase()
          if (cat.includes(target) || name.includes(target)) {
            hasNotBought = false
          }
        }
      }
    }

    if (boughtCategory && !hasBought) return false
    if (notBoughtCategory && !hasNotBought) return false

    return true
  })

  return {
    count: audience.length,
    sampleCustomers: audience.slice(0, 3).map(c => ({ id: c.id, name: c.name, email: c.email }))
  }
}

export async function getMerchantProducts(merchantId: string) {
  return prisma.product.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getMerchantPaymentLinks(merchantId: string) {
  return prisma.paymentLink.findMany({
    where: { merchantId },
    include: {
      order: {
        include: {
          customer: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}
