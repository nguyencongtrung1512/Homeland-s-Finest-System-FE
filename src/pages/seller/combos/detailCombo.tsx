import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { ArrowLeft, Package, FileText, Clock, CheckCircle, XCircle, Upload, Edit } from 'lucide-react'
import ThreeDCard from '../../../components/ui/threed-card'
import {
  getComboById,
  submitCombo,
  cancelCombo,
  addItemToCombo,
  updateComboItem,
  removeItemFromCombo,
  updateComboShell
} from '../../../apis/combo.api'
import ComboItemsManager from './ComboItemsManager'
import type {
  Combo,
  CreateComboItemRequest,
  UpdateComboItemRequest,
  UpdateComboRequest
} from '../../../types/combo.type'
import { toast } from '../../../utils/toast'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Save } from 'lucide-react'

function DetailComboSeller() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)
  const [finalPrice, setFinalPrice] = useState<number>(0)
  const [isEditingFinalPrice, setIsEditingFinalPrice] = useState(false)
  const [savingFinalPrice, setSavingFinalPrice] = useState(false)
  const isEditingRef = useRef(false)

  // Gửi duyệt: chỉ khi status là Draft hoặc Rejected (Denied) và có ≥ 2 combo items
  // Combo Dừng hoạt động (isActive = false) vẫn có thể gửi duyệt lại nếu status phù hợp
  const canSubmitStatus = (status: string) => {
    // Cho phép gửi duyệt nếu status là Draft hoặc Rejected, bất kể isActive
    return status === 'Draft' || status === 'Rejected'
  }

  // Hủy: chỉ khi status là Pending hoặc Processing
  const canCancelStatus = (status: string) => status === 'Pending' || status === 'Processing'

  const handleSubmit = async () => {
    if (!combo) return
    try {
      const res = await submitCombo(combo.id)
      if (res.status === 200 || res.status === 201 || res.status === 202) {
        // Cập nhật state ngay từ response nếu có data
        if (res.data) {
          const updatedCombo = res.data as unknown as Combo
          setCombo({
            ...updatedCombo,
            isActive: updatedCombo.isActive ?? true
          })
        }

        // Hiển thị thông báo
        const newStatus = res.data?.status || combo.status
        if (newStatus === 'Pending') {
          toast.success('Đã gửi duyệt. Combo đang chờ Admin phân công.')
        } else if (newStatus === 'Processing') {
          toast.success('Đã gửi duyệt. Combo đang được Staff xử lý.')
        } else {
          toast.success('Đã gửi duyệt combo.')
        }

        // Fetch lại để đảm bảo data mới nhất (không hiển thị loading để tránh giật UI)
        await fetchCombo(false)
      } else {
        toast.error(res.message || 'Gửi duyệt combo thất bại')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gửi duyệt combo thất bại'
      toast.error(msg)
    }
  }

  const handleCancel = async () => {
    if (!combo) return
    try {
      const res = await cancelCombo(combo.id)
      if (res.status === 200 || res.status === 201 || res.status === 202) {
        // Cập nhật state ngay từ response nếu có data
        if (res.data) {
          const updatedCombo = res.data as unknown as Combo
          setCombo({
            ...updatedCombo,
            isActive: updatedCombo.isActive ?? true
          })
        }

        // Hiển thị thông báo
        toast.success('Đã hủy combo thành công.')

        // Fetch lại để đảm bảo data mới nhất (không hiển thị loading để tránh giật UI)
        await fetchCombo(false)
      } else {
        toast.error(res.message || 'Hủy combo thất bại')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Hủy combo thất bại'
      toast.error(msg)
    }
  }

  const fetchCombo = useCallback(
    async (showLoading = true) => {
      if (!id) return

      if (showLoading) {
        setLoading(true)
      }
      try {
        const response = await getComboById(id)
        if (response.data) {
          const comboData = response.data
          setCombo(comboData)
          // Chỉ cập nhật finalPrice nếu không đang edit
          if (!isEditingRef.current) {
            setFinalPrice(comboData.totalFinalPrice || 0)
          }
        } else {
          setCombo(null)
        }
      } catch (error) {
        console.error('Error fetching combo:', error)
        setCombo(null)
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [id]
  )

  // Cập nhật finalPrice khi combo data được load lần đầu
  useEffect(() => {
    if (combo?.totalFinalPrice !== undefined && finalPrice === 0 && !isEditingRef.current) {
      setFinalPrice(combo.totalFinalPrice || 0)
    }
  }, [combo?.totalFinalPrice, finalPrice])

  const handleUpdateFinalPrice = async () => {
    if (!combo) return

    if (finalPrice < 0) {
      toast.error('Giá bán không được âm')
      return
    }

    setSavingFinalPrice(true)
    try {
      const updateData: UpdateComboRequest = {
        name: combo.name,
        description: combo.description || '',
        isActive: combo.isActive,
        finalPrice: finalPrice
      }

      const response = await updateComboShell(combo.id, updateData)

      if (response && (response.status === 200 || response.status === 202)) {
        // Cập nhật state local thay vì fetch lại toàn bộ
        if (response.data) {
          const updatedCombo = response.data as unknown as Combo
          setCombo({
            ...updatedCombo,
            isActive: updatedCombo.isActive ?? combo.isActive
          })
          // Cập nhật finalPrice từ response
          if (!isEditingRef.current) {
            setFinalPrice(updatedCombo.totalFinalPrice || 0)
          }
        } else {
          // Nếu response không có data, chỉ cập nhật totalFinalPrice trong state hiện tại
          setCombo({
            ...combo,
            totalFinalPrice: finalPrice
          })
        }

        toast.success('Cập nhật giá combo thành công')
        isEditingRef.current = false
        setIsEditingFinalPrice(false)
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật giá combo')
      }
    } catch (error) {
      let errorMessage = 'Có lỗi xảy ra khi cập nhật giá combo'

      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as { message?: string }).message || errorMessage
      }

      toast.error(errorMessage)
    } finally {
      setSavingFinalPrice(false)
    }
  }

  const handleAddItem = async (itemData: CreateComboItemRequest) => {
    if (!combo) return

    try {
      const response = await addItemToCombo(combo.id, itemData)

      // Axios interceptor trả về response.data, nên response đã là { status, message, data }
      if (response && (response.status === 200 || response.status === 201)) {
        // Cập nhật combo state nếu có data
        if (response.data) {
          setCombo({
            ...(response.data as unknown as Combo),
            isActive: (response.data as unknown as Combo).isActive ?? true
          })
        }

        // Toast đã được hiển thị trong ComboItemsManager
        // Chỉ hiển thị toast info nếu combo chuyển sang Pending
        if (response.data && (response.data as unknown as Combo).status === 'Pending') {
          toast.info('Combo đã được gửi duyệt do có đủ 2 sản phẩm')
        }

        // Refresh combo data
        await fetchCombo()
      } else {
        // Response không có status hợp lệ
        toast.success('Thêm sản phẩm vào combo thành công')
        await fetchCombo()
      }
    } catch (error) {
      let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm'

      if (error && typeof error === 'object' && 'message' in error) {
        // Error từ axios interceptor đã là error.response.data
        errorMessage = (error as { message?: string }).message || errorMessage
      }

      toast.error(errorMessage)
      throw error
    }
  }

  const handleUpdateItem = async (itemId: string, itemData: UpdateComboItemRequest) => {
    if (!combo) return

    try {
      const response = await updateComboItem(combo.id, itemId, itemData)

      if (response) {
        setCombo({
          ...(response.data as unknown as Combo),
          isActive: (response.data as unknown as Combo).isActive ?? true
        })
        toast.success('Cập nhật sản phẩm thành công')

        if ((response.data as unknown as Combo).status === 'Pending') {
          toast.info('Combo đã được gửi duyệt do có thay đổi')
        } else if ((response.data as unknown as Combo).status === 'Draft') {
          toast.info('Combo đã chuyển về trạng thái nháp')
        }

        await fetchCombo()
      }
    } catch (error) {
      console.error('Error updating item:', error)

      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm'

      if (error && typeof error === 'object') {
        if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string }

          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          } else if (axiosError.message) {
            errorMessage = axiosError.message
          }
        } else if ('message' in error) {
          errorMessage = (error as Error).message
        }
      }

      toast.error(errorMessage)
      throw error
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!combo) return

    const itemToRemove = combo.comboItems.find((item) => item.id === itemId)
    if (!itemToRemove) {
      toast.error('Không tìm thấy sản phẩm cần xóa')
      return
    }

    try {
      const itemData: UpdateComboItemRequest = {
        productVariantId: itemToRemove.productVariantId,
        quantity: itemToRemove.quantity,
        isActive: false
      }
      const response = await removeItemFromCombo(combo.id, itemId, itemData)

      if (response) {
        setCombo({
          ...(response.data as unknown as Combo),
          isActive: (response.data as unknown as Combo).isActive ?? true
        })
        toast.success('Xóa sản phẩm khỏi combo thành công')

        if ((response.data as unknown as Combo).status === 'Draft') {
          toast.info('Combo đã chuyển về trạng thái nháp do số lượng sản phẩm < 2')
        }

        await fetchCombo()
      }
    } catch (error) {
      console.error('Error removing item:', error)

      let errorMessage = 'Có lỗi xảy ra khi xóa sản phẩm'

      if (error && typeof error === 'object') {
        if ('response' in error) {
          const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string }

          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          } else if (axiosError.message) {
            errorMessage = axiosError.message
          }
        } else if ('message' in error) {
          errorMessage = (error as Error).message
        }
      }

      toast.error(errorMessage)
      throw error
    }
  }

  useEffect(() => {
    fetchCombo()
  }, [fetchCombo])

  const handleBack = () => {
    navigate('/seller/combo-management')
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'Dừng hoạt động',
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
      case 'Processing':
        return {
          text: 'Đang xử lý',
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
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
      case 'Cancelled':
        return {
          text: 'Đã hủy',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
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

  const getStatusMessage = (status: string, isActive: boolean) => {
    if (!isActive) {
      // Combo Dừng hoạt động nhưng vẫn có thể gửi duyệt lại nếu status là Draft hoặc Rejected
      if (status === 'Draft' || status === 'Rejected') {
        return {
          message: 'Combo đã bị xóa. Bạn có thể chỉnh sửa và gửi duyệt lại khi đã có ít nhất 2 sản phẩm.',
          className: 'text-orange-600 bg-orange-50'
        }
      }
      return {
        message: 'Combo đã dừng hoạt động và không thể sử dụng',
        className: 'text-gray-600 bg-gray-50'
      }
    }

    switch (status) {
      case 'Draft':
        // Thông báo sẽ được cập nhật động dựa trên số lượng items
        return {
          message: '', // Sẽ được cập nhật bên dưới
          className: 'text-blue-600 bg-blue-50'
        }
      case 'Pending':
        return {
          message: 'Combo đang chờ Admin phân công Staff xử lý. Bạn không thể chỉnh sửa lúc này.',
          className: 'text-yellow-600 bg-yellow-50'
        }
      case 'Processing':
        return {
          message: 'Combo đang được Staff xử lý. Bạn không thể chỉnh sửa lúc này.',
          className: 'text-orange-600 bg-orange-50'
        }
      case 'Approved':
        return {
          message: 'Combo đã được duyệt và đang hoạt động.',
          className: 'text-green-600 bg-green-50'
        }
      case 'Rejected':
        return {
          message: 'Combo đã bị từ chối và không thể sử dụng nữa.',
          className: 'text-red-600 bg-red-50'
        }
      case 'Cancelled':
        return {
          message: 'Combo đã bị hủy. Bạn có thể chỉnh sửa và gửi duyệt lại.',
          className: 'text-gray-600 bg-gray-50'
        }
      default:
        return {
          message: 'Trạng thái combo không xác định',
          className: 'text-gray-600 bg-gray-50'
        }
    }
  }

  const calculateTotalPrice = () => {
    if (!combo) return 0
    return combo.comboItems.reduce((total, item) => total + item.basePrice * item.quantity, 0)
  }

  const calculateTotalItems = () => {
    if (!combo) return 0
    return combo.comboItems.filter((item) => item.isActive).reduce((total, item) => total + item.quantity, 0)
  }

  const calculateActiveItemsCount = () => {
    if (!combo) return 0
    return combo.comboItems.filter((item) => item.isActive).length
  }

  // Cho phép edit khi ở trạng thái Draft, bất kể isActive
  // Combo Dừng hoạt động (isActive = false) vẫn có thể edit nếu status là Draft
  const canEdit = combo?.status === 'Draft'

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
  const baseStatusMessage = getStatusMessage(combo.status, combo.isActive)
  const totalPrice = calculateTotalPrice()
  const totalItems = calculateTotalItems()
  const activeItemsCount = calculateActiveItemsCount()

  // Cập nhật thông báo cho Draft dựa trên số lượng items
  const statusMessage =
    combo.status === 'Draft' && combo.isActive
      ? {
        message:
          activeItemsCount >= 2
            ? 'Combo đang ở trạng thái nháp. Bạn có thể chỉnh sửa và gửi duyệt combo.'
            : `Combo đang ở trạng thái nháp. Cần thêm ${2 - activeItemsCount} sản phẩm nữa để có thể gửi duyệt (yêu cầu tối thiểu 2 sản phẩm).`,
        className: activeItemsCount >= 2 ? 'text-blue-600 bg-blue-50' : 'text-orange-600 bg-orange-50'
      }
      : baseStatusMessage

  return (
    <motion.div
      className='p-6'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div
        className='flex items-center justify-between mb-6'
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={handleBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
          <h3 className='text-2xl font-semibold text-gray-900'>Combo: {combo.name}</h3>
        </div>
        <Badge variant='secondary' className={statusInfo.className}>
          {statusInfo.icon}
          <span className='ml-1'>{statusInfo.text}</span>
        </Badge>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className='mb-6'
      >
        <Card className='border-0 shadow-sm p-2'>
          <CardHeader>
            <CardTitle>Hành động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {/* Thông báo trạng thái - luôn hiển thị */}
              <motion.div
                className={`text-sm px-4 py-2 rounded-md ${statusMessage.className}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {statusMessage.message}
              </motion.div>

              {/* Các nút hành động */}
              <div className='flex items-center gap-4'>
                {/* Button Gửi duyệt: chỉ hiển thị khi Draft hoặc Rejected */}
                {/* Button sẽ bị disable nếu chưa đủ 2 items active */}
                {canSubmitStatus(combo.status) && (
                  <Button
                    onClick={handleSubmit}
                    variant='outline'
                    className='border-green-600 text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    disabled={activeItemsCount < 2}
                    title={
                      activeItemsCount >= 2
                        ? 'Gửi duyệt combo'
                        : `Cần có ít nhất 2 sản phẩm active để gửi duyệt. Hiện tại có ${activeItemsCount} sản phẩm.`
                    }
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    Gửi duyệt
                    {activeItemsCount < 2 && <span className='ml-2 text-xs'>({activeItemsCount}/2)</span>}
                  </Button>
                )}

                {/* Button Hủy: chỉ hiển thị khi Pending hoặc Processing */}
                {canCancelStatus(combo.status) && (
                  <Button
                    onClick={handleCancel}
                    variant='outline'
                    className='border-orange-600 text-orange-700 hover:bg-orange-50'
                    title='Hủy combo'
                  >
                    <XCircle className='w-4 h-4 mr-2' />
                    Hủy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div
        className='grid grid-cols-1 lg:grid-cols-3 gap-6'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Combo Image with 3D Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className='flex justify-center'
          >
            {combo.thumbnailUrl ? (
              <ThreeDCard
                className='w-full max-w-2xl'
                backgroundImage={combo.thumbnailUrl}
                maxRotation={8}
                glowOpacity={0.3}
                enableGlow={true}
                enableShadow={true}
                enableParallax={true}
              >
                <div className='w-full h-96 flex items-center justify-center relative z-10'>
                  <img src={combo.thumbnailUrl} alt={combo.name} className='w-full h-full object-contain rounded-lg' />
                </div>
              </ThreeDCard>
            ) : (
              <ThreeDCard
                className='w-full max-w-2xl'
                backgroundImage={null}
                maxRotation={8}
                glowOpacity={0.2}
                enableGlow={false}
                enableShadow={true}
                enableParallax={true}
              >
                <div className='w-full h-64 flex flex-col items-center justify-center text-white relative z-10'>
                  <Package className='w-16 h-16 mb-2 opacity-80' />
                  <p className='text-sm opacity-70'>Chưa có ảnh combo</p>
                </div>
              </ThreeDCard>
            )}
          </motion.div>

          {/* Combo Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <ComboItemsManager
              items={combo.comboItems}
              canEdit={canEdit}
              comboStatus={combo.status}
              onAddItem={handleAddItem}
              onUpdateItem={handleUpdateItem}
              onRemoveItem={handleRemoveItem}
            />
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div
          className='space-y-6'
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Status & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
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

                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>Tổng giá gốc:</span>
                    <span className='text-lg font-semibold text-gray-600'>{totalPrice.toLocaleString()}₫</span>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between min-h-[40px]'>
                      <Label htmlFor='finalPrice' className='text-sm font-medium text-gray-700 flex-shrink-0'>
                        Giá Bán:
                      </Label>
                      <div className='flex items-center gap-2 flex-1 justify-end'>
                        {isEditingFinalPrice ? (
                          <>
                            <Input
                              id='finalPrice'
                              value={finalPrice}
                              onChange={(e) => setFinalPrice(Number(e.target.value))}
                              className='w-32 h-8'
                              min='0'
                              disabled={savingFinalPrice || !canEdit}
                              autoFocus
                            />
                            <Button
                              size='sm'
                              onClick={handleUpdateFinalPrice}
                              disabled={savingFinalPrice || !canEdit}
                              className='bg-green-600 hover:bg-green-700 h-8 flex-shrink-0'
                            >
                              <Save className='w-3 h-3 mr-1' />
                              Lưu
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => {
                                isEditingRef.current = false
                                setIsEditingFinalPrice(false)
                                setFinalPrice(combo.totalFinalPrice || 0)
                              }}
                              disabled={savingFinalPrice}
                              className='h-8 flex-shrink-0'
                            >
                              Hủy
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className='text-lg font-semibold text-green-600 min-w-[100px] text-right'>
                              {combo.totalFinalPrice.toLocaleString()}₫
                            </span>
                            {canEdit && (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  isEditingRef.current = true
                                  setIsEditingFinalPrice(true)
                                  setFinalPrice(combo.totalFinalPrice || 0)
                                }}
                                className='h-6 px-2 flex-shrink-0'
                                type='button'
                              >
                                <Edit className='w-3 h-3' />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>Tổng số lượng:</span>
                  <span className='text-lg font-semibold text-gray-900'>{totalItems}</span>
                </div>

                {combo.availableQuantity !== undefined && (
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>Số lượng khả dụng:</span>
                    <span className='text-lg font-semibold text-blue-600'>{combo.availableQuantity}</span>
                  </div>
                )}

                {/* <div className='flex items-center justify-between'>
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
                )} */}
              </CardContent>
            </Card>
          </motion.div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
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
          </motion.div>

          {/* Staff Note */}
          {/* {combo.staffNote && (
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
          )} */}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default DetailComboSeller
