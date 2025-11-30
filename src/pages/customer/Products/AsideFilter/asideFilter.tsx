import { useState, useEffect } from 'react'
import { Slider } from '../../../../components/ui/slider'
import { getAllProductCategory, type ProductCategoryItem } from '../../../../apis/productCategory.api'
import { Button } from '../../../../components/ui/button'
import { ShimmerBorder } from '../../../../components/ui/shimmer'

const SUB_REGIONS = ['Miền Bắc', 'Miền Trung', 'Miền Nam']

// Extended type to include parentId from API response
interface ProductCategoryItemWithParent extends ProductCategoryItem {
  parentId?: string | null
}

// Category names for Group 1: THỰC PHẨM & ĐẶC SẢN
const GROUP_1_CATEGORY_NAMES = [
  'Cà phê, Trà & Đồ uống',
  'Các loại Hạt & Ngũ cốc',
  'Trái cây & Nông sản',
  'Gia vị & Sốt đặc trưng',
  'Bánh, Mứt & Kẹo truyền thống',
  'Thực phẩm chế biến & Khô',
  'Sản phẩm từ ong'
]

// Category names for Group 2: THỦ CÔNG MỸ NGHỆ & QUÀ TẶNG
const GROUP_2_CATEGORY_NAMES = [
  'Gốm sứ nghệ thuật',
  'Sản phẩm từ Vải & Lụa tơ tằm',
  'Sản phẩm Mây, Tre & Cói đan',
  'Đồ gỗ & Điêu khắc nghệ thuật',
  'Sơn mài truyền thống',
  'Trang sức & Phụ kiện thủ công',
  'Đồ trang trí & Quà tặng'
]

