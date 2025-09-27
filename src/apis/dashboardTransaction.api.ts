import axiosInstance from '../service/axiosInstance'
import type { TransactionDashboardParams, TransactionDashboardData } from '../types/transactionDashboardType'


/**
 * Lấy dữ liệu dashboard giao dịch
 * @param params - Tham số truy vấn: StartDate, EndDate, Year
 * @returns Promise<TransactionDashboardData>
 */
export const getTransactionDashboard = async (
  params: TransactionDashboardParams
): Promise<TransactionDashboardData> => {
  const response = await axiosInstance.get(`/transaction-dashboard`, {
    params: {
      Year: params.Year
    }
  })
  return response.data
}

/**
 * Lấy dữ liệu dashboard giao dịch với pagination
 * @param params - Tham số truy vấn
 * @param page - Trang hiện tại (mặc định: 1)
 * @param pageSize - Số lượng item per page (mặc định: 10)
 * @returns Promise<TransactionDashboardData>
 */
export const getTransactionDashboardWithPagination = async (
  params: TransactionDashboardParams,
  page: number = 1,
  pageSize: number = 10
): Promise<TransactionDashboardData> => {
  const response = await axiosInstance.get(`/transaction-dashboard`, {
    params: {
      Year: params.Year,
      page,
      pageSize
    }
  })
  return response.data
}

/**
 * Lấy danh sách các năm có dữ liệu
 * @returns Promise<number[]> - Danh sách các năm có dữ liệu
 */
export const getAvailableYears = async (): Promise<number[]> => {
  const response = await axiosInstance.get(`/transaction-dashboard`, {
    params: {
      Year: new Date().getFullYear() // Lấy năm hiện tại để lấy dữ liệu
    }
  })

  // Lấy danh sách năm từ revenueByYear
  const revenueByYear = response.data?.summary?.revenueByYear
  if (!revenueByYear) {
    console.warn('No revenueByYear data available')
    return []
  }

  const years = Object.keys(revenueByYear).map((year) => parseInt(year))
  return years.sort((a, b) => b - a) // Sắp xếp từ năm mới nhất đến cũ nhất
}

/**
 * Lấy dữ liệu thống kê tổng quan từ transaction-dashboard endpoint
 * @param params - Tham số truy vấn
 * @returns Promise<TransactionDashboardData>
 */
export const getTransactionSummary = async (params: TransactionDashboardParams): Promise<TransactionDashboardData> => {
  const response = await axiosInstance.get(`/transaction-dashboard`, {
    params: {
      Year: params.Year
    }
  })
  return response.data
}