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

// Interface cho create/update request
export interface HashtagCreateRequest {
  name: string
  storeId: string
  isActive: boolean
}

// Function để lấy tất cả Hashtag
export const getAllHashtags = async (): Promise<HashtagResponse> => {
  const response = await axiosInstance.get(API_URL)
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
export const updateHashtag = async (id: string, data: HashtagCreateRequest): Promise<HashtagSingleResponse> => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response as unknown as HashtagSingleResponse
}

// Function để tìm kiếm Hashtag theo keyword
export const searchHashtags = async (keyword: string): Promise<HashtagResponse> => {
  const response = await axiosInstance.get(API_URL, {
    params: {
      keyword: keyword || ''
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