import { useState, useEffect } from 'react'
import { ArrowLeft, Check, XCircle, User, Home, Clock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { message } from 'antd'
import { Button } from '../../../components/ui/button'
import { Card } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog'
import { productApi, type ProductResponse } from '../../../apis/product.api'
import { staffApi } from '../../../apis/staff.api'
import type { Product } from '../../../types'

function DetailProductStaff() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // States cho dialog xác nhận
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approveNote, setApproveNote] = useState('')
  const [rejectNote, setRejectNote] = useState('')

  // Fetch product details
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        message.error('Không tìm thấy ID sản phẩm')
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        console.log('🔍 DEBUG - Fetching product detail for ID:', id)
        
        const response: ProductResponse = await productApi.getById(id)
        console.log('🔍 DEBUG - Product detail response:', response)
        
        if (response.status === 200 && response.data) {
          setProduct(response.data)
        } else {
          message.error('Không thể tải thông tin sản phẩm')
        }
      } catch (error) {
        console.error('❌ DEBUG - Error fetching product detail:', error)
        message.error('Có lỗi xảy ra khi tải thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [id, navigate])

  const handleBack = () => {
    navigate(-1)
  }

  // Mở dialog approve
  const openApproveDialog = () => {
    setApproveNote('')
    setShowApproveDialog(true)
  }

  // Mở dialog reject
  const openRejectDialog = () => {
    setRejectNote('')
    setShowRejectDialog(true)
  }

  // Xác nhận approve
  const confirmApprove = async () => {
    if (!product?.id) return
    
    if (!approveNote.trim()) {
      message.warning('Vui lòng nhập ghi chú!')
      return
    }
    
    try {
      setUpdating(true)
      console.log('🔍 DEBUG - Approving product:', product.id)
      
      const response = await staffApi.reviewProduct(product.id, { 
        newStatus: 'Approved',
        note: approveNote.trim()
      })
      
      if (response.status === 200) {
        message.success('Sản phẩm đã được duyệt thành công')
        setShowApproveDialog(false)
        setApproveNote('')
        
        // Refresh product data
        const updatedProduct = await productApi.getById(product.id)
        if (updatedProduct.status === 200) {
          setProduct(updatedProduct.data)
        }
      } else {
        message.error('Có lỗi xảy ra khi duyệt sản phẩm')
      }
    } catch (error) {
      console.error('❌ DEBUG - Error approving product:', error)
      message.error('Có lỗi xảy ra khi duyệt sản phẩm')
    } finally {
      setUpdating(false)
    }
  }

  // Xác nhận reject
  const confirmReject = async () => {
    if (!product?.id) return
    
    if (!rejectNote.trim()) {
      message.warning('Vui lòng nhập lý do từ chối!')
      return
    }
    
    try {
      setUpdating(true)
      console.log('🔍 DEBUG - Rejecting product:', product.id)
      
      const response = await staffApi.reviewProduct(product.id, { 
        newStatus: 'Rejected',
        note: rejectNote.trim()
      })
      
      if (response.status === 200) {
        message.success('Sản phẩm đã được từ chối')
        setShowRejectDialog(false)
        setRejectNote('')
        
        // Refresh product data
        const updatedProduct = await productApi.getById(product.id)
        if (updatedProduct.status === 200) {
          setProduct(updatedProduct.data)
        }
      } else {
        message.error('Có lỗi xảy ra khi từ chối sản phẩm')
      }
    } catch (error) {
      console.error('❌ DEBUG - Error rejecting product:', error)
      message.error('Có lỗi xảy ra khi từ chối sản phẩm')
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    } catch {
      return dateString
    }
  }

  const getStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className='bg-orange-100 text-orange-800'>Chờ duyệt</Badge>
      case 'approved':
        return <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>
      case 'rejected':
        return <Badge className='bg-red-100 text-red-800'>Từ chối</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800'>{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Quay lại quản lý sản phẩm
          </Button>
          <h1 className='text-2xl font-bold text-gray-900'>Chi tiết sản phẩm</h1>
          <div></div>
        </div>
        <Card className='shadow-lg p-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Đang tải thông tin sản phẩm...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Quay lại quản lý sản phẩm
          </Button>
          <h1 className='text-2xl font-bold text-gray-900'>Chi tiết sản phẩm</h1>
          <div></div>
        </div>
        <Card className='shadow-lg p-8'>
          <div className='text-center'>
            <p className='text-gray-600'>Không tìm thấy thông tin sản phẩm</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header with Back Button */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Quay lại quản lý sản phẩm
          </Button>
        </div>
        <h1 className='text-2xl font-bold text-gray-900'>Chi tiết sản phẩm</h1>
        <div></div>
      </div>

      {/* Main Content */}
      <Card className='shadow-lg p-5'>
        {/* Product Review Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-orange-500 rounded-full'></div>
              <h2 className='text-xl font-bold text-gray-900'>Đánh giá sản phẩm</h2>
            </div>
          </div>

          <div className='flex gap-6'>
            {/* Product Image */}
            <div className='w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden'>
              {product.productImages && product.productImages.length > 0 ? (
                <img
                  src={product.productImages[0]}
                  alt={product.name}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling!.style.display = 'flex'
                  }}
                />
              ) : null}
              <div className='text-center'>
                <span className='text-gray-500 text-sm'>Không có hình ảnh</span>
              </div>
            </div>

            {/* Product Details */}
            <div className='flex-1'>
              <h3 className='text-2xl font-bold text-gray-900 mb-4'>{product.name}</h3>

              <p className='text-gray-700 mb-4 leading-relaxed'>
                {product.description}
              </p>

              <div className='mb-4'>
                <span className='text-sm text-gray-600 mr-2'>Loại sản phẩm:</span>
                <span className='font-medium'>{product.typeProduct || 'Chưa xác định'}</span>
              </div>

              <div className='mb-4'>
                <span className='text-sm text-gray-600 mr-2'>Xuất xứ:</span>
                <span className='font-medium'>{product.madeBy || 'Chưa xác định'}</span>
              </div>

              <div className='mb-6'>
                <span className='text-sm text-gray-600 mr-2'>Trạng thái:</span>
                {getStatusTag(product.status)}
              </div>

              {/* Staff Actions */}
              <div className='mb-4'>
                <div className='flex items-center gap-2 mb-3'>
                  <User size={16} className='text-green-600' />
                  <span className='font-semibold text-gray-900'>Hành động của Staff</span>
                </div>

                {product.status === 'Pending' && (
                  <div className='flex gap-3 mb-3'>
                    <Button 
                      onClick={openApproveDialog} 
                      disabled={updating}
                      className='bg-green-600 hover:bg-green-700 text-white'
                    >
                      <Check size={16} className='mr-2' />
                      Duyệt sản phẩm
                    </Button>
                    <Button 
                      onClick={openRejectDialog} 
                      disabled={updating}
                      className='bg-red-600 hover:bg-red-700 text-white'
                    >
                      <XCircle size={16} className='mr-2' />
                      Từ chối
                    </Button>
                  </div>
                )}

                {product.status !== 'Pending' && (
                  <div className='text-sm text-gray-600 mb-3'>
                    Sản phẩm đã được xử lý: {getStatusTag(product.status)}
                  </div>
                )}

                {product.note && (
                  <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                    <span className='font-medium text-gray-700'>Ghi chú từ Staff:</span>
                    <p className='text-gray-600 mt-1'>{product.note}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Store Information and Product History - Side by Side */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Store Information Section */}
          <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
            <div className='flex items-center gap-2 mb-6'>
              <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Home size={18} className='text-blue-600' />
              </div>
              <h2 className='text-xl font-bold text-gray-900'>Thông tin cửa hàng</h2>
            </div>

            <div className='flex items-start gap-4'>
              <Avatar className='w-16 h-16 shadow-md'>
                <AvatarFallback className='bg-green-600 text-white'>
                  <Home size={24} />
                </AvatarFallback>
              </Avatar>
              <div className='flex-1'>
                <h3 className='text-lg font-bold text-gray-900 mb-2'>ID: {product.storeId}</h3>
                <p className='text-gray-600 mb-4 text-sm'>Thông tin cửa hàng</p>

                <div className='space-y-3'>
                  <div className='flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100'>
                    <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center'>
                      <User size={14} className='text-gray-500' />
                    </div>
                    <span className='text-gray-700 font-medium'>Store ID: {product.storeId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product History Section */}
          <div className='bg-gray-50 rounded-lg p-6 border border-gray-200'>
            <div className='flex items-center gap-2 mb-6'>
              <div className='w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center'>
                <Clock size={18} className='text-orange-600' />
              </div>
              <h2 className='text-xl font-bold text-gray-900'>Thông tin sản phẩm</h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-white rounded-lg p-4 border border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>Ngày tạo</span>
                </div>
                <span className='text-gray-900 font-semibold'>{formatDate(product.createdAt)}</span>
              </div>

              <div className='bg-white rounded-lg p-4 border border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>Đánh giá</span>
                </div>
                <span className='text-gray-900 font-semibold'>
                  {product.rating?.toFixed(1) || '0.0'} ⭐ ({product.reviewCount || 0} đánh giá)
                </span>
              </div>

              <div className='bg-white rounded-lg p-4 border border-gray-100'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-sm font-medium text-gray-600'>Lượt bán</span>
                </div>
                <span className='text-gray-900 font-semibold'>{product.saleCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Dialog Xác nhận Duyệt */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <Check className='text-green-600' size={24} />
              Xác nhận duyệt sản phẩm
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className='space-y-4 mt-4'>
                <p>Bạn có chắc chắn muốn duyệt sản phẩm <strong>{product.name}</strong>?</p>
                
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Ghi chú <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    value={approveNote}
                    onChange={(e) => setApproveNote(e.target.value)}
                    placeholder='Nhập ghi chú về việc duyệt sản phẩm này...'
                    className='w-full min-h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none'
                  />
                  {!approveNote.trim() && (
                    <p className='text-xs text-red-500'>Vui lòng nhập ghi chú trước khi duyệt</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove}
              disabled={updating || !approveNote.trim()}
              className='bg-green-600 hover:bg-green-700'
            >
              {updating ? 'Đang xử lý...' : 'Xác nhận duyệt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Xác nhận Từ chối */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'>
              <XCircle className='text-red-600' size={24} />
              Xác nhận từ chối sản phẩm
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className='space-y-4 mt-4'>
                <p>Bạn có chắc chắn muốn từ chối sản phẩm <strong>{product.name}</strong>?</p>
                
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-gray-700'>
                    Lý do từ chối <span className='text-red-500'>*</span>
                  </label>
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder='Nhập lý do từ chối sản phẩm này...'
                    className='w-full min-h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none'
                  />
                  {!rejectNote.trim() && (
                    <p className='text-xs text-red-500'>Vui lòng nhập lý do từ chối</p>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReject}
              disabled={updating || !rejectNote.trim()}
              className='bg-red-600 hover:bg-red-700'
            >
              {updating ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DetailProductStaff