'use server'

import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { getStoreContext } from '@/lib/store-context'
import { revalidatePath } from 'next/cache'

async function getAuthenticatedCustomer() {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { customer: true }
  })
  if (!user) throw new Error('User not found')

  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId

  let customer = await prisma.merchantCustomer.findFirst({
    where: { merchantId, email: user.email },
    include: { savedPaymentMethods: true }
  })

  if (!customer) {
    customer = await prisma.merchantCustomer.create({
      data: {
        merchantId,
        email: user.email,
        name: `${user.customer?.firstName || ''} ${user.customer?.lastName || ''}`.trim() || 'Customer'
      },
      include: { savedPaymentMethods: true }
    })
  }

  return customer
}

export async function addTestPaymentMethod() {
  const customer = await getAuthenticatedCustomer()

  const activeMethods = customer.savedPaymentMethods.filter(m => m.status === 'ACTIVE')
  const isFirstMethod = activeMethods.length === 0

  // If setting default, reset others first
  if (isFirstMethod) {
    await prisma.savedPaymentMethod.updateMany({
      where: { merchantCustomerId: customer.id },
      data: { isDefault: false }
    })
  }

  await prisma.savedPaymentMethod.create({
    data: {
      merchantCustomerId: customer.id,
      provider: 'DEMO',
      providerToken: null,
      brand: 'Visa',
      last4: '4242',
      type: 'CARD',
      status: 'ACTIVE',
      isDefault: isFirstMethod
    }
  })

  revalidatePath('/shop/settings')
  return { success: true }
}

export async function removePaymentMethod(id: string) {
  const customer = await getAuthenticatedCustomer()

  const method = await prisma.savedPaymentMethod.findUnique({
    where: { id }
  })

  // Customer isolation check
  if (!method || method.merchantCustomerId !== customer.id) {
    throw new Error('Payment method not found or unauthorized')
  }

  await prisma.savedPaymentMethod.delete({
    where: { id }
  })

  // If deleted method was default, set another active method as default
  if (method.isDefault) {
    const remaining = await prisma.savedPaymentMethod.findFirst({
      where: { merchantCustomerId: customer.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    })
    
    if (remaining) {
      await prisma.savedPaymentMethod.update({
        where: { id: remaining.id },
        data: { isDefault: true }
      })
    }
  }

  // Ensure AI purchase is disabled if no valid provider-backed payment method exists
  const anyValidMethod = await prisma.savedPaymentMethod.findFirst({
    where: { merchantCustomerId: customer.id, provider: { not: 'DEMO' }, status: 'ACTIVE' }
  })

  if (!anyValidMethod) {
    await prisma.merchantCustomer.update({
      where: { id: customer.id },
      data: { aiPurchaseEnabled: false }
    })
  }

  revalidatePath('/shop/settings')
  return { success: true }
}

export async function setDefaultPaymentMethod(id: string) {
  const customer = await getAuthenticatedCustomer()

  const method = await prisma.savedPaymentMethod.findUnique({
    where: { id }
  })

  // Customer isolation check
  if (!method || method.merchantCustomerId !== customer.id) {
    throw new Error('Payment method not found or unauthorized')
  }

  // Clear default on all other methods
  await prisma.savedPaymentMethod.updateMany({
    where: { merchantCustomerId: customer.id, id: { not: id } },
    data: { isDefault: false }
  })

  // Set requested method as default
  await prisma.savedPaymentMethod.update({
    where: { id },
    data: { isDefault: true }
  })

  revalidatePath('/shop/settings')
  return { success: true }
}
