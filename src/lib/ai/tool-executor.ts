import { db as prisma } from '@/lib/db'

export interface ExecuteToolParams<T> {
  agentRunId: string;
  conversationId: string;
  merchantId: string;
  messageId?: string;
  toolName: string;
  input: any;
  execute: () => Promise<T>;
}

export async function executeAgentTool<T>({
  agentRunId,
  conversationId,
  merchantId,
  messageId,
  toolName,
  input,
  execute
}: ExecuteToolParams<T>): Promise<string> {
  const agentAction = await prisma.agentAction.create({
    data: {
      agentRunId,
      conversationId,
      merchantId,
      messageId,
      toolName,
      inputJson: JSON.stringify(input),
      status: 'STARTED'
    }
  });

  try {
    const result = await execute();
    const outputJson = JSON.stringify(result);

    await prisma.agentAction.update({
      where: { id: agentAction.id },
      data: {
        outputJson,
        status: 'SUCCEEDED'
      }
    });

    return outputJson;
  } catch (error: any) {
    const outputJson = JSON.stringify({ error: error.message || 'Tool execution failed' });
    
    await prisma.agentAction.update({
      where: { id: agentAction.id },
      data: {
        outputJson,
        status: 'FAILED'
      }
    });

    // We return the error as a stringified JSON so the LLM knows it failed, 
    // rather than throwing and crashing the agent loop.
    return outputJson;
  }
}
