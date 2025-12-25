export interface ProductCertificateType {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  reviewedByStaffId: string // UUID - Foreign key to Staff
  imageUrl: string // varchar(500)
  status: string // varchar(50) - có thể là bất kỳ string nào
  staffNotes: string // text
  submittedDate: string // ISO date string
  decisionDate: string // ISO date string
  updatedAt: string // ISO date string
}

export interface ProductCertificateCreateInput {
  productId: string
  certificateImage: File // File object cho multipart/form-data
  status: string // Status based on validation level
}

export interface ProductCertificateUpdateInput {
  reviewedByStaffId?: string
  imageUrl?: string
  status?: string
  staffNotes?: string
  submittedDate?: string
  decisionDate?: string
}

// Response từ API GET
export interface ProductCertificateListResponse {
  status: number
  message: string
  data: ProductCertificateType[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}
export interface ProductCertificateResponse {
  status: number
  message: string
  data: ProductCertificateType
}
