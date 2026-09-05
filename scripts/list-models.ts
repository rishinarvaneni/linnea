import { GoogleGenerativeAI } from '@google/generative-ai'

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    console.error('Missing GOOGLE_API_KEY')
    return
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.models) {
      console.log('Available models supporting generateContent:')
      data.models.forEach((model: any) => {
        if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${model.name} (${model.displayName})`)
        }
      })
    } else {
      console.log('No models returned or error:', data)
    }
  } catch (err) {
    console.error('Error fetching models:', err)
  }
}

listModels()
