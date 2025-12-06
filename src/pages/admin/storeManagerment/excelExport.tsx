import * as XLSX from 'xlsx'
import { type StoreResponse } from '../../../apis/store.api'

/**
 * Format date to Vietnamese format
 */
const formatDateToVietnamese = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Chưa có'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Ngày không hợp lệ'
  }
}

/**
 * Get status text in Vietnamese
 */
const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    Approved: 'Hoạt động',
    Pending: 'Chờ duyệt',
    Rejected: 'Từ chối',
    Processing: 'Nhân viên xử lí',
    ReviewedByStaff: 'Đã duyệt bởi nhân viên',
    Inactive: 'Bị khóa'
  }
  return statusMap[status] || 'Chờ duyệt'
}

/**
 * Export store details to Excel
 */
export const exportStoreToExcel = (store: StoreResponse) => {
  try {
    // Tạo workbook mới
    const wb = XLSX.utils.book_new()

    // ============================================
    // SHEET 1: THÔNG TIN CỬA HÀNG
    // ============================================
    const storeInfo = [
      ['THÔNG TIN CHI TIẾT CỬA HÀNG'],
      [],
      ['Tên cửa hàng:', store.storeName || ''],
      ['Địa chỉ:', store.address || 'Chưa có thông tin địa chỉ'],
      ['Trạng thái:', getStatusText(store.status || 'Pending')],
      ['Ngày nộp đơn:', formatDateToVietnamese(store.submittedDate)],
      ['Ngày quyết định:', formatDateToVietnamese(store.decisionDate)],
      [],
      ['GHI CHÚ VÀ ĐÁNH GIÁ'],
      [],
      ['Ghi chú Admin:', store.adminNote || 'Chưa có'],
      ['Nhân viên đánh giá:', store.staffName || 'Chưa có'],
      ['Ghi chú nhân viên:', store.staffNotes || 'Chưa có'],
      [],
      ['THÔNG TIN NGƯỜI ĐẠI DIỆN PHÁP LÝ'],
      []
    ]

    // Thêm thông tin người bán
    if (store.sellerInfo) {
      storeInfo.push(
        ['Họ và tên:', `${store.sellerInfo.userInfo.firstName} ${store.sellerInfo.userInfo.lastName}`],
        ['Email:', store.sellerInfo.userInfo.email || 'Chưa có thông tin'],
        ['Số điện thoại:', store.sellerInfo.userInfo.phoneNumber || 'Chưa có thông tin'],
        ['CCCD:', store.sellerInfo.identifyCard || 'Chưa có thông tin']
      )
    } else {
      storeInfo.push(
        ['Họ và tên:', 'Chưa có thông tin'],
        ['Email:', 'Chưa có thông tin'],
        ['Số điện thoại:', 'Chưa có thông tin'],
        ['CCCD:', 'Chưa có thông tin']
      )
    }

    const ws1 = XLSX.utils.aoa_to_sheet(storeInfo)

    // Định dạng độ rộng cột cho sheet 1
    ws1['!cols'] = [{ wch: 30 }, { wch: 60 }]

    // Merge cells cho tiêu đề
    ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

    XLSX.utils.book_append_sheet(wb, ws1, 'Thông tin cửa hàng')

    // ============================================
    // SHEET 2: DANH SÁCH SẢN PHẨM
    // ============================================
    if (store.products && store.products.length > 0) {
      const productsData: any[][] = [
        ['DANH SÁCH SẢN PHẨM CỦA CỬA HÀNG: ' + (store.storeName || '')],
        [],
        ['STT', 'Tên sản phẩm', 'Mô tả', 'Giá (đ)', 'Số lượng', 'Danh mục', 'Trạng thái']
      ]

      store.products.forEach((product: any, index: number) => {
        productsData.push([
          index + 1,
          product.productName || '',
          product.description || 'Không có mô tả',
          product.price ? product.price.toLocaleString('vi-VN') : '0',
          product.quantity || 0,
          product.categoryName || 'Chưa phân loại',
          product.status ? getStatusText(product.status) : 'Hoạt động'
        ])
      })

      // Thêm dòng tổng kết
      productsData.push(
        [],
        ['TỔNG CỘNG:', '', '', '', store.products.length + ' sản phẩm', '', '']
      )

      const ws2 = XLSX.utils.aoa_to_sheet(productsData)

      // Định dạng độ rộng cột cho sheet 2
      ws2['!cols'] = [
        { wch: 5 },  // STT
        { wch: 35 }, // Tên sản phẩm
        { wch: 50 }, // Mô tả
        { wch: 15 }, // Giá
        { wch: 10 }, // Số lượng
        { wch: 20 }, // Danh mục
        { wch: 12 }  // Trạng thái
      ]

      // Merge cells cho tiêu đề
      ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

      XLSX.utils.book_append_sheet(wb, ws2, 'Sản phẩm')
    }

    // ============================================
    // XUẤT FILE
    // ============================================
    const timestamp = new Date().toISOString().split('T')[0]
    const storeName = store.storeName?.replace(/[^a-zA-Z0-9]/g, '_') || 'CuaHang'
    const fileName = `${storeName}_${timestamp}.xlsx`

    XLSX.writeFile(wb, fileName)

    return { success: true, fileName }
  } catch (error) {
    console.error('Export Excel error:', error)
    return { success: false, error }
  }
}

/**
 * Export multiple stores to Excel
 */
export const exportStoresToExcel = (stores: StoreResponse[]) => {
  try {
    const wb = XLSX.utils.book_new()

    // Tạo data cho sheet
    const storesData: any[][] = [
      ['DANH SÁCH CÁC CỬA HÀNG'],
      [],
      ['STT', 'Tên cửa hàng', 'Địa chỉ', 'Trạng thái', 'Ngày nộp đơn', 'Người đại diện', 'Email', 'Số điện thoại']
    ]

    stores.forEach((store, index) => {
      const sellerName = store.sellerInfo
        ? `${store.sellerInfo.userInfo.firstName} ${store.sellerInfo.userInfo.lastName}`
        : 'Chưa có'
      const sellerEmail = store.sellerInfo?.userInfo.email || 'Chưa có'
      const sellerPhone = store.sellerInfo?.userInfo.phoneNumber || 'Chưa có'

      storesData.push([
        index + 1,
        store.storeName || '',
        store.address || '',
        getStatusText(store.status || 'Pending'),
        formatDateToVietnamese(store.submittedDate),
        sellerName,
        sellerEmail,
        sellerPhone
      ])
    })

    // Thêm dòng tổng kết
    storesData.push([], ['TỔNG CỘNG:', stores.length + ' cửa hàng', '', '', '', '', '', ''])

    const ws = XLSX.utils.aoa_to_sheet(storesData)

    // Định dạng độ rộng cột
    ws['!cols'] = [
      { wch: 5 },  // STT
      { wch: 30 }, // Tên cửa hàng
      { wch: 40 }, // Địa chỉ
      { wch: 20 }, // Trạng thái
      { wch: 20 }, // Ngày nộp đơn
      { wch: 25 }, // Người đại diện
      { wch: 30 }, // Email
      { wch: 15 }  // Số điện thoại
    ]

    // Merge cells cho tiêu đề
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]

    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách cửa hàng')

    // Xuất file
    const timestamp = new Date().toISOString().split('T')[0]
    const fileName = `DanhSachCuaHang_${timestamp}.xlsx`

    XLSX.writeFile(wb, fileName)

    return { success: true, fileName }
  } catch (error) {
    console.error('Export Excel error:', error)
    return { success: false, error }
  }
}