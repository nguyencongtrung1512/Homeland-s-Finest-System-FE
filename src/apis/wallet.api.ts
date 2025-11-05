import axiosInstance from '../service/axiosInstance'

const API_URL = '/Wallet'

export interface WalletBalanceResponse {
  status: number
  message: string
  data: {
    userId: string
    availableBalance: number
    totalBalance: number
    pendingBalance: number
  }
}

/**
 * Lấy số dư khả dụng của user
 * @param userId - ID của user
 * @returns Promise<WalletBalanceResponse>
 */
export const getWalletBalance = async (userId: string): Promise<WalletBalanceResponse['data']> => {
  try {
    const response = await axiosInstance.get<WalletBalanceResponse>(`${API_URL}/${userId}/balance`)
    return response.data.data
  } catch (error) {
    console.error('Error fetching wallet balance:', error)
    // Trả về giá trị mặc định nếu API không tồn tại hoặc có lỗi
    return {
      userId,
      availableBalance: 0,
      totalBalance: 0,
      pendingBalance: 0
    }
  }
}

/**
 * Lấy lịch sử giao dịch wallet
 * @param userId - ID của user
 * @param params - Tham số phân trang
 * @returns Promise<any>
 */
export const getWalletTransactions = async (
  userId: string,
  params?: {
    pageSize?: number
    pageNumber?: number
  }
) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/${userId}/transactions`, {
      params: {
        PageSize: params?.pageSize || 10,
        PageNumber: params?.pageNumber || 1
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching wallet transactions:', error)
    throw error
  }
}

export default {
  getWalletBalance,
  getWalletTransactions
}

