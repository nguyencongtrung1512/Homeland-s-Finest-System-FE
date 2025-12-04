import { useState, useEffect, useMemo } from 'react'
import { Search, Eye, CalendarIcon, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Badge } from '../../../components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Calendar } from '../../../components/ui/calendar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import Pagination from '../../../components/Pagination/Pagination'
import { productApi, type ProductListResponse } from '../../../apis/product.api'
import type { Product } from '../../../types'
import { toast } from '../../../utils/toast'
import { formatDate } from '../../../utils/formatDate'
import path from '../../../constants/path'
import { ShimmerBorder } from '../../../components/ui/shimmer'
import Loading from '../../../components/Loading/loading'

const DEFAULT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

function ManagerProduct() {
  const navigate = useNavigate()
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState<string>('Processing')
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Fetch products with backend filters
  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true)

      const params: {
        pageNumber: number
        pageSize: number
        search?: string
        productStatus?: string
        productType?: string
        isActive?: boolean
      } = {
        pageNumber: page,
        pageSize: pageSize
      }

      // Add search if provided
      if (searchText) {
        params.search = searchText
      }

      // Add productStatus filter
      if (productStatusFilter !== 'all') {
        params.productStatus = productStatusFilter
      }

      // Add isActive filter
      if (isActiveFilter !== 'all') {
        params.isActive = isActiveFilter === 'true'
      }

      const response: ProductListResponse = await productApi.getAll(params)

      if (response && response.data) {
        setAllProducts(response.data || [])
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1)
          setTotalItems(response.pagination.totalItems || 0)
        } else {
          // Fallback nếu không có pagination từ API
          setTotalPages(1)
          setTotalItems(response.data?.length || 0)
        }
      } else {
        toast.error('Không thể tải danh sách sản phẩm')
        setAllProducts([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
      setAllProducts([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount and when filters change
  useEffect(() => {
    fetchProducts(currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, productStatusFilter, isActiveFilter])

  // Apply client-side filters (date)
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts]

    // Filter by date (client-side)
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd')
      filtered = filtered.filter((p) => {
        try {
          // Handle different date formats from API
          // Product might not have createdAt directly, check the structure
          const createdAt = (p as Product & { createdAt?: string }).createdAt
          if (!createdAt) return false

          const dateStr = createdAt.split(' ')[0] // Get date part before space
          // If format is dd-MM-yyyy, convert to yyyy-MM-dd
          if (dateStr.includes('-')) {
            const parts = dateStr.split('-')
            if (parts.length === 3) {
              // Check if it's dd-MM-yyyy or yyyy-MM-dd
              if (parts[0].length === 4) {
                // Already yyyy-MM-dd
                return dateStr === filterDate
              } else {
                // dd-MM-yyyy, convert to yyyy-MM-dd
                const [day, month, year] = parts
                return `${year}-${month}-${day}` === filterDate
              }
            }
          }
          return dateStr === filterDate
        } catch {
          return false
        }
      })
    }

    return filtered
  }, [allProducts, dateFilter])

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return <Badge className='bg-yellow-500 hover:bg-yellow-600'>Chờ xử lý</Badge>
      case 'approved':
        return <Badge className='bg-green-500 hover:bg-green-600'>Đã duyệt</Badge>
      case 'confirmed':
        return <Badge className='bg-cyan-500 hover:bg-cyan-600'>Đã xác nhận</Badge>
      case 'rejected':
        return <Badge className='bg-red-500 hover:bg-red-600'>Từ chối xử lý</Badge>
      case 'denied':
        return <Badge variant='destructive'>Từ chối duyệt</Badge>
      case 'pending':
        return <Badge className='bg-orange-500 hover:bg-orange-600'>Chờ duyệt</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  // Reset to page 1 when date filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [dateFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Chỉ fetch từ server nếu không có client-side filters (date)
    // Nếu có client-side filters, chỉ cần set page (pagination sẽ được tính từ filteredProducts)
    const hasClientSideFilters = dateFilter !== undefined
    if (!hasClientSideFilters) {
      fetchProducts(page)
    }
  }

  const handleClearFilter = async () => {
    setSearchText('')
    setProductStatusFilter('all')
    setIsActiveFilter('all')
    setDateFilter(undefined)
    setCurrentPage(1)
    // Fetch with default filters (all filters set to 'all')
    try {
      const params = {
        pageNumber: 1,
        pageSize: pageSize
      }
      const response: ProductListResponse = await productApi.getAll(params)
      if (response && response.data) {
        setAllProducts(response.data || [])
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1)
          setTotalItems(response.pagination.totalItems || 0)
        } else {
          setTotalPages(1)
          setTotalItems(response.data?.length || 0)
        }
      }
    } catch (error) {
      console.error('Error clearing filters:', error)
      toast.error('Có lỗi xảy ra khi xóa lọc')
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
    // Search will trigger fetchProducts through useEffect when searchText changes
  }

  // Fetch products when search text changes (with debounce effect)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        fetchProducts(1)
      } else {
        setCurrentPage(1)
      }
    }, 500) // Debounce 500ms

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText])

  // Calculate pagination for filtered products (when using client-side filters)
  const hasClientSideFilters = dateFilter !== undefined
  const effectiveTotalPages = hasClientSideFilters ? Math.ceil(filteredProducts.length / pageSize) : totalPages
  const effectiveTotalItems = hasClientSideFilters ? filteredProducts.length : totalItems

  // Use filtered products directly if no client-side filters, otherwise paginate filtered results
  const paginatedProducts = useMemo(() => {
    if (hasClientSideFilters) {
      const startIndex = (currentPage - 1) * pageSize
      return filteredProducts.slice(startIndex, startIndex + pageSize)
    }
    // Server-side pagination: use allProducts directly (already paginated from server)
    return allProducts
  }, [filteredProducts, allProducts, currentPage, pageSize, hasClientSideFilters])

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Quản lý sản phẩm</h2>
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#ffffff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={() => fetchProducts(currentPage)}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
          <p className='text-white/90 mt-2'>
            Duyệt và quản lý tất cả sản phẩm được phân công ({effectiveTotalItems} sản phẩm)
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-end gap-4'>
            {/* Search */}
            <div className='flex-1 min-w-[300px]'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={16} />
                <Input
                  placeholder='Tên sản phẩm...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(searchText)
                    }
                  }}
                  className='pl-10 w-full'
                />
              </div>
            </div>

            {/* Trạng thái sản phẩm */}
            <div className='flex-1 min-w-[180px]'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
              <Select value={productStatusFilter} onValueChange={setProductStatusFilter}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái sản phẩm' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='Processing'>Chờ xử lý</SelectItem>
                  <SelectItem value='Approved'>Đã duyệt</SelectItem>
                  <SelectItem value='Confirmed'>Đã xác nhận</SelectItem>
                  <SelectItem value='Rejected'>Từ chối xử lý</SelectItem>
                  <SelectItem value='Denied'>Từ chối duyệt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trạng thái bán */}
            <div className='flex-1 min-w-[180px]'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái bán</label>
              <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái bán' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái bán</SelectItem>
                  <SelectItem value='true'>Đang hoạt động</SelectItem>
                  <SelectItem value='false'>Dừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày */}
            <div className='flex-1 min-w-[180px]'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày tạo</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='w-full justify-start text-left font-normal'>
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateFilter ? format(dateFilter, 'dd/MM/yyyy', { locale: vi }) : 'mm/dd/yyyy'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar mode='single' selected={dateFilter} onSelect={setDateFilter} initialFocus locale={vi} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filter Button */}
            <div className='flex items-end'>
              <Button
                onClick={handleClearFilter}
                variant='outline'
                className='h-10 px-4 border-gray-300 hover:bg-gray-100'
              >
                Xóa lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='pt-6'>
          {loading ? (
            <Loading size='lg' text='Đang tải danh sách sản phẩm...' />
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Trạng thái bán</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className='text-center py-8 text-gray-500'>
                          Không có dữ liệu
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <div className='w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative'>
                                {record.productImages && record.productImages.length > 0 ? (
                                  <img
                                    src={record.productImages[0]}
                                    alt={record.name}
                                    className='w-full h-full object-cover'
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = DEFAULT_IMAGE
                                    }}
                                  />
                                ) : (
                                  <img src={DEFAULT_IMAGE} alt={record.name} className='w-full h-full object-cover' />
                                )}
                              </div>
                              <div>
                                <div className='font-medium text-gray-900'>{record.name}</div>
                                {record.description && (
                                  <div className='text-sm' title={record.description}>
                                    Mô tả {truncateText(record.description, 60)}
                                  </div>
                                )}
                                <div className='text-sm' title={record.material}>
                                  Xuất xứ: {record.material}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className='text-gray-700'>
                              {(() => {
                                const productWithDate = record as Product & { createdAt?: string }
                                return productWithDate.createdAt ? formatDate(productWithDate.createdAt) : 'N/A'
                              })()}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusTag(record.status)}</TableCell>
                          <TableCell>
                            {record.isActive ? (
                              <Badge className='bg-green-100 text-green-800 hover:bg-green-200 w-fit'>
                                Đang hoạt động
                              </Badge>
                            ) : (
                              <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-200 w-fit'>Dừng bán</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => {
                                const detailPath = `${path.detailProductStaff.replace(':id', record.id)}`
                                navigate(detailPath)
                              }}
                              className='h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100'
                              title='Xem chi tiết'
                            >
                              <Eye size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className='flex items-center justify-between mt-6'>
                <div className='text-sm text-gray-600'>
                  Hiển thị {(currentPage - 1) * pageSize + 1} đến{' '}
                  {Math.min(currentPage * pageSize, effectiveTotalItems)} của {effectiveTotalItems} kết quả
                </div>
                {effectiveTotalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={effectiveTotalPages}
                    onPageChange={handlePageChange}
                    maxVisiblePages={5}
                  />
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ManagerProduct
