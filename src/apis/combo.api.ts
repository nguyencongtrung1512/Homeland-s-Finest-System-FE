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
  Combo,
  ComboFilterRequest
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

  // Gửi DiscountPercent nếu được chỉ định
  if (comboData.discountPercent !== undefined) {
    formData.append('DiscountPercent', comboData.discountPercent.toString())
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

// POST /api/Combo/filter - Get combos with comprehensive filtering
export const filterCombos = async (filterRequest: ComboFilterRequest): Promise<{
  data: Combo[]
  pagination?: {
    pageSize: number
    pageNumber: number
    totalItems: number
    totalPages?: number
  }
}> => {
  try {
    console.log('filterCombos request:', filterRequest)

    // Prepare request body - convert to match backend naming (PascalCase)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestBody: Record<string, any> = {
      PageNumber: filterRequest.pageNumber || 1,
      PageSize: filterRequest.pageSize || 12
    }

    // Add optional filters only if they have values
    // Price Filters (Backend: decimal?)
    if (filterRequest.minPrice !== undefined && filterRequest.minPrice !== null) {
      requestBody.MinPrice = filterRequest.minPrice
    }
    if (filterRequest.maxPrice !== undefined && filterRequest.maxPrice !== null) {
      requestBody.MaxPrice = filterRequest.maxPrice
    }

    // Location Filters (Backend: List<string>?)
    if (filterRequest.provinceFilters && filterRequest.provinceFilters.length > 0) {
      requestBody.ProvinceFilters = filterRequest.provinceFilters
    }
    if (filterRequest.regionFilters && filterRequest.regionFilters.length > 0) {
      requestBody.RegionFilters = filterRequest.regionFilters
    }
    if (filterRequest.subRegionFilters && filterRequest.subRegionFilters.length > 0) {
      requestBody.SubRegionFilters = filterRequest.subRegionFilters
    }

    // Category Filters (Backend: List<Guid>? - frontend sends as string[])
    if (filterRequest.categoryFilterIds && filterRequest.categoryFilterIds.length > 0) {
      requestBody.CategoryFilterIds = filterRequest.categoryFilterIds
    }

    // Store Filters (Backend: List<Guid>? for StoreFilters, List<string>? for StoreNameFilters)
    if (filterRequest.storeFilters && filterRequest.storeFilters.length > 0) {
      requestBody.StoreFilters = filterRequest.storeFilters
    }
    if (filterRequest.storeNameFilters && filterRequest.storeNameFilters.length > 0) {
      requestBody.StoreNameFilters = filterRequest.storeNameFilters
    }

    // Status Filters (Backend: List<string>?, bool?)
    if (filterRequest.statusFilters && filterRequest.statusFilters.length > 0) {
      requestBody.StatusFilters = filterRequest.statusFilters
    }
    if (filterRequest.isActiveFilter !== undefined && filterRequest.isActiveFilter !== null) {
      requestBody.IsActiveFilter = filterRequest.isActiveFilter
    }

    // Date Filters (Backend: DateTime?)
    if (filterRequest.fromDate) {
      requestBody.FromDate = filterRequest.fromDate
    }
    if (filterRequest.toDate) {
      requestBody.ToDate = filterRequest.toDate
    }

    // Sales Filters (Backend: int?)
    if (filterRequest.minSaleCount !== undefined && filterRequest.minSaleCount !== null) {
      requestBody.MinSaleCount = filterRequest.minSaleCount
    }
    if (filterRequest.maxSaleCount !== undefined && filterRequest.maxSaleCount !== null) {
      requestBody.MaxSaleCount = filterRequest.maxSaleCount
    }

    // Rating Filters (Backend: double?, bool?)
    if (filterRequest.minRating !== undefined && filterRequest.minRating !== null) {
      requestBody.MinRating = filterRequest.minRating
    }
    if (filterRequest.maxRating !== undefined && filterRequest.maxRating !== null) {
      requestBody.MaxRating = filterRequest.maxRating
    }
    if (filterRequest.hasRating !== undefined && filterRequest.hasRating !== null) {
      requestBody.HasRating = filterRequest.hasRating
    }

    // Savings Filters (Backend: decimal?)
    if (filterRequest.minSavings !== undefined && filterRequest.minSavings !== null) {
      requestBody.MinSavings = filterRequest.minSavings
    }
    if (filterRequest.maxSavings !== undefined && filterRequest.maxSavings !== null) {
      requestBody.MaxSavings = filterRequest.maxSavings
    }

    // Stock Filters (Backend: int?, bool?)
    if (filterRequest.minAvailableQuantity !== undefined && filterRequest.minAvailableQuantity !== null) {
      requestBody.MinAvailableQuantity = filterRequest.minAvailableQuantity
    }
    if (filterRequest.maxAvailableQuantity !== undefined && filterRequest.maxAvailableQuantity !== null) {
      requestBody.MaxAvailableQuantity = filterRequest.maxAvailableQuantity
    }
    if (filterRequest.inStock !== undefined && filterRequest.inStock !== null) {
      requestBody.InStock = filterRequest.inStock
    }

    // Item Count Filters (Backend: int?)
    if (filterRequest.minItemCount !== undefined && filterRequest.minItemCount !== null) {
      requestBody.MinItemCount = filterRequest.minItemCount
    }
    if (filterRequest.maxItemCount !== undefined && filterRequest.maxItemCount !== null) {
      requestBody.MaxItemCount = filterRequest.maxItemCount
    }

    // Sorting and Search (Backend: string?)
    if (filterRequest.sortBy) {
      requestBody.SortBy = filterRequest.sortBy
    }
    if (filterRequest.queryText) {
      requestBody.QueryText = filterRequest.queryText
    }

    // Staff Filters (Backend: List<Guid>? - frontend sends as string[])
    if (filterRequest.assignedToFilters && filterRequest.assignedToFilters.length > 0) {
      requestBody.AssignedToFilters = filterRequest.assignedToFilters
    }

    const response = await axiosInstance.post(`${API_URL}/filter`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('filterCombos response:', response)

    // Backend trả về ApiResponseWithPagination với structure:
    // { status, message, data: Combo[], pagination: {...} }
    const responseData = response.data || response

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
      }

      if (responseData.pagination) {
        pagination = {
          pageSize: responseData.pagination.pageSize || filterRequest.pageSize || 12,
          pageNumber: responseData.pagination.pageNumber || filterRequest.pageNumber || 1,
          totalItems: responseData.pagination.totalItems || 0,
          totalPages: responseData.pagination.totalPages || Math.ceil((responseData.pagination.totalItems || 0) / (filterRequest.pageSize || 12))
        }
      }
    }

    console.log('filterCombos processed data:', { combos, pagination })
    return { data: combos, pagination }
  } catch (error) {
    console.error('filterCombos API error:', error)
    throw error
  }
}

