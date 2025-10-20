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

export type FormStatus =
  | 'Pending'
  | 'Processing'
  | 'DeniedByAdmin'
  | 'DeniedByStaff'
  | 'ApprovedByStaff'
  | 'ApprovedByAdmin'
  | 'Rejected'
  | 'Confirmed'
  | 'Cancel'

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
  status: 'ApprovedByStaff' | 'DeniedByStaff'
}

export interface AdminUpdateRequest {
  adminText: string
  status: 'ApprovedByAdmin' | 'DeniedByAdmin'
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
