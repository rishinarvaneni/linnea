import { db as prisma } from '@/lib/db'
import { createOrderFromCart } from '@/lib/checkout/order'

export async function searchProducts(merchantId: string, params: { query?: string, category?: string, minPricePaise?: number, maxPricePaise?: number, inStockOnly?: boolean }) {
  const where: any = { merchantId, active: true }
  
  if (params.query) {
    where.OR = [
      { name: { contains: params.query } },
      { description: { contains: params.query } }
    ]
  }
  if (params.category) {
    where.category = { equals: params.category }
  }
  if (params.minPricePaise !== undefined) {
    where.pricePaise = { ...where.pricePaise, gte: params.minPricePaise }
  }
  if (params.maxPricePaise !== undefined) {
    where.pricePaise = { ...where.pricePaise, lte: params.maxPricePaise }
  }
  if (params.inStockOnly) {
    where.inventory = { gt: 0 }
  }

  const products = await prisma.product.findMany({
    where,
    take: 5
  })
  
  return products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description,
    pricePaise: p.pricePaise,
    inventory: p.inventory,
    category: p.category,
    active: p.active,
    imageUrl: p.imageUrl
  }))
}

export async function getProduct(merchantId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, merchantId }
  })
  if (!product) throw new Error("Product not found")
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    pricePaise: product.pricePaise,
    inventory: product.inventory,
    category: product.category,
    active: product.active,
    imageUrl: product.imageUrl
  }
}

export async function getProductAvailability(merchantId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, merchantId },
    select: { inventory: true }
  })
  if (!product) throw new Error("Product not found")
  return { availableQuantity: product.inventory }
}

export async function getRelatedProducts(merchantId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, merchantId }
  })
  if (!product || !product.category) return []

  const related = await prisma.product.findMany({
    where: { 
      merchantId, 
      category: product.category,
      id: { not: productId }
    },
    take: 3
  })
  
  return related.map(p => ({
    id: p.id,
    name: p.name,
    pricePaise: p.pricePaise,
    inventory: p.inventory,
    category: p.category,
    active: p.active,
    imageUrl: p.imageUrl
  }))
}

// ---------------------------------------------
// CART TOOLS (Server authoritative)
// ---------------------------------------------

async function ensureCart(merchantId: string, merchantCustomerId: string) {
  let cart = await prisma.cart.findFirst({
    where: { merchantId, merchantCustomerId, status: 'ACTIVE' },
    include: { items: { include: { product: true } } }
  })

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        merchantId,
        merchantCustomerId,
        status: 'ACTIVE'
      },
      include: { items: { include: { product: true } } }
    })
  }
  return cart
}

function mapCartView(cart: any) {
  const items = cart.items.map((item: any) => ({
    productId: item.productId,
    name: item.product.name,
    quantity: item.quantity,
    unitPricePaise: item.product.pricePaise,
    subtotalPaise: item.quantity * item.product.pricePaise
  }))
  
  const totalPaise = items.reduce((sum: number, item: any) => sum + item.subtotalPaise, 0)
  
  return {
    id: cart.id,
    items,
    totalPaise
  }
}

export async function getCart(merchantId: string, merchantCustomerId: string) {
  const cart = await ensureCart(merchantId, merchantCustomerId)
  return mapCartView(cart)
}

export async function addToCart(merchantId: string, merchantCustomerId: string, productId: string, quantity: number) {
  if (quantity < 1) throw new Error("Quantity must be at least 1")
  
  const product = await prisma.product.findFirst({
    where: { id: productId, merchantId }
  })
  if (!product) throw new Error("Product not found or unavailable")
  
  const cart = await ensureCart(merchantId, merchantCustomerId)
  
  const existingItem = cart.items.find((i: any) => i.productId === productId)
  const newQuantity = (existingItem?.quantity || 0) + quantity
  
  if (newQuantity > product.inventory) {
    return {
      success: false,
      error: "INSUFFICIENT_INVENTORY",
      availableQuantity: product.inventory
    }
  }

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity }
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: newQuantity
      }
    })
  }

  return mapCartView(await ensureCart(merchantId, merchantCustomerId))
}

export async function removeFromCart(merchantId: string, merchantCustomerId: string, productId: string) {
  const cart = await ensureCart(merchantId, merchantCustomerId)
  const existingItem = cart.items.find((i: any) => i.productId === productId)
  
  if (existingItem) {
    await prisma.cartItem.delete({
      where: { id: existingItem.id }
    })
  }
  
  return mapCartView(await ensureCart(merchantId, merchantCustomerId))
}

export async function updateCartItem(merchantId: string, merchantCustomerId: string, productId: string, quantity: number) {
  if (quantity < 1) return removeFromCart(merchantId, merchantCustomerId, productId)
  
  const product = await prisma.product.findFirst({
    where: { id: productId, merchantId }
  })
  if (!product) throw new Error("Product not found")
    
  if (quantity > product.inventory) {
    return {
      success: false,
      error: "INSUFFICIENT_INVENTORY",
      availableQuantity: product.inventory
    }
  }
  
  const cart = await ensureCart(merchantId, merchantCustomerId)
  const existingItem = cart.items.find((i: any) => i.productId === productId)
  
  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity }
    })
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity
      }
    })
  }

  return mapCartView(await ensureCart(merchantId, merchantCustomerId))
}

export async function clearCart(merchantId: string, merchantCustomerId: string) {
  const cart = await ensureCart(merchantId, merchantCustomerId)
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id }
  })
  return mapCartView(await ensureCart(merchantId, merchantCustomerId))
}

export async function calculateCart(merchantId: string, customerId: string) {
  const cart = await getCart(merchantId, customerId)
  if (!cart) return null
  return {
    totalPaise: cart.totalPaise,
    itemCount: cart.items.length
  }
}

import { executeAutonomousPurchase as executeAutonomous } from '@/lib/checkout/autonomous'

export async function createCheckout(merchantId: string, customerId: string) {
  try {
    const checkoutData = await createOrderFromCart(customerId, merchantId)
    return {
      type: "CHECKOUT_ACTION",
      text: "Your order is ready for payment.",
      checkout: checkoutData
    }
  } catch (error: any) {
    return { error: error.message || 'Failed to create checkout' }
  }
}

export async function executeAutonomousPurchase(merchantId: string, customerId: string, productId: string, quantity: number) {
  try {
    const result = await executeAutonomous(merchantId, customerId, productId, quantity)
    return result
  } catch (error: any) {
    return { error: error.message || 'Failed to execute autonomous purchase' }
  }
}

export async function getOrderStatus(customerId: string, orderIdOrNumber: string) {
  const order = await prisma.order.findFirst({
    where: {
      merchantCustomerId: customerId,
      OR: [
        { id: orderIdOrNumber },
        { orderNumber: orderIdOrNumber }
      ]
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPaise: true,
      createdAt: true
    }
  })

  if (!order) return { error: 'Order not found or does not belong to you.' }
  return order
}

export async function getPaymentStatus(customerId: string, paymentId: string) {
  const payment = await prisma.payment.findFirst({
    where: {
      id: paymentId,
      merchantCustomerId: customerId
    },
    select: {
      id: true,
      status: true,
      amountPaise: true,
      method: true,
      paidAt: true
    }
  })

  if (!payment) return { error: 'Payment not found or does not belong to you.' }
  return payment
}
