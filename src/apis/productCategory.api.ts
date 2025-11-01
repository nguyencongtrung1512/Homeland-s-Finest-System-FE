import axiosInstance from '../service/axiosInstance'

const API_URL = `/ProductCategory`

// Interface cho ProductCategory item
export interface ProductCategoryItem {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Interface cho response từ API
export interface ProductCategoryResponse {
  status: number
  message: string
  data: ProductCategoryItem[]
}

// Interface cho pagination parameters
export interface ProductCategoryParams {
  pageSize?: number
  pageNumber?: number
}

// Function để lấy tất cả ProductCategory với pagination
export const getAllProductCategory = async (params?: ProductCategoryParams) => {
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

// Function để lấy ProductCategory theo ID
export const getProductCategoryById = async (id: string) => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  return response
}

// Function để tạo ProductCategory mới
export const createProductCategory = async (data: ProductCategoryItem) => {
  // Tạo FormData để match với API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('Name', data.name)
  formData.append('Description', data.description)
  formData.append('IsActive', data.isActive.toString())

  const response = await axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}

// Function để cập nhật ProductCategory
export const updateProductCategory = async (id: string, data: ProductCategoryItem) => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response
}
