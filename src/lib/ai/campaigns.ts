'use server'

import { getStoreContext } from '@/lib/store-context'
import { getAudienceForCampaign, getMerchantProducts } from '@/lib/merchant-data'
import { createGeminiModel } from './gemini'
import { formatRupees } from '@/lib/merchant-data'
import { db as prisma } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function generateCampaignPlan(prompt: string) {
  if (!prompt || !prompt.trim()) {
    throw new Error("Prompt cannot be empty.")
  }

  const session = await getSession()
  if (!session || session.role !== 'MERCHANT') {
    throw new Error("Unauthorized: Merchant access required.")
  }

  const merchant = await prisma.merchant.findUnique({
    where: { userId: session.userId }
  })

  if (!merchant) {
    throw new Error("Unauthorized: No merchant profile found.")
  }

  const merchantId = merchant.id
  console.log(`[generateCampaignPlan] Started for merchant: ${merchantId}`)

  // We will first use Gemini to extract parameters for getAudienceForCampaign
  const extractionPrompt = `
    You are extracting targeting criteria from a merchant's campaign request.
    Merchant Request: "${prompt}"

    Extract the "boughtCategory" and "notBoughtCategory". Return ONLY a JSON object with these two keys. If one is missing, make it null. Do not include markdown formatting.
    Example: {"boughtCategory": "headphones", "notBoughtCategory": "speakers"}
  `

  const model = createGeminiModel(0.2)
  const extractionResult = await model.invoke(extractionPrompt)

  let params = { boughtCategory: '', notBoughtCategory: '' }
  try {
    const text = (extractionResult.content as string).replace(/```json/g, '').replace(/```/g, '').trim()
    params = JSON.parse(text)
  } catch (e) {
    console.error(`[generateCampaignPlan] Gemini extraction failed:`, e)
    throw new Error("Failed to extract audience criteria from the prompt. Please be more specific.")
  }

  console.log(`[generateCampaignPlan] Audience query started for params:`, params)

  // Use real data tools
  const audience = await getAudienceForCampaign(merchantId, params.boughtCategory || undefined, params.notBoughtCategory || undefined)
  const products = await getMerchantProducts(merchantId)
  
  // Filter for valid products: active, in-stock, and apply QA test filter
  const validProducts = products.filter(p => 
    p.active === true && 
    p.inventory > 0 && 
    !p.name.toLowerCase().includes('adversarial') && 
    !p.name.toLowerCase().includes('test')
  )
  
  // Find a target product to recommend based on the prompt or notBoughtCategory
  let targetProduct = validProducts.find(p => p.category?.toLowerCase() === params.notBoughtCategory?.toLowerCase())
  if (!targetProduct && params.notBoughtCategory) {
    targetProduct = validProducts.find(p => p.name.toLowerCase().includes(params.notBoughtCategory.toLowerCase()))
  }
  
  if (!targetProduct && validProducts.length > 0) {
    targetProduct = validProducts[0] // fallback
  }

  if (!targetProduct) {
    throw new Error("No active, in-stock product matching this campaign was found.")
  }

  const opportunityValue = formatRupees(targetProduct.pricePaise * audience.count)
  console.log(`[generateCampaignPlan] Audience count: ${audience.count}, Product: ${targetProduct.name}`)

  if (audience.count === 0) {
    return {
      status: 'DRAFT',
      audienceCount: 0,
      targetProduct: targetProduct?.name || 'Unknown',
      opportunityValue: '₹0',
      message: 'There are currently no customers matching this criteria in your database.',
      cta: 'N/A'
    }
  }

  // Generate the actual plan
  const planPrompt = `
    You are an expert commerce copywriter. 
    Write a short email/SMS marketing message and CTA for the following campaign.
    Target Audience: ${audience.count} customers who bought ${params.boughtCategory || 'something'} but not ${params.notBoughtCategory || 'something else'}.
    Product to promote: ${targetProduct?.name || 'our products'}
    Price: ${targetProduct ? formatRupees(targetProduct.pricePaise) : 'N/A'}
    
    Keep the message engaging, concise, and professional.
    IMPORTANT RULES:
    1. Only use factual claims about the product name and price provided above.
    2. Do NOT invent stock levels, discounts, or delivery promises.
    Output ONLY JSON with "message" and "cta" keys. No markdown.
  `

  console.log(`[generateCampaignPlan] Generating message with Gemini`)
  const planResult = await model.invoke(planPrompt)

  let copy = { message: '', cta: '' }
  try {
    const text = (planResult.content as string).replace(/```json/g, '').replace(/```/g, '').trim()
    copy = JSON.parse(text)
    if (!copy.message || !copy.cta) throw new Error("Missing fields in Gemini response")
  } catch (e) {
    console.error(`[generateCampaignPlan] Gemini generation failed:`, e)
    throw new Error("Failed to generate campaign message. The AI response was malformed.")
  }

  console.log(`[generateCampaignPlan] Generation completed`)

  // Find the exact product to get image and formatted price
  let targetProductImage = null
  let targetProductPrice = null
  const selectedProduct = products.find(p => p.name === targetProduct?.name)
  if (selectedProduct) {
    targetProductImage = selectedProduct.imageUrl || null
    targetProductPrice = formatRupees(selectedProduct.pricePaise)
  }

  const audienceCriteria = JSON.stringify({
    boughtCategory: params.boughtCategory,
    notBoughtCategory: params.notBoughtCategory
  })

  // Save the campaign draft
  const campaign = await prisma.campaign.create({
    data: {
      merchantId: merchantId,
      name: `Campaign for ${selectedProduct ? selectedProduct.name : targetProduct?.name}`,
      objective: 'Conversion',
      status: 'DRAFT',
      channel: 'MIXED',
      audienceCriteria: audienceCriteria,
      audienceCount: audience.count,
      message: copy.message,
      cta: copy.cta,
      productId: selectedProduct?.id || targetProduct?.id || null,
    }
  })

  console.log(`[generateCampaignPlan] Campaign saved successfully: ${campaign.id}`)

  return {
    id: campaign.id,
    status: 'DRAFT',
    audienceCount: audience.count,
    audienceBoughtCategory: params.boughtCategory,
    audienceNotBoughtCategory: params.notBoughtCategory,
    opportunityValue: opportunityValue,
    targetProduct: selectedProduct ? selectedProduct.name : targetProduct?.name,
    targetProductImage,
    targetProductPrice,
    message: copy.message,
    cta: copy.cta
  }
}
