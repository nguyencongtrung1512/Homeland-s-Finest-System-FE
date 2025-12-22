import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { ArrowLeft, Package, FileText, Clock, CheckCircle, XCircle, Upload, Edit, AlertCircle, Check, X } from 'lucide-react'
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
import { Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../components/ui/dialog'

const formatWithDots = (digits: string) => {
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function DetailComboSeller() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)
  const [finalPrice, setFinalPrice] = useState<number>(0)
  const [finalPriceInput, setFinalPriceInput] = useState<string>('')
  const [finalPriceRaw, setFinalPriceRaw] = useState<string>('')
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [priceInputMode, setPriceInputMode] = useState<'direct' | 'percent'>('direct')
  const [isEditingFinalPrice, setIsEditingFinalPrice] = useState(false)
  const [savingFinalPrice, setSavingFinalPrice] = useState(false)
  const isEditingRef = useRef(false)
  const finalPriceInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmModalType, setConfirmModalType] = useState<'inactive' | 'approved-inactive'>('inactive')

  // Gửi duyệt: chỉ khi status là Draft, Rejected (Denied), hoặc Cancelled và có ≥ 2 combo items
  // Combo Dừng hoạt động (isActive = false) vẫn có thể gửi duyệt lại nếu status phù hợp
  const canSubmitStatus = (status: string) => {
    // Cho phép gửi duyệt nếu status là Draft, Rejected, hoặc Cancelled, bất kể isActive
    return status === 'Draft' || status === 'Rejected' || status === 'Cancelled' || status === 'Denied'
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
          toast.success('Đã gửi duyệt. Combo đang chờ nhân viên phân công.')
        } else if (newStatus === 'Processing') {
          toast.success('Đã gửi duyệt. Combo đang được nhân viên xử lý.')
        } else {
          toast.success('Đã gửi duyệt combo.')
        }

        // Fetch lại để đảm bảo data mới nhất (không hiển thị loading để tránh giật UI)
        await fetchCombo(false)
      } else {
        toast.error(res.message || 'Gửi duyệt combo thất bại')
      }
    } catch (e: unknown) {
      // Lấy thông báo lỗi từ backend response
      let errorMessage = 'Gửi duyệt combo thất bại'
      if (e && typeof e === 'object') {
        // Error từ axios interceptor có dạng { status, message, data }
        if ('message' in e && typeof e.message === 'string') {
          errorMessage = e.message
        } else if ('response' in e) {
          // Fallback cho axios error structure
          const axiosError = e as { response?: { data?: { message?: string } } }
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          }
        }
      }
      toast.error(errorMessage)
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
      // Lấy thông báo lỗi từ backend response
      let errorMessage = 'Hủy combo thất bại'
      if (e && typeof e === 'object') {
        // Error từ axios interceptor có dạng { status, message, data }
        if ('message' in e && typeof e.message === 'string') {
          errorMessage = e.message
        } else if ('response' in e) {
          // Fallback cho axios error structure
          const axiosError = e as { response?: { data?: { message?: string } } }
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          }
        }
      }
      toast.error(errorMessage)
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

  // Cập nhật finalPrice và tính discountPercent khi combo data được load lần đầu
  useEffect(() => {
    if (combo?.totalFinalPrice !== undefined && combo?.totalBasePrice && finalPrice === 0 && !isEditingRef.current) {
      const price = combo.totalFinalPrice || 0
      const digits = price.toString()
      setFinalPrice(price)
      setFinalPriceRaw(digits)
      setFinalPriceInput(formatWithDots(digits))
      // Tính discountPercent từ finalPrice và totalBasePrice
      if (combo.totalBasePrice > 0) {
        const calculatedDiscount = ((combo.totalBasePrice - price) / combo.totalBasePrice) * 100
        setDiscountPercent(Math.round(calculatedDiscount * 100) / 100) // Làm tròn 2 chữ số thập phân
      }
    }
  }, [combo?.totalFinalPrice, combo?.totalBasePrice, finalPrice])

  // Check if price has changed
  const hasPriceChanges = (): boolean => {
    if (!combo) return false

    // Check if FinalPrice changed
    if (priceInputMode === 'direct' && finalPrice !== combo.totalFinalPrice) {
      return true
    }

    // Check if DiscountPercent changed
    if (priceInputMode === 'percent') {
      const currentDiscount =
        combo.totalBasePrice > 0
          ? ((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100
          : 0
      if (Math.abs(discountPercent - currentDiscount) > 0.01) {
        return true
      }
    }

    return false
  }

  // Execute save final price (actual API call)
  const executeUpdateFinalPrice = async () => {
    if (!combo) return

    setSavingFinalPrice(true)
    try {
      const updateData: UpdateComboRequest = {
        name: combo.name,
        description: combo.description || '',
        isActive: combo.isActive
      }

      // Chỉ gửi một trong hai: finalPrice HOẶC discountPercent
      if (priceInputMode === 'percent') {
        // Nếu nhập theo phần trăm, chỉ gửi discountPercent
        updateData.discountPercent = discountPercent
      } else {
        // Nếu nhập giá trực tiếp, chỉ gửi finalPrice
        updateData.finalPrice = finalPrice
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
          // Cập nhật finalPrice và discountPercent từ response
          if (!isEditingRef.current) {
            setFinalPrice(updatedCombo.totalFinalPrice || 0)
            if (updatedCombo.totalBasePrice > 0) {
              const calculatedDiscount =
                ((updatedCombo.totalBasePrice - updatedCombo.totalFinalPrice) / updatedCombo.totalBasePrice) * 100
              setDiscountPercent(Math.round(calculatedDiscount * 100) / 100)
            }
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
        setPriceInputMode('direct')
      } else {
        toast.error('Có lỗi xảy ra khi cập nhật giá combo')
      }
    } catch (error) {
      // Lấy thông báo lỗi từ backend response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật giá combo'
      if (error && typeof error === 'object') {
        // Error từ axios interceptor có dạng { status, message, data }
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('response' in error) {
          // Fallback cho axios error structure
          const axiosError = error as { response?: { data?: { message?: string } } }
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          }
        }
      }

      toast.error(errorMessage)
    } finally {
      setSavingFinalPrice(false)
    }
  }

  // Handle confirmation modal actions for price update
  const handleConfirmPriceUpdate = async () => {
    setShowConfirmModal(false)
    await executeUpdateFinalPrice()
    // Fetch lại combo để cập nhật status mới sau khi backend xử lý
    await fetchCombo(false)
  }

  const handleCancelPriceConfirm = () => {
    setShowConfirmModal(false)
    setConfirmModalType('inactive')
  }

  const handleUpdateFinalPrice = async () => {
    if (!combo) return

    // Validate dựa trên mode
    if (priceInputMode === 'direct') {
      if (finalPrice < 0) {
        toast.error('Giá bán không được âm')
        return
      }
      if (finalPrice > combo.totalBasePrice) {
        toast.error('Giá bán không được lớn hơn giá gốc')
        return
      }
    } else {
      if (discountPercent < 0 || discountPercent > 100) {
        toast.error('Phần trăm giảm giá phải từ 0 đến 100')
        return
      }
    }

    // Check if combo is Approved but inactive - need special warning
    if (combo.status === 'Approved' && combo.isActive === false && hasPriceChanges()) {
      setConfirmModalType('approved-inactive')
      setShowConfirmModal(true)
      return
    }

    // Only show confirmation modal if combo is inactive (tạm dừng) and has price changes
    if (combo.isActive === false && hasPriceChanges()) {
      setConfirmModalType('inactive')
      setShowConfirmModal(true)
      return
    }

    // Direct save for active combo or when no changes
    await executeUpdateFinalPrice()
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
      // Lấy thông báo lỗi từ backend response
      let errorMessage = 'Có lỗi xảy ra khi thêm sản phẩm'
      if (error && typeof error === 'object') {
        // Error từ axios interceptor có dạng { status, message, data }
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('response' in error) {
          // Fallback cho axios error structure
          const axiosError = error as { response?: { data?: { message?: string } } }
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          }
        }
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

      // Lấy thông báo lỗi từ backend response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm'
      if (error && typeof error === 'object') {
        // Error từ axios interceptor có dạng { status, message, data }
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('response' in error) {
          // Fallback cho axios error structure
          const axiosError = error as { response?: { data?: { message?: string; error?: string } } }
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          }
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

      // Lấy thông báo lỗi từ backend response
      let errorMessage = 'Có lỗi xảy ra khi xóa sản phẩm'
      if (error && typeof error === 'object') {
        // Error từ axios interceptor có dạng { status, message, data }
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message
        } else if ('response' in error) {
          // Fallback cho axios error structure
          const axiosError = error as { response?: { data?: { message?: string; error?: string } } }
          if (axiosError.response?.data?.message) {
            errorMessage = axiosError.response.data.message
          } else if (axiosError.response?.data?.error) {
            errorMessage = axiosError.response.data.error
          }
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
          text: 'Đang xử lý',
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
          icon: <Clock className='w-4 h-4' />
        }
      case 'Cancelled':
        return {
          text: 'Đã hủy',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
          icon: <XCircle className='w-4 h-4' />
        }
      case 'Denied':
        return {
          text: 'Bị từ chối',
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
          icon: <XCircle className='w-4 h-4' />
        }
      case 'Confirmed':
        return {
          text: 'Đã xác nhận',
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
          icon: <CheckCircle className='w-4 h-4' />
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
      // Combo Dừng hoạt động nhưng vẫn có thể gửi duyệt lại nếu status là Draft, Cancelled, Denied, hoặc Approved
      if (status === 'Draft' || status === 'Cancelled' || status === 'Denied') {
        return {
          message: 'Combo đã bị xóa. Bạn có thể chỉnh sửa và gửi duyệt lại khi đã có ít nhất 2 sản phẩm.',
          className: 'text-orange-600 bg-orange-50'
        }
      }
      // Approved nhưng isActive = false: có thể chỉnh sửa và gửi duyệt lại
      if (status === 'Approved') {
        return {
          message: 'Combo đã dừng hoạt động nhưng bạn có thể chỉnh sửa và gửi duyệt lại.',
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
          message: 'Combo đang chờ nhân viên xử lý. Bạn không thể chỉnh sửa lúc này.',
          className: 'text-yellow-600 bg-yellow-50'
        }
      case 'Processing':
        return {
          message: 'Combo đang được nhân viên xử lý. Bạn không thể chỉnh sửa lúc này.',
          className: 'text-orange-600 bg-orange-50'
        }
      case 'Approved':
        return {
          message: 'Combo đã được duyệt và đang hoạt động.',
          className: 'text-green-600 bg-green-50'
        }
      case 'Rejected':
        return {
          message: 'Combo đang xử lý và không thể chỉnh sửa',
          className: 'text-orange-600 bg-orange-50'
        }
      case 'Cancelled':
        return {
          message: 'Combo đã bị hủy. Bạn có thể chỉnh sửa và gửi duyệt lại.',
          className: 'text-gray-600 bg-gray-50'
        }
      case 'Denied':
        return {
          message: 'Combo đã bị từ chối. Bạn có thể chỉnh sửa và gửi duyệt lại.',
          className: 'text-red-600 bg-red-50'
        }
      case 'Confirmed':
        return {
          message: 'Combo đang xử lý và không thể chỉnh sửa',
          className: 'text-orange-600 bg-orange-50'
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

  // Cho phép edit khi ở trạng thái Draft, Pending, Cancelled, hoặc Denied, bất kể isActive
  // Approved với isActive = false cũng có thể chỉnh sửa
  // Processing, Approved (với isActive = true), Rejected, Confirmed không thể chỉnh sửa
  // Combo Dừng hoạt động (isActive = false) vẫn có thể edit nếu status phù hợp
  const canEdit =
    combo?.status === 'Draft' ||
    combo?.status === 'Pending' ||
    combo?.status === 'Cancelled' ||
    combo?.status === 'Denied' ||
    (combo?.status === 'Approved' && combo?.isActive === false)

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
                {/* Button Gửi duyệt: chỉ hiển thị khi Draft, Rejected, hoặc Cancelled */}
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
                <CardTitle className='py-2'>Thông tin combo</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Status Row */}
                <div className='grid grid-cols-2 gap-x-4 items-center'>
                  <span className='text-sm font-medium text-gray-700'>Trạng thái:</span>
                  <div className='flex justify-end'>
                    <Badge variant='secondary' className={statusInfo.className}>
                      {statusInfo.text}
                    </Badge>
                  </div>
                </div>

                {/* Original Price Row */}
                <div className='grid grid-cols-2 gap-x-4 items-center'>
                  <span className='text-sm font-medium text-gray-700'>Tổng giá gốc:</span>
                  <span className='text-lg font-semibold text-gray-600 text-right'>
                    {totalPrice.toLocaleString('vi-VN')}₫
                  </span>
                </div>

                {/* Selling Price Block - Blue Background */}
                <div className='bg-blue-50 rounded-lg p-4 relative'>
                  <div className='flex items-start justify-between mb-2'>
                    <span className='text-sm font-medium text-gray-700'>Giá Bán:</span>
                    {!isEditingFinalPrice && canEdit && (
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          isEditingRef.current = true
                          setIsEditingFinalPrice(true)
                          setFinalPrice(combo.totalFinalPrice || 0)
                          if (combo.totalBasePrice > 0) {
                            const calculatedDiscount =
                              ((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100
                            setDiscountPercent(Math.round(calculatedDiscount * 100) / 100)
                          }
                          setPriceInputMode('direct')
                        }}
                        className='h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100'
                        type='button'
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                    )}
                  </div>

                  {isEditingFinalPrice ? (
                    <div className='space-y-3'>
                      {/* Mode Selection Buttons */}
                      <div className='flex items-center gap-2'>
                        <Button
                          type='button'
                          size='sm'
                          variant={priceInputMode === 'direct' ? 'ghost' : 'outline'}
                          onClick={() => {
                            setPriceInputMode('direct')
                            const price = combo.totalFinalPrice || 0
                            const digits = price.toString()
                            setFinalPrice(price)
                            setFinalPriceRaw(digits)
                            setFinalPriceInput(formatWithDots(digits))
                          }}
                          className={`h-7 text-xs px-3 ${priceInputMode === 'direct'
                            ? 'bg-gray-100 hover:bg-gray-200 text-white'
                            : 'bg-white border-gray-300'
                            }`}
                        >
                          Nhập giá
                        </Button>
                        <Button
                          type='button'
                          size='sm'
                          variant={priceInputMode === 'percent' ? 'ghost' : 'outline'}
                          onClick={() => {
                            setPriceInputMode('percent')
                            if (combo.totalBasePrice > 0) {
                              const calculatedDiscount =
                                ((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100
                              setDiscountPercent(Math.round(calculatedDiscount * 100) / 100)
                              const price = combo.totalFinalPrice || 0
                              const digits = price.toString()
                              setFinalPrice(price)
                              setFinalPriceRaw(digits)
                              setFinalPriceInput(formatWithDots(digits))
                            }
                          }}
                          className={`h-7 text-xs px-3 ${priceInputMode === 'percent'
                            ? 'bg-gray-100 hover:bg-gray-200 text-white'
                            : 'bg-white border-gray-300'
                            }`}
                        >
                          Nhập phần trăm
                        </Button>
                      </div>

                      {/* Input Section */}
                      <div className='flex items-center gap-2'>
                        {priceInputMode === 'direct' ? (
                          <>
                            <Input
                              id='finalPrice'
                              type='text'
                              inputMode='numeric'
                              ref={finalPriceInputRef}
                              value={finalPriceInput}
                              onChange={(e) => {
                                const input = e.target
                                const selectionStart = input.selectionStart ?? 0
                                const rawBeforeCaret = input.value.slice(0, selectionStart).replace(/\D/g, '')
                                const rawAll = input.value.replace(/\D/g, '')

                                setFinalPriceRaw(rawAll)
                                const value = rawAll ? Number(rawAll) : 0
                                setFinalPrice(value)
                                const formatted = formatWithDots(rawAll)
                                setFinalPriceInput(formatted)

                                requestAnimationFrame(() => {
                                  const el = finalPriceInputRef.current
                                  if (!el) return
                                  let digitsSeen = 0
                                  let pos = 0
                                  while (pos < formatted.length && digitsSeen < rawBeforeCaret.length) {
                                    if (/\d/.test(formatted[pos])) digitsSeen++
                                    pos++
                                  }
                                  el.selectionStart = el.selectionEnd = pos
                                })

                                if (combo.totalBasePrice > 0 && value >= 0) {
                                  const calculatedDiscount =
                                    ((combo.totalBasePrice - value) / combo.totalBasePrice) * 100
                                  setDiscountPercent(Math.round(calculatedDiscount * 100) / 100)
                                }
                              }}
                              onBlur={() => setFinalPriceInput(formatWithDots(finalPriceRaw))}
                              onFocus={() => {
                                const digits = finalPriceRaw || finalPrice.toString()
                                const formatted = formatWithDots(digits)
                                setFinalPriceInput(formatted)
                                requestAnimationFrame(() => {
                                  const el = finalPriceInputRef.current
                                  if (!el) return
                                  el.selectionStart = el.selectionEnd = el.value.length
                                })
                              }}
                              className='w-32 h-9 text-right text-sm bg-white'
                              disabled={savingFinalPrice || !canEdit}
                              autoFocus
                            />
                            <span className='text-sm text-gray-600 font-medium'>₫</span>
                          </>
                        ) : (
                          <>
                            <Input
                              id='discountPercent'
                              type='number'
                              value={discountPercent}
                              onChange={(e) => {
                                const value = Number(e.target.value)
                                if (value >= 0 && value <= 100) {
                                  setDiscountPercent(value)
                                  if (combo.totalBasePrice > 0) {
                                    const calculatedPrice = combo.totalBasePrice * (1 - value / 100)
                                    const price = Math.round(calculatedPrice)
                                    const digits = price.toString()
                                    setFinalPrice(price)
                                    setFinalPriceRaw(digits)
                                    setFinalPriceInput(formatWithDots(digits))
                                  }
                                }
                              }}
                              className='w-20 h-9 text-right text-sm bg-white'
                              min='0'
                              max='100'
                              step='0.01'
                              disabled={savingFinalPrice || !canEdit}
                              autoFocus
                            />
                            <span className='text-sm text-gray-600 font-medium'>%</span>
                            <span className='text-xs text-gray-500 ml-1'>
                              = {finalPrice.toLocaleString('vi-VN')}₫
                            </span>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          onClick={handleUpdateFinalPrice}
                          disabled={savingFinalPrice || !canEdit}
                          className='bg-green-600 hover:bg-green-700 h-8 px-3 text-xs text-white'
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
                            const price = combo.totalFinalPrice || 0
                            const digits = price.toString()
                            setFinalPrice(price)
                            setFinalPriceRaw(digits)
                            setFinalPriceInput(formatWithDots(digits))
                            if (combo.totalBasePrice > 0) {
                              const calculatedDiscount =
                                ((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100
                              setDiscountPercent(Math.round(calculatedDiscount * 100) / 100)
                            }
                            setPriceInputMode('direct')
                          }}
                          disabled={savingFinalPrice}
                          className='h-8 px-3 text-xs bg-white'
                        >
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className='text-2xl font-bold text-blue-600 block mb-1'>
                        {combo.totalFinalPrice.toLocaleString('vi-VN')}₫
                      </span>
                      {combo.totalBasePrice > 0 && (
                        <span className='text-sm text-green-600 font-medium'>
                          Giảm{' '}
                          {Math.round(
                            ((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100 * 100
                          ) / 100}
                          %
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Discounted Amount Block - Green Background */}
                <div className='bg-green-50 rounded-lg p-4'>
                  <div className='grid grid-cols-2 gap-x-4 items-center'>
                    <span className='text-sm font-medium text-gray-700'>Đã giảm:</span>
                    <span className='text-lg font-semibold text-green-600 text-right'>
                      {combo.totalSavings.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                {/* Quantity Blocks - Side by Side */}
                <div className='grid grid-cols-2 gap-3'>
                  {/* Total Quantity Block */}
                  <div className='bg-white border border-gray-200 rounded-lg p-4'>
                    <span className='text-sm font-medium text-gray-700 block mb-2'>Tổng số lượng</span>
                    <span className='text-2xl font-bold text-gray-900 block'>{totalItems}</span>
                  </div>

                  {/* Available Quantity Block */}
                  {combo.availableQuantity !== undefined && (
                    <div className='bg-white border border-gray-200 rounded-lg p-4'>
                      <span className='text-sm font-medium text-gray-700 block mb-2'>Số lượng khả dụng</span>
                      <span className='text-2xl font-bold text-gray-900 block'>{combo.availableQuantity}</span>
                    </div>
                  )}
                </div>
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

      {/* Confirmation Modal for Price Updates */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => !open && handleCancelPriceConfirm()}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-amber-700'>
              <AlertCircle className='w-6 h-6 text-amber-600' />
              Xác nhận cập nhật giá combo
            </DialogTitle>
            <DialogDescription>
              {confirmModalType === 'approved-inactive'
                ? 'Combo sẽ về trạng thái nháp và cần gửi duyệt lại'
                : 'Những thay đổi này sẽ yêu cầu duyệt lại bởi nhân viên'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {/* Warning Box */}
            <div className='rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='flex-shrink-0 pt-0.5'>
                  <AlertCircle className='w-5 h-5 text-amber-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-amber-900 mb-2'>Lưu ý quan trọng</h3>
                  {confirmModalType === 'approved-inactive' ? (
                    <>
                      <p className='text-sm text-amber-800 mb-3'>
                        Combo hiện đang ở trạng thái <strong>"Đã duyệt"</strong> nhưng đã bị <strong>"Dừng hoạt động"</strong>.
                      </p>
                      <p className='text-sm text-amber-800 mb-3'>
                        Khi bạn cập nhật giá, combo sẽ chuyển về trạng thái <strong>"Nháp"</strong> và bạn sẽ cần <strong>gửi duyệt lại</strong> để combo có thể hoạt động trở lại.
                      </p>
                      <p className='text-sm text-amber-800'>
                        Sau khi lưu, bạn sẽ thấy nút <strong>"Gửi duyệt"</strong> để gửi combo đi duyệt lại.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className='text-sm text-amber-800 mb-3'>
                        Combo sẽ chuyển về trạng thái <strong>"Chờ duyệt"</strong> và cần đợi nhân viên xem xét trong vòng <strong>24 giờ</strong>.
                      </p>
                      <p className='text-sm text-amber-800'>
                        Trong thời gian chờ duyệt, combo vẫn hoạt động bình thường (nếu đang ở trạng thái "Đã duyệt").
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCancelPriceConfirm} variant='outline' disabled={savingFinalPrice}>
              <X className='w-4 h-4 mr-2' />
              Hủy
            </Button>
            <Button
              onClick={handleConfirmPriceUpdate}
              className='bg-green-600 hover:bg-green-700 text-white'
              disabled={savingFinalPrice}
            >
              {savingFinalPrice ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Check className='w-4 h-4 mr-2' />
                  Xác nhận cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default DetailComboSeller
