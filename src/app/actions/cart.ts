'use server'

import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import * as customerTools from '@/lib/ai/customer-tools'
import { getStoreContext } from '@/lib/store-context'

async function resolveMerchantCustomer(merchantId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { customer: true }
  })
  if (!user || !user.customer) throw new Error('Unauthorized')

  let merchantCustomer = await prisma.merchantCustomer.findFirst({
    where: { merchantId, email: user.email }
  })

  if (!merchantCustomer) {
    merchantCustomer = await prisma.merchantCustomer.create({
      data: {
        merchantId,
        email: user.email,
        name: `${user.customer.firstName} ${user.customer.lastName || ''}`.trim() || 'Guest'
      }
    })
  }
  return merchantCustomer
}

export async function fetchCustomerCart() {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') return null
  
  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId
  const merchantCustomer = await resolveMerchantCustomer(merchantId, session.userId)
  
  return customerTools.getCart(merchantId, merchantCustomer.id)
}

export async function updateCartItemAction(productId: string, quantity: number) {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') throw new Error('Unauthorized')
    
  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId
  const merchantCustomer = await resolveMerchantCustomer(merchantId, session.userId)
  
  const result = await customerTools.updateCartItem(merchantId, merchantCustomer.id, productId, quantity)
  
  if ((result as any).error) {
    return { success: false, error: (result as any).error }
  }
  
  revalidatePath('/shop')
  return { success: true }
}

export async function removeCartItemAction(productId: string) {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') throw new Error('Unauthorized')
    
  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId
  const merchantCustomer = await resolveMerchantCustomer(merchantId, session.userId)
  
  await customerTools.removeFromCart(merchantId, merchantCustomer.id, productId)
  revalidatePath('/shop')
  return { success: true }
}

export async function addToCartAction(productId: string, quantity: number) {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') throw new Error('Unauthorized')
    
  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId
  const merchantCustomer = await resolveMerchantCustomer(merchantId, session.userId)
  
  const result = await customerTools.addToCart(merchantId, merchantCustomer.id, productId, quantity)
  
  if ((result as any).error) {
    return { success: false, error: (result as any).error }
  }
  
  revalidatePath('/shop')
  return { success: true }
}
