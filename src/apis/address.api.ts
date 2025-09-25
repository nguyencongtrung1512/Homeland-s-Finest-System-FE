import axiosInstance from '../service/axiosInstance'
import type { Address, AddressCreateInput, AddressUpdateInput, AddressQueryParams } from '../types/addressType'

// GHN API Types
export interface GHNProvince {
  ProvinceID: number
  ProvinceName: string
  CountryID: number
  Code: string
  NameExtension: string[]
}

export interface GHNDistrict {
  DistrictID: number
  ProvinceID: number
  DistrictName: string
  Code: string
  Type: number
  SupportType: number
  NameExtension: string[]
}

export interface GHNWard {
  WardCode: string
  DistrictID: number
  WardName: string
  NameExtension: string[]
}

export interface GHNProvinceResponse {
  data: GHNProvince[]
}

export interface GHNDistrictResponse {
  data: GHNDistrict[]
}

export interface GHNWardResponse {
  data: GHNWard[]
}

const API_URL_ADDRESS = `/Address`

// API Response Types
export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface PaginationInfo {
  pageSize: number
  pageNumber: number
  totalItems: number
  totalPages: number
}

export interface AddressResponse {
  status: number
  message: string
  data: Address
}

export interface AddressListResponse {
  status: number
  message: string
  data: Address[]
  pagination: PaginationInfo
}

