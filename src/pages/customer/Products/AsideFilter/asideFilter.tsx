import { useState, useEffect } from 'react'
import { Slider } from '../../../../components/ui/slider'
import { getAllProductCategory, type ProductCategoryItem } from '../../../../apis/productCategory.api'
import { Button } from '../../../../components/ui/button'
import { ShimmerBorder } from '../../../../components/ui/shimmer'

const SUB_REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam']

export interface FilterState {
  minPrice?: number
  maxPrice?: number
  categoryFilters?: string[]
  subRegionFilters?: string[]
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
  const [selectedRegions, setSelectedRegions] = useState<string[]>(initialFilters?.subRegionFilters || [])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categoryFilters || [])
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await getAllProductCategory({ pageSize: 5, pageNumber: 1 })
        if (response && response.status === 200 && response.data) {
          // Filter only active categories and take first 5
          const activeCategories = response.data
            .filter((category: ProductCategoryItem) => category.isActive)
            .slice(0, 5)
          setCategories(activeCategories)
        } else {
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Cập nhật filters khi initialFilters thay đổi
  useEffect(() => {
    if (initialFilters) {
      setPriceRange([initialFilters.minPrice || 0, initialFilters.maxPrice || 1000000])
      setSelectedRegions(initialFilters.subRegionFilters || [])
      setSelectedCategories(initialFilters.categoryFilters || [])
    }
  }, [initialFilters])

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      const newRegions = prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
      return newRegions
    })
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
      return newCategories
    })
  }

  const handleApplyFilters = () => {
    const filters: FilterState = {
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
      categoryFilters: selectedCategories.length > 0 ? selectedCategories : undefined,
      subRegionFilters: selectedRegions.length > 0 ? selectedRegions : undefined
    }

    // Gọi callback để truyền filters lên component cha
    onFilterChange?.(filters)
  }

  const handleResetFilters = () => {
    setPriceRange([0, 1000000])
    setSelectedRegions([])
    setSelectedCategories([])

    // Gửi filters rỗng để reset
    onFilterChange?.({
      minPrice: undefined,
      maxPrice: undefined,
      categoryFilters: undefined,
      subRegionFilters: undefined
    })
  }

  return (
    <aside className='w-full bg-white rounded-xl border border-gray-200 p-4 sticky top-24 h-max'>
      <h3 className='text-sm font-bold bg-green-600 border border-green-600 p-2 rounded-lg'>TẤT CẢ SẢN PHẨM</h3>

      {/* Categories */}
      <div className='mt-4 space-y-2 text-sm'>
        {categoriesLoading ? (
          <div className='text-center text-gray-500 py-4'>Đang tải danh mục...</div>
        ) : categories.length > 0 ? (
          categories.map((category) => (
            <button
              key={category.id}
              onClick={() => toggleCategory(category.id)}
              className={`block w-full text-left px-2 py-1.5 rounded transition ${
                selectedCategories.includes(category.id)
                  ? 'bg-green-100 text-green-700 font-semibold'
                  : 'hover:bg-gray-50'
              }`}
            >
              {category.name}
            </button>
          ))
        ) : (
          <div className='text-center text-gray-500 py-4'>Không có danh mục</div>
        )}
      </div>

      {/* Sub Region */}
      <div className='mt-6'>
        <p className='text-sm font-semibold text-gray-700 mb-2'>Vùng miền</p>
        <div className='grid grid-cols-1 gap-2'>
          {SUB_REGIONS.map((region) => (
            <button
              key={region}
              onClick={() => toggleRegion(region)}
              className={`text-sm rounded border px-3 py-1.5 transition ${
                selectedRegions.includes(region)
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 hover:border-green-400'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className='mt-6'>
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
      </div>

      {/* Action buttons */}
      <div className='mt-6 space-y-4 py-4 border-t border-gray-200'>
        <ShimmerBorder className='w-full' color='#10b981' animationDuration='3s' contentClassName='bg-transparent'>
          <Button variant='green' onClick={handleApplyFilters} className='w-full'>
            Áp dụng lọc
          </Button>
        </ShimmerBorder>
        {(selectedCategories.length > 0 ||
          selectedRegions.length > 0 ||
          priceRange[0] > 0 ||
          priceRange[1] < 1000000) && (
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
