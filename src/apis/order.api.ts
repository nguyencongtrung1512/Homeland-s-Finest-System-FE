import axiosInstance from '../service/axiosInstance'
import type { 
  OrderListResponse, 
  OrderResponse, 
  OrderQueryParams, 
  CreateOrderInput, 
  
  Order
} from '../types/orderType'
const API_URL = `/Order`

// GET /api/Order/get-all - Lấy danh sách tất cả orders với pagination
export const getAllOrders = async (params?: OrderQueryParams): Promise<Order[]> => {
  const response: OrderListResponse = await axiosInstance.get(`${API_URL}/get-all`, {
    params
  })
  return response.data
}

// GET /api/Order/customer-order/{customerId} - Lấy orders của customer cụ thể
export const getCustomerOrders = async (
  customerId: string, 
  params?: OrderQueryParams
): Promise<Order[]> => {
  const response: OrderListResponse = await axiosInstance.get(
    `${API_URL}/customer-order/${customerId}`,
    { params }
  )
  return response.data
}

// GET /api/Order/detail/{orderId} - Lấy chi tiết order
export const getOrderDetail = async (orderId: string): Promise<Order> => {
  const response: OrderResponse = await axiosInstance.get(`${API_URL}/detail/${orderId}`)
  return response.data
}

// POST /api/Order/create-order - Tạo order mới
export const createOrder = async (orderData: CreateOrderInput): Promise<Order> => {
  const response: OrderListResponse = await axiosInstance.post(`${API_URL}/create-order`, orderData)
  return response.data[0] // API trả về array, lấy phần tử đầu tiên
}

// PUT /api/Order/confirm/{orderId} - Xác nhận order (chuyển sang Processing)
export const confirmOrder = async (orderId: string): Promise<Order> => {
  const response: OrderResponse = await axiosInstance.put(`${API_URL}/confirm/${orderId}`)
  return response.data
}

// PUT /api/Order/cancel/{orderId} - Hủy order
export const cancelOrder = async (orderId: string, reason: string): Promise<Order[]> => {
  const formData = new FormData()
  formData.append('reason', reason)
  
  const response: OrderListResponse = await axiosInstance.put(`${API_URL}/cancel/${orderId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response.data
}

// PUT /api/Order/delivered/{orderId} - Đánh dấu đã giao hàng
export const markOrderDelivered = async (orderId: string): Promise<Order> => {
  const response: OrderResponse = await axiosInstance.put(`${API_URL}/delivered/${orderId}`)
  return response.data
}

// PUT /api/Order/return/{orderId} - Trả hàng
export const returnOrder = async (orderId: string, note?: string): Promise<Order> => {
  const response: OrderResponse = await axiosInstance.put(`${API_URL}/return/${orderId}`, {
    note
  })
  return response.data
}

// PUT /api/Order/received/{orderId} - Customer xác nhận đã nhận hàng
export const confirmOrderReceived = async (orderId: string): Promise<Order> => {
  const response: OrderResponse = await axiosInstance.put(`${API_URL}/received/${orderId}`)
  return response.data
}

// PUT /api/Order/refund/{orderId} - Hoàn tiền
export const refundOrder = async (orderId: string, note?: string): Promise<Order> => {
  const response: OrderResponse = await axiosInstance.put(`${API_URL}/refund/${orderId}`, {
    note
  })
  return response.data
}

// Utility function để lấy orders theo status
export const getOrdersByStatus = async (
  status: string, 
  params?: Omit<OrderQueryParams, 'status'>
): Promise<Order[]> => {
  return getAllOrders({ ...params, status: status as any })
}

// Utility function để lấy orders của store
export const getStoreOrders = async (
  storeId: string, 
  params?: Omit<OrderQueryParams, 'storeId'>
): Promise<Order[]> => {
  return getAllOrders({ ...params, storeId })
}

export default {
  getAllOrders,
  getCustomerOrders,
  getOrderDetail,
  createOrder,
  confirmOrder,
  cancelOrder,
  markOrderDelivered,
  returnOrder,
  confirmOrderReceived,
  refundOrder,
  getOrdersByStatus,
  getStoreOrders
}

