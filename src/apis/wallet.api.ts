import axiosInstance from '../service/axiosInstance'
import type { WalletData } from '../types/walletType'

const API_URL = '/Wallet'

/**
 * Lấy số dư khả dụng của user
 * @returns Promise<WalletData>
 */
export const getWalletBalance = async (): Promise<WalletData> => {
    const response = await axiosInstance.get<WalletData>(`${API_URL}/my-Wallet`)
    return response.data
}


export const getWalletTransactions = async (
  params?: {
    pageSize?: number
    pageNumber?: number
  }
) => {
  try {
    const response = await axiosInstance.get(`${API_URL}/my-wallet-history`, {
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
