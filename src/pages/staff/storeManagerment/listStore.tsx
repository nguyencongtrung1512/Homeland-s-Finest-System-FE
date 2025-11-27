import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, RefreshCw, Store, Package, ExternalLink, Calendar, User } from 'lucide-react'
import { storeApi } from '../../../apis/store.api'

// Interface cho Store response thực tế từ API
interface ActualStoreResponse {
  id: string
  sellerId: string
  sellerName: string | null
  storeName: string
  address: string
  description: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  status: string
  adminNote: string | null
  staffNotes: string | null
  staffName: string | null
  staffImage: string | null
  submittedDate: string
  decisionDate: string | null
  createdAt: string
}
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from '../../../utils/toast'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { ShimmerBorder } from '../../../components/ui/shimmer'

interface StoreData {
  key: string
  store: {
    avatar: string

    name: string
    id: string
  }
  logoUrl: string | null
  owner: {
    name: string
    email: string
  }
  createdDate: string
  products: number
  status: 'Processing' | 'Pending' | 'Approved' | 'Rejected' | 'Denied'
}

const DEFAULT_STORE_LOGO = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

function ListStore() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [storeData, setStoreData] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalStores, setTotalStores] = useState(0)
  const [productCategories, setProductCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const pageSize = 12

  const convertStoreResponse = (apiStore: ActualStoreResponse): StoreData => {
    const avatarText = apiStore.storeName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    return {
      key: apiStore.id,
      store: {
        avatar: avatarText,
        name: apiStore.storeName,
        id: apiStore.id
      },
      logoUrl: apiStore.logoUrl,
      owner: {
        name: apiStore.sellerName || 'Chủ cửa hàng',
        email: 'N/A'
      },
      createdDate: formatDate(apiStore.createdAt),
      products: 0,
      status: apiStore.status as 'Processing' | 'Pending' | 'Approved' | 'Rejected' | 'Denied'
    }
  }

  // Function để fetch product categories
  const fetchProductCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true)
      const response = await getAllProductCategory({
        pageSize: 0,
        pageNumber: 1
      })

      if (response && Array.isArray(response)) {
        const activeCategories = response.filter((category: ProductCategoryItem) => category.isActive)
        setProductCategories(activeCategories)
      } else if (response && response.data && Array.isArray(response.data)) {
        const activeCategories = response.data.filter((category: ProductCategoryItem) => category.isActive)
        setProductCategories(activeCategories)
      } else {
        console.warn('Không thể tải danh sách ngành hàng')
      }
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách ngành hàng:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  // Function để fetch all stores
  const fetchAllStores = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getAllStores({
        pageSize: 0,
        pageNumber: 1
      })

      if (response && response.data && Array.isArray(response.data)) {
        const convertedStores = response.data.map((store: unknown) =>
          convertStoreResponse(store as ActualStoreResponse)
        )
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else {
        setError('Định dạng dữ liệu không đúng')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách cửa hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllStores()
    fetchProductCategories()
  }, [fetchAllStores, fetchProductCategories])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  const filteredStores = storeData.filter((store) => {
    const searchLower = searchText.toLowerCase().trim()

    if (!searchLower) return true

    const matchStoreName = store.store.name.toLowerCase().includes(searchLower)

    return matchStoreName
  })

  const totalFilteredStores = filteredStores.length
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedStores = filteredStores.slice(startIndex, endIndex)

  const handleFilter = () => {
    // Reset về trang 1 khi filter
    setCurrentPage(1)
  }

  // Render store card component
  const renderStoreCard = (store: StoreData) => {
    const statusConfig = {
      Processing: {
        variant: 'default' as const,
        text: 'Đang xử lý',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      },
      Pending: {
        variant: 'default' as const,
        text: 'Chờ duyệt',
        className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
      },
      Approved: {
        variant: 'default' as const,
        text: 'Đã duyệt',
        className: 'bg-green-100 text-green-700 hover:bg-green-100'
      },
      Rejected: {
        variant: 'default' as const,
        text: 'Từ chối',
        className: 'bg-red-100 text-red-700 hover:bg-red-100'
      },
      Denied: {
        variant: 'default' as const,
        text: 'Không hoạt động',
        className: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
      }
    }
    const config = statusConfig[store.status as keyof typeof statusConfig] || {
      variant: 'default' as const,
      text: store.status,
      className: 'bg-gray-100 text-gray-700'
    }

    return (
      <Card
        key={store.key}
        className='h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300 flex flex-col overflow-hidden'
      >
        <CardContent className='p-4 flex flex-col flex-1 min-h-0'>
          {/* Header with Avatar and Store Info */}
          <div className='flex items-start gap-3 mb-4 min-w-0'>
            <div className='relative flex-shrink-0'>
              <div className='h-14 w-14 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-600 relative'>
                <img
                  src={store.logoUrl && store.logoUrl.trim() !== '' ? store.logoUrl : DEFAULT_STORE_LOGO}
                  alt={store.store.name}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (!target.src.includes(DEFAULT_STORE_LOGO)) {
                      target.src = DEFAULT_STORE_LOGO
                    } else {
                      // If default also fails, hide image and show fallback text
                      target.style.display = 'none'
                    }
                  }}
                />
                {/* Fallback text - only visible if image fails to load */}
                <div
                  className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 text-white font-semibold text-sm'
                  style={{ display: 'none' }}
                >
                  {store.store.avatar}
                </div>
              </div>
              <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-gray-200'>
                <Store size={14} className='text-green-600' />
              </div>
            </div>
            <div className='flex-1 min-w-0 overflow-hidden'>
              <h3
                className='text-base font-semibold text-gray-900 mb-1.5 line-clamp-2 break-words'
                title={store.store.name}
              >
                {store.store.name}
              </h3>
              <Badge variant={config.variant} className={`${config.className} text-xs`}>
                {config.text}
              </Badge>
            </div>
          </div>

          {/* Store Details */}
          <div className='space-y-2.5 mb-4 flex-1'>
            <div className='flex items-center gap-2 text-sm text-gray-600 min-w-0'>
              <User size={14} className='text-gray-400 flex-shrink-0' />
              <span className='truncate' title={store.owner.name}>{store.owner.name}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600 min-w-0'>
              <Calendar size={14} className='text-gray-400 flex-shrink-0' />
              <span className='truncate'>Ngày tham gia: {store.createdDate}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600 min-w-0'>
              <Package size={14} className='text-gray-400 flex-shrink-0' />
              <span className='truncate'>{store.products} sản phẩm</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='grid grid-cols-2 gap-2 mt-auto'>
            <Button
              variant='outline'
              title='Xem sản phẩm'
              onClick={() => navigate(`/staff/store-detail/${store.store.id}/list-product`)}
              className='flex items-center justify-center gap-1.5 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 text-xs px-2 py-1.5 h-auto'
            >
              <Package size={14} className='flex-shrink-0' />
              <span className='truncate'>Sản phẩm</span>
            </Button>
            <Button
              variant='outline'
              title='Xem chi tiết cửa hàng'
              onClick={() => navigate(`/staff/store-detail/${store.store.id}`)}
              className='flex items-center justify-center gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-xs px-2 py-1.5 h-auto'
            >
              <ExternalLink size={14} className='flex-shrink-0' />
              <span className='truncate'>Chi tiết</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Quản lí cửa hàng</h2>
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#ffffff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={fetchAllStores}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
          <p className='text-white/90'>Xem xét và phê duyệt tất cả cửa hàng ({totalStores} cửa hàng)</p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px] relative'>
              <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
              <Input
                placeholder='Tìm kiếm theo tên cửa hàng...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={categoriesLoading}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder={categoriesLoading ? 'Đang tải...' : 'Tất cả ngành hàng'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả thể loại</SelectItem>
                {productCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type='date'
              placeholder='mm/dd/yyyy'
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className='w-40'
            />

            <Button onClick={handleFilter} className='bg-green-600 hover:bg-green-700'>
              <Filter size={16} className='mr-2' />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Store Cards Grid */}
      <div>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <span className='text-gray-600'>Đang tải danh sách cửa hàng...</span>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-red-500 text-lg mb-2'>⚠️</div>
              <p className='text-red-600 font-medium mb-4'>{error}</p>
              <Button onClick={fetchAllStores} className='bg-green-600 hover:bg-green-700'>
                Thử lại
              </Button>
            </div>
          </div>
        ) : storeData.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>🏪</div>
              <p className='text-gray-600'>Chưa có cửa hàng nào trong hệ thống</p>
            </div>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>🔍</div>
              <p className='text-gray-600'>Không tìm thấy cửa hàng phù hợp với từ khóa "{searchText}"</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5'>
              {paginatedStores.map(renderStoreCard)}
            </div>

            {/* Pagination */}
            <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
              <div className='text-sm text-gray-600'>
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, totalFilteredStores)} của {totalFilteredStores} kết
                quả
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <span className='text-sm text-gray-600'>
                  Trang {currentPage} / {Math.ceil(totalFilteredStores / pageSize)}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(Math.ceil(totalFilteredStores / pageSize), prev + 1))
                  }
                  disabled={currentPage >= Math.ceil(totalFilteredStores / pageSize)}
                >
                  Sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ListStore
