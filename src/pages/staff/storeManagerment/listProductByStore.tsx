import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Filter, Package, Eye, Calendar, Star, Tag, ChevronLeft } from 'lucide-react'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from '../../../utils/toast'
import { Card as ShadcnCard, CardContent, Card } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'

// Interface for product from store API
interface StoreProduct {
  id: string
  name: string
  description: string | null
  productImages: string[] | null
  saleCount: number | null
  rating: number | null
  reviewCount: number | null
  isActive: boolean
  status: string
  createdAt: string
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

function ListProductByStoreStaff() {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()

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

  // Convert Store Product to ProductData
  const convertProduct = (storeProduct: StoreProduct): ProductData => {
    const formatDate = (dateString: string) => {
      // Format: "19:23:34 22/10/2025" -> "22/10/2025"
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
        image: storeProduct.productImages && storeProduct.productImages.length > 0 ? storeProduct.productImages[0] : '',
        name: storeProduct.name,
        id: storeProduct.id
      },
      description: storeProduct.description || '',
      category: 'N/A', // Not available in store product data
      createdDate: formatDate(storeProduct.createdAt),
      status: storeProduct.status as 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Confirmed' | 'Denied',
      rating: storeProduct.rating,
      saleCount: storeProduct.saleCount,
      isActive: storeProduct.isActive
    }
  }

  // Fetch product categories
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
      }
    } catch (err: unknown) {
      console.error('Lỗi khi tải danh sách ngành hàng:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Fetch products by store using getStoreById
  const fetchProductsByStore = async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreById(storeId)

      // Extract store info and products from response
      const storeData: StoreResponse = response.data?.data || response.data || (response as unknown as StoreResponse)

      if (storeData) {
        // Set store name
        setStoreName(storeData.storeName || '')

        // Extract products from storeData.products
        let products: StoreProduct[] = []
        if (Array.isArray(storeData.products)) {
          products = storeData.products as StoreProduct[]
        }

        // Apply filters
        let filteredProducts = products

        // Apply search filter
        if (searchText.trim()) {
          const searchLower = searchText.trim().toLowerCase()
          filteredProducts = filteredProducts.filter(
            (p) =>
              p.name.toLowerCase().includes(searchLower) ||
              (p.description && p.description.toLowerCase().includes(searchLower))
          )
        }

        // Apply status filter
        if (statusFilter !== 'all') {
          filteredProducts = filteredProducts.filter((p) => p.status.toLowerCase() === statusFilter.toLowerCase())
        }

        // Note: Category filter is not available in store product data, so we skip it

        // Convert to ProductData
        const convertedProducts = filteredProducts.map(convertProduct)
        setProductData(convertedProducts)
        setTotalProducts(convertedProducts.length)
      } else {
        setError('Không thể tải thông tin cửa hàng')
      }
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
  }

  useEffect(() => {
    fetchProductCategories()
  }, [])

  useEffect(() => {
    fetchProductsByStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchProductsByStore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, statusFilter])

  // Paginate products for display
  const totalFilteredProducts = totalProducts
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalFilteredProducts)
  const paginatedProducts = productData.slice(startIndex, endIndex)
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
          {/* Product Image */}
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

          {/* Product Info */}
          <div className='space-y-3'>
            <h3 className='text-lg font-semibold text-gray-900 line-clamp-2 min-h-[3.5rem]'>{product.product.name}</h3>

            <p className='text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]'>{product.description}</p>

            {/* Stats */}
            <div className='flex items-center justify-between text-sm text-gray-600'>
              <div className='flex items-center gap-1'>
                <Star size={14} className='text-yellow-500' />
                <span>
                  {product.rating !== null && product.rating !== undefined ? product.rating.toFixed(1) : '0.0'}
                </span>
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

            {/* Action Button */}
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

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <ShadcnCard className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                onClick={handleBack}
                size='icon'
                className='flex items-center justify-center w-10 h-10 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full'
              >
                <ChevronLeft size={20} />
              </Button>
              <h2 className='text-3xl font-bold text-white m-0'>Danh sách sản phẩm - cửa hàng {storeName}</h2>
            </div>
          </div>
        </CardContent>
      </ShadcnCard>

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
            {/* Products Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
              {paginatedProducts.map(renderProductCard)}
            </div>

            {/* Pagination */}
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
    </div>
  )
}

export default ListProductByStoreStaff
