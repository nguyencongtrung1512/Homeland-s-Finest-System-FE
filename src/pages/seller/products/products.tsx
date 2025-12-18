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
import { Plus, Edit, Eye, Play, PauseCircle, BookOpen, AlertCircle } from 'lucide-react'
import path from '../../../constants/path'
import { productApi, type ProductListResponse } from '../../../apis/product.api'
import type { Product } from '../../../types/productType'
import ModalUpdateProduct from './modalUpdateProduct'
import { toast } from '../../../utils/toast'
import Pagination from '../../../components/Pagination/Pagination'
import ProductTutorialModal from './ProductTutorialModal'
import { useStore } from '../../../contexts/store.context'
import { storeStoryApi } from '../../../apis/storeStory.api'

function ProductsSeller() {
  const navigate = useNavigate()
  const { store } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'createdAt' | 'name'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'approved' | 'pending' | 'draft' | 'processing' | 'cancelled' | 'confirmed' | 'denied'
  >('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [productToActivate, setProductToActivate] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isActivating, setIsActivating] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStoryRequiredDialog, setShowStoryRequiredDialog] = useState(false)
  const [isCheckingStory, setIsCheckingStory] = useState(false)
  const [hasStoreStory, setHasStoreStory] = useState<boolean | null>(null)

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

  // Kiểm tra store story khi component mount hoặc store thay đổi
  const checkStoreStory = async () => {
    if (!store?.id) {
      setHasStoreStory(null)
      return
    }

    try {
      setIsCheckingStory(true)
      const response = await storeStoryApi.getByStore(store.id)

      // Kiểm tra xem có story hay không
      const storiesData = response.data
      const storiesArray = Array.isArray(storiesData) ? storiesData : storiesData ? [storiesData] : []
      const hasStory = storiesArray.length > 0

      setHasStoreStory(hasStory)
    } catch (error: unknown) {
      // Nếu API trả về lỗi (có thể là 404 hoặc không có story), coi như chưa có story
      console.error('Error checking store story:', error)
      setHasStoreStory(false)
    } finally {
      setIsCheckingStory(false)
    }
  }

  // Kiểm tra store story khi store có sẵn
  useEffect(() => {
    if (store?.id) {
      checkStoreStory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id])

  // Kiểm tra lại store story khi quay lại trang (khi window được focus)
  useEffect(() => {
    const handleFocus = () => {
      if (store?.id) {
        // Check lại khi quay lại trang để cập nhật trạng thái mới nhất
        checkStoreStory()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id])

  const handleCreateProduct = async () => {
    // Kiểm tra store story trước khi cho phép tạo sản phẩm
    if (!store?.id) {
      toast.error('Không tìm thấy thông tin cửa hàng')
      return
    }

    // Nếu chưa kiểm tra hoặc đang kiểm tra, thực hiện kiểm tra
    if (hasStoreStory === null || isCheckingStory) {
      setIsCheckingStory(true)
      try {
        const response = await storeStoryApi.getByStore(store.id)
        const storiesData = response.data
        const storiesArray = Array.isArray(storiesData) ? storiesData : storiesData ? [storiesData] : []
        const hasStory = storiesArray.length > 0
        setHasStoreStory(hasStory)

        if (!hasStory) {
          // Chưa có story -> hiển thị dialog yêu cầu tạo story
          setShowStoryRequiredDialog(true)
          return
        }
      } catch (error: unknown) {
        // Nếu API trả về lỗi, coi như chưa có story
        console.error('Error checking store story:', error)
        setHasStoreStory(false)
        setShowStoryRequiredDialog(true)
        return
      } finally {
        setIsCheckingStory(false)
      }
    } else if (!hasStoreStory) {
      // Đã kiểm tra và chưa có story
      setShowStoryRequiredDialog(true)
      return
    }

    // Đã có story -> cho phép tạo sản phẩm
    navigate(`../${path.createProduct}`)
  }

  const handleGoToCreateStory = () => {
    setShowStoryRequiredDialog(false)
    navigate(`../${path.myStorySeller}`)
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

  const handleToggleActiveClick = (product: Product) => {
    if (product.isActive) {
      // Nếu đang active thì Dừng bán sản phẩm
      setProductToDelete(product)
      setShowDeleteDialog(true)
    } else {
      // Nếu đang inactive thì kích hoạt lại
      setProductToActivate(product)
      setShowActivateDialog(true)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return

    try {
      setIsDeleting(true)
      // Fetch chi tiết sản phẩm để lấy đầy đủ thông tin
      const productDetail = await productApi.getById(productToDelete.id)
      if (productDetail.status !== 200 || !productDetail.data) {
        toast.error('Không thể tải thông tin sản phẩm')
        return
      }

      const product = productDetail.data

      // Tạo FormData với tất cả các field
      const formData = new FormData()
      formData.append('Name', product.name || '')
      formData.append('ProvinceId', product.provinceId?.toString() || '')
      formData.append('IsActive', 'false') // Thay đổi isActive thành false
      formData.append('RemoveExistingVideo', 'false')

      // Optional fields
      if (product.description) {
        formData.append('Description', product.description)
      }

      if (product.material) {
        formData.append('Material', product.material)
      }

      if (product.productCategories?.id) {
        formData.append('CategoryId', product.productCategories.id)
      }

      // Existing image URLs
      if (product.productImages && product.productImages.length > 0) {
        product.productImages.forEach((url: string) => {
          formData.append('ExistingImageUrls', url)
        })
      }

      const response = await productApi.updateWithFormData(productToDelete.id, formData)

      if (response && (response.status === 200 || response.status === 202)) {
        toast.success('Tạm Dừng bán sản phẩm thành công')
        setShowDeleteDialog(false)
        setProductToDelete(null)
        // Refresh product list
        await fetchProducts()
      } else {
        toast.error(response?.message || 'Không thể tạm Dừng bán sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error deactivating product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi tạm Dừng bán sản phẩm'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    setProductToDelete(null)
  }

  const handleActivateConfirm = async () => {
    if (!productToActivate) return

    try {
      setIsActivating(true)
      // Fetch chi tiết sản phẩm để lấy đầy đủ thông tin
      const productDetail = await productApi.getById(productToActivate.id)
      if (productDetail.status !== 200 || !productDetail.data) {
        toast.error('Không thể tải thông tin sản phẩm')
        return
      }

      const product = productDetail.data

      // Tạo FormData với tất cả các field
      const formData = new FormData()
      formData.append('Name', product.name || '')
      formData.append('ProvinceId', product.provinceId?.toString() || '')
      formData.append('IsActive', 'true') // Thay đổi isActive thành true
      formData.append('RemoveExistingVideo', 'false')

      // Optional fields
      if (product.description) {
        formData.append('Description', product.description)
      }

      if (product.material) {
        formData.append('Material', product.material)
      }

      if (product.productCategories?.id) {
        formData.append('CategoryId', product.productCategories.id)
      }

      // Existing image URLs
      if (product.productImages && product.productImages.length > 0) {
        product.productImages.forEach((url: string) => {
          formData.append('ExistingImageUrls', url)
        })
      }

      const response = await productApi.updateWithFormData(productToActivate.id, formData)

      if (response && (response.status === 200 || response.status === 202)) {
        toast.success('Kích hoạt sản phẩm thành công')
        setShowActivateDialog(false)
        setProductToActivate(null)
        // Refresh product list
        await fetchProducts()
      } else {
        toast.error(response?.message || 'Không thể kích hoạt sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error activating product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi kích hoạt sản phẩm'
      toast.error(errorMessage)
    } finally {
      setIsActivating(false)
    }
  }

  const handleActivateCancel = () => {
    setShowActivateDialog(false)
    setProductToActivate(null)
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
      case 'processing':
        return {
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
          text: 'Đang xử lý'
        }
      case 'cancelled':
        return {
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          text: 'Đã hủy'
        }
      case 'rejected':
        return {
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
          text: 'Đang xử lý'
        }
      case 'confirmed':
        return {
          variant: 'secondary' as const,
          className: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100',
          text: 'Đã xác nhận'
        }
      case 'denied':
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
        const trimmedSearchTerm = searchTerm.trim()
        if (!trimmedSearchTerm) return true
        const term = trimmedSearchTerm.toLowerCase()
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
              : statusFilter === 'processing'
                ? statusValue === 'processing' || statusValue === 'rejected'
                : statusFilter === 'cancelled'
                  ? statusValue === 'cancelled'
                  : statusFilter === 'confirmed'
                    ? statusValue === 'confirmed'
                    : statusFilter === 'denied'
                      ? statusValue === 'denied'
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
        <h1 className='text-2xl font-semibold text-green-700'>Quản lý sản phẩm</h1>
        <div className='flex gap-3'>
          <Button variant='outline' onClick={() => setShowTutorial(true)}>
            <BookOpen className='w-4 h-4 mr-2' />
            Xem hướng dẫn
          </Button>
          <Button variant='yellow' onClick={handleCreateProduct}>
            <Plus className='w-4 h-4 mr-2' />
            Thêm sản phẩm mới
          </Button>
        </div>
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
                  placeholder='Tìm theo tên, mô tả...'
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
                  setSortBy(field as 'createdAt' | 'name')
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
                  <SelectItem value='draft'>Nháp</SelectItem>
                  <SelectItem value='pending'>Chờ duyệt</SelectItem>
                  <SelectItem value='processing'>Đang xử lý</SelectItem>
                  <SelectItem value='confirmed'>Đã xác nhận</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                  <SelectItem value='denied'>Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-green-700 py-2'>Danh sách sản phẩm</CardTitle>
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
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className='py-12 px-4'>
                      {hasStoreStory === false ? (
                        <div className='flex flex-col items-center justify-center text-center py-8'>
                          <div className='bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 max-w-2xl w-full'>
                            <div className='flex items-center justify-center mb-4'>
                              <AlertCircle className='w-12 h-12 text-yellow-600' />
                            </div>
                            <h3 className='text-xl font-semibold text-yellow-800 mb-3'>
                              Bạn cần tạo câu chuyện cửa hàng trước
                            </h3>
                            <p className='text-gray-700 mb-4'>
                              Để bắt đầu tạo sản phẩm, bạn cần tạo <strong>câu chuyện cửa hàng</strong> trước. Câu
                              chuyện cửa hàng giúp khách hàng hiểu rõ hơn về cửa hàng của bạn và tăng độ tin cậy.
                            </p>
                            <div className='bg-white rounded-lg p-4 mb-4 text-left'>
                              <p className='text-sm font-medium text-gray-800 mb-2'>
                                📝 Lợi ích của câu chuyện cửa hàng:
                              </p>
                              <ul className='text-sm text-gray-600 list-disc list-inside space-y-1'>
                                <li>Giúp khách hàng hiểu rõ hơn về cửa hàng của bạn</li>
                                <li>Tăng độ tin cậy và uy tín của cửa hàng</li>
                                <li>Tạo sự kết nối với khách hàng</li>
                                <li>Là bước quan trọng để bắt đầu bán hàng trên hệ thống</li>
                              </ul>
                            </div>
                            <Button
                              onClick={handleGoToCreateStory}
                              className='bg-yellow-600 hover:bg-yellow-700 text-white'
                            >
                              <Plus className='w-4 h-4 mr-2' />
                              Đi đến tạo câu chuyện cửa hàng
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className='flex flex-col items-center justify-center text-center py-8'>
                          <div className='text-gray-500'>
                            <p className='text-lg mb-2'>Chưa có sản phẩm nào</p>
                            <p className='text-sm'>Hãy bắt đầu bằng cách tạo sản phẩm đầu tiên của bạn</p>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
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
                            {product.isActive ? (
                              <Button
                                title='Dừng bán sản phẩm'
                                variant='ghost'
                                size='sm'
                                onClick={() => handleToggleActiveClick(product)}
                              >
                                <PauseCircle className='w-4 h-4' />
                              </Button>
                            ) : (
                              <Button
                                title='Kích hoạt lại sản phẩm'
                                variant='ghost'
                                size='sm'
                                onClick={() => handleToggleActiveClick(product)}
                                className='text-green-600 hover:text-green-700 hover:bg-green-50'
                              >
                                <Play className='w-4 h-4' />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
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

      {/* Dialog xác nhận tạm Dừng bán sản phẩm */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận tạm Dừng bán sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tạm Dừng bán sản phẩm <strong>{productToDelete?.name}</strong> không?
              <br />
              <span className='text-sm text-gray-500 mt-2 block'>
                Sản phẩm sẽ bị vô hiệu hóa và không còn hiển thị trên hệ thống. Hành động này có thể ảnh hưởng đến các
                sản phẩm và đơn hàng liên quan.
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
              {isDeleting ? 'Đang xử lý...' : 'Xác nhận tạm dừng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận kích hoạt lại sản phẩm */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-yellow-600'>⚠️ Cảnh báo: Kích hoạt lại sản phẩm</DialogTitle>
            <DialogDescription>
              <div className='space-y-2'>
                <p>
                  Bạn có chắc chắn muốn kích hoạt lại sản phẩm <strong>{productToActivate?.name}</strong> không?
                </p>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3'>
                  <p className='text-sm text-yellow-800 font-medium mb-1'>⚠️ Lưu ý quan trọng:</p>
                  <ul className='text-sm text-yellow-700 list-disc list-inside space-y-1'>
                    <li>Sản phẩm sẽ được hiển thị lại trên hệ thống</li>
                    <li>Khách hàng có thể xem và mua sản phẩm này</li>
                    <li>Hãy đảm bảo sản phẩm vẫn còn tồn kho và thông tin còn chính xác</li>
                    <li>Kiểm tra lại giá cả và thông tin sản phẩm trước khi kích hoạt</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={handleActivateCancel} disabled={isActivating}>
              Hủy
            </Button>
            <Button
              onClick={handleActivateConfirm}
              disabled={isActivating}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {isActivating ? 'Đang xử lý...' : 'Xác nhận kích hoạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutorial Modal */}
      <ProductTutorialModal open={showTutorial} onOpenChange={setShowTutorial} />

      {/* Dialog yêu cầu tạo câu chuyện cửa hàng */}
      <Dialog open={showStoryRequiredDialog} onOpenChange={setShowStoryRequiredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-yellow-600'>
              <AlertCircle className='w-5 h-5' />
              Yêu cầu tạo câu chuyện cửa hàng
            </DialogTitle>
            <DialogDescription>
              <div className='space-y-3 mt-4'>
                <p className='text-base text-gray-700'>
                  Bạn cần tạo <strong>câu chuyện cửa hàng</strong> trước khi có thể tạo sản phẩm mới.
                </p>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                  <p className='text-sm text-yellow-800 font-medium mb-2'>📝 Tại sao cần tạo câu chuyện cửa hàng?</p>
                  <ul className='text-sm text-yellow-700 list-disc list-inside space-y-1'>
                    <li>Giúp khách hàng hiểu rõ hơn về cửa hàng của bạn</li>
                    <li>Tăng độ tin cậy và uy tín của cửa hàng</li>
                    <li>Tạo sự kết nối với khách hàng</li>
                    <li>Là bước quan trọng để bắt đầu bán hàng trên hệ thống</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowStoryRequiredDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleGoToCreateStory} className='bg-yellow-600 hover:bg-yellow-700 text-white'>
              <Plus className='w-4 h-4 mr-2' />
              Đi đến tạo câu chuyện
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductsSeller
