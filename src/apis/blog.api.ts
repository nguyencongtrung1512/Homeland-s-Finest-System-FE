import axiosInstance from '../service/axiosInstance'

const API_URL = `/Blog`

// Interface cho User (tác giả blog)
export interface BlogUser {
  id: string
  email: string
  gender: string
  phoneNumber: string
  role: string
  firstName: string
  lastName: string
  avatar: string
  isActive: boolean
  note: string
  dateOfBirth: string
  isPermission: boolean
  createdAt: string
  updatedAt: string
}

// Interface cho Blog item
export interface BlogItem {
  blogId: string
  userId: string
  blogCategoryId: string[]
  title: string
  description: string
  content: string
  image: string
  isActive: boolean | null | string
  createdAt: string
  updatedAt: string
  user: BlogUser
}

// Interface cho response từ API
export interface BlogResponse {
  status: number
  message: string
  data: BlogItem[]
}

// Interface cho single Blog response
export interface BlogSingleResponse {
  status: number
  message: string
  data: BlogItem
}

// Interface cho pagination parameters
export interface BlogParams {
  pageSize?: number
  pageNumber?: number
  search?: string
  categoryId?: string
  userId?: string
  isActive?: boolean
}

// Interface cho tạo Blog mới
export interface CreateBlogInput {
  userId: string
  blogCategoryId: string[]
  title: string
  description: string
  content: string
  image: string
}

// Interface cho cập nhật Blog
export interface UpdateBlogInput {
  blogCategoryId?: string[]
  title?: string
  description?: string
  content?: string
  image?: string
  isActive?: boolean
}

// Function để lấy tất cả Blog với pagination và filters
export const getAllBlog = async (params?: BlogParams) => {
  const queryParams = new URLSearchParams()

  if (params?.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  if (params?.search) {
    queryParams.append('search', params.search)
  }

  if (params?.categoryId) {
    queryParams.append('categoryId', params.categoryId)
  }

  if (params?.userId) {
    queryParams.append('userId', params.userId)
  }

  if (params?.isActive !== undefined) {
    queryParams.append('isActive', params.isActive.toString())
  }

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL

  const response = await axiosInstance.get(url)
  return response
}

// Function để lấy Blog theo ID
export const getBlogById = async (id: string) => {
  const response = await axiosInstance.get(`${API_URL}/${id}`)
  return response
}

// Function để tạo Blog mới
export const createBlog = async (data: CreateBlogInput) => {
  // Tạo FormData để match với API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('UserId', data.userId)

  // Xử lý array cho blogCategoryId
  data.blogCategoryId.forEach((categoryId, index) => {
    formData.append(`BlogCategoryId[${index}]`, categoryId)
  })

  formData.append('Title', data.title)
  formData.append('Description', data.description)
  formData.append('Content', data.content)
  formData.append('Image', data.image)

  const response = await axiosInstance.post(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}

// Function để cập nhật Blog
export const updateBlog = async (id: string, data: FormData | UpdateBlogInput) => {
  let headers = {}

  if (data instanceof FormData) {
    headers = {
      'Content-Type': 'multipart/form-data'
    }
  } else {
    headers = {
      'Content-Type': 'application/json'
    }
    data = convertToFormData(data)
  }

  const response = await axiosInstance.put(`${API_URL}/${id}`, data, {
    headers
  })
  return response
}

// Hàm hỗ trợ chuyển đổi object thành FormData
function convertToFormData(data: UpdateBlogInput): FormData {
  const formData = new FormData()

  if (data.title) formData.append('Title', data.title)
  if (data.description) formData.append('Description', data.description)
  if (data.content) formData.append('Content', data.content)

  if (data.blogCategoryId && data.blogCategoryId.length > 0) {
    data.blogCategoryId.forEach((categoryId, index) => {
      formData.append(`BlogCategoryId[${index}]`, categoryId)
    })
  }

  if (data.image) formData.append('Image', data.image)
  if (data.isActive !== undefined) formData.append('IsActive', data.isActive.toString())

  return formData
}

// Function để lấy Blog theo category
export const getBlogByCategory = async (categoryId: string, params?: Omit<BlogParams, 'categoryId'>) => {
  const queryParams = new URLSearchParams()
  queryParams.append('categoryId', categoryId)

  if (params?.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  if (params?.search) {
    queryParams.append('search', params.search)
  }

  if (params?.userId) {
    queryParams.append('userId', params.userId)
  }

  if (params?.isActive !== undefined) {
    queryParams.append('isActive', params.isActive.toString())
  }

  const url = `${API_URL}/category/${categoryId}?${queryParams.toString()}`
  const response = await axiosInstance.get(url)
  return response
}

// Function để cập nhật trạng thái active của Blog
export const updateBlogActiveStatus = async (id: string, isActive: boolean) => {
  const response = await axiosInstance.patch(`${API_URL}/${id}/active`, { isActive })
  return response
}

// Function để xóa Blog
export const deleteBlog = async (id: string) => {
  const response = await axiosInstance.put(`/Blog/delete-blog/${id}`, null, {
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return response
}

// Export tất cả functions như một object để dễ sử dụng
export const blogApi = {
  getAll: getAllBlog,
  getById: getBlogById,
  create: createBlog,
  update: updateBlog,
  getByCategory: getBlogByCategory,
  updateActiveStatus: updateBlogActiveStatus,
  delete: deleteBlog
}

export default blogApi
