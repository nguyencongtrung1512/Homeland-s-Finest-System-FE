import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search, Filter, RefreshCw, Package, Eye, ArrowLeft, Calendar, Star, Tag } from 'lucide-react'
import { productApi, type ProductListResponse } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { toast } from 'react-toastify'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import type { Product } from '../../../types'

// Interface for query parameters
interface ProductQueryParams {
  pageSize?: number
  pageNumber?: number
  search?: string
  categoryId?: string
  status?: string
  isActive?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Processing'
  rating: number
  saleCount: number
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

  // Convert API Product to ProductData
  const convertProduct = (apiProduct: Product): ProductData => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    return {
      key: apiProduct.id,
      product: {
        image: apiProduct.productImages?.[0] || '',
        name: apiProduct.name,
        id: apiProduct.id
      },
      description: apiProduct.description,
      category: 'N/A', // Will be populated from categories
      createdDate: formatDate(apiProduct.createdAt),
      status: apiProduct.status as 'Pending' | 'Approved' | 'Rejected' | 'Processing',
      rating: apiProduct.rating || 0,
      saleCount: apiProduct.saleCount || 0,
      isActive: apiProduct.isActive
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
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách ngành hàng:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Fetch products by store
  const fetchProductsByStore = async () => {
    if (!storeId) return

    try {
      setLoading(true)
      setError(null)

      const params: ProductQueryParams = {
        pageSize: pageSize,
        pageNumber: currentPage
      }

      // Add search filter
      if (searchText.trim()) {
        params.search = searchText.trim()
      }

      // Add category filter
      if (categoryFilter !== 'all') {
        params.categoryId = categoryFilter
      }

      // Add status filter
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response: ProductListResponse = await productApi.getByStore(storeId, params)

      if (response && response.data && Array.isArray(response.data)) {
        const convertedProducts = response.data.map(convertProduct)
        setProductData(convertedProducts)
        setTotalProducts(response.pagination?.totalItems || convertedProducts.length)
      } else {
        setError('Định dạng dữ liệu không đúng')
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách sản phẩm'
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
  }, [storeId, currentPage, categoryFilter, statusFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, categoryFilter, statusFilter])

  // Filter products for display
  const filteredProducts = productData

  // Calculate pagination
  const totalFilteredProducts = totalProducts
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalFilteredProducts)

  const handleFilter = () => {
    setCurrentPage(1)
    fetchProductsByStore()
  }

  const handleViewProduct = (productId: string) => {
    navigate(`/staff/manager-product/detail-product/${productId}`)
  }

  // Render product card
  const renderProductCard = (product: ProductData) => {
    const statusConfig = {
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
      Processing: {
        variant: 'default' as const,
        text: 'Đang xử lý',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
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
                <img
                  src={product.product.image}
                  alt={product.product.name}
                  className='w-full h-full object-cover'
                />
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
            <h3 className='text-lg font-semibold text-gray-900 line-clamp-2 min-h-[3.5rem]'>
              {product.product.name}
            </h3>
            
            <p className='text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]'>
              {product.description}
            </p>

            {/* Stats */}
            <div className='flex items-center justify-between text-sm text-gray-600'>
              <div className='flex items-center gap-1'>
                <Star size={14} className='text-yellow-500' />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Tag size={14} className='text-gray-400' />
                <span>{product.saleCount} đã bán</span>
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
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            onClick={() => navigate('/staff/stores')}
            className='flex items-center gap-2'
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Danh sách sản phẩm</h1>
            <p className='text-gray-600 mt-1'>
              {storeName ? `Cửa hàng: ${storeName}` : 'Xem và quản lý sản phẩm của cửa hàng'}
            </p>
          </div>
        </div>
        <Button
          onClick={fetchProductsByStore}
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
              {filteredProducts.map(renderProductCard)}
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
                  onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalFilteredProducts / pageSize), prev + 1))}
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