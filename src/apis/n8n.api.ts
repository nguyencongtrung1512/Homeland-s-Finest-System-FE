import axios from 'axios'

const N8N_WEBHOOK_BLOG_URL = 'https://trung8b.app.n8n.cloud/webhook/thb'
const N8N_WEBHOOK_VALIDATE_CERTIFICATE_URL = 'http://143.198.85.51/webhook/content'
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

// Certificate Data Types theo từng loại chứng chỉ
export interface ISO22000CertificateData {
  ten_don_vi: string
  dia_chi: string
  tieu_chuan_ap_dung: string
  pham_vi_chung_nhan: string
  so_giay_chung_nhan: string
  ngay_chung_nhan: string
  ngay_het_han: string
}

export interface HACCPCertificateData {
  ten_don_vi: string
  dia_chi: string
  tieu_chuan_ap_dung: string
  pham_vi_chung_nhan: string
  so_chung_chi: string
  ngay_cap: string
  ngay_het_han: string
}

export interface BusinessLicenseData {
  ten_doanh_nghiep_tieng_viet?: string
  ten_doanh_nghiep_tieng_nuoc_ngoai?: string
  ten_doanh_nghiep_viet_tat?: string
  ma_so_doanh_nghiep: string
  ngay_dang_ky_lan_dau: string
  dia_chi_tru_so_chinh: string
  von_dieu_le: string
  nguoi_dai_dien_phap_luat: {
    ho_va_ten: string
    chuc_danh?: string
    ngay_sinh?: string
    dan_toc?: string
    quoc_tich?: string
    loai_giay_to_phap_ly?: string
    so_giay_to_phap_ly?: string
    ngay_cap?: string
    noi_cap?: string
    dia_chi_thuong_tru?: string
  }
}

export interface HouseholdBusinessData {
  ten_ho_kinh_doanh: string
  ma_so_dang_ky_ho_kinh_doanh: string
  ngay_dang_ky_lan_dau: string
  dia_chi_tru_so: string
  nganh_nghe_kinh_doanh: string
  von_kinh_doanh: string
  chu_ho_kinh_doanh: {
    ho_va_ten: string
    ngay_sinh?: string
    dan_toc?: string
    so_can_cuoc?: string
    ngay_cap?: string
    noi_cap?: string
    dia_chi_thuong_tru?: string
  }
}

export interface BusinessLocationData {
  ten_dia_diem_kinh_doanh: string
  ma_so_dia_diem_kinh_doanh: string
  dia_chi: string
  nguoi_dung_dau: {
    ho_va_ten: string
    so_giay_to_phap_ly?: string
  }
  don_vi_chu_quan: {
    ten_doanh_nghiep: string
    ma_so_doanh_nghiep: string
  }
}

export interface OCOPCertificateData {
  ten_san_pham: string
  ten_chu_the: string
  hang_sao: number | string
  so_quyet_dinh?: string
  nam_danh_gia?: string
  ten_cuoc_thi?: string
  tinh_thanh_pho: string
  ngay_het_han?: string
}

export interface VietGAPCertificateData {
  san_pham_duoc_chung_nhan: string
  ten_co_so: string
  dia_chi_vung_trong: string
  dien_tich_canh_tac: string
  san_luong_du_kien: string
  tieu_chuan_ap_dung: string
  so_giay_chung_nhan: string
  hieu_luc_tu_ngay: string
  hieu_luc_den_ngay: string
}

export type CertificateData =
  | ISO22000CertificateData
  | HACCPCertificateData
  | BusinessLicenseData
  | HouseholdBusinessData
  | BusinessLocationData
  | OCOPCertificateData
  | VietGAPCertificateData

export interface ValidateCertificateResponse {
  type: string // "CHUNG_NHAN_ISO_22000", "GIAY_CHUNG_NHAN_DANG_KY_DOANH_NGHIEP", etc.
  data: CertificateData | null // Chi tiết theo từng loại certificate
  level: string // "Good", "Fair", "Bad"
  category?: string // "Store"
  IsExpired?: boolean
  // Backward compatibility fields
  isValid?: boolean // Derived từ level: "Good" = true, "Bad"/"Fair" = false
  reason?: string // Message mô tả
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

    const response = await axios.post<ValidateCertificateResponse | { isValid: boolean; reason: string }>(
      N8N_WEBHOOK_VALIDATE_CERTIFICATE_URL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    const responseData = response.data

    // Parse response và derive isValid/reason từ level
    if (responseData && 'type' in responseData && 'level' in responseData) {
      const level = responseData.level.toLowerCase()
      const isValid = level === 'good'

      // Derive reason nếu không có sẵn
      let reason = responseData.reason
      if (!reason) {
        if (level === 'good') {
          reason = `Chứng chỉ hợp lệ: ${responseData.type}`
        } else if (level === 'fair') {
          reason = `Chứng chỉ không thuộc loại được chấp nhận (${responseData.type})`
        } else {
          reason = `Ảnh không phải là chứng chỉ hợp lệ`
        }
      }

      return {
        type: responseData.type,
        data: responseData.data || null,
        level: responseData.level,
        category: responseData.category,
        IsExpired: responseData.IsExpired,
        isValid,
        reason
      }
    }

    // Backward compatibility: nếu response có format cũ (isValid, reason)
    if (responseData && typeof responseData.isValid === 'boolean' && responseData.reason) {
      const oldFormat = responseData as {
        isValid: boolean
        reason: string
        type?: string
        data?: CertificateData | null
        level?: string
        category?: string
        IsExpired?: boolean
      }
      return {
        type: oldFormat.type || 'UNKNOWN',
        data: oldFormat.data || null,
        level: oldFormat.level || (oldFormat.isValid ? 'Good' : 'Bad'),
        category: oldFormat.category,
        IsExpired: oldFormat.IsExpired,
        isValid: oldFormat.isValid,
        reason: oldFormat.reason
      }
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
