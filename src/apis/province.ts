import axiosInstance from '../service/axiosInstance'

const API_PROVINCE = `/Province`
const API_DISTRICT = `/District`
const API_WARD = `/Ward`

export interface Province {
  id: number
  name: string
  region: string
  regionSpecified: string
  description: string
}
export interface District {
  id: number
  name: string
  provinceId: number
  provinceName: string
}
export interface Ward {
  id: number
  name: string
  districtId: number
  districtName: string
}

export const getProvinces = async (): Promise<Province[]> => {
  const response = await axiosInstance.get(API_PROVINCE)
  return response.data
}
export interface ProvinceDetailResponse {
  status: number
  message: string
  data: Province
}

export const getProvincesDetail = async (provinceName: string): Promise<ProvinceDetailResponse> => {
  const response = await axiosInstance.get(
    `${API_PROVINCE}/get-detail-by-name?provinceName=${encodeURIComponent(provinceName)}`
  )
  return response as unknown as ProvinceDetailResponse
}

export const getProvinceById = async (id: string): Promise<Province[]> => {
  const response = await axiosInstance.get(`${API_PROVINCE}/${id}`)
  return response.data
}

export const getDistricts = async (provinceId: number): Promise<District[]> => {
  const response = await axiosInstance.get(`${API_DISTRICT}/${provinceId}`)
  return response.data
}

export const getWards = async (districtId: number): Promise<Ward[]> => {
  const response = await axiosInstance.get(`${API_WARD}/${districtId}`)
  return response.data
}
