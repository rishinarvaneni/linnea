import { db as prisma } from '@/lib/db'
import { RunAgentParams, AgentResponse } from './types'
import * as dbTools from './tools'
import { createGeminiModel } from './gemini'
import { executeAgentTool } from './tool-executor'
import { getConversationHistory } from './message-history'
import { z } from 'zod'
import { tool } from '@langchain/core/tools'
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'

export async function runRevenueAgent({ conversationId, userId, message }: RunAgentParams): Promise<AgentResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { merchant: true }
    })
    
    if (!user || !user.merchant) {
      return { success: false, error: 'Unauthorized or not a merchant.' }
    }
    
    const merchantId = user.merchant.id

    const agentRun = await prisma.agentRun.create({
      data: {
        conversationId,
        agentType: 'MERCHANT_REVENUE',
        status: 'STARTED'
      }
    })

    const history = await getConversationHistory(conversationId, 20)
    
    // The history contains the user message that was just inserted in the DB.
    // We remove the last human message from history to pass it as `input` instead.
    if (history.length > 0) {
      const lastMsg = history[history.length - 1]
      if (lastMsg._getType() === 'human' && lastMsg.content === message) {
        history.pop()
      }
    }

    const systemPrompt = `You are an autonomous revenue analyst and assistant for a merchant. 
Your responsibilities:
- analyze merchant business metrics
- inspect payment performance
- identify failed payment opportunities
- identify abandoned carts
- inspect customers and order history
- identify upsell and cross-sell opportunities
- explain revenue opportunities
- recommend actions

Rules:
1. Never invent payment, customer, or product information.
2. Always use tools when the answer depends on merchant data.
3. Clearly distinguish facts from recommendations. Prefer real data over assumptions.
4. Never claim an external action succeeded before the tool success.
5. Never claim a Razorpay action has happened unless confirmed by a tool.
6. Prioritize high-value opportunities based on observable tool results.
7. Explain recommendations clearly based on data (e.g. "I recommend this because...").
8. Do not expose your internal chain-of-thought.
9. Only use merchant-authorized tools.
10. ALL financial values returned by tools are in paise. When displaying to the user, you MUST convert paise to INR by dividing by 100 and format it as currency (e.g., ₹2,999.00).
11. Detection of revenue opportunities can happen proactively when asked.
12. Payment-link creation requires explicit merchant approval.
13. Recovery notification requires explicit merchant approval.
14. Never claim the customer was contacted externally.
15. Never claim revenue was recovered until verified payment success.
16. Never create duplicate active recovery attempts.
17. Never fabricate payment/click/recovery events.
18. Never modify authoritative order amounts.
19. Never expose other merchants' data.`

    const tools = [
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getMerchantMetrics',
          input: {},
          execute: () => dbTools.getMerchantMetrics(merchantId)
        })
      }, {
        name: 'getMerchantMetrics',
        description: 'Get high-level revenue metrics for the merchant, including total successful revenue and failed payments.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getFailedPayments',
          input: {},
          execute: () => dbTools.getFailedPayments(merchantId)
        })
      }, {
        name: 'getFailedPayments',
        description: 'Get the most recent failed payments.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getAbandonedCarts',
          input: {},
          execute: () => dbTools.getAbandonedCarts(merchantId)
        })
      }, {
        name: 'getAbandonedCarts',
        description: 'Get recent abandoned carts.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getCustomers',
          input: {},
          execute: () => dbTools.getCustomers(merchantId)
        })
      }, {
        name: 'getCustomers',
        description: 'Get recent customers.',
        schema: z.object({})
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getCustomerHistory',
          input: args,
          execute: () => dbTools.getCustomerHistory(merchantId, args.customerId)
        })
      }, {
        name: 'getCustomerHistory',
        description: 'Get order and payment history for a specific customer.',
        schema: z.object({ customerId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getUpsellRecommendations',
          input: args,
          execute: () => dbTools.getUpsellRecommendations(merchantId, args.customerId)
        })
      }, {
        name: 'getUpsellRecommendations',
        description: 'Get upsell and cross-sell product recommendations for a specific customer based on their purchase history.',
        schema: z.object({ customerId: z.string() })
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getOrders',
          input: {},
          execute: () => dbTools.getOrders(merchantId)
        })
      }, {
        name: 'getOrders',
        description: 'Get recent orders.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getRevenueOpportunities',
          input: {},
          execute: () => dbTools.getRevenueOpportunities(merchantId)
        })
      }, {
        name: 'getRevenueOpportunities',
        description: 'Get general revenue opportunities counts (failed payments, abandoned carts, upsells).',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getUpsellOpportunities',
          input: {},
          execute: () => dbTools.getUpsellOpportunities(merchantId)
        })
      }, {
        name: 'getUpsellOpportunities',
        description: 'Get deterministic upsell and cross-sell opportunities (based on real co-occurrences and category rules) for the merchant.',
        schema: z.object({})
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getAudienceForCampaign',
          input: args,
          execute: () => dbTools.getAudienceForCampaign(merchantId, args.boughtCategory, args.notBoughtCategory)
        })
      }, {
        name: 'getAudienceForCampaign',
        description: 'Find real audience size for a campaign based on what they bought or did not buy. Pass categories or product names.',
        schema: z.object({
          boughtCategory: z.string().optional(),
          notBoughtCategory: z.string().optional()
        })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getProduct',
          input: args,
          execute: () => dbTools.getProduct(merchantId, args.productId)
        })
      }, {
        name: 'getProduct',
        description: 'Get details about a specific product.',
        schema: z.object({ productId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'searchProducts',
          input: args,
          execute: () => dbTools.searchProducts(merchantId, args.query)
        })
      }, {
        name: 'searchProducts',
        description: 'Search for products by name.',
        schema: z.object({ query: z.string() })
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getRecoverableOpportunities',
          input: {},
          execute: () => dbTools.getRecoverableOpportunities(merchantId)
        })
      }, {
        name: 'getRecoverableOpportunities',
        description: 'Get high-priority revenue recovery opportunities. Opportunities are scored and ranked deterministically.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getRecoveryHistory',
          input: {},
          execute: () => dbTools.getRecoveryHistory(merchantId)
        })
      }, {
        name: 'getRecoveryHistory',
        description: 'Get the history of recovery attempts.',
        schema: z.object({})
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getRecoveryStatus',
          input: args,
          execute: () => dbTools.getRecoveryStatus(merchantId, args.recoveryId)
        })
      }, {
        name: 'getRecoveryStatus',
        description: 'Get the current status of a specific recovery attempt.',
        schema: z.object({ recoveryId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'startRecovery',
          input: args,
          execute: () => dbTools.startRecovery(merchantId, args.opportunityId, args.strategy)
        })
      }, {
        name: 'startRecovery',
        description: 'Start a recovery attempt for a specific opportunity. REQUIRES EXPLICIT MERCHANT CONFIRMATION BEFORE CALLING.',
        schema: z.object({ opportunityId: z.string(), strategy: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'createPaymentLink',
          input: args,
          execute: () => dbTools.createPaymentLink(merchantId, args.orderId)
        })
      }, {
        name: 'createPaymentLink',
        description: 'Create a Razorpay Test Mode payment link for a specific order. Only use this when explicitly asked.',
        schema: z.object({ orderId: z.string() })
      })
    ]

    const llm = createGeminiModel().bindTools(tools)

    const messages: BaseMessage[] = [
      new SystemMessage(systemPrompt),
      ...history
    ]
    
    // Add the new user message if history doesn't already end with it
    if (messages.length === 1 || messages[messages.length - 1].content !== message) {
      messages.push(new HumanMessage(message))
    }

    let iterations = 0
    let finalOutput = ""

    while (iterations < 5) {
      const result = await llm.invoke(messages)
      messages.push(result)

      if (!result.tool_calls || result.tool_calls.length === 0) {
        finalOutput = typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        break
      }

      for (const toolCall of result.tool_calls) {
        const functionName = toolCall.name
        const args = toolCall.args

        let actionResult = ''
        let actionStatus = 'STARTED'

        const agentAction = await prisma.agentAction.create({
          data: {
            conversationId,
            merchantId,
            agentRunId: agentRun.id,
            toolName: functionName,
            inputJson: JSON.stringify(args),
            status: actionStatus
          }
        })

        try {
          const matchedTool = tools.find(t => t.name === functionName)
          if (!matchedTool) {
            throw new Error(`Unknown tool: ${functionName}`)
          }
          
          const rawData = await (matchedTool as any).invoke(args)
          actionResult = typeof rawData === 'string' ? rawData : JSON.stringify(rawData)
          actionStatus = 'SUCCEEDED'
        } catch (error: any) {
          actionResult = JSON.stringify({ error: error.message || 'Tool execution failed' })
          actionStatus = 'FAILED'
        }

        await prisma.agentAction.update({
          where: { id: agentAction.id },
          data: {
            outputJson: actionResult,
            status: actionStatus
          }
        })

        messages.push(new ToolMessage({
          tool_call_id: toolCall.id as string,
          name: functionName,
          content: actionResult
        }))
      }

      iterations++
    }

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: { status: 'COMPLETED' }
    })

    return {
      success: true,
      message: finalOutput
    }

  } catch (error: any) {
    console.error('Agent error:', error)
    
    // Attempt to mark AgentRun as FAILED if possible
    try {
      // Find the last STARTED run for this conversation (rough heuristic since we don't have agentRun scoped broadly in the catch)
      const lastRun = await prisma.agentRun.findFirst({
        where: { conversationId, status: 'STARTED' },
        orderBy: { createdAt: 'desc' }
      });
      if (lastRun) {
        await prisma.agentRun.update({ where: { id: lastRun.id }, data: { status: 'FAILED' } })
      }
    } catch (_) {}

    return { success: false, error: 'Sorry, I couldn\'t process that request right now. Please try again.' }
  }
}

