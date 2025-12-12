import axios from 'axios'

const N8N_WEBHOOK_BLOG_URL = 'https://trung8b.app.n8n.cloud/webhook/thb'
const N8N_WEBHOOK_VALIDATE_CERTIFICATE_URL = 'https://phat.app.n8n.cloud/webhook/cetificate '
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

export interface ValidateCertificateResponse {
  isValid: boolean
  reason: string
}

export const getBlogSuggestion = async (topic: string): Promise<string> => {
  try {
    const response = await axios.post<N8NSuggestionResponse>(N8N_WEBHOOK_BLOG_URL, {
      topic: topic.trim()
    })

    // Extract text from response
    if (response.data?.content?.parts?.[0]?.text) {
      return response.data.content.parts[0].text
    }

    throw new Error('Invalid response format from n8n')
  } catch (error: unknown) {
    console.error('Error getting blog suggestion from n8n:', error)
    throw error
  }
}

export const validateCertificate = async (file: File | Blob): Promise<ValidateCertificateResponse> => {
  try {
    const formData = new FormData()
    formData.append('data', file)

    const response = await axios.post<ValidateCertificateResponse>(N8N_WEBHOOK_VALIDATE_CERTIFICATE_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data && typeof response.data.isValid === 'boolean' && response.data.reason) {
      return response.data
    }

    throw new Error('Invalid response format from n8n')
  } catch (error: unknown) {
    console.error('Error validating certificate from n8n:', error)
    throw error
  }
}

export const n8nApi = {
  getBlogSuggestion,
  validateCertificate
}

export default n8nApi
