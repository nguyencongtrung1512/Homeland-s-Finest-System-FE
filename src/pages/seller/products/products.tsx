import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import path from '../../../constants/path'
import { productApi, type ProductListResponse } from '../../../apis/product.api'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import type { Product } from '../../../types/productType'

function ProductsSeller() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    totalItems: 0,
    totalPages: 0
  })

  // Fetch store ID from authenticated user
  const fetchStoreId = async () => {
    try {
      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng')
        return
      }

      const response = await storeApi.getStoreBySellerId(user.userId)
      console.log('response getStoreBySellerId', response)
      if (response.status === 200 && response.data) {
        setStoreId(response.data.id)
        return response.data.id
      } else {
        setError('Không tìm thấy thông tin cửa hàng')
        return null
      }
    } catch (err) {
      console.error('Error fetching store ID:', err)
      setError('Có lỗi xảy ra khi tải thông tin cửa hàng')
      return null
    }
  }

  // Fetch products from API
  const fetchProducts = async (pageNumber: number = 1, pageSize: number = 10, currentStoreId?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Use provided storeId or the one from state
      const targetStoreId = currentStoreId || storeId

      if (!targetStoreId) {
        setError('Không có thông tin cửa hàng')
        return
      }

      const response: ProductListResponse = await productApi.getByStore(targetStoreId, {
        pageNumber,
        pageSize,
        status: ''
      })

      console.log('response.data', response.data)
      console.log('API Response:', response)

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

  // Load store ID and products on component mount
  useEffect(() => {
    const initializeData = async () => {
      const fetchedStoreId = await fetchStoreId()
      if (fetchedStoreId) {
        await fetchProducts(1, 10, fetchedStoreId)
      }
    }

    initializeData()
  }, [user?.userId])

  const handleCreateProduct = () => {
    navigate(`../${path.createProduct}`)
  }

  const handleEditProduct = (productId: string) => {
    navigate(`../${path.updateProductSeller.replace(':id', productId)}`)
  }

  const handleViewProduct = (productId: string) => {
    navigate(`../${path.detailProductSeller.replace(':id', productId)}`)
  }

  const handlePageChange = (newPage: number) => {
    fetchProducts(newPage, pagination.pageSize)
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
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Loại sản phẩm</th>
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
                      <td className='py-3 px-4 text-gray-900'>{product.typeProduct}</td>
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
                            onClick={() => handleEditProduct(product.id)}
                          >
                            <Edit className='w-4 h-4' />
                          </Button>
                          <Button variant='ghost' size='sm' className='text-red-600 hover:text-red-700'>
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
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-gray-700'>
              Hiển thị {(pagination.pageNumber - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalItems)} của {pagination.totalItems}{' '}
              sản phẩm
            </div>
            <div className='flex space-x-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={pagination.pageNumber <= 1}
                onClick={() => handlePageChange(pagination.pageNumber - 1)}
              >
                Trước
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.pageNumber - 2) + i
                if (pageNum > pagination.totalPages) return null

                return (
                  <Button
                    key={pageNum}
                    variant='outline'
                    size='sm'
                    className={pageNum === pagination.pageNumber ? 'bg-green-600 text-white hover:bg-green-700' : ''}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}

              <Button
                variant='outline'
                size='sm'
                disabled={pagination.pageNumber >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.pageNumber + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductsSeller
