import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
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
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    totalItems: 0,
    totalPages: 0
  })
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch products from API - GET /api/Product tự động filter theo seller đã đăng nhập
  const fetchProducts = async (pageNumber: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true)
      setError(null)

      const response: ProductListResponse = await productApi.getAll({
        pageNumber,
        pageSize,
        status: ''
      })

      if (response.status === 200) {
        setProducts(response.data)
        setPagination(response.pagination)
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
    fetchProducts(1, 10)
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
    fetchProducts(newPage, pagination.pageSize)
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
        toast.success(response?.message || 'Xóa sản phẩm thành công')
        setShowDeleteDialog(false)
        setProductToDelete(null)
        // Refresh product list
        await fetchProducts(pagination.pageNumber, pagination.pageSize)
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
                {products.map((product) => {
                  const statusInfo = getStatusBadge(product.status, product.isActive)
                  return (
                    <tr key={product.id} className='border-b hover:bg-gray-50'>
                      <td className='py-3 px-4 text-gray-900'>{product.name}</td>
                      <td className='py-3 px-4 text-gray-900 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap'>{product.description}</td>
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
          {pagination.totalPages > 1 && (
            <div className='flex flex-col gap-4 mt-6 lg:flex-row lg:items-center lg:justify-between'>
              <div className='text-sm text-gray-700'>
                Hiển thị {(pagination.pageNumber - 1) * pagination.pageSize + 1} -{' '}
                {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalItems)} trong tổng số{' '}
                {pagination.totalItems} sản phẩm
              </div>
              <Pagination
                currentPage={pagination.pageNumber}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
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
            <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{productToDelete?.name}</strong> không?
              <br />
              <span className='text-sm text-gray-500 mt-2 block'>
                Sản phẩm sẽ bị vô hiệu hóa và không còn hiển thị trên hệ thống. Hành động này có thể ảnh hưởng đến các đơn hàng liên quan.
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
              {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductsSeller
