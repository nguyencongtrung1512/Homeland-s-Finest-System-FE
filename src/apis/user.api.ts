import axiosInstance from '../service/axiosInstance'
import { staffApi } from './staff.api'
import { sellerApi } from './seller.api'

const API_URL = '/User'

export interface User {
  id: string
  email: string
  password?: string
  gender: string | null
  phoneNumber: string
  role: string
  firstName: string
  lastName: string
  bankAccount: string | null
  toBin: string | null
  avatar: string | null
  userPoint: number
  provinceId: number | null
  isActive: boolean
  note: string | null
  dateOfBirth: string
  editBy: string | null
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

// Helper function để lấy thông tin user dựa trên role
const getUserInfoByRole = async (userId: string, role?: string): Promise<User | null> => {
  try {
    if (role === 'Staff') {
      const response = await staffApi.getStaffInfo(userId)
      return response.data
    } else if (role === 'Seller') {
      const response = await sellerApi.getSellerDetail(userId)
      return response.data
    } else {
      // Default: sử dụng getUserById cho Customer
      return await getUserById(userId)
    }
  } catch (error) {
    console.error('Error fetching user info by role:', error)
    return null
  }
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  gender?: string
  dateOfBirth?: string
  role?: string
  avatar?: string | File
  isActive?: boolean
  isPermission?: boolean
  note?: string
  provinceId?: number
  bankAccount?: string
  toBin?: string
}

export interface UpdateUserResponse {
  status: number
  message: string
  data: User
}

export const updateUser = async (userId: string, data: UpdateUserData): Promise<UpdateUserResponse> => {
  // Lấy thông tin user hiện tại trước khi update
  let currentUser: User | null = null
  try {
    // Thử lấy thông tin từ các API khác nhau dựa trên role
    currentUser = await getUserInfoByRole(userId, data.role)

    // Nếu không lấy được từ role-specific API, thử getUserById
    if (!currentUser) {
      currentUser = await getUserById(userId)
    }
  } catch (error) {
    console.error('Error fetching current user data:', error)
    // Nếu không lấy được thông tin hiện tại, vẫn tiếp tục với data được truyền vào
  }

  const formData = new FormData()

  // Sử dụng giá trị từ data nếu có, nếu không thì dùng giá trị hiện tại
  formData.append('FirstName', data.firstName !== undefined ? data.firstName : currentUser?.firstName || '')
  formData.append('LastName', data.lastName !== undefined ? data.lastName : currentUser?.lastName || '')
  formData.append('Email', data.email !== undefined ? data.email : currentUser?.email || '')
  formData.append('PhoneNumber', data.phoneNumber !== undefined ? data.phoneNumber : currentUser?.phoneNumber || '')
  formData.append('Gender', data.gender !== undefined ? data.gender : currentUser?.gender || '')
  formData.append('DateOfBirth', data.dateOfBirth !== undefined ? data.dateOfBirth : currentUser?.dateOfBirth || '')
  formData.append('Role', data.role !== undefined ? data.role : currentUser?.role || '')

  // Handle avatar - if it's a File, append it directly; if it's a string, append the string
  if (data.avatar !== undefined) {
    if (data.avatar instanceof File) {
      formData.append('Avatar', data.avatar)
    } else {
      formData.append('Avatar', data.avatar)
    }
  } else {
    formData.append('Avatar', currentUser?.avatar || '')
  }
  formData.append(
    'IsActive',
    (data.isActive !== undefined ? data.isActive : (currentUser?.isActive ?? true)).toString()
  )
  formData.append(
    'IsPermission',
    (data.isPermission !== undefined ? data.isPermission : (currentUser?.isPermission ?? true)).toString()
  )
  formData.append('note', (data.note ?? currentUser?.note ?? 'Cập nhật từ trang Profile').trim())
  formData.append(
    'ProvinceId',
    (data.provinceId !== undefined ? data.provinceId : currentUser?.provinceId || '').toString()
  )
  formData.append('BankAccount', data.bankAccount !== undefined ? data.bankAccount : currentUser?.bankAccount || '')
  formData.append('ToBin', data.toBin !== undefined ? data.toBin : currentUser?.toBin || '')

  // Thêm UpdatedAt timestamp
  const now = new Date().toISOString()
  formData.append('UpdatedAt', now)

  const response = await axiosInstance.put(`${API_URL}/update-customer/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}
