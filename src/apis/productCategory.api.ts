import axiosInstance from '../service/axiosInstance'

const API_URL = `/ProductCategory`

// Interface cho ProductCategory item
export interface ProductCategoryItem {
  id: string
  name: string
  description: string
  isActive: boolean
  parentId?: string | null // UUID of parent category (null if root category)
  createdAt: string
  updatedAt: string
  // Optional: Only populated when includeParent = true
  parent?: ProductCategoryItem
  // Optional: Only populated when includeChildren = true
  children?: ProductCategoryItem[]
}

// Interface cho response từ API
export interface ProductCategoryResponse {
  status: number
  message: string
  data: ProductCategoryItem[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages: number
  }
}

// Interface cho single category response
export interface ProductCategorySingleResponse {
  status: number
  message: string
  data: ProductCategoryItem
}

// Interface cho pagination parameters
export interface ProductCategoryParams {
  pageSize?: number
  pageNumber?: number
  includeParent?: boolean
  includeChildren?: boolean
}

// Interface cho get by ID parameters
export interface ProductCategoryByIdParams {
  includeParent?: boolean
  includeChildren?: boolean
}

// Interface cho root categories parameters
export interface ProductCategoryRootParams {
  pageSize?: number
  pageNumber?: number
  includeChildren?: boolean
}

// Interface cho children parameters
export interface ProductCategoryChildrenParams {
  includeChildren?: boolean
}

// Interface cho create/update request
export interface ProductCategoryCreateRequest {
  name: string
  description?: string
  isActive?: boolean
  parentId?: string | null
}

// Function để lấy tất cả ProductCategory với pagination
export const getAllProductCategory = async (params?: ProductCategoryParams): Promise<ProductCategoryResponse> => {
  const queryParams = new URLSearchParams()

  if (params?.pageSize !== undefined) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber !== undefined) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  if (params?.includeParent !== undefined) {
    queryParams.append('includeParent', params.includeParent.toString())
  }

  if (params?.includeChildren !== undefined) {
    queryParams.append('includeChildren', params.includeChildren.toString())
  }

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL

  const response = await axiosInstance.get(url)
  // Axios interceptor đã xử lý response, trả về response.data
  return response as unknown as ProductCategoryResponse
}

// Function để lấy ProductCategory theo ID
export const getProductCategoryById = async (
  id: string,
  params?: ProductCategoryByIdParams
): Promise<ProductCategorySingleResponse> => {
  const queryParams = new URLSearchParams()

  if (params?.includeParent !== undefined) {
    queryParams.append('includeParent', params.includeParent.toString())
  }

  if (params?.includeChildren !== undefined) {
    queryParams.append('includeChildren', params.includeChildren.toString())
  }

  const url = queryParams.toString() ? `${API_URL}/${id}?${queryParams.toString()}` : `${API_URL}/${id}`

  const response = await axiosInstance.get(url)
  return response as unknown as ProductCategorySingleResponse
}

// Function để lấy root categories (categories không có parent)
export const getRootProductCategories = async (
  params?: ProductCategoryRootParams
): Promise<ProductCategoryResponse> => {
  const queryParams = new URLSearchParams()

  if (params?.pageSize !== undefined) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber !== undefined) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  if (params?.includeChildren !== undefined) {
    queryParams.append('includeChildren', params.includeChildren.toString())
  }

  const url = queryParams.toString() ? `${API_URL}/roots?${queryParams.toString()}` : `${API_URL}/roots`

  const response = await axiosInstance.get(url)
  return response as unknown as ProductCategoryResponse
}

// Function để lấy children của một category
export const getProductCategoryChildren = async (
  parentId: string,
  params?: ProductCategoryChildrenParams
): Promise<ProductCategoryResponse> => {
  const queryParams = new URLSearchParams()

  if (params?.includeChildren !== undefined) {
    queryParams.append('includeChildren', params.includeChildren.toString())
  }

  const url = queryParams.toString()
    ? `${API_URL}/${parentId}/children?${queryParams.toString()}`
    : `${API_URL}/${parentId}/children`

  const response = await axiosInstance.get(url)
  return response as unknown as ProductCategoryResponse
}

// Function để lấy category tree từ một category (full tree của tất cả descendants)
export const getProductCategoryTree = async (id: string): Promise<ProductCategorySingleResponse> => {
  const response = await axiosInstance.get(`${API_URL}/${id}/tree`)
  return response as unknown as ProductCategorySingleResponse
}

// Function để lấy full category tree từ tất cả root categories
export const getFullProductCategoryTree = async (): Promise<ProductCategoryResponse> => {
  const response = await axiosInstance.get(`${API_URL}/tree`)
  return response as unknown as ProductCategoryResponse
}

// Function để tạo ProductCategory mới
export const createProductCategory = async (
  data: ProductCategoryCreateRequest
): Promise<ProductCategorySingleResponse> => {
  // Tạo FormData để match với API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('Name', data.name)

  if (data.description !== undefined) {
    formData.append('Description', data.description)
  }

  if (data.isActive !== undefined) {
    formData.append('IsActive', data.isActive.toString())
  }

  // Handle ParentId: empty string or null means root category
  if (data.parentId !== undefined && data.parentId !== null && data.parentId !== '') {
    formData.append('ParentId', data.parentId)
  } else {
    // Empty string means root category (no parent)
    formData.append('ParentId', '')
  }

  const response = await axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response as unknown as ProductCategorySingleResponse
}

// Function để cập nhật ProductCategory
export const updateProductCategory = async (
  id: string,
  data: ProductCategoryCreateRequest
): Promise<ProductCategorySingleResponse> => {
  const requestBody: Record<string, string | boolean | null> = {
    name: data.name
  }

  if (data.description !== undefined) {
    requestBody.description = data.description
  }

  if (data.isActive !== undefined) {
    requestBody.isActive = data.isActive
  }

  if (data.parentId !== undefined) {
    requestBody.parentId = data.parentId
  }

  const response = await axiosInstance.put(`${API_URL}/${id}`, requestBody, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response as unknown as ProductCategorySingleResponse
}

// Function để xóa ProductCategory (soft delete - sets IsActive = false)
export const deleteProductCategory = async (id: string): Promise<ProductCategorySingleResponse> => {
  const response = await axiosInstance.put(`${API_URL}/delete/${id}`)
  return response as unknown as ProductCategorySingleResponse
}
