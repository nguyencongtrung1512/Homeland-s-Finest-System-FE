import axiosInstance from '../service/axiosInstance'
import type {
  TransactionResponse,
  TransactionListResponse,
  TransactionQueryParams,
  PurchaseInput,
  Transaction
} from '../types/transactionType'

const API_URL = `/Transaction`

// POST /api/Transaction/purchase - Thanh toán đơn hàng
export const purchaseOrder = async (purchaseData: PurchaseInput): Promise<Transaction[]> => {
  console.log('=== DEBUG TRANSACTION API ===')
  console.log('purchaseData:', purchaseData)
  console.log('orderIds:', purchaseData.orderIds)

  const response: TransactionResponse = await axiosInstance.post(`${API_URL}/purchase`, purchaseData)

  console.log('Transaction response:', response)
  console.log('Transaction data:', response.data)

  return response.data
}

// GET /api/Transaction/purchase - Lấy transaction purchase với orderIds
export const getTransactionPurchase = async (orderIds: string[]): Promise<Transaction[]> => {
  console.log('🔍 DEBUG API: Sending orderIds to transaction purchase:', orderIds)
  console.log('🔍 DEBUG API: OrderIds length:', orderIds.length)

  const payload = { orderIds }
  console.log('🔍 DEBUG API: Payload:', payload)

  const response = await axiosInstance.post(`${API_URL}/purchase`, payload)

  console.log('🔍 DEBUG API: Response:', response)
  console.log('🔍 DEBUG API: Response data:', response.data)

  return response.data
}

// GET /api/Transaction/get-all - Lấy danh sách tất cả transactions với pagination
export const getAllTransactions = async (params?: TransactionQueryParams): Promise<Transaction[]> => {
  const response: TransactionListResponse = await axiosInstance.get(`${API_URL}/get-all`, {
    params
  })
  return response.data
}

// GET /api/Transaction/user/{userId} - Lấy transactions của user cụ thể
export const getUserTransactions = async (
  userId: string,
  params?: TransactionQueryParams
): Promise<Transaction[]> => {
  const response: TransactionListResponse = await axiosInstance.get(
    `${API_URL}/user/${userId}`,
    { params }
  )
  return response.data
}

// GET /api/Transaction/order/{orderId} - Lấy transaction của order cụ thể
export const getOrderTransaction = async (orderId: string): Promise<Transaction> => {
  const response: TransactionResponse = await axiosInstance.get(`${API_URL}/order/${orderId}`)
  return response.data[0] // API trả về array, lấy phần tử đầu tiên
}

// GET /api/Transaction/detail/{transactionId} - Lấy chi tiết transaction
export const getTransactionDetail = async (transactionId: string): Promise<Transaction> => {
  const response: TransactionResponse = await axiosInstance.get(`${API_URL}/detail/${transactionId}`)
  return response.data[0] // API trả về array, lấy phần tử đầu tiên
}

// Utility function để lấy transactions theo status
export const getTransactionsByStatus = async (
  status: string,
  params?: Omit<TransactionQueryParams, 'status'>
): Promise<Transaction[]> => {
  return getAllTransactions({ ...params, status: status as any })
}

// Utility function để lấy transactions theo payment method
export const getTransactionsByPaymentMethod = async (
  paymentMethod: string,
  params?: Omit<TransactionQueryParams, 'paymentMethod'>
): Promise<Transaction[]> => {
  return getAllTransactions({ ...params, paymentMethod })
}

export default {
  purchaseOrder,
  getTransactionPurchase,
  getAllTransactions,
  getUserTransactions,
  getOrderTransaction,
  getTransactionDetail,
  getTransactionsByStatus,
  getTransactionsByPaymentMethod
}