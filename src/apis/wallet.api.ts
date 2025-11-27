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

export const getWalletTransactions = async (params?: { pageSize?: number; pageNumber?: number }) => {
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

/**
 * Interface cho response của deposit API
 */
export interface DepositResponse {
  success: boolean
  message: string
  amountDeposited: number
  currentAvailable: number
  currentDebt: number
}

/**
 * Interface cho response của pay debt API
 */
export interface PayDebtResponse {
  success: boolean
  message: string
  amountPaid: number
  remainingDebt: number
  currentAvailable: number
}

/**
 * Interface cho response của withdrawal API
 */
export interface WithdrawalResponse {
  id: string
  walletId: string
  orderId: string
  userId: string
  userEmail: string
  userPhoneNumber: string
  type: string
  amount: number
  bankAccount: string
  bankName: string
  accountHolderName: string
  status: string
  processedBy: string
  processNote: string
  processedAt: string
  createdAt: string
  updatedAt: string
}

/**
 * Nạp tiền vào tài khoản
 * @param amount Số tiền muốn nạp
 * @returns Promise<DepositResponse>
 */
export const depositMoney = async (amount: number): Promise<DepositResponse> => {
  try {
    // Axios interceptor đã trả về response.data, nên response ở đây đã là data rồi
    const response = await axiosInstance.post<
      | {
        status?: number
        message: string
        data: DepositResponse
      }
      | DepositResponse
    >(`${API_URL}/deposit`, amount, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Xử lý cả 2 trường hợp: response có wrapper hoặc response trực tiếp
    if ('data' in response && response.data) {
      return response.data as DepositResponse
    }
    return response as any
  } catch (error) {
    console.error('Error depositing money:', error)
    throw error
  }
}

/**
 * Trả nợ (pay debt)
 * @param amount Số tiền muốn trả
 * @returns Promise<PayDebtResponse>
 */
export const payDebt = async (amount: number): Promise<PayDebtResponse> => {
  try {
    const response = await axiosInstance.post<{
      status: number
      message: string
      data: PayDebtResponse
    }>(`${API_URL}/pay-debt`, amount, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data.data
  } catch (error) {
    console.error('Error paying debt:', error)
    throw error
  }
}

/**
 * Rút tiền (withdrawal)
 * @param amount Số tiền muốn rút
 * @returns Promise<WithdrawalResponse>
 */
export const withdrawal = async (amount: number): Promise<WithdrawalResponse> => {
  try {
    const response = await axiosInstance.post<{
      status: number
      message: string
      data: WithdrawalResponse
    }>(`${API_URL}/withdrawal`, amount, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data.data
  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    throw error
  }
}

export default {
  getWalletBalance,
  getWalletTransactions,
  depositMoney,
  payDebt,
  withdrawal
}
