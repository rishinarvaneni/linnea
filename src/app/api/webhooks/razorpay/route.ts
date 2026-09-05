import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { db as prisma } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const eventIdHeader = req.headers.get('x-razorpay-event-id')
    console.log('--- WEBHOOK DIAGNOSTIC ---')
    console.log('Webhook secret configured:', !!webhookSecret)
    console.log('Signature present:', !!signature)
    console.log('Event ID Header present:', !!eventIdHeader)

    if (!webhookSecret) {
      console.error('Webhook processing failed: RAZORPAY_WEBHOOK_SECRET is missing.')
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 })
    }

    if (!signature) {
      console.log('Reason for rejection: Missing Signature')
      console.log('HTTP Status: 400')
      return NextResponse.json({ error: 'Missing Signature' }, { status: 400 })
    }

    // 1. Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex')

    if (expectedSignature !== signature) {
      console.log('Reason for rejection: Invalid Signature')
      console.log('HTTP Status: 400')
      return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 })
    }

    // 2. Parse Payload safely after verification
    let event: any = null
    try {
      event = JSON.parse(rawBody)
      console.log('Payload parsed: true')
    } catch (e) {
      console.log('Payload parsed: false')
      console.log('Reason for rejection: Malformed JSON')
      console.log('HTTP Status: 400')
      return NextResponse.json({ error: 'Invalid Event Format' }, { status: 400 })
    }

    const deduplicationKey = eventIdHeader || signature // Use header, fallback to signature
    console.log('Event name:', event.event)
    console.log('Event ID / Deduplication Key:', deduplicationKey)

    if (!deduplicationKey) {
      console.log('Reason for rejection: Missing deduplicationKey')
      console.log('HTTP Status: 400')
      return NextResponse.json({ error: 'Invalid Event Format' }, { status: 400 })
    }

    // 3. Idempotency Check
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { deduplicationKey }
    })

    if (existingEvent) {
      console.log('Resolution path: Duplicate event (Already Processed)')
      console.log('HTTP Status: 200')
      // Event already processed, return 200 to acknowledge idempotently
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Attempt atomic insert to secure the idempotency lock
    await prisma.webhookEvent.create({
      data: {
        eventType: event.event,
        payloadJson: rawBody,
        deduplicationKey
      }
    })

    // 4. Process specific events
    if (event.event === 'payment_link.paid' || event.event === 'payment.captured') {
      let razorpayOrderId = undefined
      let paymentLinkId = undefined
      let paymentId = undefined
      let amountPaise = 0
      let customerEmail = undefined

      if (event.event === 'payment_link.paid') {
        const payload = event.payload.payment_link.entity
        razorpayOrderId = payload.reference_id // For payment links we stored internal orderId in reference_id
        paymentLinkId = payload.id
        amountPaise = payload.amount_paid
      } else if (event.event === 'payment.captured') {
        const payload = event.payload.payment.entity
        razorpayOrderId = payload.order_id || payload.notes?.order_id
        paymentId = payload.id
        amountPaise = payload.amount
        customerEmail = payload.email
      }

      // If we have an identifier to reconcile against
      if (razorpayOrderId) {
        let internalOrder = null
        if (event.event === 'payment_link.paid') {
          internalOrder = await prisma.order.findUnique({ where: { id: razorpayOrderId }, include: { items: true } })
        } else {
          internalOrder = await prisma.order.findUnique({ where: { razorpayOrderId: razorpayOrderId }, include: { items: true } })
        }

        if (internalOrder && internalOrder.status !== 'PAID') {
          let inventoryShortfall = false
          try {
            await prisma.$transaction(async (tx) => {
              // 1. Verify and decrement inventory atomically in one step
              try {
                for (const item of internalOrder.items) {
                  const result = await tx.product.updateMany({
                    where: { 
                      id: item.productId, 
                      inventory: { gte: item.quantity } 
                    },
                    data: { inventory: { decrement: item.quantity } }
                  })
                  
                  if (result.count === 0) {
                    throw new Error('INSUFFICIENT_INVENTORY')
                  }
                }
              } catch (error) {
                // We must throw here to rollback the entire transaction
                throw new Error('INVENTORY_SHORTFALL')
              }

              // 2. Mark Order as PAID and set fulfillment status
              await tx.order.update({
                where: { id: internalOrder.id },
                data: { status: 'PAID', fulfillmentStatus: 'FULFILLED' }
              })

              // 3. Convert Cart
              const activeCart = await tx.cart.findFirst({
                where: {
                  merchantId: internalOrder.merchantId,
                  merchantCustomerId: internalOrder.merchantCustomerId,
                  status: 'ACTIVE'
                }
              })
              if (activeCart) {
                await tx.cart.update({
                  where: { id: activeCart.id },
                  data: { status: 'CONVERTED' }
                })
              }

              // Mark internal payment as SUCCESS if it exists, otherwise create it
              if (paymentLinkId) {
                const pl = await tx.paymentLink.findUnique({
                  where: { razorpayPaymentLinkId: paymentLinkId }
                })
                if (pl) {
                  await tx.paymentLink.update({
                    where: { id: pl.id },
                    data: { status: 'PAID' }
                  })
                }
              }

              const existingPayment = await tx.payment.findFirst({
                where: { orderId: internalOrder.id, status: 'PENDING' }
              })

              if (existingPayment) {
                await tx.payment.update({
                  where: { id: existingPayment.id },
                  data: {
                    status: 'SUCCESS',
                    razorpayPaymentId: paymentId,
                    razorpayPaymentLinkId: paymentLinkId,
                    paidAt: new Date()
                  }
                })
              } else {
                await tx.payment.create({
                  data: {
                    merchantId: internalOrder.merchantId,
                    orderId: internalOrder.id,
                    merchantCustomerId: internalOrder.merchantCustomerId,
                    amountPaise: amountPaise,
                    status: 'SUCCESS',
                    method: event.event === 'payment_link.paid' ? 'PAYMENT_LINK' : 'CARD',
                    razorpayPaymentId: paymentId,
                    razorpayPaymentLinkId: paymentLinkId,
                    paidAt: new Date()
                  }
                })
              }

              const activeRecovery = await tx.recoveryAttempt.findFirst({
                where: {
                  orderId: internalOrder.id,
                  status: { notIn: ['PAYMENT_SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'] }
                }
              })
              
              if (activeRecovery) {
                await tx.recoveryAttempt.update({
                  where: { id: activeRecovery.id },
                  data: {
                    status: 'PAYMENT_SUCCESS',
                    completedAt: new Date()
                  }
                })
              }
            })
          } catch (error: any) {
            if (error.message === 'INVENTORY_SHORTFALL') {
              inventoryShortfall = true
            } else {
              throw error
            }
          }

          if (inventoryShortfall) {
            console.error(`Inventory shortfall for Order ${internalOrder.id}. Applying fallback reconciliation.`)
            
            // Do NOT mark order as FULFILLED. Do NOT change payment to SUCCESS (leave it PENDING or whatever it is).
            // But we must record the fulfillment status as REQUIRES_RECONCILIATION.
            await prisma.order.update({
              where: { id: internalOrder.id },
              data: {
                fulfillmentStatus: 'REQUIRES_RECONCILIATION'
              }
            })
            
            // Also log the razorpayPaymentId on the payment so we don't lose track of it, but don't mark it SUCCESS.
            const existingPayment = await prisma.payment.findFirst({
              where: { orderId: internalOrder.id, status: 'PENDING' }
            })

            if (existingPayment) {
              await prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                  razorpayPaymentId: paymentId,
                  razorpayPaymentLinkId: paymentLinkId
                }
              })
            }
          }
        }
      }
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { deduplicationKey },
      data: { processedAt: new Date() }
    })

    console.log('Resolution path: Success')
    console.log('HTTP Status: 200')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log('Resolution path: Internal Server Error')
    console.log('HTTP Status: 500')
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
