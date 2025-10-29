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
  update: async (id: string, data: AddressUpdateInput & { userId?: string }): Promise<AddressResponse> => {
    try {
      // Use multipart/form-data as required by backend
      const formData = new FormData()

      // Add UserId if provided (required by backend)
      if (data.userId) {
        formData.append('UserId', data.userId)
      }

      // Add all fields with capitalized names as required by backend
      if (data.province !== undefined) formData.append('Province', data.province)
      if (data.district !== undefined) formData.append('District', data.district)
      if (data.ward !== undefined) formData.append('Ward', data.ward)
      if (data.provinceId !== undefined) formData.append('ProvinceId', data.provinceId.toString())
      if (data.districtId !== undefined) formData.append('DistrictId', data.districtId.toString())
      if (data.wardId !== undefined) formData.append('WardId', data.wardId.toString())
      if (data.streetAddress !== undefined) formData.append('StreetAddress', data.streetAddress)
      if (data.isDefault !== undefined) formData.append('IsDefault', data.isDefault ? 'true' : 'false')
      if (data.isActive !== undefined) formData.append('IsActive', data.isActive ? 'true' : 'false')

      const response = await axiosInstance.put(`${API_URL_ADDRESS}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response as unknown as AddressResponse
    } catch (error: unknown) {
      console.error('Error updating address:', error)
      throw error
    }
  },

  // Delete address
  delete: async (id: string): Promise<AddressResponse> => {
    const response = await axiosInstance.put(`/delete-address/${id}`)
    return response as unknown as AddressResponse
  },

  // Set address as default
  // setAsDefault: async (id: string, userId: string): Promise<AddressResponse> => {
  //   const response = await axiosInstance.put(`${API_URL_ADDRESS}/${id}/set-default`)
  //   return response as unknown as AddressResponse
  // },

  // Set address as default - Sử dụng endpoint Update có sẵn
  // Set address as default - Simple version
  setAsDefault: async (id: string, userId: string): Promise<AddressResponse> => {
    try {
      console.log('🎯 setAsDefault called:', { id, userId })

      // Lấy địa chỉ hiện tại
      const current = await axiosInstance.get(`${API_URL_ADDRESS}/${id}`)
      const addr = current.data || current

      console.log('📋 Current address:', addr)

      // Update với IsDefault = true
      const formData = new FormData()
      formData.append('UserId', userId)
      formData.append('Province', addr.province || '')
      formData.append('District', addr.district || '')
      formData.append('Ward', addr.ward || '')
      formData.append('ProvinceId', (addr.provinceId || 0).toString())
      formData.append('DistrictId', (addr.districtId || 0).toString())
      formData.append('WardId', (addr.wardId || 0).toString())
      formData.append('StreetAddress', addr.streetAddress || '')
      formData.append('IsDefault', 'true')
      formData.append('IsActive', 'true')

      console.log('📤 Sending FormData:', {
        UserId: userId,
        Province: addr.province,
        District: addr.district,
        Ward: addr.ward,
        IsDefault: 'true'
      })

      const response = await axiosInstance.put(`${API_URL_ADDRESS}/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      console.log('✅ setAsDefault success:', response)
      return response as unknown as AddressResponse
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: unknown }; message?: string }
      console.error('❌ setAsDefault error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      throw error
    }
  },

  // Get user addresses by direct endpoint (new API endpoint)
  getUserAddresses: async (userId: string): Promise<AddressListResponse> => {
    const response = await axiosInstance.get(`Adress/${userId}`)
    return response as unknown as AddressListResponse
  },

  // Get provinces from GHN API
  getProvinces: async (): Promise<GHNProvinceResponse> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_GHN_API_URL}/master-data/province`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Token: import.meta.env.VITE_GHN_TOKEN
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
        `${import.meta.env.VITE_GHN_API_URL}/master-data/district?province_id=${provinceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Token: import.meta.env.VITE_GHN_TOKEN
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
      const response = await fetch(`${import.meta.env.VITE_GHN_API_URL}/master-data/ward?district_id=${districtId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Token: import.meta.env.VITE_GHN_TOKEN
        }
      })

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
  }
}

export default addressApi
