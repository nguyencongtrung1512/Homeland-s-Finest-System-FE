import { useState, useEffect } from 'react'
import { Button } from '../../../../components/ui/button'
import { ShimmerBorder } from '../../../../components/ui/shimmer'
import VietnamMap, { type ProvinceProperties } from '../../../../components/Province/VietnamMap'

export interface FilterState {
  minPrice?: number
  maxPrice?: number
  provinceFilters?: string[]
}

interface AsideFilterProps {
  onFilterChange?: (filters: FilterState) => void
  initialFilters?: FilterState
}

function AsideFilter({ onFilterChange, initialFilters }: AsideFilterProps) {
  const [priceRange, setPriceRange] = useState<number[]>([
    initialFilters?.minPrice || 0,
    initialFilters?.maxPrice || 1000000
  ])
  const [selectedProvince, setSelectedProvince] = useState<ProvinceProperties | null>(null)
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null)

  // Cập nhật filters khi initialFilters thay đổi
  useEffect(() => {
    if (initialFilters) {
      setPriceRange([initialFilters.minPrice || 0, initialFilters.maxPrice || 1000000])

      // Set selected province name if provinceFilters exist
      if (initialFilters.provinceFilters && initialFilters.provinceFilters.length > 0) {
        const provinceName = initialFilters.provinceFilters[0]
        // Lưu tên tỉnh để hiển thị
        setSelectedProvinceName(provinceName)
        // Tạo ProvinceProperties object tạm thời từ tên tỉnh nếu chưa có hoặc tên khác
        setSelectedProvince((prev) => {
          if (prev && prev.Name === provinceName) {
            return prev // Giữ nguyên nếu tên khớp
          }
          // Tạo mới nếu chưa có hoặc tên khác
          return {
            Name: provinceName,
            Region: undefined,
            Note: null,
            description: undefined,
            regionSpecified: undefined
          }
        })
      } else {
        setSelectedProvince(null)
        setSelectedProvinceName(null)
      }
    }
  }, [initialFilters])

  // Handle province selection from VietnamMap
  const handleProvinceSelect = (province: ProvinceProperties | null) => {
    // If clicking the same province, deselect it
    if (province && selectedProvince && selectedProvince.Name === province.Name) {
      setSelectedProvince(null)
      setSelectedProvinceName(null)
      // Immediately trigger search with no province filter
      onFilterChange?.({
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        provinceFilters: undefined
      })
    } else {
      setSelectedProvince(province)
      setSelectedProvinceName(province ? province.Name : null)

      // Immediately trigger search with province filter
      const provinceFilters = province ? [province.Name] : undefined

      onFilterChange?.({
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        provinceFilters
      })
    }
  }

  const handleApplyFilters = () => {
    const filters: FilterState = {
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
      provinceFilters: selectedProvince ? [selectedProvince.Name] : undefined
    }

    // Gọi callback để truyền filters lên component cha
    onFilterChange?.(filters)
  }

  const handleResetFilters = () => {
    setPriceRange([0, 1000000])
    setSelectedProvince(null)
    setSelectedProvinceName(null)

    // Gửi filters rỗng để reset
    onFilterChange?.({
      minPrice: undefined,
      maxPrice: undefined,
      provinceFilters: undefined
    })
  }

  return (
    <aside className='w-full bg-white rounded-xl border border-gray-200 p-4 sticky top-24 h-max'>
      <h3 className='text-sm font-bold bg-green-600 border border-green-600 p-2 rounded-lg uppercase'>Khám phá đặc sản</h3>

      {/* Vietnam Map */}
      <div className='mt-2'>
        {/* Hiển thị tỉnh đang chọn */}
        {(selectedProvince || selectedProvinceName) && (
          <div className='mt-2 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-gray-700'>Đang chọn:</span>
                <span className='text-sm font-semibold text-green-700'>
                  {selectedProvince?.Name || selectedProvinceName}
                </span>
              </div>
              <button
                onClick={() => handleProvinceSelect(null)}
                className='text-xs text-gray-500 hover:text-red-600 transition-colors'
                title='Bỏ chọn'
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className='flex justify-center'>
          <VietnamMap setSelectedProvince={handleProvinceSelect} />
        </div>

      </div>

      {/* Price range */}
      {/* <div className='mt-6'>
        <p className='text-sm font-semibold text-gray-700'>KHOẢNG GIÁ</p>
        <div className='mt-3'>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={1000000}
            step={10000}
            className='w-full'
          />
          <div className='flex justify-between text-xs text-gray-500 mt-1'>
            <span>0đ</span>
            <span>1,000,000đ</span>
          </div>
          <div className='mt-2 text-sm font-medium text-green-700'>
            Từ: {priceRange[0].toLocaleString('vi-VN')}đ - Đến: {priceRange[1].toLocaleString('vi-VN')}đ
          </div>
        </div>
      </div> */}

      {/* Action buttons */}
      <div className='mt-6 space-y-4 py-4 border-t border-gray-200'>
        {(selectedProvince !== null || priceRange[0] > 0 || priceRange[1] < 1000000) && (
          <ShimmerBorder className='w-full' color='#10b981' animationDuration='3s' contentClassName='bg-transparent'>
            <Button variant='green' onClick={handleApplyFilters} className='w-full'>
              Áp dụng lọc
            </Button>
          </ShimmerBorder>
        )}
        {(selectedProvince !== null || priceRange[0] > 0 || priceRange[1] < 1000000) && (
          <ShimmerBorder
            className='w-full'
            color='#dc2626'
            animationDuration='3s'
            contentClassName='bg-transparent rounded-lg'
          >
            <Button
              onClick={handleResetFilters}
              className='w-full rounded-lg border border-gray-300 text-gray-700 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors bg-white'
            >
              Xóa bộ lọc
            </Button>
          </ShimmerBorder>
        )}
      </div>
    </aside>
  )
}

export default AsideFilter
