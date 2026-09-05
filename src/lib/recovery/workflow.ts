import { db as prisma } from '@/lib/db'
import crypto from 'crypto'
import { createRazorpayPaymentLink } from '@/lib/razorpay/payment-links'
import { getRecoverableOpportunities } from './opportunities'
import { sendEmail } from '@/lib/providers/email'
import { sendSms } from '@/lib/providers/sms'

function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(paise / 100)
}

export async function startRecovery(merchantId: string, opportunityId: string, strategy: string = 'STANDARD_RECOVERY') {
  // 1. Validate Opportunity from the active list
  const opportunities = await getRecoverableOpportunities(merchantId)
  const opp = opportunities.find(o => o.id === opportunityId)
  
  if (!opp) {
    throw new Error('Opportunity is no longer valid, has expired, or was already recovered.')
  }

  // 2-4: Atomic duplicate check and attempt creation
  const attempt = await prisma.$transaction(async (tx) => {
    const activeAttempt = await tx.recoveryAttempt.findFirst({
      where: {
        merchantId,
        OR: [
          { paymentId: opp.paymentId || undefined },
          { cartId: opp.cartId || undefined }
        ],
        status: {
          in: ['PENDING', 'LINK_CREATED', 'MESSAGE_SENT', 'CUSTOMER_CLICKED', 'PAYMENT_SUCCESS']
        }
      }
    })

    if (activeAttempt) {
      throw new Error('An active recovery attempt already exists for this opportunity.')
    }

    // 3. Resolve Authoritative Order
    let targetOrderId = opp.orderId

    if (opp.type === 'ABANDONED_CART' && opp.cartId && !targetOrderId) {
      const cart = await tx.cart.findUnique({
        where: { id: opp.cartId },
        include: { items: { include: { product: true } } }
      })

      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty or not found.')
      }

      const orderNumber = `NVR-REC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          merchantId,
          merchantCustomerId: opp.customerId,
          status: 'PENDING',
          totalPaise: opp.amountPaise,
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              pricePaise: item.product.pricePaise
            }))
          }
        }
      })

      targetOrderId = newOrder.id
    }

    if (!targetOrderId) {
      throw new Error('Failed to resolve an authoritative order for recovery.')
    }

    // 4. Create RecoveryAttempt
    return await tx.recoveryAttempt.create({
      data: {
        merchantId,
        merchantCustomerId: opp.customerId,
        cartId: opp.cartId,
        paymentId: opp.paymentId,
        orderId: targetOrderId,
        reason: opp.type,
        strategy,
        status: 'PENDING',
        amountPaise: opp.amountPaise
      }
    })
  })

  let targetOrderId = attempt.orderId!

  try {
    if (strategy === 'FORCE_FAILURE') {
      throw new Error('Unable to create the payment link. No payment or order state was changed.')
    }

    // 5. Create Razorpay Payment Link
    const paymentLinkUrl = await createRazorpayPaymentLink(merchantId, targetOrderId)

    // Lookup the newly created payment link
    const paymentLinkRecord = await prisma.paymentLink.findFirst({
      where: { orderId: targetOrderId, url: paymentLinkUrl },
      orderBy: { createdAt: 'desc' }
    })

    if (paymentLinkRecord) {
      await prisma.recoveryAttempt.update({
        where: { id: attempt.id },
        data: { 
          status: 'LINK_CREATED',
          paymentLinkId: paymentLinkRecord.id
        }
      })
    }

    // 6. Real Provider Delivery
    const customer = await prisma.merchantCustomer.findUnique({
      where: { id: opp.customerId }
    })

    if (!customer) {
      throw new Error('Customer not found for delivery.')
    }

    const messageText = `Hi ${opp.customerName || 'there'}! You left some great items in your cart worth ${formatRupees(opp.amountPaise)}. Secure them before they're gone: ${paymentLinkUrl}`
    let providerMessageId = null
    let sendResult = null

    if (customer.email) {
      const emailRes = await sendEmail(customer.email, 'Complete your purchase', messageText.replace(paymentLinkUrl, `<a href="${paymentLinkUrl}">Complete Purchase</a>`))
      if (emailRes.status === 'ACCEPTED') {
        providerMessageId = emailRes.providerMessageId || 'email_accepted'
        sendResult = emailRes
      } else {
        throw new Error(`Email provider error: ${emailRes.errorMessage || emailRes.status}`)
      }
    } else if (customer.phone) {
      const smsRes = await sendSms(customer.phone, messageText)
      if (smsRes.status === 'ACCEPTED') {
        providerMessageId = smsRes.providerMessageId || 'sms_accepted'
        sendResult = smsRes
      } else {
        throw new Error(`SMS provider error: ${smsRes.errorMessage || smsRes.status}`)
      }
    } else {
      throw new Error('No valid contact method found (Email/Phone missing).')
    }

    // 7. Update Recovery State (Only on ACCEPTED)
    await prisma.recoveryAttempt.update({
      where: { id: attempt.id },
      data: {
        status: 'MESSAGE_SENT',
        messageSent: providerMessageId
      }
    })

    return {
      success: true,
      recoveryId: attempt.id,
      message: 'Recovery started successfully. Message handed off to provider.',
      paymentLinkUrl,
      providerMessageId
    }
  } catch (error: any) {
    // Handle Failure
    await prisma.recoveryAttempt.update({
      where: { id: attempt.id },
      data: { status: 'FAILED' }
    })
    
    return {
      success: false,
      error: error.message || 'Failed to complete recovery workflow.'
    }
  }
}
