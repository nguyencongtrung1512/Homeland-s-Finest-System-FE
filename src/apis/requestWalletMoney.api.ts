import axiosInstance from '../service/axiosInstance'
import type {
  RequestWalletMoneyQueryParams,
  RequestWalletMoneyListResponse,
  RequestWalletMoneyListData,
  UpdateRequestWalletMoneyInput,
  UpdateRequestWalletMoneyResponse,
  RequestWalletMoney
} from '../types/requestWalletMoneyType'

const API_URL = '/RequestWalletMoney'

/**
 * Lấy danh sách yêu cầu rút tiền/hoàn tiền
 * Hàm này dùng để hiện ra những yêu cầu liên quan đến hoàn tiền, rút tiền
 * @param params - Query parameters: pageSize, pageNumber, userId, orderId, type, status
 * @returns Promise<RequestWalletMoneyListData>
 */
export const getRequestWalletMoney = async (
  params?: RequestWalletMoneyQueryParams
): Promise<RequestWalletMoneyListData> => {
  try {
    // Axios interceptor đã xử lý response, trả về RequestWalletMoneyListResponse trực tiếp
    const response: RequestWalletMoneyListResponse = await axiosInstance.get(API_URL, {
      params: {
        pageSize: params?.pageSize ?? 10,
        pageNumber: params?.pageNumber !== undefined ? params.pageNumber : 0,
        ...(params?.userId && { userId: params.userId }),
        ...(params?.orderId && { orderId: params.orderId }),
        ...(params?.type && { type: params.type }),
        ...(params?.status && { status: params.status })
      }
    })

    // Response đã được interceptor xử lý, trả về object có data và pagination
    return {
      data: response.data || [],
      pagination: response.pagination
    }
  } catch (error) {
    console.error('Error fetching request wallet money:', error)
    throw error
  }
}

/**
 * Lấy danh sách yêu cầu rút tiền
 * @param params - Query parameters
 * @returns Promise<RequestWalletMoney[]>
 */
export const getWithdrawalRequests = async (
  params?: Omit<RequestWalletMoneyQueryParams, 'type'>
): Promise<RequestWalletMoneyListData> => {
  return getRequestWalletMoney({ ...params, type: 'Withdrawal' })
}

/**
 * Lấy danh sách yêu cầu hoàn tiền
 * @param params - Query parameters
 * @returns Promise<RequestWalletMoney[]>
 */
export const getRefundRequests = async (
  params?: Omit<RequestWalletMoneyQueryParams, 'type'>
): Promise<RequestWalletMoneyListData> => {
  return getRequestWalletMoney({ ...params, type: 'Refund' })
}

/**
 * Lấy yêu cầu theo trạng thái
 * @param status - Trạng thái: 'Pending' | 'Completed' | 'Cancel'
 * @param params - Query parameters khác
 * @returns Promise<RequestWalletMoneyListData>
 */
export const getRequestWalletMoneyByStatus = async (
  status: string,
  params?: Omit<RequestWalletMoneyQueryParams, 'status'>
): Promise<RequestWalletMoneyListData> => {
  return getRequestWalletMoney({ ...params, status })
}

/**
 * Cập nhật yêu cầu rút tiền/hoàn tiền (Admin duyệt yêu cầu)
 * Hàm này dùng để admin duyệt những yêu cầu liên quan đến hoàn tiền, rút tiền
 * @param requestWalletMoneyId - ID của yêu cầu cần cập nhật
 * @param data - Dữ liệu cập nhật: note, status
 * @returns Promise<RequestWalletMoney>
 */
export const updateRequestWalletMoney = async (
  requestWalletMoneyId: string,
  data: UpdateRequestWalletMoneyInput
): Promise<RequestWalletMoney> => {
  try {
    const formData = new FormData()

    // Thêm status (required)
    formData.append('status', data.status)

    // Thêm note nếu có
    if (data.note) {
      formData.append('note', data.note)
    }

    // Axios interceptor đã xử lý response, trả về UpdateRequestWalletMoneyResponse trực tiếp
    const response: UpdateRequestWalletMoneyResponse = await axiosInstance.put(
      `${API_URL}/update/${requestWalletMoneyId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    // Response đã được interceptor xử lý, trả về data trực tiếp
    return response.data
  } catch (error) {
    console.error('Error updating request wallet money:', error)
    throw error
  }
}

export default {
  getRequestWalletMoney,
  getWithdrawalRequests,
  getRefundRequests,
  getRequestWalletMoneyByStatus,
  updateRequestWalletMoney
}
