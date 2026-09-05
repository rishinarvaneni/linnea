import { db as prisma } from '@/lib/db'
import { formatRupees } from '@/lib/merchant-data'

export type MerchantNotification = {
  id: string
  title: string
  description: string
  date: Date
  type: 'success' | 'warning' | 'info' | 'error'
}

export async function getMerchantNotifications(merchantId: string): Promise<MerchantNotification[]> {
  const notifications: MerchantNotification[] = []

  // 1. Fetch recent paid orders
  const recentOrders = await prisma.order.findMany({
    where: { merchantId, status: 'PAID' },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })

  recentOrders.forEach(order => {
    notifications.push({
      id: `ord_${order.id}`,
      title: order.origin === 'AI_BUYER' ? 'AI Buyer Order' : 'New Order',
      description: `A payment of ${formatRupees(order.totalPaise)} was completed successfully.`,
      date: order.updatedAt,
      type: 'success'
    })
  })

  // 2. Fetch recent failed payments
  const recentFailedPayments = await prisma.payment.findMany({
    where: { merchantId, status: 'FAILED' },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })

  recentFailedPayments.forEach(payment => {
    notifications.push({
      id: `fail_${payment.id}`,
      title: 'Payment Failed',
      description: `A payment of ${formatRupees(payment.amountPaise)} requires recovery.`,
      date: payment.updatedAt,
      type: 'error'
    })
  })

  // 3. Fetch recent recovery events
  const recentRecoveries = await prisma.recoveryAttempt.findMany({
    where: { 
      merchantId, 
      status: { in: ['LINK_CREATED', 'PAYMENT_SUCCESS'] }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  })

  recentRecoveries.forEach(recovery => {
    if (recovery.status === 'LINK_CREATED') {
      notifications.push({
        id: `rec_link_${recovery.id}`,
        title: 'Recovery Link Created',
        description: `A payment link was generated for a recoverable opportunity.`,
        date: recovery.updatedAt,
        type: 'info'
      })
    } else if (recovery.status === 'PAYMENT_SUCCESS') {
      notifications.push({
        id: `rec_succ_${recovery.id}`,
        title: 'Revenue Recovered',
        description: `Successfully recovered ${formatRupees(recovery.amountPaise)}.`,
        date: recovery.updatedAt,
        type: 'success'
      })
    }
  })

  // 4. Fetch recent Agent Runs
  const recentAgentActions = await prisma.agentAction.findMany({
    where: { merchantId, status: 'SUCCEEDED' },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  recentAgentActions.forEach(action => {
    notifications.push({
      id: `agent_${action.id}`,
      title: 'Agent Activity',
      description: `Revenue Agent successfully executed ${action.toolName}.`,
      date: action.createdAt,
      type: 'info'
    })
  })

  // Sort all notifications by date desc and take top 10
  return notifications
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)
}
