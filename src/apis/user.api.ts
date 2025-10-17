import axiosInstance from '../service/axiosInstance'

const API_URL = '/User'

export interface User {
  id: string
  email: string
  gender: string | null
  phoneNumber: string
  role: string
  firstName: string
  lastName: string
  avatar: string | null
  isActive: boolean
  note: string | null
  dateOfBirth: string
  isPermission: boolean
  createdAt: string
  updatedAt: string
}

export interface GetUsersResponse {
  status: number
  message: string
  data: User[]
}

export interface GetUserByIdResponse {
  status: number
  message: string
  data: User
}

export interface GetUsersParams {
  pageSize?: number
  pageNumber?: number
  searchTerm?: string
  role?: string
  isActive?: boolean
}

export const getUsers = async (params?: GetUsersParams): Promise<User[]> => {
  const queryParams = new URLSearchParams()

  if (params?.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString())
  }

  if (params?.pageNumber) {
    queryParams.append('pageNumber', params.pageNumber.toString())
  }

  if (params?.searchTerm) {
    queryParams.append('searchTerm', params.searchTerm)
  }

  if (params?.role) {
    queryParams.append('role', params.role)
  }

  if (params?.isActive !== undefined) {
    queryParams.append('isActive', params.isActive.toString())
  }

  const url = queryParams.toString() ? `${API_URL}?${queryParams.toString()}` : API_URL

  const response = await axiosInstance.get(url)
  return response.data
}

export const getUserById = async (userId: string): Promise<User> => {
  const response = await axiosInstance.get(`${API_URL}/customer-infor/${userId}`)
  return response.data
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  gender?: string
  dateOfBirth?: string
  role?: string
  avatar?: string
  isActive?: boolean
  isPermission?: boolean
  note?: string
}

export interface UpdateUserResponse {
  status: number
  message: string
  data: User
}

export const updateUser = async (userId: string, data: UpdateUserData): Promise<UpdateUserResponse> => {
  // Tạo FormData để match với API requirement (multipart/form-data)
  const formData = new FormData()

  if (data.firstName !== undefined) formData.append('FirstName', data.firstName)
  if (data.lastName !== undefined) formData.append('LastName', data.lastName)
  if (data.email !== undefined) formData.append('Email', data.email)
  if (data.phoneNumber !== undefined) formData.append('PhoneNumber', data.phoneNumber)
  if (data.gender !== undefined) formData.append('Gender', data.gender)
  if (data.dateOfBirth !== undefined) formData.append('DateOfBirth', data.dateOfBirth)
  if (data.role !== undefined) formData.append('Role', data.role)
  if (data.avatar !== undefined) formData.append('Avatar', data.avatar)
  if (data.isActive !== undefined) formData.append('IsActive', data.isActive.toString())
  if (data.isPermission !== undefined) formData.append('IsPermission', data.isPermission.toString())
  if (data.note !== undefined) formData.append('Note', data.note)

  // Thêm các field bắt buộc với giá trị hiện tại (có thể cần lấy từ user hiện tại)
  const now = new Date().toISOString()
  formData.append('UpdatedAt', now)

  const response = await axiosInstance.put(`${API_URL}/customer-infor/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}
