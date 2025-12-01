import axiosInstance from '../service/axiosInstance'
import type {
  AdminUpdateRequest,
  CreateFormRequest,
  FormDTO,
  FormQueryParams,
  StaffUpdateRequest,
  UpdateFormRequest
} from '../types/form.type'

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

    const response = await axiosInstance.post('/Form', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
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

    const response = await axiosInstance.put(`/Form/customer-update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  cancelForm: async (id: string): Promise<void> => {
    await axiosInstance.put(`/Issue/cancel-form/${id}`)
  },

  getFormById: async (id: string): Promise<FormDTO> => {
    const response = await axiosInstance.get(`/Form/${id}`)
    return response.data
  },

  getFormByOrderId: async (orderId: string): Promise<FormDTO> => {
    const response = await axiosInstance.get(`/Issue/detail-by-orderId/${orderId}`)
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

    const response = await axiosInstance.get(`/Issue?${queryParams.toString()}`)
    return response.data
  },

  // Admin APIs
  assignStaff: async (staffId: string, formId: string): Promise<void> => {
    await axiosInstance.put(`/Issue/Admin/assign-staff/${staffId}/Issue/${formId}`)
  },

  adminUpdateForm: async (formId: string, data: AdminUpdateRequest): Promise<void> => {
    const formData = new FormData()
    formData.append('AdminText', data.adminText)
    formData.append('Status', data.status)

    await axiosInstance.put(`/Issue/${formId}/admin-update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
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

    const response = await axiosInstance.get(`/Issue?${queryParams.toString()}`)
    return response.data
  },

  // Staff APIs
  staffUpdateForm: async (formId: string, data: StaffUpdateRequest): Promise<void> => {
    const formData = new FormData()
    formData.append('Reply', data.reply)
    formData.append('Status', data.status)

    await axiosInstance.put(`/Form/${formId}/staff-update`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
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

    const response = await axiosInstance.get(`/Issue?${queryParams.toString()}`)
    return response.data
  },

  // Seller APIs
  getFormsByStoreId: async (storeId: string, params?: Partial<FormQueryParams>): Promise<FormDTO[]> => {
    const queryParams = new URLSearchParams()
    queryParams.append('storeId', storeId)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString())
        }
      })
    }

    const response = await axiosInstance.get(`/Issue?${queryParams.toString()}`)
    return response.data
  },

  sellerUpdateForm: async (formId: string, data: { sellerReply: string; sellerImageFiles?: File[] }): Promise<void> => {
    const formData = new FormData()
    formData.append('SellerReply', data.sellerReply)

    if (data.sellerImageFiles && data.sellerImageFiles.length > 0) {
      data.sellerImageFiles.forEach((file) => {
        formData.append('SellerImageFiles', file)
      })
    }

    await axiosInstance.put(`/Issue/seller-update/${formId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}
