import { useState, useEffect } from 'react'
import { ArrowLeft, Check, XCircle, Package, FileText, Award, Video, ImageIcon } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../components/ui/alert-dialog'
import { productApi, type ProductResponse } from '../../../apis/product.api'
import { staffApi } from '../../../apis/staff.api'
import type { Product } from '../../../types'

// Extended interface to match API response
interface ProductDetail extends Product {
  variants?: any[]
  productCategories?: any[]
  productCertificateDTOs?: any[]
  editedById?: string | null
}

function DetailProductStaff() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductDetail | null>(null)
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
        toast.error('Không tìm thấy ID sản phẩm', {
          position: 'top-right',
          autoClose: 3000
        })
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        console.log('🔍 DEBUG - Fetching product detail for ID:', id)

        const response: ProductResponse = await productApi.getById(id)
        console.log('🔍 DEBUG - Product detail response:', response)

        if (response.status === 200 && response.data) {
          setProduct(response.data as ProductDetail)
        } else {
          toast.error('Không thể tải thông tin sản phẩm', {
            position: 'top-right',
            autoClose: 3000
          })
        }
      } catch (error) {
        console.error('❌ DEBUG - Error fetching product detail:', error)
        toast.error('Có lỗi xảy ra khi tải thông tin sản phẩm', {
          position: 'top-right',
          autoClose: 3000
        })
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
      toast.warning('Vui lòng nhập ghi chú!', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    try {
      setUpdating(true)
      console.log('🔍 DEBUG - Approving product:', product.id)

      const response = await staffApi.reviewProduct(product.id, {
        newStatus: 'Approved',
        note: approveNote.trim()
      })

      if (response) {
        toast.success('Sản phẩm đã được duyệt thành công', {
          position: 'top-right',
          autoClose: 3000
        })
        setShowApproveDialog(false)
        setApproveNote('')

        // Refresh product data
        const updatedProduct = await productApi.getById(product.id)
        if (updatedProduct.status === 200) {
          setProduct(updatedProduct.data as ProductDetail)
        }
      } else {
        toast.error('Có lỗi xảy ra khi duyệt sản phẩm', {
          position: 'top-right',
          autoClose: 3000
        })
      }
    } catch (error) {
      console.error('❌ DEBUG - Error approving product:', error)
      toast.error('Có lỗi xảy ra khi duyệt sản phẩm', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setUpdating(false)
    }
  }

  // Xác nhận reject
  const confirmReject = async () => {
    if (!product?.id) return

    if (!rejectNote.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối!', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    try {
      setUpdating(true)
      console.log('🔍 DEBUG - Rejecting product:', product.id)

      const response = await staffApi.reviewProduct(product.id, {
        newStatus: 'Rejected',
        note: rejectNote.trim()
      })

      if (response) {
        toast.success('Sản phẩm đã được từ chối', {
          position: 'top-right',
          autoClose: 3000
        })
        setShowRejectDialog(false)
        setRejectNote('')

        // Refresh product data
        const updatedProduct = await productApi.getById(product.id)
        if (updatedProduct.status === 200) {
          setProduct(updatedProduct.data as ProductDetail)
        }
      } else {
        toast.error('Có lỗi xảy ra khi từ chối sản phẩm', {
          position: 'top-right',
          autoClose: 3000
        })
      }
    } catch (error) {
      console.error('❌ DEBUG - Error rejecting product:', error)
      toast.error('Có lỗi xảy ra khi từ chối sản phẩm', {
        position: 'top-right',
        autoClose: 3000
      })
    } finally {
      setUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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

  const getCertificateStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge className='bg-yellow-100 text-yellow-800'>Chờ xử lý</Badge>
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

      {/* Product Status and Actions */}
      <Card className='shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <h2 className='text-xl font-bold text-gray-900'>{product.name}</h2>
              {getStatusTag(product.status)}
              <Badge variant={product.isActive ? 'default' : 'secondary'}>
                {product.isActive ? 'Hoạt động' : 'Tạm dừng'}
              </Badge>
            </div>

            {/* Staff Actions */}
            {product.status === 'Pending' && (
              <div className='flex gap-3'>
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
          </div>
        </CardHeader>
      </Card>

      {/* Product Information */}
      <div className='space-y-6'>
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='w-5 h-5 text-blue-600' />
              Thông tin sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-600'>Tên sản phẩm</label>
              <p className='mt-1 text-gray-900 font-medium'>{product.name}</p>
            </div>

            <div>
              <label className='text-sm font-medium text-gray-600'>Mô tả</label>
              <p className='mt-1 text-gray-900 whitespace-pre-wrap'>{product.description}</p>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-gray-600'>Nhà sản xuất</label>
                <p className='mt-1 text-gray-900'>{product.madeBy || 'Chưa cập nhật'}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-600'>Loại sản phẩm</label>
                <p className='mt-1 text-gray-900'>{product.typeProduct || 'Chưa xác định'}</p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium text-gray-600'>Province ID</label>
                <p className='mt-1 text-gray-900'>{product.provinceId}</p>
              </div>
              <div>
                <label className='text-sm font-medium text-gray-600'>Store ID</label>
                <p className='mt-1 text-gray-900 font-mono text-xs'>{product.storeId}</p>
              </div>
            </div>

            {product.editedById && (
              <div>
                <label className='text-sm font-medium text-gray-600'>Được chỉnh sửa bởi</label>
                <p className='mt-1 text-gray-900 font-mono text-xs'>{product.editedById}</p>
              </div>
            )}

            {product.note && (
              <div>
                <label className='text-sm font-medium text-gray-600'>Ghi chú từ Staff</label>
                <div className='mt-1 bg-gray-50 rounded-lg p-3 border'>
                  <p className='text-gray-900'>{product.note}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Media Section */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Product Images */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <ImageIcon className='w-5 h-5 text-purple-600' />
                Hình ảnh sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.productImages && product.productImages.length > 0 ? (
                <div className='grid grid-cols-2 gap-4'>
                  {product.productImages.map((image, index) => (
                    <div key={index} className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className='w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer'
                        onClick={() => window.open(image, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <ImageIcon className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>Không có hình ảnh</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Video */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Video className='w-5 h-5 text-red-600' />
                Video sản phẩm
              </CardTitle>
            </CardHeader>
            <CardContent>
              {product.productVideo ? (
                <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden'>
                  <video src={product.productVideo} controls className='w-full h-full object-cover' />
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Video className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-500'>Không có video</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-indigo-600' />
              Danh mục sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.productCategories && product.productCategories.length > 0 ? (
              <div className='grid gap-4'>
                {product.productCategories.map((category: any, index: number) => (
                  <div key={index} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                    <div className='flex items-center justify-between mb-2'>
                      <h3 className='font-medium text-gray-900'>{category.name}</h3>
                      <Badge variant={category.isActive ? 'default' : 'secondary'}>
                        {category.isActive ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </div>
                    <p className='text-sm text-gray-600 mb-3'>{category.description}</p>
                    <div className='grid grid-cols-2 gap-4 text-xs text-gray-500'>
                      <div>
                        <span className='font-medium'>Ngày tạo:</span> {formatDate(category.createdAt)}
                      </div>
                      <div>
                        <span className='font-medium'>Cập nhật:</span> {formatDate(category.updatedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <FileText className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa có danh mục nào</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Award className='w-5 h-5 text-yellow-600' />
              Chứng nhận sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.productCertificateDTOs && product.productCertificateDTOs.length > 0 ? (
              <div className='grid gap-4'>
                {product.productCertificateDTOs.map((cert: any, index: number) => (
                  <div key={index} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                    <div className='flex items-start justify-between mb-4'>
                      <div>
                        <h3 className='font-medium text-gray-900 mb-2'>Chứng nhận #{index + 1}</h3>
                        {getCertificateStatusTag(cert.status)}
                      </div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                      <div>
                        <label className='font-medium text-gray-600'>Ngày nộp:</label>
                        <p className='text-gray-900'>{formatDate(cert.submittedDate)}</p>
                      </div>

                      {cert.decisionDate && (
                        <div>
                          <label className='font-medium text-gray-600'>Ngày quyết định:</label>
                          <p className='text-gray-900'>{formatDate(cert.decisionDate)}</p>
                        </div>
                      )}

                      {cert.reviewedByStaffId && (
                        <div>
                          <label className='font-medium text-gray-600'>Staff xử lý:</label>
                          <p className='text-gray-900 font-mono text-xs'>{cert.reviewedByStaffId}</p>
                        </div>
                      )}

                      {cert.updatedAt && (
                        <div>
                          <label className='font-medium text-gray-600'>Cập nhật lần cuối:</label>
                          <p className='text-gray-900'>{formatDate(cert.updatedAt)}</p>
                        </div>
                      )}
                    </div>

                    {cert.staffNotes && (
                      <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                        <label className='font-medium text-blue-800'>Ghi chú từ Staff:</label>
                        <p className='text-blue-700 mt-1'>{cert.staffNotes}</p>
                      </div>
                    )}

                    {cert.imageUrl && (
                      <div className='mt-4'>
                        <label className='font-medium text-gray-600'>Hình ảnh chứng nhận:</label>
                        <div className='mt-2 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden'>
                          <img
                            src={cert.imageUrl}
                            alt={`Certificate ${index + 1}`}
                            className='w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer'
                            onClick={() => window.open(cert.imageUrl, '_blank')}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <Award className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500'>Chưa có chứng nhận nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                <p>
                  Bạn có chắc chắn muốn duyệt sản phẩm <strong>{product.name}</strong>?
                </p>

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
                <p>
                  Bạn có chắc chắn muốn từ chối sản phẩm <strong>{product.name}</strong>?
                </p>

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
                  {!rejectNote.trim() && <p className='text-xs text-red-500'>Vui lòng nhập lý do từ chối</p>}
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
