import axiosInstance from '../service/axiosInstance'

const API_URL = `/SystemStorage`

// Interface cho SystemStorage item
export interface SystemStorageItem {
  id: string
  name: string
  description: string
  value: string
}

// Interface cho response từ API
export interface SystemStorageResponse {
  status: number
  message: string
  data: SystemStorageItem[]
}

// Interface cho pagination parameters
export interface SystemStorageParams {
  pageSize?: number
  pageNumber?: number
}

// Function để lấy tất cả SystemStorage với pagination
export const getAllSystemStorage = async (params?: SystemStorageParams) => {
  const queryParams = new URLSearchParams()

  if (params?.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL

  const response = await axiosInstance.get(url)
  // Axios interceptor đã xử lý response, trả về response.data
  return response
}

// Function để tạo SystemStorage mới
export const createSystemStorage = async (data: SystemStorageItem) => {
  const response = await axiosInstance.post(API_URL, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response
}

// Function để cập nhật SystemStorage
export const updateSystemStorage = async (id: string, data: SystemStorageItem) => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response
}

// Function để xóa SystemStorage
export const deleteSystemStorage = async (id: string) => {
  const response = await axiosInstance.delete(`${API_URL}/${id}`)
  return response
}
