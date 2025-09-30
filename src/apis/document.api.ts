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
  effectiveDate: string
}

export interface UpdateDocumentData {
  slug: string
  title: string
  content: string
  version: string
  isPublished: boolean
  type: string
  effectiveDate: string
}

export interface DocumentListParams {
  pageSize?: number
  pageNumber?: number
  search?: string
  type?: string
  isPublished?: boolean
}

// Get documents list
export const getDocuments = async (params?: DocumentListParams): Promise<DocumentType[]> => {
  const response = await axiosInstance.get(API_URL, {
    params: {
      pageSize: params?.pageSize || 10,
      pageNumber: params?.pageNumber || 1,
      ...(params?.search && { search: params.search }),
      ...(params?.type && { type: params.type }),
      ...(params?.isPublished !== undefined && { isPublished: params.isPublished })
    }
  })

  // Handle different response structures
  if (Array.isArray(response)) {
    return response
  } else if (response && Array.isArray(response.data)) {
    return response.data
  } else if (response && Array.isArray((response as any).items)) {
    return (response as any).items
  } else if (response && response.data && Array.isArray(response.data.data)) {
    return response.data.data
  } else {
    return []
  }
}

// Get document by ID
export const getDocumentById = async (id: string): Promise<DocumentType> => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  return response as unknown as DocumentType
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
  formData.append('effectiveDate', data.effectiveDate)

  const response = await axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response as unknown as DocumentType
}

// Update document
export const updateDocument = async (id: string, data: UpdateDocumentData): Promise<DocumentType> => {
  const formData = new FormData()
  formData.append('slug', data.slug)
  formData.append('title', data.title)
  formData.append('content', data.content)
  formData.append('version', data.version)
  formData.append('isPublished', data.isPublished.toString())
  formData.append('type', data.type)
  formData.append('effectiveDate', data.effectiveDate)

  const response = await axiosInstance.put(`${API_URL}/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response as unknown as DocumentType
}

// Delete document
export const deleteDocument = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${API_URL}/${id}`)
}
