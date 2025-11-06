import axios from 'axios'

const N8N_WEBHOOK_URL = 'https://trung1512.app.n8n.cloud/webhook/generate-blog-titles'

export interface N8NSuggestionRequest {
  topic: string
}

export interface N8NSuggestionResponse {
  content: {
    parts: Array<{
      text: string
    }>
  }
}

export const getBlogSuggestion = async (topic: string): Promise<string> => {
  try {
    const response = await axios.post<N8NSuggestionResponse>(N8N_WEBHOOK_URL, {
      topic: topic.trim()
    })

    // Extract text from response
    if (response.data?.content?.parts?.[0]?.text) {
      return response.data.content.parts[0].text
    }

    throw new Error('Invalid response format from n8n')
  } catch (error: any) {
    console.error('Error getting blog suggestion from n8n:', error)
    throw error
  }
}

export const n8nApi = {
  getBlogSuggestion
}

export default n8nApi

