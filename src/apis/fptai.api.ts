// FPT AI OCR API Service
export interface FPTAIResponse {
  errorCode: number
  errorMessage: string
  data: Array<{
    id: string
    id_prob: string
    name: string
    name_prob: string
    dob: string
    dob_prob: string
    sex: string
    sex_prob: string
    nationality: string
    nationality_prob: string
    home: string
    home_prob: string
    address: string
    address_prob: string
    doe: string
    doe_prob: string
    overall_score: string
    number_of_name_lines: string
    address_entities: {
      province: string
      district: string
      ward: string
      street: string
    }
    type_new: string
    type: string
  }>
}

export interface ExtractedCCCDInfo {
  id: string
  name: string
  dob: string
  sex: string
  address: string
  province: string
  district: string
  ward: string
  street: string
}

const FPT_AI_API_KEY = import.meta.env.VITE_FPT_AI_API_KEY
const FPT_AI_OCR_URL = import.meta.env.VITE_FPT_AI_OCR_URL

export const extractCCCDInfo = async (imageFile: File): Promise<ExtractedCCCDInfo | null> => {
  try {
    const formData = new FormData()
    formData.append('image', imageFile)

    const response = await fetch(FPT_AI_OCR_URL, {
      method: 'POST',
      headers: {
        'api-key': FPT_AI_API_KEY
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: FPTAIResponse = await response.json()

    if (result.errorCode !== 0) {
      throw new Error(result.errorMessage || 'Lỗi khi xử lý ảnh')
    }

    if (!result.data || result.data.length === 0) {
      throw new Error('Không thể đọc thông tin từ ảnh CCCD')
    }

    const cccdData = result.data[0]

    // Format date from DD/MM/YYYY to YYYY-MM-DD for HTML date input
    const formatDate = (dateStr: string): string => {
      if (!dateStr) return ''
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      }
      return dateStr
    }

    // Map gender - FPT AI trả về "NAM" hoặc "NỮ" (IN HOA)
    const mapGender = (sex: string): string => {
      const sexUpper = sex.toUpperCase()
      if (sexUpper === 'NAM') return 'Male'
      if (sexUpper === 'NỮ' || sexUpper === 'NU') return 'Female'
      return '' // Default empty nếu không xác định được
    }

    return {
      id: cccdData.id,
      name: cccdData.name,
      dob: formatDate(cccdData.dob),
      sex: mapGender(cccdData.sex),
      address: cccdData.address,
      province: cccdData.address_entities.province,
      district: cccdData.address_entities.district,
      ward: cccdData.address_entities.ward,
      street: cccdData.address_entities.street
    }
  } catch (error) {
    console.error('Error extracting CCCD info:', error)
    throw error
  }
}