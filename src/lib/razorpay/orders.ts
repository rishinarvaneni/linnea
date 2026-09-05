import { getRazorpayClient } from './client'

export async function createRazorpayOrder(amountPaise: number, receiptId: string) {
  const client = getRazorpayClient()
  if (!client) {
    throw new Error('Razorpay credentials missing')
  }

  const options = {
    amount: amountPaise,
    currency: 'INR',
    receipt: receiptId,
    payment_capture: 1
  }

  try {
    const response = await client.orders.create(options)
    return response.id
  } catch (error) {
    console.error('Error creating Razorpay Order:', error)
    throw new Error('Failed to create Razorpay Order')
  }
}
