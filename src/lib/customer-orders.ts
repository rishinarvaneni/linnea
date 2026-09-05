import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { getStoreContext } from '@/lib/store-context'

async function getAuthenticatedMerchantCustomer() {
  const session = await getSession()
  if (!session || session.role !== 'CUSTOMER') return null

  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })

  if (!user) return null

  // Ensure we find the specific MerchantCustomer for this merchant
  const merchantCustomer = await prisma.merchantCustomer.findFirst({
    where: { merchantId, email: user.email }
  })

  if (!merchantCustomer) return null

  return { merchantCustomer, merchantId }
}

export async function getCustomerOrders() {
  const context = await getAuthenticatedMerchantCustomer()
  if (!context) return []

  const { merchantCustomer, merchantId } = context

  return prisma.order.findMany({
    where: {
      merchantId,
      merchantCustomerId: merchantCustomer.id,
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: { items: true }
      }
    }
  })
}

export async function getCustomerOrder(orderId: string) {
  const context = await getAuthenticatedMerchantCustomer()
  if (!context) return null

  const { merchantCustomer, merchantId } = context

  return prisma.order.findFirst({
    where: {
      id: orderId,
      merchantId,
      merchantCustomerId: merchantCustomer.id,
    },
    include: {
      items: {
        include: {
          product: true
        }
      },
      payments: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
}
