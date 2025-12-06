// combo.api.ts
import axiosInstance from '../service/axiosInstance'
import { storeApi } from './store.api'
import { productApi } from './product.api'
import type {
  CreateComboRequest,
  UpdateComboRequest,
  CreateComboItemRequest,
  UpdateComboItemRequest,
  ComboResponse,
  ComboParams,
  Combo
} from '../types/combo.type'

const API_URL = `/Combo`

// ===== LUỒNG TẠO COMBO =====

// POST /api/combo - Tạo Combo Shell (Bước 1)
export const createComboShell = async (comboData: CreateComboRequest): Promise<any> => {
  const formData = new FormData()

  formData.append('Name', comboData.name)
  formData.append('SellerId', comboData.sellerId)

  if (comboData.description) {
    formData.append('Description', comboData.description)
  }

  if (comboData.thumbnailFile) {
    formData.append('ThumbnailFile', comboData.thumbnailFile)
  }

  if (comboData.videoFile) {
    formData.append('VideoFile', comboData.videoFile)
  }

  const response = await axiosInstance.post<ComboResponse>(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response
}

// POST /api/combo/{comboId}/items - Thêm Items vào Combo (Bước 2)
export const addItemToCombo = async (comboId: string, itemData: CreateComboItemRequest): Promise<any> => {
  const response = await axiosInstance.post<ComboResponse>(`${API_URL}/${comboId}/items`, itemData, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response
}

export const updateComboShell = async (comboId: string, comboData: UpdateComboRequest): Promise<any> => {
  const formData = new FormData()

  formData.append('Name', comboData.name)
  formData.append('IsActive', comboData.isActive.toString())

  if (comboData.description) {
    formData.append('Description', comboData.description)
  }

  // Chỉ gửi FinalPrice nếu được chỉ định (không gửi trong modal chỉnh sửa từ listCombo)
  if (comboData.finalPrice !== undefined) {
    formData.append('FinalPrice', comboData.finalPrice.toString())
  }

  // Logic xử lý ảnh thumbnail
  if (comboData.removeThumbnail) {
    // Người dùng muốn xóa ảnh hiện tại
    formData.append('RemoveExistingImage', 'true')
  } else if (comboData.thumbnailFile) {
    // Có file ảnh mới → thay thế ảnh cũ bằng ảnh mới
    formData.append('NewThumbnailFile', comboData.thumbnailFile)
    formData.append('RemoveExistingImage', 'true')
  } else {
    // Không có file mới, không xóa → giữ nguyên ảnh cũ
    formData.append('RemoveExistingImage', 'false')
  }

  // Logic xử lý video
  if (comboData.removeVideo) {
    // Người dùng muốn xóa video hiện tại
    formData.append('RemoveExistingVideo', 'true')
  } else if (comboData.videoFile) {
    // Có file video mới → thay thế video cũ bằng video mới
    formData.append('NewVideoFile', comboData.videoFile)
    formData.append('RemoveExistingVideo', 'true')
  } else {
    // Không có file mới, không xóa → giữ nguyên video cũ
    formData.append('RemoveExistingVideo', 'false')
  }

  const response = await axiosInstance.put<ComboResponse>(`${API_URL}/${comboId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response
}

export const updateComboItem = async (
  comboId: string,
  itemId: string,
  itemData: UpdateComboItemRequest
): Promise<any> => {
  const response = await axiosInstance.put<ComboResponse>(`${API_URL}/${comboId}/items/${itemId}`, itemData, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response
}

export const getAllCombos = async (params?: ComboParams): Promise<{
  data: Combo[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages?: number
  }
}> => {
  try {
    console.log('getAllCombos params:', params)
    const response = await axiosInstance.get(API_URL, { params })
    console.log('getAllCombos response:', response)

    // Backend trả về ApiResponseWithPagination với structure:
    // { status, message, data: Combo[], pagination: {...} }
    const responseData = response.data || response

    // Handle different response structures
    let combos: Combo[] = []
    let pagination: {
      pageSize: number
      pageNumber: number
      totalItems: number
      totalPages?: number
    } | undefined

    if (Array.isArray(responseData)) {
      combos = responseData
    } else if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData.data)) {
        combos = responseData.data
      } else if (Array.isArray(responseData)) {
        combos = responseData
      }

      if (responseData.pagination) {
        pagination = {
          pageSize: responseData.pagination.pageSize || params?.pageSize || 10,
          pageNumber: responseData.pagination.pageNumber || params?.pageNumber || 1,
          totalItems: responseData.pagination.totalItems || 0,
          totalPages: responseData.pagination.totalPages || Math.ceil((responseData.pagination.totalItems || 0) / (params?.pageSize || 10))
        }
      }
    }

    console.log('getAllCombos processed data:', { combos, pagination })
    return { data: combos, pagination }
  } catch (error) {
    console.error('getAllCombos API error:', error)
    throw error
  }
}

export const getComboById = async (comboId: string): Promise<any> => {
  const response = await axiosInstance.get<ComboResponse>(`${API_URL}/${comboId}`)
  return response
}

export const createCompleteCombo = async (
  shellData: CreateComboRequest,
  itemsData: CreateComboItemRequest[]
): Promise<ComboResponse> => {
  try {
    const shellResponse = await createComboShell(shellData)

    if (!shellResponse.data?.id) {
      throw new Error('Không thể tạo combo shell')
    }

    const comboId = shellResponse.data.id
    let lastResponse = shellResponse

    for (const itemData of itemsData) {
      lastResponse = await addItemToCombo(comboId, itemData)
    }

    return lastResponse
  } catch (error) {
    console.error('Lỗi khi tạo combo hoàn chỉnh:', error)
    throw error
  }
}

export const updateCompleteCombo = async (
  comboId: string,
  shellData: UpdateComboRequest,
  itemsData: { itemId: string; data: UpdateComboItemRequest }[]
): Promise<ComboResponse> => {
  try {
    let lastResponse = await updateComboShell(comboId, shellData)

    for (const { itemId, data } of itemsData) {
      lastResponse = await updateComboItem(comboId, itemId, data)
    }

    return lastResponse
  } catch (error) {
    console.error('Lỗi khi cập nhật combo hoàn chỉnh:', error)
    throw error
  }
}
export const removeItemFromCombo = async (
  comboId: string,
  itemId: string,
  itemData: UpdateComboItemRequest
): Promise<any> => {
  // Gửi PUT request với isActive: false để xóa item
  const response = await axiosInstance.put<ComboResponse>(
    `${API_URL}/${comboId}/items/${itemId}`,
    {
      ...itemData,
      isActive: false
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  )
  return response
}

// ===== UTILITY FUNCTIONS FOR VARIANTS =====

// Lấy danh sách variants theo sellerId
export const getVariantsBySellerId = async (sellerId: string) => {
  try {
    console.log('Getting store for sellerId:', sellerId)

    // Bước 1: Lấy store theo sellerId
    const storeResponse = await storeApi.getStoreBySellerId(sellerId)
    console.log('Store response:', storeResponse)

    if (!storeResponse.data?.id) {
      throw new Error('Không tìm thấy store cho seller này')
    }

    const storeId = storeResponse.data.id
    console.log('StoreId found:', storeId)

    // Bước 2: Lấy variants theo storeId
    const variantsResponse = await productApi.getAllActiveVariants(storeId)
    console.log('Variants response:', variantsResponse)

    // Đảm bảo trả về array
    const variants = variantsResponse.data || []
    console.log('Processed variants:', variants)

    return variants
  } catch (error) {
    console.error('Error getting variants by sellerId:', error)
    throw error
  }
}

// ===== SUBMIT / CANCEL COMBO =====
export const submitCombo = async (comboId: string): Promise<any> => {
  const response = await axiosInstance.put<ComboResponse>(`/combos/${comboId}/submit`)
  return response
}

export const cancelCombo = async (comboId: string): Promise<any> => {
  const response = await axiosInstance.put<ComboResponse>(`/combos/${comboId}/cancel`)
  return response
}

// Export all functions as comboApi object
export const comboApi = {
  createComboShell,
  addItemToCombo,
  updateComboShell,
  updateComboItem,
  getAllCombos,
  getComboById,
  createCompleteCombo,
  updateCompleteCombo,
  removeItemFromCombo,
  getVariantsBySellerId,
  submitCombo,
  cancelCombo
}

export default comboApi