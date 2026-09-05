import { db as prisma } from '@/lib/db'
import { cookies, headers } from 'next/headers'

/**
 * Retrieves the current store/merchant context based on incoming request headers, cookies, or session.
 */
export async function getStoreContext(overrideMerchantId?: string) {
  let merchantId = overrideMerchantId

  if (!merchantId) {
    try {
      const cookieStore = await cookies()
      merchantId = cookieStore.get('merchantId')?.value || cookieStore.get('merchant_id')?.value
    } catch (_) {}
  }

  if (!merchantId) {
    try {
      const headersList = await headers()
      merchantId = headersList.get('x-merchant-id') || headersList.get('merchant-id') || undefined
    } catch (_) {}
  }

  if (merchantId) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        businessName: true
      }
    })
    
    if (merchant) {
      return {
        merchantId: merchant.id,
        businessName: merchant.businessName
      }
    }
  }

  // Fallback to primary store in database if no specific store cookie/header is provided
  const merchant = await prisma.merchant.findFirst({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      businessName: true
    }
  })
  
  if (!merchant) {
    throw new Error("No store context found. Please ensure a merchant exists in the database.")
  }
  
  return {
    merchantId: merchant.id,
    businessName: merchant.businessName
  }
}
