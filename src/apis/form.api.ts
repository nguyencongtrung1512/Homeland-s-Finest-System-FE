import axiosInstance from '../service/axiosInstance'
import type {
  AdminUpdateRequest,
  CreateFormRequest,
  FormDTO,
  FormListResponseData,
  FormQueryParams,
  StaffUpdateRequest,
  UpdateFormRequest
} from '../types/form.type'

// API Response types matching backend
interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

interface ApiResponseWithPagination<T> {
  status: number
  message: string
  data: T
  pagination?: {
    pageNumber: number
    pageSize: number
    totalItems: number
    totalPages?: number
  }
}

export const formApi = {
  // Customer APIs
  createForm: async (data: CreateFormRequest): Promise<FormDTO> => {
    const formData = new FormData()
    formData.append('userId', data.userId)
    if (data.storeId) formData.append('storeId', data.storeId)
    if (data.orderId) formData.append('orderId', data.orderId)
    formData.append('type', data.type)
    formData.append('subject', data.subject)
    formData.append('description', data.description)

    if (data.imageFiles) {
      data.imageFiles.forEach((file) => {
        formData.append(`imageFiles`, file)
      })
    }

    const response = (await axiosInstance.post('/Issue', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  updateForm: async (id: string, data: UpdateFormRequest): Promise<FormDTO> => {
    const formData = new FormData()
    // StoreId và OrderId có thể rỗng nhưng vẫn cần gửi
    formData.append('StoreId', data.storeId || '')
    formData.append('OrderId', data.orderId || '')
    formData.append('Type', data.type)
    formData.append('Subject', data.subject)
    formData.append('Description', data.description)

    // ExistingImageUrls - gửi các URL ảnh hiện có
    if (data.existingImageUrls && data.existingImageUrls.length > 0) {
      data.existingImageUrls.forEach((url) => {
        formData.append('ExistingImageUrls', url)
      })
    }

    // ImageFiles - gửi các file ảnh mới
    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach((file) => {
        formData.append('ImageFiles', file)
      })
    }

    const response = (await axiosInstance.put(`/Issue/customer-update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  cancelForm: async (id: string): Promise<FormDTO> => {
    const response = (await axiosInstance.put(`/Issue/cancel-Issue/${id}`)) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  getFormById: async (id: string): Promise<FormDTO> => {
    const response = (await axiosInstance.get(`/Issue/${id}`)) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  getFormByOrderId: async (orderId: string): Promise<FormDTO> => {
    const response = (await axiosInstance.get(`/Issue/detail-by-orderId/${orderId}`)) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  getCustomerForms: async (userId: string, params?: Partial<FormQueryParams>): Promise<FormDTO[]> => {
    const queryParams = new URLSearchParams()
    queryParams.append('userId', userId)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = (await axiosInstance.get(`/Issue?${queryParams.toString()}`)) as ApiResponseWithPagination<FormListResponseData | FormDTO[]>
    // axiosInstance đã trả về response.data
    // Backend có thể trả về data là array trực tiếp hoặc object có property issues
    if (Array.isArray(response.data)) {
      // Nếu data là array trực tiếp
      return response.data
    } else if (response.data && typeof response.data === 'object' && 'issues' in response.data) {
      // Nếu data là object có property issues
      return (response.data as FormListResponseData).issues || []
    }
    return []
  },

  // Admin APIs
  assignStaff: async (staffId: string, formId: string): Promise<FormDTO> => {
    const response = (await axiosInstance.put(`/Issue/Admin/assign-staff/${staffId}/Issue/${formId}`)) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  adminUpdateForm: async (formId: string, data: AdminUpdateRequest): Promise<FormDTO> => {
    const formData = new FormData()
    formData.append('AdminText', data.adminText)
    formData.append('Status', data.status)

    const response = (await axiosInstance.put(`/Issue/${formId}/admin-update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  getAllForms: async (params?: Partial<FormQueryParams>): Promise<FormDTO[]> => {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = (await axiosInstance.get(`/Issue?${queryParams.toString()}`)) as ApiResponseWithPagination<FormListResponseData | FormDTO[]>
    // axiosInstance đã trả về response.data
    // Backend có thể trả về data là array trực tiếp hoặc object có property issues
    if (Array.isArray(response.data)) {
      // Nếu data là array trực tiếp
      return response.data
    } else if (response.data && typeof response.data === 'object' && 'issues' in response.data) {
      // Nếu data là object có property issues
      return (response.data as FormListResponseData).issues || []
    }
    return []
  },

  // Staff APIs
  staffUpdateForm: async (formId: string, data: StaffUpdateRequest): Promise<FormDTO> => {
    const formData = new FormData()
    formData.append('Reply', data.reply)
    formData.append('Status', data.status)

    const response = (await axiosInstance.put(`/Issue/${formId}/staff-update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  },

  getAssignedForms: async (staffId: string, params?: Partial<FormQueryParams>): Promise<FormDTO[]> => {
    const queryParams = new URLSearchParams()
    queryParams.append('staffId', staffId)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = (await axiosInstance.get(`/Issue?${queryParams.toString()}`)) as ApiResponseWithPagination<FormListResponseData | FormDTO[]>
    // axiosInstance đã trả về response.data
    // Backend có thể trả về data là array trực tiếp hoặc object có property issues
    if (Array.isArray(response.data)) {
      // Nếu data là array trực tiếp
      return response.data
    } else if (response.data && typeof response.data === 'object' && 'issues' in response.data) {
      // Nếu data là object có property issues
      return (response.data as FormListResponseData).issues || []
    }
    return []
  },

  // Seller APIs
  getFormsByStoreId: async (storeId: string, params?: Partial<FormQueryParams>): Promise<FormListResponseData> => {
    const queryParams = new URLSearchParams()
    queryParams.append('storeId', storeId)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = (await axiosInstance.get(`/Issue?${queryParams.toString()}`)) as ApiResponseWithPagination<FormListResponseData>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponseWithPagination<FormListResponseData>
    // response.data là FormListResponseData có property issues và totalViolationCount
    return response.data || { issues: [], totalViolationCount: null }
  },

  sellerUpdateForm: async (formId: string, data: { sellerReply: string; sellerImageFiles?: File[] }): Promise<FormDTO> => {
    const formData = new FormData()
    formData.append('SellerReply', data.sellerReply)

    if (data.sellerImageFiles && data.sellerImageFiles.length > 0) {
      data.sellerImageFiles.forEach((file) => {
        formData.append('SellerImageFiles', file)
      })
    }

    const response = (await axiosInstance.put(`/Issue/seller-update/${formId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })) as ApiResponse<FormDTO>
    // axiosInstance đã trả về response.data, nên response đã là ApiResponse<FormDTO>
    return response.data
  }
}
