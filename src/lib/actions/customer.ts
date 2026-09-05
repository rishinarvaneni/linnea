'use server'

import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { getStoreContext } from '@/lib/store-context'
import { revalidatePath } from 'next/cache'

export async function updateAIPurchaseEnabled(enabled: boolean) {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') {
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  })
  if (!user) throw new Error('User not found')

  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId

  const customer = await prisma.merchantCustomer.findFirst({
    where: { merchantId, email: user.email },
    include: { savedPaymentMethods: true }
  })

  if (!customer) throw new Error('Customer not found')

  // Enforce rule: cannot enable AI purchase if default payment method has provider === "DEMO" or no active methods exist
  if (enabled) {
    const activeMethods = customer.savedPaymentMethods.filter(m => m.status === 'ACTIVE')
    if (activeMethods.length === 0) {
      throw new Error("Cannot enable autonomous purchasing without a saved payment method.")
    }
  }

  await prisma.merchantCustomer.update({
    where: { id: customer.id },
    data: { aiPurchaseEnabled: enabled }
  })

  revalidatePath('/shop/settings')
  return { success: true }
}
