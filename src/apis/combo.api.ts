// combo.api.ts
import axiosInstance from '../service/axiosInstance'

const API_URL = `/Combo`

// Response item types for Combo
export interface ComboItem {
  id: string
  productVariantId: string
  comboItemName: string
  comboItemImageUrl: string
  price: number
  quantity: number
  productName: string
  variantName: string
  storeName: string
}

export interface Combo {
  id: string
  name: string
  provinceId: number
  provinceName: string
  description: string
  isActive: boolean
  thumbnailUrl: string
  staffNote: string | null
  comboItems: ComboItem[]
}

export interface ComboPagination {
  pageSize: number
  pageNumber: number
  totalItems: number
  totalPages: number
}

export interface ComboListResponse {
  status: number
  message: string
  data: Combo[]
  pagination: ComboPagination
}

export interface ComboParams {
  pageSize?: number
  pageNumber?: number
  search?: string
  provinceId?: number
  isActive?: boolean
}

// GET /api/Combo - Get all combos
export const getAllCombos = async (params?: ComboParams): Promise<Combo[]> => {
  const response: ComboListResponse = await axiosInstance.get(API_URL, { params })
  return response.data
}
