import { getSession } from './session'
import { db as prisma } from './db'

export async function getMerchantContext() {
  const session = await getSession()
  if (!session || !session.userId || session.role !== 'MERCHANT') {
    throw new Error('Unauthorized: Merchant context requires an authenticated merchant session.')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { merchant: true },
  })

  if (!user || !user.merchant) {
    throw new Error('Unauthorized: Merchant record not found for this user.')
  }

  return {
    merchantId: user.merchant.id,
    businessName: user.merchant.businessName,
  }
}
