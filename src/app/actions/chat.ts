'use server'

import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { generateMockResponse } from '@/lib/ai/mock-agent'
import { runRevenueAgent } from '@/lib/ai/agent'
import { runCustomerAgent } from '@/lib/ai/customer-agent'
import { revalidatePath } from 'next/cache'

function generateConversationTitle(content: string): string {
  const clean = content.trim().replace(/\s+/g, ' ')
  if (clean.length <= 33) return clean
  
  const truncated = clean.slice(0, 30)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 15) {
    return truncated.slice(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

function validateAgentType(role: string, agentType: string) {
  if (role === 'MERCHANT' && agentType !== 'MERCHANT_REVENUE') {
    throw new Error('Unauthorized agent type for merchant')
  }
  if (role === 'CUSTOMER' && agentType !== 'CUSTOMER_SHOPPING') {
    throw new Error('Unauthorized agent type for customer')
  }
}

export async function listConversations(agentType: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  validateAgentType(session.role, agentType)

  return prisma.conversation.findMany({
    where: {
      userId: session.userId,
      agentType,
      messages: {
        some: {}
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })
}

export async function createConversation(agentType: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  validateAgentType(session.role, agentType)

  return prisma.conversation.create({
    data: {
      userId: session.userId,
      agentType,
      title: 'New conversation'
    }
  })
}

export async function getConversation(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!conversation) throw new Error('Conversation not found')
  if (conversation.userId !== session.userId) throw new Error('Unauthorized')
  validateAgentType(session.role, conversation.agentType)

  return conversation
}

export async function createMessage(conversationId: string, content: string, inputType: string = 'TEXT') {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const trimmedContent = content.trim()
  if (!trimmedContent) throw new Error('Message cannot be empty')

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      _count: {
        select: { messages: true }
      }
    }
  })

  if (!conversation) throw new Error('Conversation not found')
  if (conversation.userId !== session.userId) throw new Error('Unauthorized')
  validateAgentType(session.role, conversation.agentType)

  const isFirstMessage = conversation._count.messages === 0
  
  // 1. Create user message
  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'USER',
      content: trimmedContent,
      inputType
    }
  })

  // 2. Update title if first message
  if (isFirstMessage) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        title: generateConversationTitle(trimmedContent)
      }
    })
  }

  // 3. Generate AI response based on agentType
  let aiResponseText = ''

  if (conversation.agentType === 'MERCHANT_REVENUE') {
    const aiResult = await runRevenueAgent({
      conversationId,
      userId: session.userId,
      message: trimmedContent
    })

    if (!aiResult.success) {
      aiResponseText = aiResult.error || 'Failed to generate response.'
    } else {
      aiResponseText = aiResult.message || 'No response generated.'
    }
  } else if (conversation.agentType === 'CUSTOMER_SHOPPING') {
    const aiResult = await runCustomerAgent({
      conversationId,
      userId: session.userId,
      message: trimmedContent
    })

    if (!aiResult.success) {
      aiResponseText = aiResult.error || 'Failed to generate response.'
    } else {
      aiResponseText = aiResult.message || 'No response generated.'
    }
    
    // Refresh the shop path to update the server-rendered Cart
    revalidatePath('/shop')
  } else {
    aiResponseText = await generateMockResponse(conversation.agentType, trimmedContent)
  }

  // 4. Save AI response
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: 'ASSISTANT',
      content: aiResponseText,
      inputType: 'TEXT'
    }
  })

  // 5. Update conversation updatedAt
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  })

  return {
    userMessage,
    assistantMessage
  }
}

export async function getConversationContext(conversationId: string, limit: number = 20) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conversation) throw new Error('Conversation not found')
  if (conversation.userId !== session.userId) throw new Error('Unauthorized')
  validateAgentType(session.role, conversation.agentType)

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      role: true,
      content: true
    }
  })

  return messages.reverse()
}

export async function getAgentActions(conversationId: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conversation || conversation.userId !== session.userId) return []

  const actions = await prisma.agentAction.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }
  })
  
  return actions
}

export async function deleteConversation(conversationId: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId }
  })

  if (!conversation) throw new Error('Conversation not found')
  if (conversation.userId !== session.userId) {
    throw new Error('Unauthorized: You can only delete your own conversations.')
  }

  // Delete dependent records that don't cascade, and then the conversation itself
  await prisma.$transaction([
    prisma.agentAction.deleteMany({ where: { conversationId } }),
    prisma.agentRun.deleteMany({ where: { conversationId } }),
    prisma.message.deleteMany({ where: { conversationId } }), // Safe extra measure
    prisma.conversation.delete({ where: { id: conversationId } })
  ])

  return { success: true }
}
