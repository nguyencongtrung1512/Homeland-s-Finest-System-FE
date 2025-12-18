import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Package,
  Eye,
  Calendar,
  Star,
  Tag,
  ChevronLeft,
  RefreshCw,
  Component,
  Store
} from 'lucide-react'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { getAllCombos } from '../../../apis/combo.api'
import { type ComboParams, type Combo } from '../../../types/combo.type'
import { toast } from '../../../utils/toast'
import { Card as ShadcnCard, CardContent, Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import { ShimmerBorder } from '../../../components/ui/shimmer'
import path from '../../../constants/path'

// Interface cho item trả về từ /Store/{storeId}/products
interface StoreProductItemDTO {
  id: string
  type: 'Product' | 'Combo'
  name: string
  description?: string
  price: number
  imageUrl?: string
  saleCount: number
  rating: number
  reviewCount: number
  soldOut: boolean
  hashtagIds?: string[]
  createdAt: string
  // Backend có thể trả thêm status/isActive; để an toàn giữ optional
  status?: string
  isActive?: boolean
}

interface ProductData {
  key: string
  product: {
    image: string
    name: string
    id: string
  }
  description: string
  category: string
  createdDate: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Confirmed' | 'Denied'
  rating: number | null
  saleCount: number | null
  isActive: boolean
}

// Status badge component for Combo
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800'
      case 'Confirmed':
        return 'bg-purple-100 text-purple-800'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'Rejected':
        return 'bg-red-100 text-red-800'
      case 'Denied':
        return 'bg-red-100 text-red-800'
      case 'Draft':
        return 'bg-gray-100 text-gray-800'
      case 'Processing':
        return 'bg-orange-100 text-orange-800'
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'Đã duyệt'
      case 'Pending':
        return 'Chờ duyệt'
      case 'Rejected':
        return 'Từ chối'
      case 'Denied':
        return 'Bị từ chối'
      case 'Confirmed':
        return 'Đã xác nhận'
      case 'Draft':
        return 'Nháp'
      case 'Processing':
        return 'Cần xử lý'
      case 'Cancelled':
        return 'Đã hủy'
      default:
        return status
    }
  }

  return <Badge className={getStatusColor(status)}>{getStatusText(status)}</Badge>
}

