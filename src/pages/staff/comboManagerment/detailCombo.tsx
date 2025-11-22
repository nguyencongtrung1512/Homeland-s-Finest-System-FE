import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Package, Calendar, Store, CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { staffApi, type ComboDetail } from '../../../apis/staff.api'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Separator } from '../../../components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import ThreeDCard from '../../../components/ui/threed-card'
import { ShimmerBorder } from '../../../components/ui/shimmer'

function DetailComboStaff() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const comboId = id
  const [combo, setCombo] = useState<ComboDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showDenyDialog, setShowDenyDialog] = useState(false)
  const [confirmNote, setConfirmNote] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [approveNote, setApproveNote] = useState('')
  const [denyNote, setDenyNote] = useState('')

  const fetchComboDetail = useCallback(async () => {
    if (!comboId) return

    try {
      setLoading(true)
      setError(null)

      const response = await staffApi.getComboById(comboId)

      if (response && response.data && response.data.id) {
        setCombo(response.data)
      } else {
        setError('Không tìm thấy combo')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải chi tiết combo'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [comboId])

  useEffect(() => {
    fetchComboDetail()
  }, [fetchComboDetail])

  // Handle confirm assignment (Processing → Confirmed)
  const handleConfirmAssignment = async () => {
    if (!comboId || !confirmNote.trim()) {
      toast.error('Vui lòng nhập ghi chú')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.confirmComboAssignment(comboId, confirmNote)
      toast.success('Đã chấp nhận nhiệm vụ xử lý combo')
      setShowConfirmDialog(false)
      setConfirmNote('')
      await fetchComboDetail() // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi chấp nhận nhiệm vụ'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle reject assignment (Processing → Rejected)
  const handleRejectAssignment = async () => {
    if (!comboId || !rejectNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.rejectComboAssignment(comboId, rejectNote)
      toast.success('Đã từ chối nhiệm vụ thành công')
      setShowRejectDialog(false)
      setRejectNote('')
      await fetchComboDetail() // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi từ chối nhiệm vụ'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle approve combo (Confirmed → Approved)
  const handleApproveCombo = async () => {
    if (!comboId || !approveNote.trim()) {
      toast.error('Vui lòng nhập ghi chú')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.approveCombo(comboId, approveNote)
      toast.success('Đã phê duyệt combo thành công')
      setShowApproveDialog(false)
      setApproveNote('')
      await fetchComboDetail() // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi phê duyệt combo'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  // Handle deny combo (Confirmed → Denied)
  const handleDenyCombo = async () => {
    if (!comboId || !denyNote.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }

    setActionLoading(true)
    try {
      await staffApi.denyCombo(comboId, denyNote)
      toast.success('Đã từ chối combo thành công')
      setShowDenyDialog(false)
      setDenyNote('')
      await fetchComboDetail() // Refresh data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi từ chối combo'
      toast.error(errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      Processing: {
        variant: 'default' as const,
        text: 'Chờ xác nhận',
        className: 'bg-blue-100 text-blue-700',
        icon: Clock
      },
      Confirmed: {
        variant: 'default' as const,
        text: 'Đang xét duyệt',
        className: 'bg-purple-100 text-purple-700',
        icon: Clock
      },
      Approved: {
        variant: 'default' as const,
        text: 'Đã duyệt',
        className: 'bg-green-100 text-green-700',
        icon: CheckCircle
      },
      Denied: {
        variant: 'default' as const,
        text: 'Từ chối',
        className: 'bg-red-100 text-red-700',
        icon: XCircle
      },
      Rejected: {
        variant: 'default' as const,
        text: 'Bị từ chối',
        className: 'bg-orange-100 text-orange-700',
        icon: XCircle
      }
    }

    return (
      configs[status as keyof typeof configs] || {
        variant: 'default' as const,
        text: status,
        className: 'bg-gray-100 text-gray-700',
        icon: Clock
      }
    )
  }
  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'null' || dateString === 'undefined') {
      return '-'
    }

    const timeDateMatch = dateString.match(/(\d{2}:\d{2}:\d{2})\s+(\d{2}\/\d{2}\/\d{4})/)

    if (timeDateMatch) {
      const [, time, date] = timeDateMatch
      const [day, month, year] = date.split('/')
      const [hours, minutes, seconds] = time.split(':')

      // Tạo Date object với định dạng chuẩn
      const dateObj = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      )

      if (isNaN(dateObj.getTime())) {
        return '-'
      }

      return dateObj.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    }

    // Fallback cho các định dạng khác
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const DEFAULT_IMAGE_URL = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Đang tải chi tiết combo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='text-red-500 text-lg mb-2'>⚠️</div>
          <p className='text-red-600 font-medium mb-4'>{error}</p>
          <Button onClick={() => navigate('/staff/combo-management')} className='bg-blue-600 hover:bg-blue-700'>
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='text-gray-400 text-lg mb-2'>📦</div>
          <p className='text-gray-600'>Không tìm thấy combo</p>
          <Button onClick={() => navigate('/staff/combo-management')} className='bg-blue-600 hover:bg-blue-700 mt-4'>
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(combo.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='outline'
          onClick={() => navigate('/staff/combo-management')}
          className='flex items-center gap-2'
        >
          <ArrowLeft size={16} />
          Quay lại
        </Button>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Chi tiết Combo</h1>
          <p className='text-gray-600 mt-1'>Thông tin chi tiết về combo được phân công</p>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Combo Image with ThreeDCard */}
          <ThreeDCard
            className='w-full'
            backgroundImage={combo.thumbnailUrl || DEFAULT_IMAGE_URL}
            enableGlow={true}
            enableShadow={true}
            enableParallax={true}
          >
            <div className='relative h-64 md:h-80 flex items-center justify-center'>
              {combo.thumbnailUrl ? (
                <img
                  src={combo.thumbnailUrl}
                  alt={combo.name}
                  className='w-full h-full object-cover rounded-2xl'
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_IMAGE_URL
                  }}
                />
              ) : (
                <img src={DEFAULT_IMAGE_URL} alt={combo.name} className='w-full h-full object-cover rounded-2xl' />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-2xl' />
              <div className='absolute bottom-6 left-6 right-6 text-white z-10'>
                <h2 className='text-3xl font-bold mb-2 drop-shadow-lg'>{combo.name}</h2>
                <Badge
                  variant={statusConfig.variant}
                  className={`${statusConfig.className} backdrop-blur-sm bg-opacity-80`}
                >
                  <StatusIcon size={14} className='mr-1' />
                  {statusConfig.text}
                </Badge>
              </div>
            </div>
          </ThreeDCard>

          {/* Combo Basic Info */}
          <Card className='shadow-lg border-2'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 border-b pt-3'>
              <CardTitle className='text-2xl flex items-center gap-2'>Thông tin combo</CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              {combo.description && (
                <div className='mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500'>
                  <h3 className='font-semibold text-gray-900 mb-2 flex items-center gap-2'>Mô tả</h3>
                  <p className='text-gray-700 leading-relaxed'>{combo.description}</p>
                </div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-transparent rounded-lg hover:shadow-md transition-shadow'>
                  <div className='p-2 bg-blue-100 rounded-lg'>
                    <Store size={18} className='text-blue-600' />
                  </div>
                  <div className='flex-1'>
                    <span className='text-xs text-gray-500 block'>Tỉnh/Thành phố</span>
                    <span className='font-semibold text-gray-900'>{combo.provinceName}</span>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-transparent rounded-lg hover:shadow-md transition-shadow'>
                  <div className='p-2 bg-purple-100 rounded-lg'>
                    <Package size={18} className='text-purple-600' />
                  </div>
                  <div className='flex-1'>
                    <span className='text-xs text-gray-500 block'>Số sản phẩm</span>
                    <span className='font-semibold text-gray-900'>{combo.comboItems?.length || 0}</span>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-transparent rounded-lg hover:shadow-md transition-shadow'>
                  <div className='p-2 bg-green-100 rounded-lg'>
                    <Calendar size={18} className='text-green-600' />
                  </div>
                  <div className='flex-1'>
                    <span className='text-xs text-gray-500 block'>Ngày tạo</span>
                    <span className='font-semibold text-gray-900'>{formatDate(combo.createdAt)}</span>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-transparent rounded-lg hover:shadow-md transition-shadow'>
                  <div className='p-2 bg-orange-100 rounded-lg'>
                    <Calendar size={18} className='text-orange-600' />
                  </div>
                  <div className='flex-1'>
                    <span className='text-xs text-gray-500 block'>Cập nhật</span>
                    <span className='font-semibold text-gray-900'>{formatDate(combo.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combo Items */}
          <Card className='shadow-lg border-2'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-indigo-50 border-b pt-3'>
              <CardTitle className='flex items-center gap-2 text-xl'>Danh sách sản phẩm trong combo</CardTitle>
            </CardHeader>
            <CardContent className='pt-6'>
              {combo.comboItems && combo.comboItems.length > 0 ? (
                <div className='space-y-4'>
                  {combo.comboItems.map((item) => (
                    <div
                      key={item.id}
                      className='group border-2 rounded-xl p-4 hover:shadow-xl transition-all duration-300 bg-white hover:border-blue-300'
                    >
                      <div className='flex gap-4'>
                        {/* Product Image */}
                        <div className='relative flex-shrink-0'>
                          <div className='w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-blue-400 transition-colors'>
                            {item.comboItemImageUrl ? (
                              <img
                                src={item.comboItemImageUrl}
                                alt={item.comboItemName}
                                className='w-full h-full object-cover'
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_IMAGE_URL
                                }}
                              />
                            ) : (
                              <img
                                src={DEFAULT_IMAGE_URL}
                                alt={item.comboItemName}
                                className='w-full h-full object-cover'
                              />
                            )}
                          </div>
                          {!item.comboItemImageUrl && (
                            <div className='absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg'>
                              <ImageIcon size={24} className='text-gray-400' />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className='flex-1 min-w-0'>
                          <h4 className='font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors'>
                            {item.comboItemName}
                          </h4>
                          <div className='space-y-1.5 text-sm'>
                            <div className='flex items-center gap-2'>
                              <span className='text-gray-500'>Sản phẩm:</span>
                              <span className='font-medium text-gray-700'>{item.productName}</span>
                            </div>
                            {item.variantName && (
                              <div className='flex items-center gap-2'>
                                <span className='text-gray-500'>Biến thể:</span>
                                <span className='font-medium text-gray-700'>{item.variantName}</span>
                              </div>
                            )}
                            <div className='flex items-center gap-2'>
                              <span className='text-gray-500'>Số lượng:</span>
                              <Badge variant='outline' className='font-semibold'>
                                {item.quantity}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-12 text-gray-500'>
                  <div className='inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4'>
                    <Package size={40} className='text-gray-300' />
                  </div>
                  <p className='text-lg font-medium'>Chưa có sản phẩm nào trong combo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Staff Notes */}
          {combo.staffNote && (
            <Card className='shadow-lg border-2 border-yellow-200'>
              <CardHeader className='bg-gradient-to-r from-yellow-50 to-amber-50 border-b'>
                <CardTitle className='text-lg flex items-center gap-2'>
                  Ghi chú của nhân viên
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-4'>
                <p className='text-gray-700 leading-relaxed p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400'>
                  {combo.staffNote}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card className='shadow-lg border-2'>
            <CardHeader className='bg-gradient-to-r from-indigo-50 to-blue-50 border-b'>
              <CardTitle className='text-lg flex items-center gap-2'>Hành động</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Trạng thái hiện tại */}
              <div className='p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <p className='text-sm text-gray-500 mb-2 pt-3'>Trạng thái hiện tại:</p>
                    <span className='font-medium text-gray-700 pb-1'>{statusConfig.text}</span>
                  </div>
                </div>
              </div>

              {combo.status === 'Processing' && (
                <>
                  <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <ShimmerBorder color='#10b981' className='w-full' contentClassName='bg-transparent'>
                      <DialogTrigger asChild>
                        <Button className='w-full bg-green-600 hover:bg-green-700'>
                          <CheckCircle size={16} className='mr-2' />
                          Chấp nhận xử lý
                        </Button>
                      </DialogTrigger>
                    </ShimmerBorder>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chấp nhận nhiệm vụ</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='confirmNote'>Ghi chú *</Label>
                          <Textarea
                            id='confirmNote'
                            value={confirmNote}
                            onChange={(e) => setConfirmNote(e.target.value)}
                            placeholder='Nhập ghi chú khi chấp nhận nhiệm vụ...'
                            rows={4}
                          />
                        </div>
                        <div className='flex gap-2'>
                          <Button variant='outline' onClick={() => setShowConfirmDialog(false)} className='flex-1'>
                            Hủy
                          </Button>
                          <Button
                            variant='green'
                            onClick={handleConfirmAssignment}
                            disabled={actionLoading}
                            className='flex-1'
                          >
                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận chấp nhận'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <ShimmerBorder color='#ef4444' className='w-full' contentClassName='bg-transparent'>
                      <DialogTrigger asChild>
                        <Button variant='destructive' className='w-full'>
                          <XCircle size={16} className='mr-2' />
                          Từ chối
                        </Button>
                      </DialogTrigger>
                    </ShimmerBorder>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Từ chối nhiệm vụ</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='rejectNote'>Lý do từ chối *</Label>
                          <Textarea
                            id='rejectNote'
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                            placeholder='Nhập lý do từ chối nhiệm vụ...'
                            rows={4}
                          />
                        </div>
                        <div className='flex gap-2'>
                          <Button variant='outline' onClick={() => setShowRejectDialog(false)} className='flex-1'>
                            Hủy
                          </Button>
                          <Button onClick={handleRejectAssignment} disabled={actionLoading} className='flex-1'>
                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Separator />
                </>
              )}

              {/* Confirmed Status - Staff needs to Approve or Deny combo */}
              {combo.status === 'Confirmed' && (
                <>
                  <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                    <ShimmerBorder color='#10b981' className='w-full' contentClassName='bg-transparent'>
                      <DialogTrigger asChild>
                        <Button className='w-full bg-green-600 hover:bg-green-700'>
                          <CheckCircle size={16} className='mr-2' />
                          Duyệt
                        </Button>
                      </DialogTrigger>
                    </ShimmerBorder>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Phê duyệt combo</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='approveNote'>Ghi chú *</Label>
                          <Textarea
                            id='approveNote'
                            value={approveNote}
                            onChange={(e) => setApproveNote(e.target.value)}
                            placeholder='Nhập ghi chú khi phê duyệt combo...'
                            rows={4}
                          />
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            variant='outline'
                            onClick={() => setShowApproveDialog(false)}
                            className='flex-1 text-white'
                          >
                            Hủy
                          </Button>
                          <Button
                            variant='green'
                            onClick={handleApproveCombo}
                            disabled={actionLoading}
                            className='flex-1'
                          >
                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
                    <ShimmerBorder color='#ef4444' className='w-full' contentClassName='bg-transparent'>
                      <DialogTrigger asChild>
                        <Button variant='destructive' className='w-full'>
                          <XCircle size={16} className='mr-2' />
                          Từ chối
                        </Button>
                      </DialogTrigger>
                    </ShimmerBorder>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Từ chối combo</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <Label htmlFor='denyNote'>Lý do từ chối *</Label>
                          <Textarea
                            id='denyNote'
                            value={denyNote}
                            onChange={(e) => setDenyNote(e.target.value)}
                            placeholder='Nhập lý do từ chối combo...'
                            rows={4}
                          />
                        </div>
                        <div className='flex gap-2'>
                          <Button variant='outline' onClick={() => setShowDenyDialog(false)} className='flex-1'>
                            Hủy
                          </Button>
                          <Button onClick={handleDenyCombo} disabled={actionLoading} className='flex-1'>
                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Separator />
                </>
              )}

              <ShimmerBorder color='#6366f1' className='w-full' contentClassName='bg-transparent'>
                <Button variant='outline' onClick={() => navigate('/staff/combo-management')} className='w-full'>
                  Quay lại danh sách
                </Button>
              </ShimmerBorder>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Trạng thái:</span>
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    {statusConfig.text}
                  </Badge>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Số sản phẩm:</span>
                  <span className='font-medium'>{combo.comboItems?.length || 0}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Giá gốc:</span>
                  <span className='font-medium text-green-600'>{formatCurrency(combo.totalBasePrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Giá bán:</span>
                  <span className='font-medium text-blue-600'>{formatCurrency(combo.totalFinalPrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Cập nhật lần cuối:</span>
                  <span className='font-medium'>{formatDate(combo.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DetailComboStaff