export interface FilterState {
  minPrice?: number
  maxPrice?: number
  categoryFilterIds?: string[] // Category UUIDs for filtering
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.categoryFilterIds || [])
  const [group1Categories, setGroup1Categories] = useState<ProductCategoryItem[]>([])
  const [group2Categories, setGroup2Categories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<'group1' | 'group2' | null>(null)

  // Fetch parent categories from API and categorize them into groups
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        // Get all categories to filter parent categories
        const response = await getAllProductCategory({ pageSize: 0, pageNumber: 1 })
        if (response && response.status === 200 && response.data) {
          // Filter only active parent categories (categories without parentId)
          const parentCategories = response.data.filter((category: ProductCategoryItemWithParent) => {
            // Category is active and has no parentId (it's a parent category)
            return (
              category.isActive &&
              (category.parentId === null || category.parentId === undefined || category.parentId === '')
            )
          })

          // Categorize into Group 1 and Group 2 based on category names
          const group1 = parentCategories.filter((category: ProductCategoryItem) =>
            GROUP_1_CATEGORY_NAMES.includes(category.name)
          )
          const group2 = parentCategories.filter((category: ProductCategoryItem) =>
            GROUP_2_CATEGORY_NAMES.includes(category.name)
          )

          setGroup1Categories(group1)
          setGroup2Categories(group2)
        } else {
          setGroup1Categories([])
          setGroup2Categories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setGroup1Categories([])
        setGroup2Categories([])
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

      // Determine selected group based on category filters
      const categoryIds = initialFilters.categoryFilterIds || []
      if (categoryIds.length > 0) {
        setSelectedCategories(categoryIds)

        // Check which group matches
        const group1Ids = group1Categories.map((cat) => cat.id)
        const group2Ids = group2Categories.map((cat) => cat.id)

        const isGroup1 = categoryIds.every((id) => group1Ids.includes(id)) && categoryIds.length === group1Ids.length
        const isGroup2 = categoryIds.every((id) => group2Ids.includes(id)) && categoryIds.length === group2Ids.length

        if (isGroup1) {
          setSelectedGroup('group1')
        } else if (isGroup2) {
          setSelectedGroup('group2')
        } else {
          setSelectedGroup(null)
        }
      } else {
        setSelectedCategories([])
        setSelectedGroup(null)
      }
    }
  }, [initialFilters, group1Categories, group2Categories])

  const toggleRegion = (region: string) => {
    setSelectedRegions((prev) => {
      const newRegions = prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
      return newRegions
    })
  }

  // Handle group filter click
  const handleGroupFilter = (groupType: 'group1' | 'group2') => {
    const categoriesToSelect =
      groupType === 'group1' ? group1Categories.map((cat) => cat.id) : group2Categories.map((cat) => cat.id)

    // Toggle: if same group is clicked again, deselect all. Otherwise, select new group
    if (selectedGroup === groupType) {
      // Deselect if clicking the same group
      setSelectedCategories([])
      setSelectedGroup(null)
      // Apply empty filters
      onFilterChange?.({
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        categoryFilterIds: undefined,
        subRegionFilters: selectedRegions.length > 0 ? selectedRegions : undefined
      })
    } else {
      // Select new group
      setSelectedCategories(categoriesToSelect)
      setSelectedGroup(groupType)
      // Immediately apply filters with selected categories
      onFilterChange?.({
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        categoryFilterIds: categoriesToSelect,
        subRegionFilters: selectedRegions.length > 0 ? selectedRegions : undefined
      })
    }
  }

  const handleApplyFilters = () => {
    const filters: FilterState = {
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
      categoryFilterIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      subRegionFilters: selectedRegions.length > 0 ? selectedRegions : undefined
    }

    // Gọi callback để truyền filters lên component cha
    onFilterChange?.(filters)
  }

  const handleResetFilters = () => {
    setPriceRange([0, 1000000])
    setSelectedRegions([])
    setSelectedCategories([])
    setSelectedGroup(null)

    // Gửi filters rỗng để reset
    onFilterChange?.({
      minPrice: undefined,
      maxPrice: undefined,
      categoryFilterIds: undefined,
      subRegionFilters: undefined
    })
  }

  return (
    <aside className='w-full bg-white rounded-xl border border-gray-200 p-4 sticky top-24 h-max'>
      <h3 className='text-sm font-bold bg-green-600 border border-green-600 p-2 rounded-lg'>TẤT CẢ SẢN PHẨM</h3>

      {/* Group Filters */}
      <div className='mt-4 space-y-3'>
        {categoriesLoading ? (
          <div className='text-center text-gray-500 py-4 text-sm'>Đang tải danh mục...</div>
        ) : (
          <>
            {/* Group 1: Thực phẩm & Đặc sản */}
            <button
              onClick={() => handleGroupFilter('group1')}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedGroup === 'group1'
                ? 'bg-green-600 text-white border-green-600 font-semibold'
                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
                }`}
            >
              <div className='text-sm font-semibold'>Thực phẩm & Đặc sản</div>
              {group1Categories.length > 0 && (
                <div className='text-xs mt-1 opacity-75'>
                  {group1Categories.length} danh mục
                </div>
              )}
            </button>

            {/* Group 2: Thủ công mỹ nghệ & Quà tặng */}
            <button
              onClick={() => handleGroupFilter('group2')}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${selectedGroup === 'group2'
                ? 'bg-green-600 text-white border-green-600 font-semibold'
                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
                }`}
            >
              <div className='text-sm font-semibold'>Thủ công mỹ nghệ & Quà tặng</div>
              {group2Categories.length > 0 && (
                <div className='text-xs mt-1 opacity-75'>
                  {group2Categories.length} danh mục
                </div>
              )}
            </button>
          </>
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
              className={`text-sm rounded border px-3 py-1.5 transition ${selectedRegions.includes(region)
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
        {(selectedRegions.length > 0 || priceRange[0] > 0 || priceRange[1] < 1000000) && (
          <ShimmerBorder className='w-full' color='#10b981' animationDuration='3s' contentClassName='bg-transparent'>
            <Button variant='green' onClick={handleApplyFilters} className='w-full'>
              Áp dụng lọc
            </Button>
          </ShimmerBorder>
        )}
        {(selectedGroup !== null ||
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
