// combo.api.ts
import axiosInstance from '../service/axiosInstance'
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

  const response = await axiosInstance.post<ComboResponse>(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response
}

// POST /api/combo/{comboId}/items - Thêm Items vào Combo (Bước 2)
export const addItemToCombo = async (comboId: string, itemData: CreateComboItemRequest): Promise<ComboResponse> => {
  const response = await axiosInstance.post<ComboResponse>(`${API_URL}/${comboId}/items`, itemData, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response.data
}

// ===== LUỒNG CẬP NHẬT COMBO =====

// PUT /api/combo/{id} - Cập nhật Combo Shell
export const updateComboShell = async (comboId: string, comboData: UpdateComboRequest): Promise<ComboResponse> => {
  const formData = new FormData()

  formData.append('Name', comboData.name)
  formData.append('IsActive', comboData.isActive.toString())

  if (comboData.description) {
    formData.append('Description', comboData.description)
  }

  if (comboData.thumbnailFile) {
    formData.append('ThumbnailFile', comboData.thumbnailFile)
  }

  const response = await axiosInstance.put<ComboResponse>(`${API_URL}/${comboId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

// PUT /api/combo/{comboId}/items - Cập nhật Items trong Combo
export const updateComboItem = async (comboId: string, itemData: UpdateComboItemRequest): Promise<ComboResponse> => {
  const response = await axiosInstance.put<ComboResponse>(`${API_URL}/${comboId}/items`, itemData, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  return response.data
}

// ===== LUỒNG ĐỌC DỮ LIỆU =====

// GET /api/combo - Lấy danh sách Combo
export const getAllCombos = async (params?: ComboParams): Promise<Combo[]> => {
  try {
    const response = await axiosInstance.get(API_URL, { params })

    // Backend trả về array trực tiếp hoặc object có data property
    const data = Array.isArray(response.data) ? response.data : response.data?.data || []
    return data
  } catch (error) {
    console.error('getAllCombos API error:', error)
    throw error
  }
}

// GET /api/combo/{id} - Lấy chi tiết Combo
export const getComboById = async (comboId: string): Promise<ComboResponse> => {
  const response = await axiosInstance.get<ComboResponse>(`${API_URL}/${comboId}`)
  return response.data
}

// ===== UTILITY FUNCTIONS =====

// Helper function để tạo combo hoàn chỉnh (Shell + Items)
export const createCompleteCombo = async (
  shellData: CreateComboRequest,
  itemsData: CreateComboItemRequest[]
): Promise<ComboResponse> => {
  try {
    // Bước 1: Tạo combo shell
    const shellResponse = await createComboShell(shellData)

    if (!shellResponse.data?.id) {
      throw new Error('Không thể tạo combo shell')
    }

    const comboId = shellResponse.data.id
    let lastResponse = shellResponse

    // Bước 2: Thêm từng item vào combo
    for (const itemData of itemsData) {
      lastResponse = await addItemToCombo(comboId, itemData)
    }

    return lastResponse
  } catch (error) {
    console.error('Lỗi khi tạo combo hoàn chỉnh:', error)
    throw error
  }
}

// Helper function để cập nhật combo hoàn chỉnh
export const updateCompleteCombo = async (
  comboId: string,
  shellData: UpdateComboRequest,
  itemsData: UpdateComboItemRequest[]
): Promise<ComboResponse> => {
  try {
    // Bước 1: Cập nhật combo shell
    let lastResponse = await updateComboShell(comboId, shellData)

    // Bước 2: Cập nhật từng item
    for (const itemData of itemsData) {
      lastResponse = await updateComboItem(comboId, itemData)
    }

    return lastResponse
  } catch (error) {
    console.error('Lỗi khi cập nhật combo hoàn chỉnh:', error)
    throw error
  }
}

// Helper function để xóa item khỏi combo (set isActive = false)
export const removeItemFromCombo = async (comboId: string, itemId: string): Promise<ComboResponse> => {
  const itemData: UpdateComboItemRequest = {
    id: itemId,
    productVariantId: '', // Sẽ được ignore khi có ID
    comboItemName: '', // Sẽ được ignore khi có ID
    price: 0, // Sẽ được ignore khi có ID
    quantity: 0, // Sẽ được ignore khi có ID
    isActive: false
  }

  return updateComboItem(comboId, itemData)
}
