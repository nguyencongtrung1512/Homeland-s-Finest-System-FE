import type {
  CertificateData,
  ISO22000CertificateData,
  HACCPCertificateData,
  BusinessLicenseData,
  HouseholdBusinessData,
  BusinessLocationData,
  OCOPCertificateData,
  VietGAPCertificateData
} from '../apis/n8n.api'

/**
 * Convert certificate type code sang label tiếng Việt
 */
export const getCertificateTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    CHUNG_NHAN_ISO_22000: 'Chứng nhận ISO 22000',
    CHUNG_NHAN_HACCP: 'Chứng nhận HACCP',
    GIAY_CHUNG_NHAN_DANG_KY_DOANH_NGHIEP: 'Giấy chứng nhận đăng ký doanh nghiệp',
    GIAY_CHUNG_NHAN_DANG_KY_HO_KINH_DOANH: 'Giấy chứng nhận đăng ký hộ kinh doanh',
    GIAY_CHUNG_NHAN_DANG_KY_DIA_DIEM_KINH_DOANH: 'Giấy chứng nhận đăng ký địa điểm kinh doanh',
    CHUNG_NHAN_OCOP: 'Chứng nhận OCOP',
    CHUNG_NHAN_VIETGAP: 'Chứng nhận VietGAP',
    KHAC: 'Văn bản khác',
    KHONG_LIEN_QUAN: 'Không liên quan'
  }

  return typeMap[type] || type
}

/**
 * Trả về màu cho badge theo level
 */
export const getLevelBadgeColor = (level: string): string => {
  const levelLower = level.toLowerCase()
  if (levelLower === 'good') return 'bg-emerald-100 text-emerald-700 border-emerald-300'
  if (levelLower === 'fair') return 'bg-yellow-100 text-yellow-700 border-yellow-300'
  return 'bg-red-100 text-red-700 border-red-300'
}

/**
 * Trả về label tiếng Việt cho level
 */
export const getLevelLabel = (level: string): string => {
  const levelLower = level.toLowerCase()
  if (levelLower === 'good') return 'Hợp lệ'
  if (levelLower === 'fair') return 'Không phù hợp'
  return 'Không hợp lệ'
}

/**
 * Label tiếng Việt cho category
 */
export const getCategoryLabel = (category?: string): string => {
  if (!category) return ''
  const map: Record<string, string> = {
    Store: 'Cửa hàng',
    Product: 'Sản phẩm'
  }
  return map[category] || category
}

/**
 * Format và render certificate data theo từng loại
 */
