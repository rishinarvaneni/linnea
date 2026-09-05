import { db as prisma } from '@/lib/db'
import { createRazorpayOrder } from '@/lib/razorpay/orders'
import crypto from 'crypto'

export async function createOrderFromCart(customerId: string, merchantId: string, origin: string = 'STOREFRONT') {
  // 1. Fetch the active cart
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
    throw new Error('Cart is empty or not found')
  }

  // 2. Validate inventory and calculate totals
  let totalPaise = 0
  const orderItemsData = []

  for (const item of cart.items) {
    if (item.product.inventory < item.quantity) {
      throw new Error(`Only ${item.product.inventory} units of ${item.product.name} are available.`)
    }
    const pricePaise = item.product.pricePaise
    totalPaise += pricePaise * item.quantity

    orderItemsData.push({
      productId: item.productId,
      quantity: item.quantity,
      pricePaise: pricePaise
    })
  }

  // Generate order number
  const orderNumber = `NVR-ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  // 3. Atomically create Order and Payment PENDING
  const internalOrder = await prisma.order.create({
    data: {
      orderNumber,
      merchantId,
      merchantCustomerId: customerId,
      status: 'PENDING',
      totalPaise,
      origin,
      items: {
        create: orderItemsData
      },
      payments: {
        create: {
          merchantId,
          merchantCustomerId: customerId,
          amountPaise: totalPaise,
          status: 'PENDING',
          method: 'CARD' // Will be updated by Razorpay webhook based on actual method
        }
      }
    },
    include: {
      payments: true
    }
  })

  // 4. Wrap with Razorpay Order
  let razorpayOrderId: string
  try {
    razorpayOrderId = await createRazorpayOrder(totalPaise, internalOrder.id)
  } catch (error) {
    // If Razorpay fails, fail internal payment
    await prisma.payment.update({
      where: { id: internalOrder.payments[0].id },
      data: { status: 'FAILED' }
    })
    throw new Error('Failed to create Razorpay Order')
  }

  // 5. Update Order with Razorpay ID
  const updatedOrder = await prisma.order.update({
    where: { id: internalOrder.id },
    data: { razorpayOrderId }
  })

  return {
    orderId: updatedOrder.id,
    orderNumber: updatedOrder.orderNumber,
    razorpayOrderId,
    amountPaise: totalPaise,
    currency: 'INR',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID
  }
}
