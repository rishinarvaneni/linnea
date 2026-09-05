import { runCustomerAgent } from '../src/lib/ai/customer-agent'
import { db } from '../src/lib/db'

async function run() {
  const customerUser = await db.user.findFirst({ where: { role: 'CUSTOMER' } })
  if (!customerUser) throw new Error("No customer user")
  const conversation = await db.conversation.create({
    data: {
      userId: customerUser.id,
      title: 'Test',
      agentType: 'CUSTOMER_SHOPPING'
    }
  })
  
  console.log("Running agent...")
  const result = await runCustomerAgent({
    conversationId: conversation.id,
    userId: customerUser.id,
    message: "Find something under ₹5,000"
  })
  
  console.log("Agent result:", result)
}
run().catch(console.error)
