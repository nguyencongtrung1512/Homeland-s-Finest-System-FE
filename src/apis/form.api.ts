import axiosInstance from '../service/axiosInstance'

// Form Types
export type FormType =
  | 'SupportAccount'
  | 'SupportPayment'
  | 'SupportTechnical'
  | 'ComplaintContent'
  | 'RequestInformation'
  | 'ReportSeller'
  | 'FeedbackSuggestion'
  | 'PrivacyDataRequest'
  | 'SupportMarketing'
  | 'SupportOther'
  | 'SupportRefundMoney'

// Form Status
export type FormStatus =
  | 'Pending'
  | 'Processing'
  | 'ApprovedByStaff'
  | 'RejectedByStaff'
  | 'ApprovedByAdmin'
  | 'RejectedByAdmin'
  | 'Cancel'

// Form Interfaces
export interface CreateFormRequest {
  userId: string
  orderId?: string
  type: FormType
  subject: string
  description: string
  imageFiles?: File[]
}

export interface UpdateFormRequest {
  orderId?: string
  type: FormType
  subject: string
  description: string
  imageUrl?: string[]
}

export interface StaffUpdateRequest {
  reply: string
  status: 'ApprovedByStaff' | 'RejectedByStaff'
}

export interface AdminUpdateRequest {
  adminText: string
  status: 'ApprovedByAdmin' | 'RejectedByAdmin'
}

export interface FormDTO {
  id: string
  userId: string
  orderId?: string
  type: FormType
  subject: string
  description: string
  imageUrl: string[]
  status: FormStatus
  reply?: string
  staffId?: string
  staffName?: string
  adminId?: string
  adminText?: string
  createdAt: string
  updatedAt: string
}

export interface FormQueryParams {
  pageSize: number
  pageNumber: number
  userId?: string
  status?: FormStatus
  type?: FormType
  sortBy?: 'status' | 'type' | 'createdat'
  sortOrder?: 'asc' | 'desc'
}

// API Functions
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

    const response = await axiosInstance.post('/api/form', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  updateForm: async (id: string, data: UpdateFormRequest): Promise<FormDTO> => {
    const response = await axiosInstance.put(`/api/form/customer-update/${id}`, data)
    return response.data
  },

  cancelForm: async (id: string): Promise<void> => {
    await axiosInstance.put(`/cancel-form/${id}`)
  },

  getFormById: async (id: string): Promise<FormDTO> => {
    const response = await axiosInstance.get(`/api/form/${id}`)
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

    const response = await axiosInstance.get(`/api/form?${queryParams.toString()}`)
    return response.data
  },

  // Admin APIs
  assignStaff: async (staffId: string, formId: string): Promise<void> => {
    await axiosInstance.put(`/api/form/Admin/assign-staff/${staffId}/form/${formId}`)
  },

  adminUpdateForm: async (formId: string, data: AdminUpdateRequest): Promise<void> => {
    await axiosInstance.put(`/api/form/${formId}/admin-update`, data)
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

    const response = await axiosInstance.get(`/api/form?${queryParams.toString()}`)
    return response.data
  },

  // Staff APIs
  staffUpdateForm: async (formId: string, data: StaffUpdateRequest): Promise<void> => {
    await axiosInstance.put(`/api/form/${formId}/staff-update`, data)
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

    const response = await axiosInstance.get(`/api/form?${queryParams.toString()}`)
    return response.data
  }
}
