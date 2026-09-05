import { db as prisma } from '@/lib/db'
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'

export async function getConversationHistory(conversationId: string, limit: number = 20): Promise<BaseMessage[]> {
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  // Prisma returns desc (latest first) due to `take`, so we reverse to get chronological order
  history.reverse();

  return history.map(msg => {
    let content = msg.content;
    
    // For customer agent, if previous messages are JSON, extract their text to maintain context readability
    try {
      const parsed = JSON.parse(msg.content);
      if (parsed && typeof parsed.text === 'string') {
        content = parsed.text;
      }
    } catch (e) {
      // Not JSON, use as is
    }

    if (msg.role === 'USER' || msg.role === 'user') {
      return new HumanMessage(content);
    } else if (msg.role === 'ASSISTANT' || msg.role === 'assistant') {
      return new AIMessage(content);
    } else {
      // Default to HumanMessage if unknown
      return new HumanMessage(content);
    }
  });
}
