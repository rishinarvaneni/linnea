import { db as prisma } from '@/lib/db'
import { createRazorpayPaymentLink } from '@/lib/razorpay/payment-links'
import { getRecoverableOpportunities as fetchOpportunities } from '@/lib/recovery/opportunities'
import { startRecovery as execRecovery } from '@/lib/recovery/workflow'

import { getMerchantMetrics as fetchMetrics, getMerchantRevenueOpportunities as fetchOpportunitiesData, getMerchantUpsellOpportunities as fetchUpsellOpportunitiesData, getAudienceForCampaign as fetchAudienceForCampaign } from '@/lib/merchant-data'

export async function getMerchantMetrics(merchantId: string) {
  return await fetchMetrics(merchantId)
}

export async function getFailedPayments(merchantId: string) {
  const failedPayments = await prisma.payment.findMany({
    where: { merchantId, status: 'FAILED' },
    include: { customer: true, order: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  return failedPayments
}

export async function getAbandonedCarts(merchantId: string) {
  const abandonedCarts = await prisma.cart.findMany({
    where: { merchantId, status: 'ABANDONED' },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })
  return abandonedCarts
}

export async function getCustomers(merchantId: string) {
  const customers = await prisma.merchantCustomer.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  return customers
}

export async function getCustomerHistory(merchantId: string, customerId: string) {
  const customer = await prisma.merchantCustomer.findUnique({
    where: { id: customerId }
  })
  if (!customer || customer.merchantId !== merchantId) {
    throw new Error('Customer not found or unauthorized')
  }

  const orders = await prisma.order.findMany({
    where: { merchantId, merchantCustomerId: customerId },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  })

  const payments = await prisma.payment.findMany({
    where: { merchantId, merchantCustomerId: customerId },
    orderBy: { createdAt: 'desc' }
  })

  return { customer, orders, payments }
}

export async function getOrders(merchantId: string) {
  const orders = await prisma.order.findMany({
    where: { merchantId },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  return orders
}

export async function getRevenueOpportunities(merchantId: string) {
  return await fetchOpportunitiesData(merchantId)
}

export async function getUpsellOpportunities(merchantId: string) {
  return await fetchUpsellOpportunitiesData(merchantId)
}

export async function getAudienceForCampaign(merchantId: string, boughtCategory?: string, notBoughtCategory?: string) {
  return await fetchAudienceForCampaign(merchantId, boughtCategory, notBoughtCategory)
}

export async function getProduct(merchantId: string, productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId }
  })
  if (!product || product.merchantId !== merchantId) {
    throw new Error('Product not found or unauthorized')
  }
  return product
}

export async function searchProducts(merchantId: string, query: string) {
  const products = await prisma.product.findMany({
    where: {
      merchantId,
      name: { contains: query }
    },
    take: 10
  })
  return products
}

export async function createPaymentLink(merchantId: string, orderId: string) {
  try {
    const url = await createRazorpayPaymentLink(merchantId, orderId)
    return {
      success: true,
      url,
      message: `Payment link created successfully for Order ${orderId}.`
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create payment link.'
    }
  }
}

export async function getRecoverableOpportunities(merchantId: string) {
  return await fetchOpportunities(merchantId)
}

export async function getRecoveryStatus(merchantId: string, recoveryId: string) {
  const attempt = await prisma.recoveryAttempt.findUnique({
    where: { id: recoveryId }
  })
  if (!attempt || attempt.merchantId !== merchantId) {
    throw new Error('Recovery attempt not found or unauthorized')
  }
  return attempt
}

export async function getRecoveryHistory(merchantId: string) {
  const attempts = await prisma.recoveryAttempt.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  return attempts
}

export async function startRecovery(merchantId: string, opportunityId: string, strategy: string = 'STANDARD_RECOVERY') {
  return await execRecovery(merchantId, opportunityId, strategy)
}

export async function getUpsellRecommendations(merchantId: string, customerId: string) {
  const customer = await prisma.merchantCustomer.findUnique({
    where: { id: customerId }
  })
  
  if (!customer || customer.merchantId !== merchantId) {
    throw new Error('Customer not found or unauthorized')
  }

  // Retrieve previous purchases
  const orders = await prisma.order.findMany({
    where: { merchantId, merchantCustomerId: customerId, status: { not: 'PENDING' } },
    include: { items: { include: { product: true } } }
  })

  const purchasedProductIds = new Set<string>()
  const purchasedCategories = new Set<string>()
  
  for (const order of orders) {
    for (const item of order.items) {
      purchasedProductIds.add(item.productId)
      if (item.product.category) {
        purchasedCategories.add(item.product.category)
      }
    }
  }

  // Fetch available products that haven't been purchased
  const availableProducts = await prisma.product.findMany({
    where: {
      merchantId,
      inventory: { gt: 0 },
      id: { notIn: Array.from(purchasedProductIds) }
    },
    orderBy: { pricePaise: 'desc' }
  })

  // Rank products
  // 1. Same category as a previous purchase (UPSELL)
  // 2. Different category (CROSS_SELL)
  const recommendations = availableProducts.map(product => {
    const isSameCategory = product.category && purchasedCategories.has(product.category)
    const type = isSameCategory ? 'UPSELL' : 'CROSS_SELL'
    const reason = isSameCategory 
      ? `Upgrade or add-on within their preferred category (${product.category})`
      : 'Complementary product in a different category'
      
    // Priority Score (higher is better)
    // +50 for same category, +1 for every 100 Rs of price for value
    const priorityScore = (isSameCategory ? 50 : 0) + (product.pricePaise / 10000)

    return {
      productId: product.id,
      name: product.name,
      pricePaise: product.pricePaise,
      category: product.category,
      inventory: product.inventory,
      type,
      reason,
      priorityScore
    }
  })

  recommendations.sort((a, b) => b.priorityScore - a.priorityScore)

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email
    },
    recommendations: recommendations.slice(0, 4).map(({ priorityScore, ...rest }) => rest)
  }
}
