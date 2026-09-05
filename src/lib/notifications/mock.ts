import { db as prisma } from '@/lib/db'

type MockNotificationParams = {
  merchantId: string
  customerId: string
  recoveryAttemptId: string
  customerName: string
  paymentLinkUrl: string
  amountPaise: number
  type: 'FAILED_PAYMENT' | 'ABANDONED_CART'
}

export async function sendSimulatedRecoveryMessage(params: MockNotificationParams) {
  const amountStr = `₹${(params.amountPaise / 100).toLocaleString('en-IN')}`
  let messageBody = ''

  if (params.type === 'FAILED_PAYMENT') {
    messageBody = `Hi ${params.customerName}! We noticed your recent payment of ${amountStr} failed. Don't worry, you can easily complete it securely here:\n${params.paymentLinkUrl}`
  } else {
    messageBody = `Hi ${params.customerName}! You left some great items in your cart worth ${amountStr}. Secure them before they're gone:\n${params.paymentLinkUrl}`
  }

  const finalMessage = `[SIMULATED NOTIFICATION]\n${messageBody}`

  console.log(`\n=== SENDING SIMULATED NOTIFICATION ===\nTo: Customer ${params.customerId}\nMessage:\n${finalMessage}\n=====================================\n`)

  // We could store it in DB, we'll return it so the caller can store it in RecoveryAttempt
  return finalMessage
}
