import { useState, useEffect, useCallback } from 'react'
import { Package, Calendar, Store, CheckCircle, XCircle, Clock, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../../../apis/admin.api'
import { staffApi } from '../../../apis/staff.api'
import { type Combo } from '../../../types/combo.type'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'

interface ComboDetailPopupProps {
  comboId: string | null
  isOpen: boolean
  onClose: () => void
  onStatusUpdated?: () => void
}

function ComboDetailPopup({ comboId, isOpen, onClose, onStatusUpdated }: ComboDetailPopupProps) {
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staffName, setStaffName] = useState<string | null>(null)
  const [loadingStaff, setLoadingStaff] = useState(false)
  const [note, setNote] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState<'approve' | 'deny' | null>(null)

  const fetchStaffInfo = useCallback(async (staffId: string) => {
    try {
      setLoadingStaff(true)
      const response = await staffApi.getStaffInfo(staffId)

      // Handle different response formats
      let staffData: { firstName?: string; lastName?: string; email?: string } | null = null

      if (response && typeof response === 'object') {
        if (response.data) {
          staffData = response.data
        } else if (response.firstName || response.lastName) {
          staffData = response
        }
      }

      if (staffData) {
        // Generate staff name from firstName and lastName
        if (staffData.firstName && staffData.lastName) {
          setStaffName(`${staffData.firstName} ${staffData.lastName}`.trim())
        } else if (staffData.firstName) {
          setStaffName(staffData.firstName)
        } else if (staffData.lastName) {
          setStaffName(staffData.lastName)
        } else if (staffData.email) {
          setStaffName(staffData.email.split('@')[0])
        } else {
          setStaffName('Nhân viên')
        }
      } else {
        setStaffName(null)
      }
    } catch (error) {
      console.error('Error fetching staff info:', error)
      setStaffName(null)
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  const fetchComboDetail = useCallback(async () => {
    if (!comboId) return

    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getAllCombos({ pageSize: 0, pageNumber: 1 })
      const foundCombo = response.find((c) => c.id === comboId)

      if (foundCombo) {
        setCombo(foundCombo)
        // Fetch staff info if assignedToId exists
        if (foundCombo.assignedToId) {
          fetchStaffInfo(foundCombo.assignedToId)
        } else {
          setStaffName(null)
        }
      } else {
        setError('Không tìm thấy combo')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải chi tiết combo'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [comboId, fetchStaffInfo])

  useEffect(() => {
    if (isOpen && comboId) {
      fetchComboDetail()
    } else {
      // Reset states when dialog closes
      setCombo(null)
      setStaffName(null)
      setError(null)
      setNote('')
      setUpdatingStatus(null)
    }
  }, [isOpen, comboId, fetchComboDetail])

  const handleStatusUpdate = async (action: 'approve' | 'deny') => {
    if (!comboId) return

    try {
      setUpdatingStatus(action)
      if (action === 'approve') {
        await staffApi.approveCombo(comboId, note)
      } else {
        await staffApi.denyCombo(comboId, note)
      }
      // Cập nhật lại dữ liệu chi tiết & danh sách
      await fetchComboDetail()
      onStatusUpdated?.()
    } catch (err) {
      console.error('Error update combo status:', err)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleStoreClick = (storeId: string) => {
    navigate(`/admin/storeManagement/store-detail/${storeId}`)
    onClose()
  }

  const getStatusConfig = (status: string) => {
    const configs = {
      Processing: {
        variant: 'default' as const,
        text: 'Đang xử lý',
        className: 'bg-orange-100 text-orange-700',
        icon: Clock
      },
      Pending: {
        variant: 'default' as const,
        text: 'Chờ duyệt',
        className: 'bg-yellow-100 text-yellow-700',
        icon: Clock
      },
      Approved: {
        variant: 'default' as const,
        text: 'Đã duyệt',
        className: 'bg-green-100 text-green-700',
        icon: CheckCircle
      },
      Rejected: {
        variant: 'default' as const,
        text: 'Từ chối',
        className: 'bg-red-100 text-red-700',
        icon: XCircle
      },
      Cancelled: {
        variant: 'default' as const,
        text: 'Đã hủy',
        className: 'bg-gray-100 text-gray-700',
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

  if (!combo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle> 1212</DialogTitle>
          </DialogHeader>
          <div className='flex items-center justify-center py-8'>
            {loading ? (
              <div className='text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600'>Đang tải chi tiết combo...</p>
              </div>
            ) : error ? (
              <div className='text-center'>
                <div className='text-red-500 text-lg mb-2'>⚠️</div>
                <p className='text-red-600 font-medium'>{error}</p>
              </div>
            ) : (
              <div className='text-center'>
                <div className='text-gray-400 text-lg mb-2'>📦</div>
                <p className='text-gray-600'>Không tìm thấy combo</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const statusConfig = getStatusConfig(combo.status)
  const StatusIcon = statusConfig.icon
  const canQuickApprove = !['Approved', 'Denied', 'Cancelled'].includes(combo.status) && !updatingStatus

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Chi tiết Combo</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Combo Basic Info */}
          <Card>
            <CardHeader>
              <div className='flex items-start gap-4'>
                <Avatar className='h-16 w-16'>
                  {combo.thumbnailUrl ? (
                    <img src={combo.thumbnailUrl} alt={combo.name} className='w-full h-full object-cover' />
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
              <div className='flex items-center gap-2 text-sm text-gray-600'>
                <span className='font-medium'>Cửa hàng:</span>
                {combo.storeId ? (
                  <button
                    onClick={() => handleStoreClick(combo.storeId!)}
                    className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium'
                  >
                    {combo.storeName}
                  </button>
                ) : (
                  <span>{combo.storeName}</span>
                )}
              </div>
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
                  <span>{formatDate(combo.createdAt || '')}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar size={16} className='text-gray-400' />
                  <span className='font-medium'>Cập nhật:</span>
                  <span>{formatDate(combo.updatedAt || '')}</span>
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
                      <div className='mt-2 text-sm text-gray-500'>
                        <span className='font-medium'>Cửa hàng:</span>
                        <span className='ml-2'>{item.storeName}</span>
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
                {combo.assignedToId && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Nhân viên được gán:</span>
                    {loadingStaff ? (
                      <span className='text-gray-400'>Đang tải...</span>
                    ) : staffName ? (
                      <span className='font-medium flex items-center gap-1'>
                        <User size={14} className='text-gray-400' />
                        {staffName}
                      </span>
                    ) : (
                      <span className='text-gray-400'>Không tìm thấy</span>
                    )}
                  </div>
                )}
                {combo.staffNote && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Ghi chú nhân viên:</span>
                    <span className='font-medium'>{combo.staffNote}</span>
                  </div>
                )}
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Giá gốc:</span>
                  <span className='font-medium text-green-600'>{formatCurrency(combo.totalBasePrice)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Giá bán:</span>
                  <span className='font-medium text-blue-600'>{formatCurrency(combo.totalFinalPrice)}</span>
                </div>
              </div>
              {canQuickApprove && (
                <div className='mt-4 space-y-3'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>Ghi chú (tùy chọn)</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder='Thêm ghi chú khi duyệt / từ chối'
                      className='w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      rows={3}
                    />
                  </div>
                  <div className='flex gap-2 justify-end'>
                    <button
                      onClick={() => handleStatusUpdate('deny')}
                      disabled={!!updatingStatus}
                      className='px-4 py-2 rounded-md border text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-60'
                    >
                      {updatingStatus === 'deny' ? 'Đang từ chối...' : 'Từ chối'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('approve')}
                      disabled={!!updatingStatus}
                      className='px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-60'
                    >
                      {updatingStatus === 'approve' ? 'Đang duyệt...' : 'Duyệt ngay'}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ComboDetailPopup
