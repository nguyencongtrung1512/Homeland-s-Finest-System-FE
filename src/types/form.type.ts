// Form Types
export type FormType =
  | 'SupportAccount'
  | 'SupportPayment'
  | 'SupportTechnical'
  | 'ComplaintContent'
  | 'ComplaintOrder'
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
  | 'WaitingSellerResponse'
  | 'Cancel'

export interface CreateFormRequest {
  userId: string
  storeId?: string
  orderId?: string
  type: FormType
  subject: string
  description: string
  imageFiles?: File[]
}

export interface UpdateFormRequest {
  storeId?: string
  orderId?: string
  type: FormType
  subject: string
  description: string
  imageFiles?: File[]
  existingImageUrls?: string[]
}

export interface StaffUpdateRequest {
  reply: string
  status: 'ApprovedByStaff' | 'DeniedByStaff' | 'WaitingSellerResponse' | 'Rejected'
}

export interface AdminUpdateRequest {
  adminText: string
  status: 'ApprovedByAdmin' | 'DeniedByAdmin'
}

export interface FormDTO {
  id: string
  userId: string
  storeId?: string
  orderId?: string
  type: FormType
  subject: string
  description: string
  imageUrl: string[]
  status: FormStatus
  reply?: string
  staffId?: string
  staffName?: string
  lastEditId?: string
  sellerReply?: string
  sellerImages?: string[]
  sellerReplyAt?: string
  deadlineForSellerReply?: string
  isSellerReplied?: boolean
  adminId?: string
  adminText?: string
  createdAt: string
  updatedAt: string
}

export interface FormQueryParams {
  pageSize: number
  pageNumber: number
  userId?: string
  storeId?: string
  status?: FormStatus
  type?: FormType
  sortBy?: 'status' | 'type' | 'createdat'
  sortOrder?: 'asc' | 'desc'
}
