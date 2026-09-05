export async function generateMockResponse(agentType: string, content: string): Promise<string> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800))

  if (agentType === 'MERCHANT_REVENUE') {
    return "I've received your request. The Revenue Growth Agent will be connected to your payment and customer data in the next phase."
  }

  if (agentType === 'CUSTOMER_SHOPPING') {
    return "I've received your request. Product search will be connected in the next phase."
  }

  return "I've received your request. I am a mock agent."
}
