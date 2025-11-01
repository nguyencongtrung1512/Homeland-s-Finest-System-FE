import axiosInstance from '../service/axiosInstance'

const API_URL = `/Auth`
const API_URL_CUSTOMER = `/Customer`
const API_URL_SELLER = `/Seller`
const API_URL_STAFF = `/Staff`

export interface RegisterCustomerData {
  email: string
  password: string
  firstName: string
  lastName: string
  gender: string
  phoneNumber: string
  dateOfBirth: string
  provinceId: number
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  status: number
  message: string
  data: {
    token: string
    expiresAt: string
  }
}

// Interface cho response sau khi qua axios interceptor (chỉ trả về data)
export interface LoginResponseData {
  token: string
  expiresAt: string
  role: string
  userId: string
  email: string
  isPermission: boolean
}

export const registerCustomer = async (data: RegisterCustomerData) => {
  // Create FormData to match the API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('Email', data.email)
  formData.append('Password', data.password)
  formData.append('FirstName', data.firstName)
  formData.append('LastName', data.lastName)
  formData.append('Gender', data.gender)
  formData.append('PhoneNumber', data.phoneNumber)
  formData.append('DateOfBirth', data.dateOfBirth)
  formData.append('PronviceId', data.provinceId.toString())

  const response = await axiosInstance.post(`${API_URL_CUSTOMER}/Register`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  // Trả về toàn bộ response thay vì response.data vì interceptor đã xử lý
  return response
}

export const login = async (data: LoginData): Promise<LoginResponseData> => {
  const response = await axiosInstance.post(`${API_URL}/login`, data)
  return response.data
}

// Seller Login
export const loginSeller = async (data: LoginData): Promise<LoginResponseData> => {
  const response = await axiosInstance.post(`${API_URL}/login`, data)
  return response.data
}

export interface LogoutResponse {
  status: number
  message: string
  data: null
}

export interface ResetPasswordRequest {
  email: string
}

export interface ResetPasswordResponse {
  success: boolean
  message: string
  requestedAt: string
}

export interface ChangePasswordRequest {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export const logout = async (): Promise<LogoutResponse> => {
  const response = await axiosInstance.post(`${API_URL}/logout`)
  // Axios interceptor trả về response.data, nên response đã có cấu trúc LogoutResponse
  return response as unknown as LogoutResponse
}

export const resetPassword = async (data: ResetPasswordRequest): Promise<any> => {
  const response = await axiosInstance.post(`${API_URL}/reset-password`, data)
  return response
}

export const changePassword = async (data: ChangePasswordRequest): Promise<any> => {
  const response = await axiosInstance.post(`${API_URL}/change-password`, data)
  return response
}

// Seller Registration Interfaces
export interface SellerRegistrationData {
  userInfo: {
    email: string
    password: string
    confirmPassword: string
    firstName: string
    lastName: string
    phoneNumber: string
    gender: string
    dateOfBirth: string
  }
  sellerInfo: {
    businessName: string
    taxCode: string
    bankAccount: string
    identifyCard: string
    identifyFrontImage: File
    identifyBackImage: File
    businessLicense: File
  }
  storeInfo: {
    storeName: string
    address: string
    province: string
    district: string
    ward: string
    provinceID: number
    districtID: number
    wardID: number
    description: string
    vendorApplicationImageUrl: File[]
  }
}

export const registerSeller = async (data: SellerRegistrationData) => {
  // Create FormData for multipart/form-data
  const formData = new FormData()

  // Add userInfo
  formData.append('UserInfo.Email', data.userInfo.email)
  formData.append('UserInfo.Password', data.userInfo.password)
  formData.append('UserInfo.ConfirmPassword', data.userInfo.confirmPassword)
  formData.append('UserInfo.FirstName', data.userInfo.firstName)
  formData.append('UserInfo.LastName', data.userInfo.lastName)
  formData.append('UserInfo.PhoneNumber', data.userInfo.phoneNumber)
  formData.append('UserInfo.Gender', data.userInfo.gender)
  formData.append('UserInfo.DateOfBirth', data.userInfo.dateOfBirth)

  // Add sellerInfo
  formData.append('SellerInfo.BusinessName', data.sellerInfo.businessName)
  formData.append('SellerInfo.TaxCode', data.sellerInfo.taxCode)
  formData.append('SellerInfo.BankAccount', data.sellerInfo.bankAccount)
  formData.append('SellerInfo.IdentifyCard', data.sellerInfo.identifyCard)
  formData.append('SellerInfo.IdentifyFrontImage', data.sellerInfo.identifyFrontImage)
  formData.append('SellerInfo.IdentifyBackImage', data.sellerInfo.identifyBackImage)
  formData.append('SellerInfo.BusinessLicense', data.sellerInfo.businessLicense)

  // Add storeInfo
  formData.append('StoreInfo.StoreName', data.storeInfo.storeName)
  formData.append('StoreInfo.Address', data.storeInfo.address)
  formData.append('StoreInfo.Province', data.storeInfo.province)
  formData.append('StoreInfo.District', data.storeInfo.district)
  formData.append('StoreInfo.Ward', data.storeInfo.ward)
  formData.append('StoreInfo.ProvinceId', data.storeInfo.provinceID.toString())
  formData.append('StoreInfo.ProvinceId', data.storeInfo.districtID.toString())
  formData.append('StoreInfo.WardId', data.storeInfo.wardID.toString())
  formData.append('StoreInfo.Description', data.storeInfo.description)

  // Add vendor application images
  data.storeInfo.vendorApplicationImageUrl.forEach((file) => {
    formData.append(`StoreInfo.VendorApplicationImageUrl`, file)
  })

  const response = await axiosInstance.post(`${API_URL_SELLER}/Register`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}

// Staff Registration Interfaces
export interface StaffRegistrationData {
  email: string
  password: string
  firstName: string
  lastName: string
  gender: string
  phoneNumber: string
  dateOfBirth: string
  hireDate: string
}

export const registerStaff = async (data: StaffRegistrationData) => {
  // Create FormData to match the API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('Email', data.email)
  formData.append('Password', data.password)
  formData.append('FirstName', data.firstName)
  formData.append('LastName', data.lastName)
  formData.append('Gender', data.gender)
  formData.append('PhoneNumber', data.phoneNumber)
  formData.append('DateOfBirth', data.dateOfBirth)
  formData.append('HireDate', data.hireDate)

  const response = await axiosInstance.post(`${API_URL_STAFF}/Register`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}