export const getComboById = async (comboId: string): Promise<any> => {
  const response = await axiosInstance.get<ComboResponse>(`${API_URL}/${comboId}`)
  return response
}

// Get combos by order ID
export const getCombosByOrderId = async (orderId: string): Promise<{
  status: number
  message: string
  data: Array<{
    productVariantId: string
    comboId: string
    quantity: number
    availableQuantity: number
  }>
}> => {
  const response = await axiosInstance.get(`/orders/${orderId}/combos`)
  return response as any
}

// GET /api/products/{productId}/combos - Lấy danh sách combo gợi ý theo product ID
export const getCombosByProductId = async (productId: string): Promise<{
  data: Combo[]
}> => {
  try {
    const response = await axiosInstance.get<{
      status: number
      message: string
      data: Combo[]
    }>(`/products/${productId}/combos`)

    // Backend trả về ApiResponse với structure:
    // { status, message, data: Combo[] }
    const responseData = response.data || response

    let combos: Combo[] = []

    if (Array.isArray(responseData)) {
      combos = responseData
    } else if (responseData && typeof responseData === 'object') {
      if (Array.isArray(responseData.data)) {
        combos = responseData.data
      }
    }

    return { data: combos }
  } catch (error) {
    console.error('getCombosByProductId API error:', error)
    throw error
  }
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
  filterCombos,
  getComboById,
  getCombosByProductId,
  createCompleteCombo,
  updateCompleteCombo,
  removeItemFromCombo,
  getVariantsBySellerId,
  submitCombo,
  cancelCombo
}

export default comboApi