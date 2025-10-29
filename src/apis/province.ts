import axiosInstance from '../service/axiosInstance'

const API_URL = `/Province`

export interface Province {
  id: number
  name: string
  region: string
}

export interface ProvinceResponse {
  status: number
  message: string
  data: Province[]
}

export const getProvinces = async (): Promise<Province[]> => {
  const response = await axiosInstance.get(API_URL)
  return response.data
}
