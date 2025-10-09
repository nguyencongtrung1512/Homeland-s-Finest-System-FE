import axiosInstance from '../service/axiosInstance'
import type {
  TransactionDashboardParams,
  TransactionDashboardData
} from '../types/transactionDashboardType'

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
 * Lấy dữ liệu thống kê theo tháng
 * @param year - Năm cần lấy dữ liệu
 * @returns Promise<MonthlyStatsData>
 */
export const getTransactionMonthlyStats = async (year: number): Promise<any> => {
  const response = await axiosInstance.get(`/transaction-dashboard/monthly-stats`, {
    params: {
      year
    }
  })
  return response
}
