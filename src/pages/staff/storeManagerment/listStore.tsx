import { useState, useEffect } from 'react'
import { Search, Filter, RefreshCw, Store, Package, ExternalLink, Calendar, User } from 'lucide-react'
import { staffApi, type AssignedStore } from '../../../apis/staff.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from 'react-toastify'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { useNavigate } from 'react-router-dom'

interface StoreData {
  key: string
  store: {
    avatar: string
    name: string
    id: string
  }
  owner: {
    name: string
    email: string
  }
  createdDate: string
  products: number
  status: 'Processing' | 'ReviewedByStaff' | 'Pending' | 'Approved' | 'Rejected' | 'Inactive'
}

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
  const pageSize = 3

  const convertAssignedStore = (apiStore: AssignedStore): StoreData => {
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
      owner: {
        name: 'Chủ cửa hàng',
        email: 'N/A'
      },
      createdDate: formatDate(apiStore.createdAt),
      products: 0,
      status: apiStore.status
    }
  }

  // Function để fetch product categories
  const fetchProductCategories = async () => {
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
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách ngành hàng:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Function để fetch assigned stores
  const fetchAssignedStores = async () => {
    try {
      setLoading(true)
      setError(null)

      const userString = localStorage.getItem('user')
      let staffId = null

      if (userString) {
        try {
          const user = JSON.parse(userString)
          staffId = user.userId || user.id
        } catch (parseError) {
          setError('Lỗi khi phân tích thông tin người dùng. Vui lòng đăng nhập lại.')
          return
        }
      }

      if (!staffId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        return
      }

      const response = await staffApi.getAssignedStores(staffId, {
        pageSize: 0,
        pageNumber: 1
      })

      if (response && Array.isArray(response)) {
        const convertedStores = response.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else if (response && response.data && Array.isArray(response.data)) {
        const convertedStores = response.data.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else {
        setError('Định dạng dữ liệu không đúng')
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách cửa hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignedStores()
    fetchProductCategories()
  }, [])

  // Reset về trang 1 khi search text thay đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText])

  // Lọc stores dựa trên search text (chỉ tìm theo tên cửa hàng)
  const filteredStores = storeData.filter((store) => {
    const searchLower = searchText.toLowerCase().trim()

    if (!searchLower) return true

    // Chỉ tìm kiếm theo tên cửa hàng (storeName)
    const matchStoreName = store.store.name.toLowerCase().includes(searchLower)

    return matchStoreName
  })

  // Tính toán pagination cho filtered data
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
      ReviewedByStaff: {
        variant: 'default' as const,
        text: 'Đã xem xét',
        className: 'bg-green-100 text-green-700 hover:bg-green-100'
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
      Inactive: {
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
        className='h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300'
      >
        <CardContent className='p-2'>
          {/* Header with Avatar and Store Info */}
          <div className='flex items-start gap-4 mb-4'>
            <div className='relative'>
              <Avatar className='h-14 w-14 bg-gradient-to-br from-green-500 to-green-600'>
                <AvatarFallback className='text-white font-semibold'>{store.store.avatar}</AvatarFallback>
              </Avatar>
              <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-gray-200'>
                <Store size={14} className='text-green-600' />
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-lg font-semibold text-gray-900 truncate mb-1'>{store.store.name}</h3>
              <Badge variant={config.variant} className={config.className}>
                {config.text}
              </Badge>
            </div>
          </div>

          {/* Store Details */}
          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <User size={14} className='text-gray-400' />
              <span>{store.owner.name}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar size={14} className='text-gray-400' />
              <span>Ngày tham gia: {store.createdDate}</span>
            </div>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Package size={14} className='text-gray-400' />
              <span>{store.products} sản phẩm</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='grid grid-cols-2 gap-2 '>
            <Button
              variant='outline'
              onClick={() => navigate(`/staff/store-detail/${store.store.id}/list-product`)}
              className='flex items-center justify-center gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300'
            >
              <Package size={16} />
              Xem sản phẩm
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate(`/staff/store-detail/${store.store.id}`)}
              className='flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            >
              <ExternalLink size={16} />
              Thăm cửa hàng
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Quản lí cửa hàng</h1>
          <p className='text-gray-600 mt-1'>Xem xét và phê duyệt các cửa hàng được phân công</p>
        </div>
        <Button
          onClick={fetchAssignedStores}
          disabled={loading}
          variant='outline'
          className='flex items-center gap-2 bg-transparent'
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

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
                <SelectItem value='all'>Tất cả ngành hàng</SelectItem>
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
              <Button onClick={fetchAssignedStores} className='bg-green-600 hover:bg-green-700'>
                Thử lại
              </Button>
            </div>
          </div>
        ) : storeData.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>🏪</div>
              <p className='text-gray-600'>Chưa có cửa hàng nào được phân công</p>
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
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {paginatedStores.map(renderStoreCard)}
            </div>

            {/* Pagination */}
            <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
              <div className='text-sm text-gray-600'>
                Hiển thị {startIndex + 1} đến {Math.min(endIndex, totalFilteredStores)} của {totalFilteredStores} kết quả
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
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalFilteredStores / pageSize), prev + 1))}
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