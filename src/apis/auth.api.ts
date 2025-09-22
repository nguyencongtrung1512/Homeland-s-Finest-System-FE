import axiosInstance from '../service/axiosInstance'

const API_URL = `/Auth`
const API_URL_CUSTOMER = `/Customer`
const API_URL_SELLER = `/Seller`
const API_URL_STAFF = `/Staff`

export interface RegisterCustomerData {
  email: string
  password: string
  gender: string
  phoneNumber: string
  dateOfBirth: string
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
}

export const registerCustomer = async (data: RegisterCustomerData) => {
  // Create FormData to match the API requirement (multipart/form-data)
  const formData = new FormData()
  formData.append('Email', data.email)
  formData.append('Password', data.password)
  formData.append('Gender', data.gender)
  formData.append('PhoneNumber', data.phoneNumber)
  formData.append('DateOfBirth', data.dateOfBirth)

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

export interface LogoutResponse {
  status: number
  message: string
  data: null
}

export const logout = async (): Promise<LogoutResponse> => {
  const response = await axiosInstance.post(`${API_URL}/logout`)
  // Axios interceptor trả về response.data, nên response đã có cấu trúc LogoutResponse
  return response as unknown as LogoutResponse
}
