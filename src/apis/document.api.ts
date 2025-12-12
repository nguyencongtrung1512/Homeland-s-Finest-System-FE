import axiosInstance from '../service/axiosInstance'

const API_URL = '/Document'

export interface DocumentType {
  id: string
  slug: string
  title: string
  content: string
  version: string
  isPublished: boolean
  type: string
  effectiveDate: string
  createdAt: string
  updatedAt: string
}

export interface CreateDocumentData {
  slug: string
  title: string
  content: string
  version: string
  isPublished: boolean
  type: string
}

export interface UpdateDocumentData {
  slug?: string
  title?: string
  content?: string
  isPublished?: boolean
}

export interface DocumentListParams {
  pageSize?: number
  pageNumber?: number
}

export interface DocumentListResponse {
  data: DocumentType[]
  pagination?: {
    pageNumber: number
    pageSize: number
    totalItems: number
  }
}

// Get documents list
export const getDocuments = async (params?: DocumentListParams): Promise<DocumentListResponse> => {
  const response = await axiosInstance.get(`${API_URL}/type/Seller`, {
    params: {
      pageSize: params?.pageSize || 10,
      pageNumber: params?.pageNumber || 1
    }
  })

  const responseData = response.data || response

  // Handle ApiResponseWithPagination structure
  let documents: DocumentType[] = []
  let pagination: {
    pageNumber: number
    pageSize: number
    totalItems: number
  } | undefined

  if (Array.isArray(responseData)) {
    documents = responseData
  } else if (responseData && typeof responseData === 'object') {
    if (Array.isArray(responseData.data)) {
      documents = responseData.data
    } else if (Array.isArray(responseData)) {
      documents = responseData
    }

    if (responseData.pagination) {
      pagination = {
        pageNumber: responseData.pagination.pageNumber || params?.pageNumber || 1,
        pageSize: responseData.pagination.pageSize || params?.pageSize || 10,
        totalItems: responseData.pagination.totalItems || 0
      }
    }
  }

  return { data: documents, pagination }
}

// Get document by ID
export const getDocumentById = async (id: string): Promise<DocumentType> => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  const responseData = response.data || response

  if (responseData && responseData.data) {
    return responseData.data
  }
  return responseData as DocumentType
}

// Create new document
export const createDocument = async (data: CreateDocumentData): Promise<DocumentType> => {
  const formData = new FormData()
  formData.append('slug', data.slug)
  formData.append('title', data.title)
  formData.append('content', data.content)
  formData.append('version', data.version)
  formData.append('isPublished', data.isPublished.toString())
  formData.append('type', data.type)

  const response = await axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  const responseData = response.data || response
  if (responseData && responseData.data) {
    return responseData.data
  }
  return responseData as DocumentType
}

// Update document
export const updateDocument = async (id: string, data: UpdateDocumentData): Promise<DocumentType> => {
  const formData = new FormData()
  if (data.slug) formData.append('slug', data.slug)
  if (data.title) formData.append('title', data.title)
  if (data.content) formData.append('content', data.content)
  if (data.isPublished !== undefined) formData.append('isPublished', data.isPublished.toString())

  const response = await axiosInstance.put(`${API_URL}/Update-document/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  const responseData = response.data || response
  if (responseData && responseData.data) {
    return responseData.data
  }
  return responseData as DocumentType
}

// Delete document (soft delete)
export const deleteDocument = async (id: string): Promise<DocumentType> => {
  const response = await axiosInstance.put(`${API_URL}/delete-document/${id}`)
  const responseData = response.data || response

  if (responseData && responseData.data) {
    return responseData.data
  }
  return responseData as DocumentType
}
