import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Plus, Edit, Trash2, Eye, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import path from '../../../constants/path'
import { getAllCombos} from '../../../apis/combo.api'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import { useState, useEffect, useCallback } from 'react'
import type { Combo, ComboParams } from '../../../types/combo.type'
import UpdateComboModal from './updateCombo'

function ComboSeller() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [allCombos, setAllCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const pagination =
    allCombos.length > 0
      ? {
        pageNumber: currentPage,
        pageSize: pageSize,
        totalItems: allCombos.length,
        totalPages: Math.ceil(allCombos.length / pageSize)
      }
      : null

  const combos = allCombos.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const fetchCombos = useCallback(async () => {
    if (!user?.userId) {
      setError('Chưa đăng nhập')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First, get the store information using userId
      const storeResponse = await storeApi.getStoreBySellerId(user.userId)

      if (!storeResponse.data?.id) {
        setError('Không tìm thấy thông tin cửa hàng')
        return
      }

      const storeId = storeResponse.data.id

      // Then fetch combos using storeId
      const params: ComboParams = {
        pageSize: 0,
        pageNumber: 1,
        storeId: storeId
      }
      const response = await getAllCombos(params)
      setAllCombos(response)
      setCurrentPage(1)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : ''
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    fetchCombos()
  }, [fetchCombos])

  const handleRefresh = async () => {
    await fetchCombos()
    toast.success('Đã làm mới danh sách combo')
  }

  const handlePreviousPage = () => {
    if (pagination && pagination.pageNumber > 1) {
      setCurrentPage(pagination.pageNumber - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && pagination.pageNumber < pagination.totalPages) {
      setCurrentPage(pagination.pageNumber + 1)
    }
  }

  const handleCreateCombo = () => {
    navigate(`../${path.createComboSeller}`)
  }

  const handleEditCombo = (combo: Combo) => {
    setSelectedCombo(combo)
    setShowUpdateModal(true)
  }

  const handleUpdateSuccess = () => {
    fetchCombos()
  }

  const handleViewCombo = (comboId: string) => {
    navigate(`../${path.detailComboSeller.replace(':id', comboId)}`)
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'Đã xóa',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      }
    }

    switch (status) {
      case 'Draft':
        return {
          text: 'Nháp',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
        }
      case 'Pending':
        return {
          text: 'Chờ duyệt',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
        }
      case 'Processing':
        return {
          text: 'Đang xử lý',
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
        }
      case 'Approved':
        return {
          text: 'Đã duyệt',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
      case 'Rejected':
        return {
          text: 'Bị từ chối',
          className: 'bg-red-100 text-red-800 hover:bg-red-100'
        }
      case 'Active':
        return {
          text: 'Hoạt động',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
      case 'Cancelled':
        return {
          text: 'Đã hủy',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
        }
      default:
        return {
          text: 'Đã duyệt',
          className: 'bg-green-100 text-green-800 hover:bg-green-100'
        }
    }
  }

  const calculateTotalPrice = (comboItems: { finalPrice: number; quantity: number }[]) => {
    return comboItems.reduce((total, item) => total + item.finalPrice * item.quantity, 0)
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Quản lý Combo</h1>
        <div className='flex space-x-2'>
          <Button variant='outline' onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button className='bg-green-600 hover:bg-green-700' onClick={handleCreateCombo}>
            <Plus className='w-4 h-4 mr-2' />
            Thêm Combo mới
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-red-800'>{error}</p>
        </div>
      )}

      {/* Combos Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Combo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex justify-center items-center py-8'>
              <RefreshCw className='w-6 h-6 animate-spin text-green-600' />
              <span className='ml-2 text-gray-600'>Đang tải...</span>
            </div>
          ) : combos.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 mb-4'>Chưa có combo nào</p>
              <Button onClick={handleCreateCombo} className='bg-green-600 hover:bg-green-700'>
                <Plus className='w-4 h-4 mr-2' />
                Tạo combo đầu tiên
              </Button>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b'>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>Tên Combo</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>Mô tả</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>Giá tổng</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>Số items</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>Trạng thái</th>
                    <th className='text-left py-3 px-4 font-medium text-gray-700'>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((combo) => {
                    const statusInfo = getStatusBadge(combo.status, combo.isActive)
                    const totalPrice = calculateTotalPrice(combo.comboItems.filter((item) => item.isActive))
                    const activeItemsCount = combo.comboItems.filter((item) => item.isActive).length

                    return (
                      <tr key={combo.id} className='border-b hover:bg-gray-50'>
                        <td className='py-3 px-4 text-gray-900 font-medium'>{combo.name}</td>
                        <td className='py-3 px-4 text-gray-600 max-w-xs truncate'>
                          {combo.description || 'Không có mô tả'}
                        </td>
                        <td className='py-3 px-4 text-gray-900 font-semibold'>{totalPrice.toLocaleString()}₫</td>
                        <td className='py-3 px-4 text-gray-900'>
                          {activeItemsCount}/{combo.comboItems.length}
                        </td>
                        <td className='py-3 px-4'>
                          <Badge variant='secondary' className={statusInfo.className}>
                            {statusInfo.text}
                          </Badge>
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex space-x-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleViewCombo(combo.id)}
                              title='Xem chi tiết'
                            >
                              <Eye className='w-4 h-4' />
                            </Button>
                            <Button variant='ghost' size='sm' onClick={() => handleEditCombo(combo)} title='Chỉnh sửa'>
                              <Edit className='w-4 h-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              className='text-red-600 hover:text-red-700'
                              title='Xóa combo'
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
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className='flex items-center justify-between mt-6'>
              <div className='text-sm text-gray-700'>
                Hiển thị {(pagination.pageNumber - 1) * pagination.pageSize + 1}-
                {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalItems)} của{' '}
                {pagination.totalItems} combo
              </div>
              <div className='flex space-x-2'>
                <Button variant='outline' size='sm' disabled={pagination.pageNumber === 1} onClick={handlePreviousPage}>
                  Trước
                </Button>
                <Button variant='outline' size='sm' className='bg-green-600 text-white hover:bg-green-700'>
                  {pagination.pageNumber}
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={pagination.pageNumber === pagination.totalPages}
                  onClick={handleNextPage}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Combo Modal */}
      <UpdateComboModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        combo={selectedCombo}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  )
}

export default ComboSeller
