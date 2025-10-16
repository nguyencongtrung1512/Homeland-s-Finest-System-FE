// combo.api.ts
import axiosInstance from '../service/axiosInstance'
import type {
  CreateComboRequest,
  ComboResponse,
  ComboListResponse,
  ComboParams,
  Combo
} from '../types/combo.type'

const API_URL = `/Combo`

// POST /api/Combo - Create new combo
export const createCombo = async (comboData: CreateComboRequest): Promise<ComboResponse> => {
  const formData = new FormData()

  formData.append('Name', comboData.name)
  formData.append('ProvinceId', comboData.provinceId.toString())
  formData.append('Description', comboData.description)
  formData.append('ThumbnailFile', comboData.thumbnailFile)

  const response = await axiosInstance.post<ComboResponse>(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

// GET /api/Combo - Get all combos
export const getAllCombos = async (params?: ComboParams): Promise<Combo[]> => {
  const response: ComboListResponse = await axiosInstance.get(API_URL, { params })
  return response.data
}
