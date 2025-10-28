import axiosInstance from '../service/axiosInstance'

const API_URL = `/BlogCategory`

// Interface cho BlogCategory item
export interface BlogCategoryItem {
  categoryId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

// Interface cho Blog item trong danh mục
export interface BlogItem {
  blogId: string
  title: string
  description: string
  image: string
  createdAt: string
}

export interface BlogCategoryDetail extends BlogCategoryItem {
  blogs: BlogItem[]
}

// Interface cho pagination info
export interface PaginationInfo {
  pageSize: number
  pageNumber: number
  totalItems: number
  totalPages: number
}

// Interface cho response từ API
export interface BlogCategoryResponse {
  status: number
  message: string
  data: BlogCategoryItem[]
  pagination?: PaginationInfo
}

// Interface cho single BlogCategory response
export interface BlogCategorySingleResponse {
  status: number
  message: string
  data: BlogCategoryItem
}

// Interface cho BlogCategoryDetail response
export interface BlogCategoryDetailResponse {
  status: number
  message: string
  data: BlogCategoryDetail
}

// Interface cho pagination parameters
export interface BlogCategoryParams {
  pageSize?: number
  pageNumber?: number
}

// Interface cho tạo BlogCategory mới
export interface CreateBlogCategoryInput {
  name: string
  isActive: boolean
}

// Interface cho cập nhật BlogCategory
export interface UpdateBlogCategoryInput {
  name?: string
  isActive?: boolean
}

// Function để lấy tất cả BlogCategory với pagination
export const getAllBlogCategory = async (params?: BlogCategoryParams) => {
  const queryParams = new URLSearchParams()

  if (params?.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL

  const response = await axiosInstance.get(url)
  return response
}

// Function để lấy BlogCategory theo ID
export const getBlogCategoryById = async (id: string) => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  return response
}

// Function để lấy chi tiết BlogCategory kèm danh sách blogs
export const getBlogCategoryDetail = async (id: string) => {
  const response = await axiosInstance.get(`${API_URL}?categoryId=${id}`)
  return response
}

// Function để tạo BlogCategory mới
export const createBlogCategory = async (data: CreateBlogCategoryInput) => {
  // Tạo FormData để match với API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('Name', data.name)
  formData.append('IsActive', data.isActive.toString())

  const response = await axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}

// Function để cập nhật BlogCategory
export const updateBlogCategory = async (id: string, data: UpdateBlogCategoryInput) => {
  const response = await axiosInstance.put(`${API_URL}/${id}`, data, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response
}

// Export tất cả functions như một object để dễ sử dụng
export const blogCategoryApi = {
  getAll: getAllBlogCategory,
  getById: getBlogCategoryById,
  getDetail: getBlogCategoryDetail,
  create: createBlogCategory,
  update: updateBlogCategory
}

export default blogCategoryApi
