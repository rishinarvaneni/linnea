import { db } from '../src/lib/db'
import { runRevenueAgent } from '../src/lib/ai/agent'
import crypto from 'crypto'

async function main() {
  const merchantUser = await db.user.findFirst({
    where: { role: 'MERCHANT' },
    include: { merchant: true }
  })

  if (!merchantUser) {
    console.error('No merchant user found')
    process.exit(1)
  }

  // Create the customer if John doesn't exist for testing
  const customer = await db.merchantCustomer.findFirst({
    where: { merchantId: merchantUser.merchant?.id, name: { contains: 'John' } }
  })
  
  const conversationId = `conv-test-${crypto.randomBytes(4).toString('hex')}`

  const response = await runRevenueAgent({
    conversationId,
    userId: merchantUser.id,
    message: "What can I upsell to John?"
  })

  console.log("AGENT RESPONSE:", JSON.stringify(response, null, 2))
  process.exit(0)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
