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
  slug?: string
  title?: string
  content?: string
  version?: string
  isPublished?: boolean
  type?: string
  effectiveDate?: string
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
  return response.data
}

// Get document by ID
export const getDocumentById = async (id: string): Promise<DocumentType> => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  return response.data
}

// Create new document
export const createDocument = async (data: CreateDocumentData): Promise<DocumentType> => {
  const response = await axiosInstance.post(API_URL, data)
  return response.data
}

// Update document
export const updateDocument = async (id: string, data: UpdateDocumentData): Promise<DocumentType> => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, data)
  return response.data
}

// Delete document
export const deleteDocument = async (id: string): Promise<void> => {
  await axiosInstance.delete(`${API_URL}/${id}`)
}