import axiosInstance from '../service/axiosInstance'

const API_URL = `/Hashtag`

// Interface cho Hashtag item
export interface HashtagItem {
  id: string
  name: string
  description: string
  usageCount: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

// Interface cho response từ API (list)
export interface HashtagResponse {
  status: number
  message: string
  data: HashtagItem[]
  pagination: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

// Interface cho single hashtag response
export interface HashtagSingleResponse {
  status: number
  message: string
  data: HashtagItem
}

// Interface cho create request
export interface HashtagCreateRequest {
  name: string
  storeId: string
  usageCount?: number
  isActive?: boolean
}

// Interface cho update request
export interface HashtagUpdateRequest {
  name?: string
  storeId?: string
  usageCount?: number
  isActive?: boolean
}

// Function để lấy tất cả Hashtag với pagination (dành cho Staff)
export const getAllHashtags = async (
  pageSize: number = 0,
  pageNumber: number = 1,
  description?: string
): Promise<HashtagResponse> => {
  const params: any = {
    pageSize,
    pageNumber
  }
  if (description) {
    params.description = description
  }
  const response = await axiosInstance.get(API_URL, { params })
  return response as unknown as HashtagResponse
}

// Function để lấy Hashtag theo storeId (dành cho Seller)
export const getHashtagsByStoreId = async (
  storeId: string,
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<HashtagResponse> => {
  const params: any = {
    pageSize,
    pageNumber
  }
  const response = await axiosInstance.get(`${API_URL}/store/${storeId}`, { params })
  return response as unknown as HashtagResponse
}

// Function để tạo Hashtag mới
export const createHashtag = async (data: HashtagCreateRequest): Promise<HashtagSingleResponse> => {
  const response = await axiosInstance.post(API_URL, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response as unknown as HashtagSingleResponse
}

// Function để cập nhật Hashtag
export const updateHashtag = async (id: string, data: HashtagUpdateRequest): Promise<HashtagSingleResponse> => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response as unknown as HashtagSingleResponse
}

// Function để tìm kiếm Hashtag theo description
export const searchHashtags = async (
  description: string,
  pageSize: number = 0,
  pageNumber: number = 1
): Promise<HashtagResponse> => {
  const response = await axiosInstance.get(API_URL, {
    params: {
      pageSize,
      pageNumber,
      description: description || ''
    }
  })
  return response as unknown as HashtagResponse
}

// Function để lấy Hashtag theo ID
export const getHashtagById = async (id: string): Promise<HashtagSingleResponse> => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  return response as unknown as HashtagSingleResponse
}

// Function để xóa mềm Hashtag (soft delete)
export const softDeleteHashtag = async (id: string): Promise<HashtagSingleResponse> => {
  const response = await axiosInstance.put(`${API_URL}/delete-hashtag/${id}`)
  return response as unknown as HashtagSingleResponse
}

// Function để xóa cứng Hashtag (hard delete)
export const deleteHashtag = async (id: string): Promise<HashtagSingleResponse> => {
  const response = await axiosInstance.delete(`${API_URL}/${id}`)
  return response as unknown as HashtagSingleResponse
}