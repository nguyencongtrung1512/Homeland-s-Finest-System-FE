import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import path from '../../../constants/path'
import { productApi, type ProductListResponse } from '../../../apis/product.api'
import type { Product } from '../../../types/productType'
import ModalUpdateProduct from './modalUpdateProduct'
import { toast } from '../../../utils/toast'
import Pagination from '../../../components/Pagination/Pagination'

function ProductsSeller() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'price'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'draft'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch products from API - GET /api/Product tự động filter theo seller đã đăng nhập
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const response: ProductListResponse = await productApi.getAll({
        pageNumber: 1,
        pageSize: 0,
        status: ''
      })

      if (response.status === 200) {
        setProducts(Array.isArray(response.data) ? response.data : [])
        setCurrentPage(1)
      } else {
        setError('Không thể tải danh sách sản phẩm')
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      setError('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount
  useEffect(() => {
    fetchProducts()
  }, [])

  const handleCreateProduct = () => {
    navigate(`../${path.createProduct}`)
  }

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product)
    setShowUpdateDialog(true)
  }

  const handleViewProduct = (productId: string) => {
    navigate(`../${path.detailProductSeller.replace(':id', productId)}`)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      setIsDeleting(true)
      const response = await productApi.delete(productToDelete.id)

      if (response && (response.status === 200 || response.status === 202)) {
        toast.success('Xóa sản phẩm thành công')
        setShowDeleteDialog(false)
        setProductToDelete(null)
        // Refresh product list
        await fetchProducts()
      } else {
        toast.error(response?.message || 'Không thể xóa sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error deleting product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi xóa sản phẩm'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setProductToDelete(null)
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        variant: 'secondary' as const,
        className: 'bg-red-100 text-red-800 hover:bg-red-100',
        text: 'Tạm dừng'
      }
    }

    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          text: 'Hoạt động'
        }
      case 'draft':
        return {
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
          text: 'Nháp'
        }
      case 'pending':
        return {
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
          text: 'Chờ duyệt'
        }
      case 'rejected':
        return {
          variant: 'secondary' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
          text: 'Từ chối'
        }
      default:
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          text: status
        }
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = (() => {
        if (!searchTerm.trim()) return true
        const term = searchTerm.toLowerCase()
        return (
          product.name.toLowerCase().includes(term) ||
          product.description?.toLowerCase().includes(term) ||
          product.status?.toLowerCase().includes(term)
        )
      })()

      const statusValue = product.status?.toLowerCase() || ''
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'approved'
            ? product.isActive && (statusValue === 'approved' || statusValue === 'active')
            : statusFilter === 'pending'
              ? statusValue === 'pending'
              : statusFilter === 'rejected'
                ? statusValue === 'rejected'
                : statusFilter === 'draft'
                  ? statusValue === 'draft'
                  : !product.isActive

      return matchesSearch && matchesStatus
    })
  }, [products, searchTerm, statusFilter])

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
    const direction = sortDirection === 'asc' ? 1 : -1

    const getDateValue = (product: Product) => {
      const withDates = product as Product & { createdAt?: string; updatedAt?: string }
      const dateString = withDates.createdAt ?? withDates.updatedAt ?? ''
      return dateString ? new Date(dateString).getTime() : 0
    }

    sorted.sort((a, b) => {
      const getValue = (product: Product) => {
        switch (sortBy) {
          case 'name':
            return product.name.toLowerCase()
          case 'price':
            return product.price ?? 0
          case 'createdAt':
          default:
            return getDateValue(product)
        }
      }

      const valueA = getValue(a)
      const valueB = getValue(b)

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * direction
      }

      if (valueA < valueB) return -1 * direction
      if (valueA > valueB) return 1 * direction
      return 0
    })

    return sorted
  }, [filteredProducts, sortBy, sortDirection])

  const totalItems = sortedProducts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedProducts.slice(start, start + pageSize)
  }, [sortedProducts, currentPage, pageSize])

  const paginationStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const paginationEnd = Math.min(currentPage * pageSize, totalItems)

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-lg'>Đang tải...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-red-600'>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Quản lý sản phẩm</h1>
        <Button className='bg-green-600 hover:bg-green-700' onClick={handleCreateProduct}>
          <Plus className='w-4 h-4 mr-2' />
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <CardContent className='p-4'>
          <motion.div
            className='grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-4'
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className='flex flex-col gap-2 lg:col-span-2'>
              <Label className='text-sm font-bold text-gray-700'>Tìm kiếm</Label>
              <div className='relative'>
                <Input
                  placeholder='Tìm theo tên, mô tả hoặc trạng thái...'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className='pl-3'
                />
              </div>
            </div>

            <div className='flex flex-col gap-2 lg:col-span-1'>
              <Label className='text-sm font-bold text-gray-700'>Sắp xếp</Label>
              <Select
                value={`${sortBy}-${sortDirection}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('-')
                  setSortBy(field as 'createdAt' | 'name' | 'price')
                  setSortDirection(direction as 'asc' | 'desc')
                }}
              >
                <SelectTrigger className='text-sm  w-[200px]'>
                  <SelectValue placeholder='Chọn kiểu sắp xếp' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='createdAt-desc'>Mới nhất</SelectItem>
                  <SelectItem value='createdAt-asc'>Cũ nhất</SelectItem>
                  <SelectItem value='name-asc'>Tên A-Z</SelectItem>
                  <SelectItem value='name-desc'>Tên Z-A</SelectItem>
                  <SelectItem value='price-asc'>Giá tăng dần</SelectItem>
                  <SelectItem value='price-desc'>Giá giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='flex flex-col gap-2 lg:col-span-1'>
              <Label className='text-sm font-bold text-gray-700'>Trạng thái</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as typeof statusFilter)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='text-sm w-[200px]'>
                  <SelectValue placeholder='Chọn trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='approved'>Hoạt động</SelectItem>
                  <SelectItem value='pending'>Chờ duyệt</SelectItem>
                  <SelectItem value='rejected'>Từ chối</SelectItem>
                  <SelectItem value='draft'>Nháp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Tên sản phẩm</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Mô tả</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Trạng thái</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => {
                  const statusInfo = getStatusBadge(product.status, product.isActive)
                  return (
                    <tr key={product.id} className='border-b hover:bg-gray-50'>
                      <td className='py-3 px-4 text-gray-900'>{product.name}</td>
                      <td className='py-3 px-4 text-gray-900 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap'>
                        {product.description}
                      </td>
                      <td className='py-3 px-4'>
                        <Badge variant={statusInfo.variant} className={statusInfo.className}>
                          {statusInfo.text}
                        </Badge>
                      </td>
                      <td className='py-3 px-4'>
                        <div className='flex space-x-2'>
                          <Button
                            title='Xem chi tiết'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleViewProduct(product.id)}
                          >
                            <Eye className='w-4 h-4' />
                          </Button>
                          <Button
                            title='Chỉnh sửa'
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button
                            title='Xóa sản phẩm'
                            variant='ghost'
                            size='sm'
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            onClick={() => handleDeleteClick(product)}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > pageSize && (
            <div className='flex flex-col gap-4 mt-6 lg:flex-row lg:items-center lg:justify-between'>
              <div className='text-sm text-gray-700'>
                Hiển thị {paginationStart}-{paginationEnd} trong tổng số {totalItems} sản phẩm
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Update Product */}
      <ModalUpdateProduct
        open={showUpdateDialog}
        onOpenChange={setShowUpdateDialog}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />

      {/* Dialog xác nhận xóa sản phẩm */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận tạm dừng sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tạm dừng sản phẩm <strong>{productToDelete?.name}</strong> không?
              <br />
              <span className='text-sm text-gray-500 mt-2 block'>
                Sản phẩm sẽ bị vô hiệu hóa và không còn hiển thị trên hệ thống. Hành động này có thể ảnh hưởng đến các sản phẩm và
                đơn hàng liên quan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={handleDeleteCancel} disabled={isDeleting}>
              Hủy
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              variant='destructive'
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {isDeleting ? 'Đang xóa...' : 'Xác nhận tạm dừng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductsSeller
