import { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Eye, CalendarIcon, RefreshCw } from 'lucide-react'
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
import { staffApi, type ProductForReview } from '../../../apis/staff.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { useAuth } from '../../../contexts/auth.context'
import { toast } from '../../../utils/toast'
import { formatDate } from '../../../utils/formatDate'
import path from '../../../constants/path'
import { ShimmerBorder } from '../../../components/ui/shimmer'

const DEFAULT_IMAGE = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

function ManagerProduct() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [allProducts, setAllProducts] = useState<ProductForReview[]>([])
  const [categories, setCategories] = useState<ProductCategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await getAllProductCategory({ pageSize: 0 })
      console.log('response data categories', response)
      if (response && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Load categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  // Fetch products for review
  const fetchProductsForReview = async (page: number = 1, search: string = '', status: string = 'all') => {
    try {
      setLoading(true)

      if (!user?.userId) {
        toast.error('Không tìm thấy thông tin staff')
        return
      }

      const params = {
        pageNumber: page,
        pageSize: pageSize,
        ...(search && { search }),
        ...(status !== 'all' && { status })
      }

      const response = await staffApi.getProductsForReview(user.userId, params)

      if (response) {
        setAllProducts(response.data)
      } else {
        toast.error('Không thể tải danh sách sản phẩm')
        setAllProducts([])
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
      setAllProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount
  useEffect(() => {
    if (user?.userId) {
      fetchProductsForReview(currentPage, searchText, statusFilter)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId, currentPage])

  // Apply client-side filters (category and date)
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts]

    // Filter by category (client-side)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.categoryIds?.includes(categoryFilter))
    }

    // Filter by date (client-side)
    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd')
      filtered = filtered.filter((p) => {
        try {
          // Handle different date formats from API
          const dateStr = p.createdAt.split(' ')[0] // Get date part before space
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
  }, [allProducts, categoryFilter, dateFilter])

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge className='bg-orange-500 hover:bg-orange-600'>Chờ duyệt</Badge>
      case 'approved':
        return <Badge className='bg-green-500 hover:bg-green-600'>Đã duyệt</Badge>
      case 'rejected':
        return <Badge variant='destructive'>Từ chối</Badge>
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const handleFilter = () => {
    setCurrentPage(1)
    fetchProductsForReview(1, searchText, statusFilter)
  }

  // Reset to page 1 when category or date filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [categoryFilter, dateFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchProductsForReview(page, searchText, statusFilter)
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
    fetchProductsForReview(1, value, statusFilter)
  }

  // Calculate pagination for filtered products
  const totalPages = Math.ceil(filteredProducts.length / pageSize)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredProducts.slice(startIndex, startIndex + pageSize)
  }, [filteredProducts, currentPage, pageSize])

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
                onClick={() => fetchProductsForReview(currentPage, searchText, statusFilter)}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
          <p className='text-white/90 mt-2'>Duyệt và quản lý tất cả sản phẩm được phân công ({filteredProducts.length} sản phẩm)</p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-wrap items-center gap-4'>
            <div className='flex-1 min-w-[300px]'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={16} />
                <Input
                  placeholder='Tên sản phẩm hoặc ID...'
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

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='Pending'>Chờ duyệt</SelectItem>
                <SelectItem value='Approved'>Đã duyệt</SelectItem>
                <SelectItem value='Rejected'>Từ chối</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Danh mục' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                {categories
                  .filter((cat) => cat.isActive)
                  .map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='w-40 justify-start text-left font-normal'>
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {dateFilter ? format(dateFilter, 'dd/MM/yyyy', { locale: vi }) : 'mm/dd/yyyy'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar mode='single' selected={dateFilter} onSelect={setDateFilter} initialFocus locale={vi} />
              </PopoverContent>
            </Popover>

            <Button onClick={handleFilter} className='bg-blue-600 hover:bg-blue-700'>
              <Filter size={16} className='mr-2' />
              Lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className='pt-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-gray-500'>Đang tải...</div>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Trạng thái</TableHead>
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
                                  <div className='text-sm ' title={record.description}>
                                    Mô tả  {truncateText(record.description, 60)}
                                  </div>
                                )}
                                <div className='text-sm ' title={record.material}>
                                  Xuất xứ: {record.material}
                                </div>
                              </div>

                            </div>
                          </TableCell>


                          <TableCell>
                            <span className='text-gray-700'>{formatDate(record.createdAt)}</span>
                          </TableCell>
                          <TableCell>{getStatusTag(record.status)}</TableCell>
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
                  {Math.min(currentPage * pageSize, filteredProducts.length)} của {filteredProducts.length} kết quả
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
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