function ListProductByStoreStaff() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'products' | 'combos'>('products')

  // Product states
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [productData, setProductData] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [productCategories, setProductCategories] = useState<ProductCategoryItem[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [storeName, setStoreName] = useState('')
  const pageSize = 12

  // Combo states
  const [comboData, setComboData] = useState<Combo[]>([])
  const [comboLoading, setComboLoading] = useState(false)
  const [comboSearchText, setComboSearchText] = useState('')
  const [comboStatusFilter, setComboStatusFilter] = useState<string>('all')
  const [comboCurrentPage, setComboCurrentPage] = useState(1)

  // Convert Store Product to ProductData
  const convertProduct = useCallback((storeProduct: StoreProductItemDTO): ProductData => {
    const formatDate = (dateString: string) => {
      if (dateString.includes(' ')) {
        return dateString.split(' ')[1] || dateString
      }
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN')
      } catch {
        return dateString
      }
    }

    return {
      key: storeProduct.id,
      product: {
        image: storeProduct.imageUrl || '',
        name: storeProduct.name,
        id: storeProduct.id
      },
      description: storeProduct.description || '',
      category: 'N/A',
      createdDate: formatDate(storeProduct.createdAt),
      status:
        (storeProduct.status as 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Confirmed' | 'Denied' | undefined) ||
        'Approved',
      rating: storeProduct.rating ?? 0,
      saleCount: storeProduct.saleCount ?? 0,
      isActive: storeProduct.isActive ?? !storeProduct.soldOut
    }
  }, [])

  // Fetch store info
  const fetchStoreInfo = useCallback(async () => {
    if (!storeId) return

    try {
      const response = await storeApi.getStoreById(storeId)
      const storeData: StoreResponse = response.data?.data || response.data || (response as unknown as StoreResponse)
      if (storeData) {
        setStoreName(storeData.storeName || '')
      }
    } catch (error) {
      console.error('Error fetching store info:', error)
    }
  }, [storeId])

  // Fetch product categories
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
      }
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách ngành hàng:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  // Fetch products by store (server pagination)
  const fetchProductsByStore = useCallback(async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreProducts(storeId, {
        pageSize,
        pageNumber: currentPage,
        name: searchText.trim() || undefined
      })

      // axiosInstance đã unwrap -> response là { status, message, data, pagination }
      // nhưng vẫn phòng trường hợp chưa unwrap để tránh lỗi
      const apiData = (response as { data?: any; pagination?: any })
      const productsSource =
        Array.isArray(apiData?.data) || apiData?.data === null ? apiData.data : (apiData as unknown as any[])
      const products = (Array.isArray(productsSource) ? productsSource : []) as StoreProductItemDTO[]
      const pagination = apiData?.pagination

      // Dùng server total nếu có, fallback theo length
      if (pagination?.totalItems !== undefined) {
        setTotalProducts(pagination.totalItems)
      } else {
        setTotalProducts(products.length)
      }

      // Filter trạng thái phía client (API chưa hỗ trợ)
      let filteredProducts = products
      if (statusFilter !== 'all') {
        filteredProducts = filteredProducts.filter(
          (p) =>
            (p.status || '').toLowerCase() === statusFilter.toLowerCase() ||
            ((p as any).status || '').toLowerCase() === statusFilter.toLowerCase()
        )
      }

      const convertedProducts = filteredProducts.map(convertProduct)
      setProductData(convertedProducts)
    } catch (err: unknown) {
      console.error('Error fetching store products:', err)
      const errorMessage =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Có lỗi xảy ra khi tải danh sách sản phẩm'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [storeId, pageSize, currentPage, searchText, statusFilter, convertProduct])

  // Fetch combos by store
  const fetchCombos = useCallback(async () => {
    if (!storeId) return

    try {
      setComboLoading(true)
      const params: ComboParams = {
        pageSize: 0,
        pageNumber: 1,
        storeId: storeId
      }

      const { data: combos } = await getAllCombos(params)
      setComboData(Array.isArray(combos) ? combos : [])
    } catch (error) {
      console.error('Error fetching combos:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách combo')
    } finally {
      setComboLoading(false)
    }
  }, [storeId])

  useEffect(() => {
    fetchStoreInfo()
    fetchProductCategories()
  }, [fetchStoreInfo, fetchProductCategories])

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProductsByStore()
    } else {
      fetchCombos()
    }
  }, [storeId, activeTab, currentPage, searchText, statusFilter, fetchProductsByStore, fetchCombos])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, statusFilter])

  // Filter combo data
  const filteredComboData = useMemo(() => {
    let filtered = comboData
    filtered = filtered.filter((combo) => combo.status !== 'Draft')

    if (comboSearchText) {
      const searchLower = comboSearchText.toLowerCase()
      filtered = filtered.filter(
        (combo) =>
          combo.name.toLowerCase().includes(searchLower) || combo.provinceName?.toLowerCase().includes(searchLower)
      )
    }

    if (comboStatusFilter !== 'all') {
      filtered = filtered.filter((combo) => combo.status === comboStatusFilter)
    }

    return filtered
  }, [comboData, comboSearchText, comboStatusFilter])

  // Pagination
  const totalFilteredProducts = totalProducts
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + productData.length, totalFilteredProducts)
  const paginatedProducts = productData

  const comboTotalPages = Math.ceil(filteredComboData.length / pageSize)
  const comboStartIndex = (comboCurrentPage - 1) * pageSize
  const comboEndIndex = comboStartIndex + pageSize
  const paginatedCombos = filteredComboData.slice(comboStartIndex, comboEndIndex)

  const handleBack = () => {
    navigate(-1)
  }

  const handleFilter = () => {
    setCurrentPage(1)
    fetchProductsByStore()
  }

  const handleViewProduct = (productId: string) => {
    navigate(`/staff/manager-product/detail-product/${productId}`)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-'
    }

    const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

    if (timeDateMatch) {
      const [, time, date] = timeDateMatch
      const [day, month, year] = date.split('/')
      const [hours, minutes, seconds] = time.split(':')

      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )

      if (isNaN(dateObj.getTime())) {
        return '-'
      }

      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // Render product card
  const renderProductCard = (product: ProductData) => {
    const statusConfig: Record<
      'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Confirmed' | 'Denied',
      { variant: 'default'; text: string; className: string }
    > = {
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
        text: 'Từ chối xử lý',
        className: 'bg-red-100 text-red-700 hover:bg-red-100'
      },
      Processing: {
        variant: 'default' as const,
        text: 'Chờ xử lý',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      },
      Confirmed: {
        variant: 'default' as const,
        text: 'Xác nhận xử lý',
        className: 'bg-green-100 text-green-700 hover:bg-green-100'
      },
      Denied: {
        variant: 'default' as const,
        text: 'Đã từ chối',
        className: 'bg-red-100 text-red-700 hover:bg-red-100'
      }
    }

    const config = statusConfig[product.status] || {
      variant: 'default' as const,
      text: product.status,
      className: 'bg-gray-100 text-gray-700'
    }

    return (
      <Card
        key={product.key}
        className='h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-green-300'
      >
        <CardContent className='p-4'>
          <div className='relative mb-4'>
            <div className='aspect-square rounded-lg overflow-hidden bg-gray-100'>
              {product.product.image ? (
                <img src={product.product.image} alt={product.product.name} className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full flex items-center justify-center'>
                  <Package size={48} className='text-gray-400' />
                </div>
              )}
            </div>
            <div className='absolute top-2 right-2'>
              <Badge variant={config.variant} className={config.className}>
                {config.text}
              </Badge>
            </div>
            {!product.isActive && (
              <div className='absolute top-2 left-2'>
                <Badge variant='default' className='bg-gray-100 text-gray-700'>
                  Không hoạt động
                </Badge>
              </div>
            )}
          </div>

          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-gray-900 line-clamp-2 min-h-[3.5rem]'>{product.product.name}</h3>
            <p className='text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]'>{product.description}</p>

            <div className='flex items-center justify-between text-sm text-gray-600'>
              <div className='flex items-center gap-1'>
                <Star size={14} className='text-yellow-500' />
                <span>{product.rating !== null && product.rating !== undefined ? product.rating.toFixed(1) : '0.0'}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Tag size={14} className='text-gray-400' />
                <span>{product.saleCount || 0} đã bán</span>
              </div>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar size={14} className='text-gray-400' />
              <span>Ngày tạo: {product.createdDate}</span>
            </div>

            <Button
              onClick={() => handleViewProduct(product.product.id)}
              className='w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2'
            >
              <Eye size={16} />
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render combo card
  const renderComboCard = (combo: Combo) => {
    return (
      <Card
        key={combo.id}
        className='h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-300'
      >
        <CardContent className='p-4'>
          <div className='flex items-start gap-4 mb-4'>
            <div className='relative'>
              <Avatar className='h-14 w-14'>
                {combo.thumbnailUrl ? (
                  <img
                    src={combo.thumbnailUrl}
                    alt={combo.name}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      const target = e.currentTarget
                      const fallback = target.nextElementSibling as HTMLElement
                      if (fallback) {
                        target.style.display = 'none'
                        fallback.style.display = 'flex'
                      }
                    }}
                  />
                ) : null}
                <AvatarFallback className='text-white font-semibold bg-gradient-to-br from-blue-500 to-blue-600'>
                  {combo.name
                    .split(' ')
                    .map((word) => word.charAt(0))
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className='absolute -bottom-1 -right-1 bg-white rounded-full p-1 border-2 border-gray-200'>
                <Component size={14} className='text-blue-600' />
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-lg font-semibold text-gray-900 truncate mb-1'>{combo.name}</h3>
              <StatusBadge status={combo.status} />
            </div>
          </div>

          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Calendar size={14} className='text-gray-400' />
              <span>Ngày tạo: {formatDate(combo.createdAt)}</span>
            </div>

            <div className='flex items-center gap-2 text-sm text-gray-600'>
              <Package size={14} className='text-gray-400' />
              <span>{combo.comboItems?.length || 0} sản phẩm</span>
            </div>

            {combo.totalFinalPrice && (
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <span className='font-medium text-green-600'>{combo.totalFinalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
            )}
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => navigate(path.detailComboStaff.replace(':id', combo.id))}
              className='flex-1 flex items-center justify-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'
            >
              <Eye size={16} />
              Xem chi tiết
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleRefresh = () => {
    fetchStoreInfo()
    if (activeTab === 'products') {
      fetchProductsByStore()
    } else {
      fetchCombos()
    }
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <ShadcnCard className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent>
          <div className='flex items-center justify-between py-4'>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                onClick={handleBack}
                size='icon'
                className='flex items-center justify-center w-10 h-10 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full'
              >
                <ChevronLeft size={20} />
              </Button>
              <div>
                <h2 className='text-3xl font-bold text-white m-0'>Cửa hàng {storeName}</h2>
                <p className='text-white/90 mt-1 flex items-center gap-2'>
                  <Store size={16} />
                  Quản lý sản phẩm và combo
                </p>
              </div>
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#ffffff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={handleRefresh}
                disabled={loading || comboLoading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading || comboLoading ? 'animate-spin' : ''} />
                {loading || comboLoading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
        </CardContent>
      </ShadcnCard>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'products' | 'combos')}
        className='w-full'
      >
        <TabsList className='grid w-full max-w-md grid-cols-2'>
          <TabsTrigger value='products' className='flex items-center gap-2'>
            <Package size={16} />
            Sản phẩm ({totalProducts})
          </TabsTrigger>
          <TabsTrigger value='combos' className='flex items-center gap-2'>
            <Component size={16} />
            Combo ({filteredComboData.length})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value='products' className='space-y-6 mt-6'>
          {/* Search and Filters */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex flex-wrap items-center gap-4'>
                <div className='flex-1 min-w-[300px] relative'>
                  <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                  <Input
                    placeholder='Tìm kiếm theo tên sản phẩm...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='pl-10'
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={categoriesLoading}>
                  <SelectTrigger className='w-48'>
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

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Tất cả trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                    <SelectItem value='Pending'>Chờ duyệt</SelectItem>
                    <SelectItem value='Approved'>Đã duyệt</SelectItem>
                    <SelectItem value='Rejected'>Từ chối</SelectItem>
                    <SelectItem value='Processing'>Đang xử lý</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleFilter} className='bg-green-600 hover:bg-green-700'>
                  <Filter size={16} className='mr-2' />
                  Lọc
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div>
            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <span className='text-gray-600'>Đang tải danh sách sản phẩm...</span>
              </div>
            ) : error ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <div className='text-red-500 text-lg mb-2'>⚠️</div>
                  <p className='text-red-600 font-medium mb-4'>{error}</p>
                  <Button onClick={fetchProductsByStore} className='bg-green-600 hover:bg-green-700'>
                    Thử lại
                  </Button>
                </div>
              </div>
            ) : productData.length === 0 ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <div className='text-gray-400 text-lg mb-2'>📦</div>
                  <p className='text-gray-600'>Cửa hàng chưa có sản phẩm nào</p>
                </div>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                  {paginatedProducts.map(renderProductCard)}
                </div>

                <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
                  <div className='text-sm text-gray-600'>
                    Hiển thị {startIndex + 1} đến {endIndex} của {totalFilteredProducts} kết quả
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
                      Trang {currentPage} / {Math.ceil(totalFilteredProducts / pageSize)}
                    </span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(Math.ceil(totalFilteredProducts / pageSize), prev + 1))
                      }
                      disabled={currentPage >= Math.ceil(totalFilteredProducts / pageSize)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Combos Tab */}
        <TabsContent value='combos' className='space-y-6 mt-6'>
          {/* Search and Filters */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex flex-wrap items-center gap-4'>
                <div className='flex-1 min-w-[300px] relative'>
                  <Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                  <Input
                    placeholder='Tìm kiếm theo tên combo'
                    value={comboSearchText}
                    onChange={(e) => {
                      setComboSearchText(e.target.value)
                      setComboCurrentPage(1)
                    }}
                    className='pl-10'
                  />
                </div>

                <Select
                  value={comboStatusFilter}
                  onValueChange={(value) => {
                    setComboStatusFilter(value)
                    setComboCurrentPage(1)
                  }}
                >
                  <SelectTrigger className='w-48'>
                    <SelectValue placeholder='Tất cả trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                    <SelectItem value='Pending'>Chờ duyệt</SelectItem>
                    <SelectItem value='Approved'>Đã duyệt</SelectItem>
                    <SelectItem value='Confirmed'>Đã xác nhận</SelectItem>
                    <SelectItem value='Rejected'>Từ chối</SelectItem>
                    <SelectItem value='Denied'>Bị từ chối</SelectItem>
                    <SelectItem value='Processing'>Cần xử lý</SelectItem>
                    <SelectItem value='Cancelled'>Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Combos Grid */}
          <div>
            {comboLoading ? (
              <div className='flex items-center justify-center py-12'>
                <span className='text-gray-600'>Đang tải danh sách combo...</span>
              </div>
            ) : filteredComboData.length === 0 ? (
              <div className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <div className='text-gray-400 text-lg mb-2'>📦</div>
                  <p className='text-gray-600'>
                    {comboSearchText || comboStatusFilter !== 'all'
                      ? 'Không tìm thấy combo phù hợp với bộ lọc'
                      : 'Cửa hàng này chưa có combo nào'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                  {paginatedCombos.map(renderComboCard)}
                </div>

                {comboTotalPages > 1 && (
                  <div className='flex items-center justify-between mt-8 pt-6 border-t border-gray-200'>
                    <div className='text-sm text-gray-600'>
                      Hiển thị {comboStartIndex + 1} đến {Math.min(comboEndIndex, filteredComboData.length)} của{' '}
                      {filteredComboData.length} kết quả
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setComboCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={comboCurrentPage === 1}
                      >
                        Trước
                      </Button>
                      <span className='text-sm text-gray-600'>
                        Trang {comboCurrentPage} / {comboTotalPages}
                      </span>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setComboCurrentPage((prev) => Math.min(comboTotalPages, prev + 1))}
                        disabled={comboCurrentPage >= comboTotalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ListProductByStoreStaff
