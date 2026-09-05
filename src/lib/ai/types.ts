export interface RunAgentParams {
  conversationId: string
  userId: string
  message: string
}

export interface AgentResponse {
  success: boolean
  message?: string
  error?: string
}

export type ToolResult = {
  success: boolean
  data?: any
  error?: string
}
