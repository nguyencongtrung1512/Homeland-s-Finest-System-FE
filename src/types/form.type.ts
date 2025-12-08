// Form Types
export type FormType = 'ComplaintOrder' | 'ReportSeller' | 'Orther'

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
  status: 'ApprovedByStaff' | 'DeniedByStaff' | 'Confirmed' | 'Rejected'
}

export interface AdminUpdateRequest {
  adminText: string
  status: 'ApprovedByAdmin' | 'DeniedByAdmin'
}

export interface FormDTO {
  id: string
  userId: string
  storeId?: string | null
  orderId?: string | null
  type: FormType
  subject: string
  description: string
  imageUrl: string[]
  status: FormStatus
  reply?: string | null
  staffId?: string | null
  staffName?: string | null
  lastEditId?: string | null
  sellerReply?: string | null
  sellerImages?: string[] | null
  sellerReplyAt?: string
  deadlineForSellerReply?: string
  isSellerReplied?: boolean
  adminId?: string | null
  adminText?: string | null
  createdAt: string
  updatedAt: string
  hasIncreasedReportCount?: boolean
}

// Response data structure for list endpoints
export interface FormListResponseData {
  issues: FormDTO[]
  totalViolationCount?: number | null
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
