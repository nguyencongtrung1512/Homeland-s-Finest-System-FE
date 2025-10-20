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
    const response = await axiosInstance.put(`/Form/customer-update/${id}`, data)
    return response.data
  },

  cancelForm: async (id: string): Promise<void> => {
    await axiosInstance.put(`/cancel-form/${id}`)
  },

  getFormById: async (id: string): Promise<FormDTO> => {
    const response = await axiosInstance.get(`/Form/${id}`)
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

    const response = await axiosInstance.get(`/Form?${queryParams.toString()}`)
    return response.data
  },

  // Admin APIs
  assignStaff: async (staffId: string, formId: string): Promise<void> => {
    await axiosInstance.put(`/Form/Admin/assign-staff/${staffId}/form/${formId}`)
  },

  adminUpdateForm: async (formId: string, data: AdminUpdateRequest): Promise<void> => {
    const formData = new FormData()
    formData.append('AdminText', data.adminText)
    formData.append('Status', data.status)

    await axiosInstance.put(`/Form/${formId}/admin-update`, formData, {
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

    const response = await axiosInstance.get(`/Form?${queryParams.toString()}`)
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

    const response = await axiosInstance.get(`/Form?${queryParams.toString()}`)
    return response.data
  }
}
