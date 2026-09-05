import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { getStoreContext } from '@/lib/store-context'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { customer: true }
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const storeContext = await getStoreContext()
    const merchantId = storeContext.merchantId

    let merchantCustomer = await prisma.merchantCustomer.findFirst({
      where: { merchantId, email: user.email },
      include: {
        savedPaymentMethods: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    })

    if (!merchantCustomer) {
      merchantCustomer = await prisma.merchantCustomer.create({
        data: {
          merchantId,
          email: user.email,
          name: `${user.customer?.firstName || ''} ${user.customer?.lastName || ''}`.trim() || 'Customer'
        },
        include: {
          savedPaymentMethods: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'desc' }
            ]
          }
        }
      })
    }

    return NextResponse.json({
      profile: {
        id: merchantCustomer.id,
        name: merchantCustomer.name,
        email: merchantCustomer.email,
        firstName: user.customer?.firstName,
        lastName: user.customer?.lastName,
        aiPurchaseEnabled: merchantCustomer.aiPurchaseEnabled,
        emailMarketingOptIn: merchantCustomer.emailMarketingOptIn,
        smsMarketingOptIn: merchantCustomer.smsMarketingOptIn,
        savedPaymentMethods: merchantCustomer.savedPaymentMethods
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