// Address API Functions
export const addressApi = {
  // Get all addresses with pagination and filters
  getAll: async (params?: AddressQueryParams): Promise<AddressListResponse> => {
    console.log('API Request params:', params)
    const response = await axiosInstance.get(API_URL_ADDRESS, { params })
    console.log('API Response:', response)
    return response as unknown as AddressListResponse
  },

  // Get address by ID
  getById: async (id: string): Promise<AddressResponse> => {
    const response = await axiosInstance.get(`${API_URL_ADDRESS}/${id}`)
    return response as unknown as AddressResponse
  },

  // Create new address
  create: async (data: AddressCreateInput): Promise<AddressResponse> => {
    try {
      // Try with multipart/form-data first
      const formData = new FormData()
      formData.append('userId', data.userId)
      formData.append('Province', data.province)
      formData.append('District', data.district)
      formData.append('Ward', data.ward)
      formData.append('provinceId', data.provinceId.toString())
      formData.append('districtId', data.districtId.toString())
      formData.append('wardId', data.wardId.toString())
      formData.append('streetAddress', data.streetAddress)
      formData.append('isDefault', data.isDefault ? 'true' : 'false')

      const response = await axiosInstance.post(API_URL_ADDRESS, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response as unknown as AddressResponse
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: unknown }; message?: string }

      // If multipart/form-data fails, try JSON format
      if (apiError.response?.status === 400) {
        try {
          const jsonData = {
            userId: data.userId,
            Province: data.province,
            District: data.district,
            Ward: data.ward,
            provinceId: data.provinceId,
            districtId: data.districtId,
            wardId: data.wardId,
            streetAddress: data.streetAddress,
            isDefault: data.isDefault
          }
          const retryResponse = await axiosInstance.post(API_URL_ADDRESS, jsonData, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
          return retryResponse as unknown as AddressResponse
        } catch {
          // Try capitalized format as last resort
          try {
            const capitalizedData = {
              UserId: data.userId,
              Province: data.province,
              District: data.district,
              Ward: data.ward,
              ProvinceId: data.provinceId,
              DistrictId: data.districtId,
              WardId: data.wardId,
              StreetAddress: data.streetAddress,
              IsDefault: data.isDefault
            }
            const capitalizedResponse = await axiosInstance.post(API_URL_ADDRESS, capitalizedData, {
              headers: {
                'Content-Type': 'application/json'
              }
            })
            return capitalizedResponse as unknown as AddressResponse
          } catch {
            // All formats failed, throw the original error
            throw error
          }
        }
      }

      throw error
    }
  },

  // Update address
  update: async (id: string, data: AddressUpdateInput): Promise<AddressResponse> => {
    const response = await axiosInstance.put(`${API_URL_ADDRESS}/${id}`, data)
    return response as unknown as AddressResponse
  },

  // Delete address
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosInstance.delete(`${API_URL_ADDRESS}/${id}`)
    return response as unknown as ApiResponse<null>
  },

  // Get addresses by user
  getByUser: async (userId: string, params?: Omit<AddressQueryParams, 'userId'>): Promise<AddressListResponse> => {
    const response = await axiosInstance.get(`${API_URL_ADDRESS}/user/${userId}`, { params })
    return response as unknown as AddressListResponse
  },

  // Get provinces from GHN API
  getProvinces: async (): Promise<GHNProvinceResponse> => {
    try {
      const response = await fetch('https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/province', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Token: 'ed8771b7-8afe-11f0-bdaf-ae7fa045a771'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as GHNProvinceResponse
    } catch (error) {
      console.error('Error fetching provinces from GHN:', error)
      throw new Error('Không thể tải danh sách tỉnh/thành phố từ GHN')
    }
  },

  // Get districts from GHN API by province ID
  getDistricts: async (provinceId: number): Promise<GHNDistrictResponse> => {
    try {
      const response = await fetch(
        `https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/district?province_id=${provinceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Token: 'ed8771b7-8afe-11f0-bdaf-ae7fa045a771'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('GHN Districts API Response:', data)
      return data as GHNDistrictResponse
    } catch (error) {
      console.error('Error fetching districts from GHN:', error)
      throw new Error('Không thể tải danh sách quận/huyện từ GHN')
    }
  },

  // Get wards from GHN API by district ID
  getWards: async (districtId: number): Promise<GHNWardResponse> => {
    try {
      const response = await fetch(
        `https://dev-online-gateway.ghn.vn/shiip/public-api/master-data/ward?district_id=${districtId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Token: 'ed8771b7-8afe-11f0-bdaf-ae7fa045a771'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as GHNWardResponse
    } catch (error) {
      console.error('Error fetching wards from GHN:', error)
      throw new Error('Không thể tải danh sách phường/xã từ GHN')
    }
  },

  // Get addresses by province (from our backend)
  getByProvince: async (
    provinceId: number,
    params?: Omit<AddressQueryParams, 'provinceId'>
  ): Promise<AddressListResponse> => {
    const response = await axiosInstance.get(`${API_URL_ADDRESS}/province/${provinceId}`, { params })
    return response as unknown as AddressListResponse
  },

  // Get addresses by district
  getByDistrict: async (
    districtId: number,
    params?: Omit<AddressQueryParams, 'districtId'>
  ): Promise<AddressListResponse> => {
    const response = await axiosInstance.get(`${API_URL_ADDRESS}/district/${districtId}`, { params })
    return response as unknown as AddressListResponse
  },

  // Get addresses by ward
  getByWard: async (wardId: number, params?: Omit<AddressQueryParams, 'wardId'>): Promise<AddressListResponse> => {
    const response = await axiosInstance.get(`${API_URL_ADDRESS}/ward/${wardId}`, { params })
    return response as unknown as AddressListResponse
  },

  // Get default address for user
  getDefaultByUser: async (userId: string): Promise<AddressResponse> => {
    const response = await axiosInstance.get(`${API_URL_ADDRESS}/user/${userId}/default`)
    return response as unknown as AddressResponse
  },

  // Set address as default
  setAsDefault: async (id: string): Promise<AddressResponse> => {
    const response = await axiosInstance.patch(`${API_URL_ADDRESS}/${id}/default`)
    return response as unknown as AddressResponse
  },

  // Update address active status
  updateActiveStatus: async (id: string, isActive: boolean): Promise<AddressResponse> => {
    const response = await axiosInstance.patch(`${API_URL_ADDRESS}/${id}/active`, { isActive })
    return response as unknown as AddressResponse
  }
}

export default addressApi
