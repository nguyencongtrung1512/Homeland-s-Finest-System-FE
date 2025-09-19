export interface ProductCertificate {
  id: string // UUID
  productId: string // UUID - Foreign key to Product
  reviewedByStaffId: string // UUID - Foreign key to Staff
  approvedByAdminId?: string // UUID - Foreign key to Admin (optional)
  imageUrl: string // varchar(500)
  status: 'pending' | 'approved' | 'rejected' | 'under_review' // varchar(50)
  staffNotes?: string // text
  adminFeedback?: string // text
  submittedDate: string // TIMESTAMPTZ
  decisionDate?: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface ProductCertificateCreateInput {
  productId: string
  reviewedByStaffId: string
  imageUrl: string
  status?: 'pending' | 'approved' | 'rejected' | 'under_review'
  staffNotes?: string
  submittedDate?: string
}

export interface ProductCertificateUpdateInput {
  approvedByAdminId?: string
  status?: 'pending' | 'approved' | 'rejected' | 'under_review'
  staffNotes?: string
  adminFeedback?: string
  decisionDate?: string
}
