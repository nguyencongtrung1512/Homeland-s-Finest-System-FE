import { useState, useEffect, useMemo, useRef } from 'react'
import VietnamMap, { type ProvinceProperties } from '../../../../components/Province/VietnamMap'
import { Slider } from '../../../../components/ui/slider'
import { getAllProductCategory, type ProductCategoryItem } from '../../../../apis/productCategory.api'

export interface FilterState {
  minPrice?: number
  maxPrice?: number
  provinceFilters?: string[]
  categoryFilterIds?: string[]
}

interface AsideFilterProps {
  onFilterChange?: (filters: FilterState) => void
  initialFilters?: FilterState
}

// Component để hiển thị category tree với checkbox
interface CategoryTreeNodeProps {
  category: ProductCategoryItem
  selectedIds: Set<string>
  expandedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleExpand: (id: string) => void
}

function CategoryTreeNode({
  category,
  selectedIds,
  expandedIds,
  onToggleSelect,
  onToggleExpand
}: CategoryTreeNodeProps) {
  const hasChildren = category.children && category.children.length > 0
  const isExpanded = expandedIds.has(category.id)
  const isSelected = selectedIds.has(category.id)

  const handleToggleSelect = () => {
    onToggleSelect(category.id)
  }

  const handleToggleExpand = () => {
    if (hasChildren) {
      onToggleExpand(category.id)
    }
  }

  return (
    <div className='select-none'>
      <div className='flex items-center gap-2 py-1.5'>
        {hasChildren && (
          <button
            onClick={handleToggleExpand}
            className='w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors'
          >
            {isExpanded ? (
              <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            ) : (
              <svg className='w-3 h-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
              </svg>
            )}
          </button>
        )}
        {!hasChildren && <div className='w-4' />}
        <label className='flex items-center gap-2 cursor-pointer flex-1 hover:text-green-600 transition-colors'>
          <input
            type='checkbox'
            checked={isSelected}
            onChange={handleToggleSelect}
            className='w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer accent-green-600'
            style={{
              backgroundColor: isSelected ? '#16a34a' : 'white',
              borderColor: isSelected ? '#16a34a' : '#d1d5db'
            }}
          />
          <span className={`text-sm transition-colors ${isSelected ? 'text-green-700 font-medium' : 'text-gray-700'}`}>
            {category.name}
          </span>
        </label>
      </div>
      {hasChildren && isExpanded && (
        <div className='ml-6 mt-1 space-y-1'>
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function AsideFilter({ onFilterChange, initialFilters }: AsideFilterProps) {
  const [activeTab, setActiveTab] = useState<'map' | 'filter'>('map')

  // Price range state
  const [priceRange, setPriceRange] = useState<number[]>([
    initialFilters?.minPrice || 0,
    initialFilters?.maxPrice || 1000000
  ])

  // Province state
  const [selectedProvince, setSelectedProvince] = useState<ProvinceProperties | null>(null)
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null)

  // Category state
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  const [categorySearchText, setCategorySearchText] = useState('')
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [parentMap, setParentMap] = useState<Map<string, string | null>>(new Map())
  const isUpdatingFromInitialFilters = useRef(false)

  // Cập nhật filters khi initialFilters thay đổi
  useEffect(() => {
    if (initialFilters) {
      isUpdatingFromInitialFilters.current = true
      setPriceRange([initialFilters.minPrice || 0, initialFilters.maxPrice || 1000000])

      // Set selected province name if provinceFilters exist
      if (initialFilters.provinceFilters && initialFilters.provinceFilters.length > 0) {
        const provinceName = initialFilters.provinceFilters[0]
        setSelectedProvinceName(provinceName)
        setSelectedProvince((prev) => {
          if (prev && prev.Name === provinceName) {
            return prev
          }
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

      // Set selected category IDs
      if (initialFilters.categoryFilterIds && initialFilters.categoryFilterIds.length > 0) {
        setSelectedCategoryIds(new Set(initialFilters.categoryFilterIds))
      } else {
        setSelectedCategoryIds(new Set())
      }

      // Reset flag sau một tick
      setTimeout(() => {
        isUpdatingFromInitialFilters.current = false
      }, 0)
    }
  }, [initialFilters])

  // Build tree structure from flat array (tương tự như trong listCategory.tsx)
  const buildTree = (categories: ProductCategoryItem[]): ProductCategoryItem[] => {
    const categoryMap = new Map<string, ProductCategoryItem & { children?: ProductCategoryItem[] }>()
    const rootNodes: (ProductCategoryItem & { children?: ProductCategoryItem[] })[] = []

    // First pass: create all nodes
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        ...category,
        children: []
      })
    })

    // Second pass: build tree structure
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!
      if (!category.parentId || category.parentId === '') {
        // Root node
        rootNodes.push(node)
      } else {
        // Child node
        const parent = categoryMap.get(category.parentId)
        if (parent && parent.children) {
          parent.children.push(node)
        }
      }
    })

    return rootNodes as ProductCategoryItem[]
  }

  // Fetch categories on mount (tham khảo từ listCategory.tsx)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        // Sử dụng getAllProductCategory với includeChildren: true để lấy tree structure
        const response = await getAllProductCategory({
          pageSize: 0, // Lấy tất cả không phân trang
          includeChildren: true // Lấy cả children để build tree
        })

        // Xử lý response tương tự như trong listCategory.tsx
        if (response && response.status === 200 && response.data) {
          // Filter only active categories trước khi build tree
          const activeCategories = response.data.filter((cat) => cat.isActive)
          // Build tree structure
          const tree = buildTree(activeCategories)
          setCategories(tree)
        } else {
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Build parent map for ancestor lookup
  useEffect(() => {
    const map = new Map<string, string | null>()
    const walk = (node: ProductCategoryItem, parentId: string | null) => {
      map.set(node.id, parentId)
      node.children?.forEach((child) => walk(child, node.id))
    }
    categories.forEach((c) => walk(c, null))
    setParentMap(map)
  }, [categories])

  // Handle province selection from VietnamMap
  const handleProvinceSelect = (province: ProvinceProperties | null) => {
    if (province && selectedProvince && selectedProvince.Name === province.Name) {
      setSelectedProvince(null)
      setSelectedProvinceName(null)
      onFilterChange?.({
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        provinceFilters: undefined,
        categoryFilterIds: selectedCategoryIds.size > 0 ? Array.from(selectedCategoryIds) : undefined
      })
    } else {
      setSelectedProvince(province)
      setSelectedProvinceName(province ? province.Name : null)

      const provinceFilters = province ? [province.Name] : undefined

      onFilterChange?.({
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
        provinceFilters,
        categoryFilterIds: selectedCategoryIds.size > 0 ? Array.from(selectedCategoryIds) : undefined
      })
    }
  }

  // Handle category selection toggle
  const handleToggleCategory = (categoryId: string) => {
    // Helpers
    const getAncestors = (id: string): string[] => {
      const res: string[] = []
      let cur = parentMap.get(id) || null
      while (cur) {
        res.push(cur)
        cur = parentMap.get(cur) || null
      }
      return res
    }

    const findNodeById = (id: string, nodes: ProductCategoryItem[]): ProductCategoryItem | null => {
      for (const n of nodes) {
        if (n.id === id) return n
        if (n.children) {
          const found = findNodeById(id, n.children)
          if (found) return found
        }
      }
      return null
    }

    const collectDescendants = (node: ProductCategoryItem): string[] => {
      const res: string[] = []
      node.children?.forEach((c) => {
        res.push(c.id, ...collectDescendants(c))
      })
      return res
    }

    setSelectedCategoryIds((prev) => {
      const next = new Set(prev)

      if (next.has(categoryId)) {
        // Uncheck
        next.delete(categoryId)
        return next
      }

      // Check current
      next.add(categoryId)

      // Remove ancestors to avoid selecting parent when child selected
      getAncestors(categoryId).forEach((id) => next.delete(id))

      // Remove descendants if selecting a parent
      const node = findNodeById(categoryId, categories)
      if (node) {
        collectDescendants(node).forEach((id) => next.delete(id))
      }

      return next
    })
  }

  // Handle category expand/collapse
  const handleToggleExpand = (categoryId: string) => {
    setExpandedCategoryIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Áp dụng filter theo trạng thái hiện tại (chỉ gọi khi người dùng bấm nút)
  const applyFilters = () => {
    onFilterChange?.({
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 1000000 ? priceRange[1] : undefined,
      provinceFilters: selectedProvince ? [selectedProvince.Name] : undefined,
      categoryFilterIds: selectedCategoryIds.size > 0 ? Array.from(selectedCategoryIds) : undefined
    })
  }

  // Filter categories based on search text (useMemo để tránh re-render không cần thiết)
  const filterResult = useMemo(() => {
    if (!categorySearchText.trim()) {
      return { filtered: categories, expandIds: [] }
    }

    const filtered: ProductCategoryItem[] = []
    const expandIds: string[] = []
    const searchLower = categorySearchText.toLowerCase()

    const processNode = (node: ProductCategoryItem): { shouldInclude: boolean; expand: boolean } => {
      const matchesSearch = node.name.toLowerCase().includes(searchLower)
      let hasMatchingChildren = false

      if (node.children && node.children.length > 0) {
        const processedChildren: ProductCategoryItem[] = []
        node.children.forEach((child) => {
          const childResult = processNode(child)
          if (childResult.shouldInclude) {
            processedChildren.push(child)
            if (childResult.expand) {
              expandIds.push(child.id)
            }
          }
        })

        if (processedChildren.length > 0) {
          hasMatchingChildren = true
          filtered.push({
            ...node,
            children: processedChildren
          })
          if (matchesSearch || hasMatchingChildren) {
            expandIds.push(node.id)
          }
          return { shouldInclude: true, expand: matchesSearch || hasMatchingChildren }
        }
      }

      if (matchesSearch) {
        filtered.push(node)
        expandIds.push(node.id)
        return { shouldInclude: true, expand: true }
      }

      return { shouldInclude: false, expand: false }
    }

    categories.forEach((node) => processNode(node))

    return { filtered, expandIds }
  }, [categories, categorySearchText])

  const filteredCategories = filterResult.filtered

  // Thu gọn danh sách: chỉ hiển thị các danh mục đã chọn (và ancestor) khi bật toggle
  const categoriesToRender = useMemo(() => {
    if (!showSelectedOnly) return filteredCategories

    const filterSelected = (node: ProductCategoryItem): ProductCategoryItem | null => {
      const children =
        node.children
          ?.map((child) => filterSelected(child))
          .filter((child): child is ProductCategoryItem => Boolean(child)) || []

      const isSelected = selectedCategoryIds.has(node.id)
      const hasSelectedChild = children.length > 0

      if (isSelected || hasSelectedChild) {
        return { ...node, children }
      }
      return null
    }

    return filteredCategories
      .map((node) => filterSelected(node))
      .filter((node): node is ProductCategoryItem => Boolean(node))
  }, [filteredCategories, selectedCategoryIds, showSelectedOnly])

  // Auto-expand when searching
  useEffect(() => {
    if (categorySearchText.trim() && filterResult.expandIds.length > 0) {
      setExpandedCategoryIds((prev) => {
        const newSet = new Set(prev)
        filterResult.expandIds.forEach((id) => newSet.add(id))
        return newSet
      })
    }
  }, [categorySearchText, filterResult.expandIds])

  // Format price to VNĐ
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫'
  }

  return (
    <aside className='w-full bg-white rounded-xl border border-gray-200 p-4 sticky top-24 h-max'>
      <h3 className='text-sm font-bold bg-green-600 border border-green-600 p-2 rounded-lg uppercase text-white text-center'>
        Khám phá đặc sản
      </h3>

      {/* Tab Navigation */}
      <div className='mt-4 flex gap-2 border-b border-gray-200'>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'map' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Bản đồ
        </button>
        <button
          onClick={() => setActiveTab('filter')}
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'filter' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Lọc
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'map' && (
        <div className='mt-4'>
          {/* Hiển thị tỉnh đang chọn */}
          {(selectedProvince || selectedProvinceName) && (
            <div className='mb-3 p-3 bg-green-50 border border-green-200 rounded-lg'>
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
      )}

      {activeTab === 'filter' && (
        <div className='mt-4 space-y-6'>
          {/* Danh Mục Section */}
          <div>
            <h4 className='text-sm font-semibold text-gray-800 mb-3'>Danh Mục</h4>

            {/* Search Input */}
            {!loadingCategories && categories.length > 0 && (
              <div className='mb-3 space-y-2'>
                <div className='relative'>
                  <input
                    type='text'
                    value={categorySearchText}
                    onChange={(e) => setCategorySearchText(e.target.value)}
                    placeholder='Tìm kiếm danh mục...'
                    className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent'
                  />
                  {categorySearchText && (
                    <button
                      onClick={() => setCategorySearchText('')}
                      className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                    >
                      <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Toggle chỉ hiển thị danh mục đã chọn */}
                <label className='flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none'>
                  <input
                    type='checkbox'
                    checked={showSelectedOnly}
                    onChange={(e) => setShowSelectedOnly(e.target.checked)}
                    className='w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-0 cursor-pointer accent-green-600'
                  />
                  <span>Chỉ hiển thị danh mục đã chọn</span>
                </label>
              </div>
            )}

            {loadingCategories ? (
              <div className='flex items-center justify-center py-8'>
                <div className='w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin'></div>
              </div>
            ) : categories.length === 0 ? (
              <p className='text-sm text-gray-500 py-4'>Không có danh mục nào</p>
            ) : filteredCategories.length === 0 ? (
              <p className='text-sm text-gray-500 py-4'>Không tìm thấy danh mục nào</p>
            ) : (
              <div className='max-h-64 overflow-y-auto space-y-1 pr-2'>
                {categoriesToRender.map((category) => (
                  <CategoryTreeNode
                    key={category.id}
                    category={category}
                    selectedIds={selectedCategoryIds}
                    expandedIds={expandedCategoryIds}
                    onToggleSelect={handleToggleCategory}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Khoảng Giá Section */}
          <div>
            <h4 className='text-sm font-semibold text-gray-800 mb-3'>KHOẢNG GIÁ (TRÊN M | KG)</h4>
            <div className='space-y-3'>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                min={0}
                max={1000000}
                step={10000}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-gray-600'>
                <span>Tối thiểu: {formatPrice(priceRange[0])}</span>
                <span>Tối đa: {formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </div>

          {/* Apply button */}
          <div className='pt-2'>
            <button
              type='button'
              onClick={applyFilters}
              className='w-full py-2 px-4 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors'
            >
              Áp dụng lọc
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}

export default AsideFilter
