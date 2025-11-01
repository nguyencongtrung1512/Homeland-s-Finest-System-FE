import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Package, Calendar, Store, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { staffApi, type ComboDetail } from '../../../apis/staff.api'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Separator } from '../../../components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'

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
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))

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
          {/* Combo Basic Info */}
          <Card>
            <CardHeader>
              <div className='flex items-start gap-4'>
                <Avatar className='h-16 w-16'>
                  {combo.thumbnailUrl ? (
                    <img
                      src={combo.thumbnailUrl}
                      alt={combo.name}
                      className='w-full h-full object-cover'
                      onError={(e) => {
                        const target = e.currentTarget
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) {
                          target.style.display = 'none'
                          fallback.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <AvatarFallback className='text-white font-semibold text-lg bg-gradient-to-br from-blue-500 to-blue-600'>
                    {combo.name
                      .split(' ')
                      .map((word) => word.charAt(0))
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1'>
                  <CardTitle className='text-2xl mb-2'>{combo.name}</CardTitle>
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>
                    <StatusIcon size={14} className='mr-1' />
                    {statusConfig.text}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {combo.description && (
                <div className='mb-4'>
                  <h3 className='font-semibold text-gray-900 mb-2'>Mô tả</h3>
                  <p className='text-gray-600'>{combo.description}</p>
                </div>
              )}

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Store size={16} className='text-gray-400' />
                  <span className='font-medium'>Tỉnh/Thành phố:</span>
                  <span>{combo.provinceName}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Package size={16} className='text-gray-400' />
                  <span className='font-medium'>Số sản phẩm:</span>
                  <span>{combo.comboItems?.length || 0}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar size={16} className='text-gray-400' />
                  <span className='font-medium'>Ngày tạo:</span>
                  <span>{formatDate(combo.createdAt)}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar size={16} className='text-gray-400' />
                  <span className='font-medium'>Cập nhập:</span>
                  <span>{formatDate(combo.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combo Items */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package size={20} />
                Danh sách sản phẩm trong combo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {combo.comboItems && combo.comboItems.length > 0 ? (
                <div className='space-y-4'>
                  {combo.comboItems.map((item) => (
                    <div key={item.id} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <h4 className='font-semibold text-gray-900'>{item.comboItemName}</h4>
                        <Badge
                          variant={item.isActive ? 'default' : 'secondary'}
                          className={item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        >
                          {item.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </div>
                      <div className='grid grid-cols-3 gap-4 text-sm text-gray-600'>
                        <div>
                          <span className='font-medium'>Số lượng:</span>
                          <span className='ml-2'>{item.quantity}</span>
                        </div>
                        <div>
                          <span className='font-medium'>Giá:</span>
                          <span className='ml-2 text-green-600 font-semibold'>{formatCurrency(item.finalPrice)}</span>
                        </div>
                        <div>
                          <span className='font-medium'>Thành tiền:</span>
                          <span className='ml-2 text-green-600 font-semibold'>
                            {formatCurrency(item.finalPrice * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8 text-gray-500'>
                  <Package size={48} className='mx-auto mb-4 text-gray-300' />
                  <p>Chưa có sản phẩm nào trong combo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Staff Notes */}
          {combo.staffNote && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Ghi chú của Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>{combo.staffNote}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Hành động</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {/* Processing Status - Staff needs to Accept or Reject assignment */}
              {combo.status === 'Processing' && (
                <>
                  <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogTrigger asChild>
                      <Button className='w-full bg-green-600 hover:bg-green-700'>
                        <CheckCircle size={16} className='mr-2' />
                        Chấp nhận review
                      </Button>
                    </DialogTrigger>
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
                          <Button onClick={handleConfirmAssignment} disabled={actionLoading} className='flex-1'>
                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận chấp nhận'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                    <DialogTrigger asChild>
                      <Button variant='destructive' className='w-full'>
                        <XCircle size={16} className='mr-2' />
                        Từ chối
                      </Button>
                    </DialogTrigger>
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
                    <DialogTrigger asChild>
                      <Button className='w-full bg-green-600 hover:bg-green-700'>
                        <CheckCircle size={16} className='mr-2' />
                        Approved
                      </Button>
                    </DialogTrigger>
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
                          <Button variant='outline' onClick={() => setShowApproveDialog(false)} className='flex-1'>
                            Hủy
                          </Button>
                          <Button onClick={handleApproveCombo} disabled={actionLoading} className='flex-1'>
                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận phê duyệt'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
                    <DialogTrigger asChild>
                      <Button variant='destructive' className='w-full'>
                        <XCircle size={16} className='mr-2' />
                        Denied
                      </Button>
                    </DialogTrigger>
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

              <Button variant='outline' onClick={() => navigate('/staff/combo-management')} className='w-full'>
                Quay lại danh sách
              </Button>
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
