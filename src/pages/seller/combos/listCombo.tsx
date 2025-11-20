import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Plus, Edit, Eye, RefreshCw, PauseCircle, PlayCircle } from 'lucide-react'
import { toast } from '../../../utils/toast'
import path from '../../../constants/path'
import { getAllCombos, updateComboShell } from '../../../apis/combo.api'
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
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Combo, ComboParams } from '../../../types/combo.type'
import UpdateComboModal from './updateCombo'
import Pagination from '../../../components/Pagination/Pagination'

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
  const [comboToToggle, setComboToToggle] = useState<Combo | null>(null)
  const [showToggleDialog, setShowToggleDialog] = useState(false)
  const [toggling, setToggling] = useState(false)

  const pagination = useMemo(() => {
    if (allCombos.length === 0) return null
    return {
      pageNumber: currentPage,
      pageSize: pageSize,
      totalItems: allCombos.length,
      totalPages: Math.ceil(allCombos.length / pageSize)
    }
  }, [allCombos.length, currentPage, pageSize])

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

  const handlePageChange = (page: number) => {
    if (!pagination) return
    const clampedPage = Math.min(Math.max(page, 1), pagination.totalPages)
    setCurrentPage(clampedPage)
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

  const handleToggleActive = (combo: Combo) => {
    setComboToToggle(combo)
    setShowToggleDialog(true)
  }

  const confirmToggleActive = async () => {
    if (!comboToToggle) return

    setToggling(true)
    try {
      // Chỉ cập nhật isActive, giữ nguyên các field khác
      const updateData = {
        name: comboToToggle.name,
        description: comboToToggle.description || '',
        isActive: !comboToToggle.isActive
      }

      const response = await updateComboShell(comboToToggle.id, updateData)

      if (response && (response.status === 200 || response.status === 201 || response.status === 202)) {
        toast.success(
          comboToToggle.isActive
            ? 'Đã dừng hoạt động combo. Combo sẽ không được bán cho đến khi được mở lại.'
            : 'Đã kích hoạt combo. Combo có thể được bán trở lại.'
        )
        await fetchCombos()
        setShowToggleDialog(false)
        setComboToToggle(null)
      } else {
        toast.error(response?.message || 'Có lỗi xảy ra khi cập nhật trạng thái combo')
      }
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : 'Có lỗi xảy ra khi cập nhật trạng thái combo'
      toast.error(errorMessage)
    } finally {
      setToggling(false)
    }
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'Dừng hoạt động',
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
                              className={
                                combo.isActive
                                  ? 'text-red-600 hover:text-red-700'
                                  : 'text-green-600 hover:text-green-700'
                              }
                              onClick={() => handleToggleActive(combo)}
                              title={combo.isActive ? 'Dừng hoạt động' : 'Kích hoạt'}
                              disabled={toggling}
                            >
                              {combo.isActive ? (
                                <PauseCircle className='w-4 h-4' />
                              ) : (
                                <PlayCircle className='w-4 h-4' />
                              )}
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
            <div className='flex flex-col gap-4 mt-6 lg:flex-row lg:items-center lg:justify-between'>
              <div className='text-sm text-gray-700'>
                Hiển thị {(pagination.pageNumber - 1) * pagination.pageSize + 1} -{' '}
                {Math.min(pagination.pageNumber * pagination.pageSize, pagination.totalItems)} trong tổng số{' '}
                {pagination.totalItems} combo
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

      {/* Update Combo Modal */}
      <UpdateComboModal
        open={showUpdateModal}
        onOpenChange={setShowUpdateModal}
        combo={selectedCombo}
        onSuccess={handleUpdateSuccess}
      />

      {/* Toggle Active Confirmation Dialog */}
      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {comboToToggle?.isActive ? 'Xác nhận dừng hoạt động combo' : 'Xác nhận kích hoạt combo'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {comboToToggle?.isActive ? (
                <>
                  Combo <strong>{comboToToggle.name}</strong> sẽ bị dừng hoạt động.
                  <br />
                  <br />
                  Combo sẽ <strong>không được bán</strong> cho đến khi bạn mở lại.
                  <br />
                  Bạn có chắc chắn muốn dừng hoạt động combo này?
                </>
              ) : (
                <>
                  Combo <strong>{comboToToggle?.name}</strong> sẽ được kích hoạt trở lại.
                  <br />
                  <br />
                  Combo sẽ <strong>có thể được bán</strong> sau khi được kích hoạt.
                  <br />
                  Bạn có chắc chắn muốn kích hoạt combo này?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling} onClick={() => setComboToToggle(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleActive}
              disabled={toggling}
              className={comboToToggle?.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {toggling ? 'Đang xử lý...' : comboToToggle?.isActive ? 'Dừng hoạt động' : 'Kích hoạt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ComboSeller
