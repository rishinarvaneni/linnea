import { db as prisma } from '@/lib/db'
import { RunAgentParams, AgentResponse } from './types'
import * as customerTools from './customer-tools'
import { createGeminiModel } from './gemini'
import { executeAgentTool } from './tool-executor'
import { getConversationHistory } from './message-history'
import { getStoreContext } from '@/lib/store-context'
import { z } from 'zod'
import { tool } from '@langchain/core/tools'
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'

const CustomerAgentResponseSchema = z.object({
  text: z.string(),
  products: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    pricePaise: z.number(),
    inventory: z.number(),
    category: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional()
  })).optional(),
  cart: z.object({
    id: z.string(),
    items: z.array(z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number(),
      unitPricePaise: z.number(),
      subtotalPaise: z.number()
    })),
    totalPaise: z.number()
  }).nullable().optional(),
  checkout: z.object({
    orderId: z.string(),
    orderNumber: z.string(),
    razorpayOrderId: z.string(),
    amountPaise: z.number(),
    currency: z.string(),
    razorpayKeyId: z.string()
  }).nullable().optional()
})


export async function runCustomerAgent({ conversationId, userId, message }: RunAgentParams): Promise<AgentResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true }
    })
    
    if (!user || !user.customer) {
      return { success: false, error: 'Unauthorized or not a customer.' }
    }
    
    const storeContext = await getStoreContext()
    const merchantId = storeContext.merchantId
    
    let merchantCustomer = await prisma.merchantCustomer.findFirst({
      where: { merchantId, email: user.email }
    })

    if (!merchantCustomer) {
      merchantCustomer = await prisma.merchantCustomer.create({
        data: {
          merchantId,
          email: user.email,
          name: `${user.customer.firstName} ${user.customer.lastName || ''}`.trim() || 'Guest'
        }
      })
    }
    const customerId = merchantCustomer.id

    const agentRun = await prisma.agentRun.create({
      data: {
        conversationId,
        agentType: 'CUSTOMER_SHOPPING',
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

    const systemPrompt = `You are an AI shopping assistant helping customers discover products from the merchant catalog.

Rules & Capabilities:
1. NEVER invent products, prices, or inventory. Only recommend products returned by your tools.
2. Always use product tools for product facts.
3. Use INR amounts from the database. ALL financial values returned by tools are in paise (1 INR = 100 paise). Convert paise to INR when writing conversational text (e.g. ₹2,999).
4. Recommend matching products with rich descriptions, image URLs, prices, and stock levels. Limit recommendations to a maximum of 3 products unless requested otherwise.
5. Natural Language & Follow-up Understanding:
   - Budget queries ("Find headphones under ₹5000"): Call searchProducts with query and maxPricePaise (500000).
   - Broad intent ("I want something for my desk"): Call searchProducts with category or query like "desk" or "lamp" or "keyboard".
   - Price adjustment ("Show me cheaper options"): Review past search/results in history, reduce maxPricePaise relative to previous items, and call searchProducts again.
   - Positional cart addition ("Add the first one to my cart", "Add the keyboard"): Find the target product's ID from recent recommendations in history and call addToCart.
   - Related items ("What else goes well with this?"): Call getRelatedProducts using the productId of the item discussed or in cart.
   - Purchase / Checkout ("Buy it", "Proceed to payment", "Checkout"):
     First try executeAutonomousPurchase. If it fails due to payment provider setup (e.g., DEMO provider), explain why and IMMEDIATELY call createCheckout tool to generate the standard Razorpay checkout modal/link.
6. Output your response as a structured JSON object matching this schema:
{
  "text": "Your conversational response here.",
  "products": [ { "id": "...", "name": "...", "pricePaise": 299900, "inventory": 10, "imageUrl": "...", "description": "...", "category": "..." } ],
  "cart": null,
  "checkout": null
}`

    const prompt = systemPrompt

    let latestProducts: any[] | undefined = undefined
    let latestCart: any | undefined = undefined
    let latestCheckout: any | undefined = undefined

    const tools = [
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'searchProducts',
          input: args,
          execute: async () => {
            const data = await customerTools.searchProducts(merchantId, args)
            latestProducts = data
            return data
          }
        })
      }, {
        name: 'searchProducts',
        description: 'Search for products by query, category, price, or stock availability.',
        schema: z.object({
          query: z.string().optional(),
          category: z.string().optional(),
          minPricePaise: z.number().optional(),
          maxPricePaise: z.number().optional(),
          inStockOnly: z.boolean().optional()
        })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getProduct',
          input: args,
          execute: () => customerTools.getProduct(merchantId, args.productId)
        })
      }, {
        name: 'getProduct',
        description: 'Get details about a specific product using its ID.',
        schema: z.object({ productId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getProductAvailability',
          input: args,
          execute: () => customerTools.getProductAvailability(merchantId, args.productId)
        })
      }, {
        name: 'getProductAvailability',
        description: 'Check how many units of a product are available.',
        schema: z.object({ productId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getRelatedProducts',
          input: args,
          execute: async () => {
            const data = await customerTools.getRelatedProducts(merchantId, args.productId)
            latestProducts = data
            return data
          }
        })
      }, {
        name: 'getRelatedProducts',
        description: 'Get products related to a specific product.',
        schema: z.object({ productId: z.string() })
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getCart',
          input: {},
          execute: async () => {
            const data = await customerTools.getCart(merchantId, customerId)
            latestCart = data
            return data
          }
        })
      }, {
        name: 'getCart',
        description: 'Get the current status of the customer\'s cart.',
        schema: z.object({})
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'addToCart',
          input: args,
          execute: async () => {
            const data = await customerTools.addToCart(merchantId, customerId, args.productId, args.quantity)
            latestCart = data
            return data
          }
        })
      }, {
        name: 'addToCart',
        description: 'Add a product to the customer\'s cart.',
        schema: z.object({ productId: z.string(), quantity: z.number() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'removeFromCart',
          input: args,
          execute: async () => {
            const data = await customerTools.removeFromCart(merchantId, customerId, args.productId)
            latestCart = data
            return data
          }
        })
      }, {
        name: 'removeFromCart',
        description: 'Remove a product from the customer\'s cart.',
        schema: z.object({ productId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'updateCartItem',
          input: args,
          execute: async () => {
            const data = await customerTools.updateCartItem(merchantId, customerId, args.productId, args.quantity)
            latestCart = data
            return data
          }
        })
      }, {
        name: 'updateCartItem',
        description: 'Set the absolute quantity of a product in the cart.',
        schema: z.object({ productId: z.string(), quantity: z.number() })
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'clearCart',
          input: {},
          execute: async () => {
            const data = await customerTools.clearCart(merchantId, customerId)
            latestCart = data
            return data
          }
        })
      }, {
        name: 'clearCart',
        description: 'Remove all items from the cart.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'calculateCart',
          input: {},
          execute: async () => {
            const data = await customerTools.calculateCart(merchantId, customerId)
            latestCart = data
            return data
          }
        })
      }, {
        name: 'calculateCart',
        description: 'Get the cart and its authoritative calculated totals.',
        schema: z.object({})
      }),
      tool(async () => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'createCheckout',
          input: {},
          execute: async () => {
            const data = await customerTools.createCheckout(merchantId, customerId)
            if (data && data.checkout) {
              latestCheckout = data.checkout
            }
            return data
          }
        })
      }, {
        name: 'createCheckout',
        description: 'Create an internal order from the cart and initiate Razorpay checkout.',
        schema: z.object({})
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getOrderStatus',
          input: args,
          execute: () => customerTools.getOrderStatus(customerId, args.orderIdOrNumber)
        })
      }, {
        name: 'getOrderStatus',
        description: 'Check the status of an order.',
        schema: z.object({ orderIdOrNumber: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'getPaymentStatus',
          input: args,
          execute: () => customerTools.getPaymentStatus(customerId, args.paymentId)
        })
      }, {
        name: 'getPaymentStatus',
        description: 'Check the status of a specific payment.',
        schema: z.object({ paymentId: z.string() })
      }),
      tool(async (args) => {
        return executeAgentTool({
          agentRunId: agentRun.id,
          conversationId,
          merchantId,
          toolName: 'executeAutonomousPurchase',
          input: args,
          execute: async () => {
            const data = await customerTools.executeAutonomousPurchase(merchantId, customerId, args.productId, args.quantity)
            return data
          }
        })
      }, {
        name: 'executeAutonomousPurchase',
        description: 'Autonomously purchase a product using the customer\'s saved payment method. Only use when explicitly asked to buy or purchase directly.',
        schema: z.object({ productId: z.string(), quantity: z.number() })
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

      const toolPromises = result.tool_calls.map(async (toolCall) => {
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

        return new ToolMessage({
          tool_call_id: toolCall.id as string,
          name: functionName,
          content: actionResult
        })
      })

      const toolMessages = await Promise.all(toolPromises)
      messages.push(...toolMessages)

      iterations++
    }

    await prisma.agentRun.update({
      where: { id: agentRun.id },
      data: { status: 'COMPLETED' }
    })

    const finalContent = finalOutput
    
    // Server-side validation of the JSON output
    try {
      // Sometimes the model outputs markdown blocks like ```json ... ```, so clean it
      const cleanContent = finalContent.replace(/^```json/g, '').replace(/```$/g, '').trim()
      const parsed = JSON.parse(cleanContent)
      
      // Merge latest products/cart from tool calls if the model omitted them
      if (!parsed.products && latestProducts) {
        parsed.products = latestProducts
      }
      if (!parsed.cart && latestCart) {
        parsed.cart = latestCart
      }
      if (!parsed.checkout && latestCheckout) {
        parsed.checkout = latestCheckout
      }

      const validated = CustomerAgentResponseSchema.parse(parsed)
      
      const normalizedPayload = {
        type: "CUSTOMER_AGENT_RESPONSE",
        text: validated.text,
        products: validated.products,
        cart: validated.cart,
        checkout: validated.checkout
      }
      
      return {
        success: true,
        message: JSON.stringify(normalizedPayload)
      }
    } catch (e) {
      console.error("Agent output validation failed", e)
      // Fallback: Just extract whatever we can or use the raw text if parsing fails entirely
      let fallbackText = "I encountered an error processing the response."
      try {
        const cleanContent = finalContent.replace(/^```json/g, '').replace(/```$/g, '').trim()
        const parsed = JSON.parse(cleanContent)
        if (parsed.text) fallbackText = parsed.text
      } catch (_) {
        fallbackText = finalContent
      }
      
      const safePayload = {
        type: "CUSTOMER_AGENT_RESPONSE",
        text: fallbackText,
        products: latestProducts,
        cart: latestCart,
        checkout: latestCheckout
      }
      return { success: true, message: JSON.stringify(safePayload) }
    }

  } catch (error: any) {
    const status = error?.status || error?.response?.status || 'UNKNOWN_STATUS'
    const message = error?.message || 'Unknown error'
    

    
    try {
      const lastRun = await prisma.agentRun.findFirst({
        where: { conversationId, status: 'STARTED' },
        orderBy: { createdAt: 'desc' }
      });
      if (lastRun) {
        await prisma.agentRun.update({ where: { id: lastRun.id }, data: { status: 'FAILED' } })
      }
    } catch (_) {}

    console.error("CUSTOMER AGENT ERROR:", error)

    return { success: false, error: 'Sorry, I couldn\'t process that request right now. Please try again.' }
  }
}

