import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const merchantPassword = await bcrypt.hash('DemoMerchant123!', 10)
  const customerPassword = await bcrypt.hash('DemoCustomer123!', 10)

  // Seed Merchant
  const merchant = await prisma.user.upsert({
    where: { email: 'merchant@example.com' },
    update: {},
    create: {
      email: 'merchant@example.com',
      password: merchantPassword,
      role: 'MERCHANT',
      merchant: {
        create: {
          businessName: 'Nivarah',
        }
      }
    },
    include: {
      merchant: true
    }
  })

  // Seed Customer
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      role: 'CUSTOMER',
      customer: {
        create: {
          firstName: 'Demo',
          lastName: 'Customer',
        }
      }
    }
  })

  const merchantId = merchant.merchant!.id

  // Create MerchantCustomers
  const customerA = await prisma.merchantCustomer.create({
    data: {
      merchantId,
      name: 'Riya Sharma',
      email: 'riya@example.com',
      phone: '9876543210'
    }
  })
  
  const customerB = await prisma.merchantCustomer.create({
    data: {
      merchantId,
      name: 'Amit Patel',
      email: 'amit@example.com',
      phone: '9123456789'
    }
  })

  // Create Products
  const headphones = await prisma.product.create({
    data: {
      merchantId,
      name: 'Noise Cancelling Headphones',
      description: 'Premium wireless headphones with active noise cancellation.',
      pricePaise: 299900,
      inventory: 15,
      category: 'Headphones'
    }
  })

  const speakers = await prisma.product.create({
    data: {
      merchantId,
      name: 'Bluetooth Speakers',
      description: 'Portable speakers with deep bass and waterproof design.',
      pricePaise: 499900,
      inventory: 2, // low stock
      category: 'Speakers'
    }
  })

  const vase = await prisma.product.create({
    data: {
      merchantId,
      name: 'Ceramic Kaari Vase',
      description: 'Handcrafted ceramic vase with a minimalist design.',
      pricePaise: 150000,
      inventory: 0, // out of stock
      category: 'Vases'
    }
  })

  const decor = await prisma.product.create({
    data: {
      merchantId,
      name: 'Nordic Table Lamp',
      description: 'Sleek floor lamp with warm adjustable lighting for living rooms.',
      pricePaise: 459900,
      inventory: 5,
      category: 'Decor'
    }
  })

  const candle = await prisma.product.create({
    data: {
      merchantId,
      name: 'Lavender Scented Candle',
      description: 'Hand-poured soy candle with calming lavender scent.',
      pricePaise: 89900,
      inventory: 50,
      category: 'Candles'
    }
  })

  // Create Orders & Payments
  // Order 1: Success
  const order1 = await prisma.order.create({
    data: {
      merchantId,
      merchantCustomerId: customerA.id,
      orderNumber: 'NVR-ORD-0001',
      status: 'PAID',
      totalPaise: 299900,
      items: {
        create: {
          productId: headphones.id,
          quantity: 1,
          pricePaise: 299900
        }
      }
    }
  })

  await prisma.payment.create({
    data: {
      merchantId,
      orderId: order1.id,
      merchantCustomerId: customerA.id,
      amountPaise: 299900,
      status: 'SUCCESS',
      method: 'UPI'
    }
  })

  // Order 2: Failed
  const order2 = await prisma.order.create({
    data: {
      merchantId,
      merchantCustomerId: customerB.id,
      orderNumber: 'NVR-ORD-0002',
      status: 'PENDING',
      totalPaise: 499900,
      items: {
        create: {
          productId: speakers.id,
          quantity: 1,
          pricePaise: 499900
        }
      }
    }
  })

  await prisma.payment.create({
    data: {
      merchantId,
      orderId: order2.id,
      merchantCustomerId: customerB.id,
      amountPaise: 499900,
      status: 'FAILED',
      method: 'CARD'
    }
  })

  // Order 3: Demo Order NVR-DEMO-001
  const order3 = await prisma.order.create({
    data: {
      id: 'NVR-DEMO-001',
      merchantId,
      merchantCustomerId: customerA.id,
      orderNumber: 'NVR-DEMO-001',
      status: 'PENDING',
      totalPaise: 299900,
      items: {
        create: {
          productId: headphones.id,
          quantity: 1,
          pricePaise: 299900
        }
      }
    }
  })

  await prisma.payment.create({
    data: {
      merchantId,
      orderId: order3.id,
      merchantCustomerId: customerA.id,
      amountPaise: 299900,
      status: 'PENDING',
      method: 'PAYMENT_LINK'
    }
  })

  // Create Carts
  await prisma.cart.create({
    data: {
      merchantId,
      merchantCustomerId: customerA.id,
      status: 'ABANDONED',
      items: {
        create: {
          productId: speakers.id,
          quantity: 1
        }
      }
    }
  })

  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