export const formatCertificateData = (
  data: CertificateData | null,
  type: string
): Array<{ label: string; value: string | React.ReactNode }> => {
  if (!data) return []

  const fields: Array<{ label: string; value: string | React.ReactNode }> = []

  switch (type) {
    case 'CHUNG_NHAN_ISO_22000': {
      const isoData = data as ISO22000CertificateData
      fields.push(
        { label: 'Tên đơn vị', value: isoData.ten_don_vi },
        { label: 'Địa chỉ', value: isoData.dia_chi },
        { label: 'Tiêu chuẩn áp dụng', value: isoData.tieu_chuan_ap_dung },
        { label: 'Phạm vi chứng nhận', value: isoData.pham_vi_chung_nhan },
        { label: 'Số giấy chứng nhận', value: isoData.so_giay_chung_nhan },
        { label: 'Ngày chứng nhận', value: isoData.ngay_chung_nhan },
        { label: 'Ngày hết hạn', value: isoData.ngay_het_han }
      )
      break
    }

    case 'CHUNG_NHAN_HACCP': {
      const haccpData = data as HACCPCertificateData
      fields.push(
        { label: 'Tên đơn vị', value: haccpData.ten_don_vi },
        { label: 'Địa chỉ', value: haccpData.dia_chi },
        { label: 'Tiêu chuẩn áp dụng', value: haccpData.tieu_chuan_ap_dung },
        { label: 'Phạm vi chứng nhận', value: haccpData.pham_vi_chung_nhan },
        { label: 'Số chứng chỉ', value: haccpData.so_chung_chi },
        { label: 'Ngày cấp', value: haccpData.ngay_cap },
        { label: 'Ngày hết hạn', value: haccpData.ngay_het_han }
      )
      break
    }

    case 'GIAY_CHUNG_NHAN_DANG_KY_DOANH_NGHIEP': {
      const businessData = data as BusinessLicenseData
      fields.push(
        { label: 'Tên doanh nghiệp (Tiếng Việt)', value: businessData.ten_doanh_nghiep_tieng_viet || '-' },
        { label: 'Tên doanh nghiệp (Tiếng nước ngoài)', value: businessData.ten_doanh_nghiep_tieng_nuoc_ngoai || '-' },
        { label: 'Tên viết tắt', value: businessData.ten_doanh_nghiep_viet_tat || '-' },
        { label: 'Mã số doanh nghiệp', value: businessData.ma_so_doanh_nghiep },
        { label: 'Ngày đăng ký lần đầu', value: businessData.ngay_dang_ky_lan_dau },
        { label: 'Địa chỉ trụ sở chính', value: businessData.dia_chi_tru_so_chinh },
        { label: 'Vốn điều lệ', value: businessData.von_dieu_le }
      )

      if (businessData.nguoi_dai_dien_phap_luat) {
        const rep = businessData.nguoi_dai_dien_phap_luat
        fields.push(
          { label: 'Người đại diện pháp luật', value: rep.ho_va_ten },
          { label: 'Chức danh', value: rep.chuc_danh || '-' },
          { label: 'Ngày sinh', value: rep.ngay_sinh || '-' },
          { label: 'Quốc tịch', value: rep.quoc_tich || '-' },
          { label: 'Số giấy tờ pháp lý', value: rep.so_giay_to_phap_ly || '-' },
          { label: 'Ngày cấp', value: rep.ngay_cap || '-' },
          { label: 'Nơi cấp', value: rep.noi_cap || '-' }
        )
      }
      break
    }

    case 'GIAY_CHUNG_NHAN_DANG_KY_HO_KINH_DOANH': {
      const householdData = data as HouseholdBusinessData
      fields.push(
        { label: 'Tên hộ kinh doanh', value: householdData.ten_ho_kinh_doanh },
        { label: 'Mã số đăng ký', value: householdData.ma_so_dang_ky_ho_kinh_doanh },
        { label: 'Ngày đăng ký lần đầu', value: householdData.ngay_dang_ky_lan_dau },
        { label: 'Địa chỉ trụ sở', value: householdData.dia_chi_tru_so },
        { label: 'Ngành nghề kinh doanh', value: householdData.nganh_nghe_kinh_doanh },
        { label: 'Vốn kinh doanh', value: householdData.von_kinh_doanh }
      )

      if (householdData.chu_ho_kinh_doanh) {
        const owner = householdData.chu_ho_kinh_doanh
        fields.push(
          { label: 'Chủ hộ kinh doanh', value: owner.ho_va_ten },
          { label: 'Ngày sinh', value: owner.ngay_sinh || '-' },
          { label: 'Số căn cước/CMND', value: owner.so_can_cuoc || '-' },
          { label: 'Ngày cấp', value: owner.ngay_cap || '-' },
          { label: 'Nơi cấp', value: owner.noi_cap || '-' }
        )
      }
      break
    }

    case 'GIAY_CHUNG_NHAN_DANG_KY_DIA_DIEM_KINH_DOANH': {
      const locationData = data as BusinessLocationData
      fields.push(
        { label: 'Tên địa điểm kinh doanh', value: locationData.ten_dia_diem_kinh_doanh },
        { label: 'Mã số địa điểm', value: locationData.ma_so_dia_diem_kinh_doanh },
        { label: 'Địa chỉ', value: locationData.dia_chi }
      )

      if (locationData.nguoi_dung_dau) {
        fields.push(
          { label: 'Người đứng đầu', value: locationData.nguoi_dung_dau.ho_va_ten },
          { label: 'Số giấy tờ pháp lý', value: locationData.nguoi_dung_dau.so_giay_to_phap_ly || '-' }
        )
      }

      if (locationData.don_vi_chu_quan) {
        fields.push(
          { label: 'Đơn vị chủ quản', value: locationData.don_vi_chu_quan.ten_doanh_nghiep },
          { label: 'Mã số doanh nghiệp', value: locationData.don_vi_chu_quan.ma_so_doanh_nghiep }
        )
      }
      break
    }

    case 'CHUNG_NHAN_OCOP': {
      const ocopData = data as OCOPCertificateData
      fields.push(
        { label: 'Tên sản phẩm', value: ocopData.ten_san_pham },
        { label: 'Tên chủ thể', value: ocopData.ten_chu_the },
        { label: 'Hạng sao', value: String(ocopData.hang_sao) },
        { label: 'Số quyết định', value: ocopData.so_quyet_dinh || '-' },
        { label: 'Năm đánh giá', value: ocopData.nam_danh_gia || '-' },
        { label: 'Tên cuộc thi/Chương trình', value: ocopData.ten_cuoc_thi || '-' },
        { label: 'Tỉnh/Thành phố cấp', value: ocopData.tinh_thanh_pho },
        { label: 'Ngày hết hạn', value: ocopData.ngay_het_han || '-' }
      )
      break
    }

    case 'CHUNG_NHAN_VIETGAP': {
      const vietgapData = data as VietGAPCertificateData
      fields.push(
        { label: 'Sản phẩm được chứng nhận', value: vietgapData.san_pham_duoc_chung_nhan },
        { label: 'Tên cơ sở', value: vietgapData.ten_co_so },
        { label: 'Địa chỉ vùng trồng', value: vietgapData.dia_chi_vung_trong },
        { label: 'Diện tích canh tác', value: vietgapData.dien_tich_canh_tac },
        { label: 'Sản lượng dự kiến', value: vietgapData.san_luong_du_kien },
        { label: 'Tiêu chuẩn áp dụng', value: vietgapData.tieu_chuan_ap_dung },
        { label: 'Số giấy chứng nhận', value: vietgapData.so_giay_chung_nhan },
        { label: 'Hiệu lực từ ngày', value: vietgapData.hieu_luc_tu_ngay },
        { label: 'Hiệu lực đến ngày', value: vietgapData.hieu_luc_den_ngay }
      )
      break
    }

    default:
      // Fallback: hiển thị tất cả fields của object
      Object.entries(data as Record<string, any>).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Nested object
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            fields.push({
              label: `${key} - ${nestedKey}`,
              value: String(nestedValue || '-')
            })
          })
        } else {
          fields.push({
            label: key,
            value: String(value || '-')
          })
        }
      })
  }

  return fields
}

