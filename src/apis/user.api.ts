import axiosInstance from '../service/axiosInstance'
import { staffApi } from './staff.api'
import { sellerApi } from './seller.api'
import axios from 'axios'

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
  bankName: string | null
  avatar: string | null
  userPoint: number
  provinceId: number | null
  isActive: boolean
  note: string | null
  dateOfBirth: string
  editBy: string | null
  violationCount: number
  isBan: boolean
  banAt: string | null
  banUntil: string | null
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
  bankName?: string
  banUntil?: string | null
}

export interface UpdateUserResponse {
  status: number
  message: string
  data: User
}

// Bank interfaces and API
export interface Bank {
  id: number
  name: string
  code: string
  bin: string
  shortName: string
  logo: string
  transferSupported: number
  lookupSupported: number
}

export interface GetBanksResponse {
  code: string
  desc: string
  data: Bank[]
}

export const getBanks = async (): Promise<Bank[]> => {
  const apiUrl = import.meta.env.VITE_API_VIETQR
  if (!apiUrl) {
    throw new Error('VITE_API_VIETQR không được cấu hình trong file .env')
  }

  try {
    const response = await axios.get<GetBanksResponse>(apiUrl)
    if (response.data.code === '00' && response.data.data) {
      return response.data.data
    }
    throw new Error(response.data.desc || 'Không thể lấy danh sách ngân hàng')
  } catch (error) {
    console.error('Error fetching banks:', error)
    throw error
  }
}

// Bank Account Lookup interfaces and API
export interface BankAccountLookupRequest {
  bank: string // bank code
  account: string // account number
}

export interface BankAccountLookupResponse {
  code: number
  success: boolean
  data: {
    account: string
    bank: string
    ownerName: string
  }
  msg: string
}

export const verifyBankAccount = async (
  bankCode: string,
  accountNumber: string
): Promise<BankAccountLookupResponse> => {
  const apiKey = '7d65308a-69ae-45c6-9e39-f4598f517353key'
  const apiSecret = 'd0a8164c-9aaf-428d-9174-492aa5dee326secret'

  if (!bankCode || !accountNumber) {
    throw new Error('Mã ngân hàng và số tài khoản là bắt buộc')
  }

  try {
    const response = await axios.post<BankAccountLookupResponse>(
      'https://api.banklookup.net',
      {
        bank: bankCode,
        account: accountNumber
      },
      {
        headers: {
          'x-api-key': apiKey,
          'x-api-secret': apiSecret,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  } catch (error) {
    console.error('Error verifying bank account:', error)
    if (axios.isAxiosError(error)) {
      const errorMessage =
        (error.response?.data as { msg?: string })?.msg ||
        error.response?.statusText ||
        'Không thể kiểm tra tài khoản ngân hàng'
      throw new Error(errorMessage)
    }
    throw error
  }
}



// Helper function to format date from DD-MM-YYYY to YYYY-MM-DD
const formatDateOfBirthForAPI = (dateString: string): string => {
  if (!dateString) return ''

  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString
  }

  // Convert from DD-MM-YYYY to YYYY-MM-DD
  const parts = dateString.split('-')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month}-${day}`
  }

  // If format is different, try to parse as Date
  try {
    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0] // Returns YYYY-MM-DD
    }
  } catch (e) {
    console.error('Error parsing date:', e)
  }

  return dateString // Return original if can't parse
}

export const updateUser = async (userId: string, data: UpdateUserData): Promise<UpdateUserResponse> => {
  let currentUser: User | null = null
  try {
    currentUser = await getUserInfoByRole(userId, data.role)

    if (!currentUser) {
      currentUser = await getUserById(userId)
    }
  } catch (error) {
    console.error('Error fetching current user data:', error)
  }

  const formData = new FormData()

  // Sử dụng giá trị từ data nếu có, nếu không thì dùng giá trị hiện tại
  formData.append('FirstName', data.firstName !== undefined ? data.firstName : currentUser?.firstName || '')
  formData.append('LastName', data.lastName !== undefined ? data.lastName : currentUser?.lastName || '')
  formData.append('Email', data.email !== undefined ? data.email : currentUser?.email || '')
  formData.append('PhoneNumber', data.phoneNumber !== undefined ? data.phoneNumber : currentUser?.phoneNumber || '')
  formData.append('Gender', data.gender !== undefined ? data.gender : currentUser?.gender || '')

  // Format dateOfBirth to YYYY-MM-DD before sending to API
  const dateOfBirthValue = data.dateOfBirth !== undefined ? data.dateOfBirth : currentUser?.dateOfBirth || ''
  formData.append('DateOfBirth', formatDateOfBirthForAPI(dateOfBirthValue))

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

  formData.append('note', (data.note ?? currentUser?.note ?? 'Cập nhật từ trang Profile').trim())
  formData.append(
    'ProvinceId',
    (data.provinceId !== undefined ? data.provinceId : currentUser?.provinceId || '').toString()
  )
  formData.append('BankAccount', data.bankAccount !== undefined ? data.bankAccount : currentUser?.bankAccount || '')
  formData.append('bankName', data.bankName !== undefined ? data.bankName : currentUser?.bankName || '')

  // Handle ban/unban logic
  // Ban tạm thời: isActive = false và có banUntil (có giá trị thời gian)
  // Ban vĩnh viễn: isActive = false và không truyền banUntil (undefined)
  // Unban: isActive = true và banUntil = null hoặc '' (xóa ban)
  if (data.banUntil !== undefined) {
    // Nếu banUntil là null, gửi rỗng string để xóa ban
    // Nếu banUntil có giá trị, gửi giá trị đó (ban tạm thời)
    const banUntilValue = data.banUntil || ''
    formData.append('BanUntil', banUntilValue)
  } else {
    // Nếu không có banUntil trong data (undefined), giữ nguyên giá trị hiện tại
    formData.append('BanUntil', currentUser?.banUntil || '')
  }

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
