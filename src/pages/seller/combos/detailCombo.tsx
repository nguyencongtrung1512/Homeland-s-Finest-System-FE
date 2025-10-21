import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { ArrowLeft, Edit, Package, MapPin, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getComboById } from '../../../apis/combo.api'
import path from '../../../constants/path'
import type { Combo } from '../../../types/combo.type'


function DetailComboSeller() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCombo = useCallback(async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await getComboById(id)
      if (response.data) {
        setCombo(response.data)
      } else {
        setCombo(null)
      }
    } catch (error) {
      console.error('Error fetching combo:', error)
      setCombo(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchCombo()
  }, [fetchCombo])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    if (combo) {
      navigate(`../${path.updateComboSeller.replace(':id', combo.id)}`)
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'Đã xóa',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        icon: <XCircle className='w-4 h-4' />
      }
    }

    switch (status) {
      case 'Draft':
        return {
          text: 'Nháp',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
          icon: <FileText className='w-4 h-4' />
        }
      case 'Pending':
        return {
          text: 'Chờ duyệt',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
          icon: <Clock className='w-4 h-4' />
        }
      case 'Approved':
        return {
          text: 'Đã duyệt',
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          icon: <CheckCircle className='w-4 h-4' />
        }
      case 'Rejected':
        return {
          text: 'Bị từ chối',
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
          icon: <XCircle className='w-4 h-4' />
        }
      default:
        return {
          text: 'Đã duyệt',
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
          icon: <CheckCircle className='w-4 h-4' />
        }
    }
  }

  const calculateTotalPrice = () => {
    if (!combo) return 0
    return combo.comboItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateTotalItems = () => {
    if (!combo) return 0
    return combo.comboItems.filter(item => item.isActive).reduce((total, item) => total + item.quantity, 0)
  }

  const calculateActiveItemsCount = () => {
    if (!combo) return 0
    return combo.comboItems.filter(item => item.isActive).length
  }

  const canEdit = combo?.status === 'Draft' || combo?.status === 'Rejected'

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
          <span className='ml-2 text-gray-600'>Đang tải...</span>
        </div>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Không tìm thấy combo</h2>
          <p className='text-gray-600 mb-6'>Combo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={handleBack} className='bg-green-600 hover:bg-green-700'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusBadge(combo.status, combo.isActive)
  const totalPrice = calculateTotalPrice()
  const totalItems = calculateTotalItems()
  const activeItemsCount = calculateActiveItemsCount()

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={handleBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
          <h1 className='text-2xl font-semibold text-gray-900'>{combo.name}</h1>
        </div>
        <div className='flex items-center gap-4'>
          <Badge variant='secondary' className={statusInfo.className}>
            {statusInfo.icon}
            <span className='ml-1'>{statusInfo.text}</span>
          </Badge>
          {canEdit && (
            <Button onClick={handleEdit} className='bg-green-600 hover:bg-green-700'>
              <Edit className='w-4 h-4 mr-2' />
              Chỉnh sửa
            </Button>
          )}
          {!canEdit && combo.status === 'Pending' && (
            <div className='text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded'>
              Combo đang chờ duyệt
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Combo Image */}
          <Card>
            <CardContent className='p-0'>
              {combo.thumbnailUrl ? (
                <img src={combo.thumbnailUrl} alt={combo.name} className='w-full h-64 object-cover rounded-t-lg' />
              ) : (
                <div className='w-full h-64 bg-gray-200 rounded-t-lg flex items-center justify-center'>
                  <Package className='w-16 h-16 text-gray-400' />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Combo Items */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Sản phẩm trong combo ({activeItemsCount}/{combo.comboItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {combo.comboItems.length === 0 ? (
                <div className='text-center py-8'>
                  <Package className='w-12 h-12 mx-auto text-gray-400 mb-4' />
                  <p className='text-gray-500'>Chưa có sản phẩm nào trong combo</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {combo.comboItems.map((item) => (
                    <div key={item.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${!item.isActive ? 'opacity-50' : ''}`}>
                      <div className='flex gap-4'>
                        {item.comboItemImageUrl ? (
                          <img
                            src={item.comboItemImageUrl}
                            alt={item.comboItemName}
                            className='w-16 h-16 object-cover rounded-lg'
                          />
                        ) : (
                          <div className='w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center'>
                            <Package className='w-8 h-8 text-gray-400' />
                          </div>
                        )}
                        <div className='flex-1'>
                          <h4 className='font-medium text-gray-900'>{item.comboItemName}</h4>
                          <p className='text-sm text-gray-600'>
                            {item.productName} - {item.variantName}
                          </p>
                          <p className='text-sm text-gray-500'>{item.storeName}</p>
                          <div className='flex justify-between items-center mt-2'>
                            <span className='text-sm text-gray-600'>Số lượng: {item.quantity}</span>
                            <span className='font-semibold text-green-600'>
                              {(item.price * item.quantity).toLocaleString()}₫
                            </span>
                          </div>
                          {!item.isActive && (
                            <Badge variant='secondary' className='mt-2 bg-gray-100 text-gray-800'>
                              Đã ẩn
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin combo</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Trạng thái:</span>
                <Badge variant='secondary' className={statusInfo.className}>
                  {statusInfo.text}
                </Badge>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Tổng giá:</span>
                <span className='text-lg font-semibold text-green-600'>{totalPrice.toLocaleString()}₫</span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Tổng số lượng:</span>
                <span className='text-lg font-semibold text-gray-900'>{totalItems}</span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Sản phẩm hoạt động:</span>
                <span className='text-lg font-semibold text-gray-900'>{activeItemsCount}</span>
              </div>

              {combo.createdAt && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>Ngày tạo:</span>
                  <span className='text-sm text-gray-600'>{combo.createdAt}</span>
                </div>
              )}

              {combo.updatedAt && (
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>Cập nhật lần cuối:</span>
                  <span className='text-sm text-gray-600'>{combo.updatedAt}</span>
                </div>
              )}
            </CardContent>
          </Card>



          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Mô tả
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600'>{combo.description}</p>
            </CardContent>
          </Card>

          {/* Staff Note */}
          {combo.staffNote && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Ghi chú từ staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-600'>{combo.staffNote}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailComboSeller