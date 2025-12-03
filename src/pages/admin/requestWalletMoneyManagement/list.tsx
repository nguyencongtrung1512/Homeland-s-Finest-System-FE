import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Eye,
  RefreshCw,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Card, CardContent } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Textarea } from '../../../components/ui/textarea'
import { Badge } from '../../../components/ui/badge'
import { getRequestWalletMoney, updateRequestWalletMoney } from '../../../apis/requestWalletMoney.api'
import { getWalletBalance, withdrawal, getWalletTransactions } from '../../../apis/wallet.api'
import { getOrderDetail } from '../../../apis/order.api'
import type { RequestWalletMoney, UpdateRequestWalletMoneyInput } from '../../../types/requestWalletMoneyType'
import type { WalletData, WalletTransactionDTO } from '../../../types/walletType'
import { getTransactionTypeLabel } from '../../../types/walletType'
import { formatDate } from '../../../utils/formatDate'
import { toast } from '../../../utils/toast'
import Loading from '../../../components/Loading/loading'
import Pagination from '../../../components/Pagination/Pagination'

function RequestWalletMoneyManagement() {
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Withdrawal' | 'Refund'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Completed' | 'Cancel'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRequest, setSelectedRequest] = useState<RequestWalletMoney | null>(null)
  const [orderDetail, setOrderDetail] = useState<{ data: { status: string } } | null>(null)
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false)
  const [allRequests, setAllRequests] = useState<RequestWalletMoney[]>([]) // Lưu tất cả requests từ API
  const [filteredRequests, setFilteredRequests] = useState<RequestWalletMoney[]>([]) // Requests sau khi filter
  const [displayedRequests, setDisplayedRequests] = useState<RequestWalletMoney[]>([]) // Requests hiển thị trên trang hiện tại
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageSize] = useState(10) // Số items mỗi trang
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [updateNote, setUpdateNote] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [walletData, setWalletData] = useState<WalletData | null>(null)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false)
  const [walletTransactions, setWalletTransactions] = useState<WalletTransactionDTO[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [transactionPage, setTransactionPage] = useState(1)
  const [transactionPageSize] = useState(10)

  // Thống kê
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
    totalAmount: 0
  })

  // Kiểm tra xem request có thể xử lý được không
  const canProcessRequest = (status: string): boolean => {
    const normalizedStatus = status?.trim()
    return normalizedStatus === 'Pending' || normalizedStatus === 'pending' || normalizedStatus === 'PENDING'
  }

  // Fetch requests từ API - lấy tất cả với pageSize=1&pageNumber=0
  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: {
        pageSize: number
        pageNumber: number
        type?: string
        status?: string
      } = {
        pageSize: 0,
        pageNumber: 1
      }

      // Vẫn filter ở API nếu có
      if (typeFilter !== 'all') {
        params.type = typeFilter
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await getRequestWalletMoney(params)
      const requests = response.data || []

      // Lưu tất cả requests
      setAllRequests(requests)

      // Tính toán thống kê từ tất cả requests
      setStats({
        total: requests.length,
        pending: requests.filter((r) => canProcessRequest(r.status)).length,
        completed: requests.filter((r) => r.status === 'Completed' || r.status === 'completed').length,
        cancelled: requests.filter((r) => r.status === 'Cancel' || r.status === 'cancel').length,
        totalAmount: requests.reduce((sum, r) => sum + r.amount, 0)
      })
    } catch (err: unknown) {
      console.error('Error fetching requests:', err)
      setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.')
      setAllRequests([])
      toast.error('Lỗi', 'Không thể tải danh sách yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  const fetchWalletInfo = async () => {
    try {
      const data = await getWalletBalance()
      setWalletData(data)
    } catch (err) {
      console.error('Error fetching wallet balance:', err)
    }
  }

  const fetchWalletTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const response = await getWalletTransactions({
        pageSize: transactionPageSize,
        pageNumber: transactionPage
      })
      // Handle different response structures
      if (response?.data?.items) {
        setWalletTransactions(response.data.items)
      } else if (Array.isArray(response?.data)) {
        setWalletTransactions(response.data)
      } else if (Array.isArray(response)) {
        setWalletTransactions(response)
      } else {
        setWalletTransactions([])
      }
    } catch (err) {
      console.error('Error fetching wallet transactions:', err)
      setWalletTransactions([])
      toast.error('Lỗi', 'Không thể tải lịch sử giao dịch')
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleCreateWithdrawal = async () => {
    if (!withdrawAmount) return

    const amountNumber = Number(withdrawAmount)
    if (Number.isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Lỗi', 'Số tiền không hợp lệ')
      return
    }

    if (walletData && amountNumber > walletData.availableBalance) {
      toast.error('Lỗi', 'Số tiền rút vượt quá số dư khả dụng')
      return
    }

    try {
      setIsSubmittingWithdraw(true)
      await withdrawal(amountNumber)
      toast.success('Thành công', 'Đã tạo yêu cầu rút tiền')
      setIsWithdrawModalOpen(false)
      setWithdrawAmount('')
      fetchWalletInfo()
      fetchRequests()
    } catch (err: unknown) {
      console.error('Error creating withdrawal request:', err)
      const message = (err as { message?: string })?.message || 'Không thể tạo yêu cầu rút tiền'
      toast.error('Lỗi', message)
    } finally {
      setIsSubmittingWithdraw(false)
    }
  }

  // Filter và search requests ở frontend
  useEffect(() => {
    let filtered = [...allRequests]

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (req) =>
          req.id.toLowerCase().includes(searchText.toLowerCase()) ||
          req.userEmail.toLowerCase().includes(searchText.toLowerCase()) ||
          req.userPhoneNumber.toLowerCase().includes(searchText.toLowerCase()) ||
          req.bankAccount.toLowerCase().includes(searchText.toLowerCase())
      )
    }

    setFilteredRequests(filtered)

    // Reset về trang 1 khi filter thay đổi
    setCurrentPage(1)
  }, [allRequests, searchText])

  // Phân trang ở frontend
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginated = filteredRequests.slice(startIndex, endIndex)
    setDisplayedRequests(paginated)
  }, [filteredRequests, currentPage, pageSize])

  // Fetch data khi filter thay đổi
  useEffect(() => {
    fetchRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter])

  useEffect(() => {
    fetchWalletInfo()
    fetchWalletTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchWalletTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionPage])

  // Handle filter button click
  const handleFilter = () => {
    setCurrentPage(1)
    fetchRequests()
  }

  // Handle view detail
  const handleViewDetail = async (request: RequestWalletMoney) => {
    setSelectedRequest(request)
    setOrderDetail(null)

    // Nếu request có orderId, fetch order detail
    if (request.orderId) {
      try {
        setLoadingOrderDetail(true)
        const orderData = await getOrderDetail(request.orderId)
        console.log('Order Detail Response:', orderData)

        // API trả về Order object trực tiếp có thuộc tính status
        // Wrap lại để match với type {data: {status: string}}
        if (orderData?.status) {
          setOrderDetail({ data: { status: orderData.status } })
        } else {
          setOrderDetail(null)
        }
      } catch (err) {
        console.error('Error fetching order detail:', err)
        // Vẫn mở modal ngay cả khi fetch thất bại
      } finally {
        setLoadingOrderDetail(false)
      }
    }

    setIsDetailModalOpen(true)
  }

  // Handle open update modal
  const handleOpenUpdateModal = (request: RequestWalletMoney) => {
    setSelectedRequest(request)
    setUpdateNote('')
    setIsUpdateModalOpen(true)
  }

  // Handle accept request
  const handleAcceptRequest = async () => {
    if (!selectedRequest) return

    try {
      setIsUpdating(true)
      const updateData: UpdateRequestWalletMoneyInput = {
        status: 'Completed',
        ...(updateNote && { note: updateNote })
      }

      await updateRequestWalletMoney(selectedRequest.id, updateData)
      toast.success('Thành công', 'Chấp nhận yêu cầu thành công')
      setIsUpdateModalOpen(false)
      setSelectedRequest(null)
      setUpdateNote('')
      fetchRequests()
    } catch (err: unknown) {
      console.error('Error accepting request:', err)
      const errorMessage = (err as { message?: string })?.message || 'Không thể chấp nhận yêu cầu'
      toast.error('Lỗi', errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle cancel request
  const handleCancelRequest = async () => {
    if (!selectedRequest) return

    try {
      setIsUpdating(true)
      const updateData: UpdateRequestWalletMoneyInput = {
        status: 'Cancel',
        ...(updateNote && { note: updateNote })
      }

      await updateRequestWalletMoney(selectedRequest.id, updateData)
      toast.success('Thành công', 'Hủy bỏ yêu cầu thành công')
      setIsUpdateModalOpen(false)
      setSelectedRequest(null)
      setUpdateNote('')
      fetchRequests()
    } catch (err: unknown) {
      console.error('Error canceling request:', err)
      const errorMessage = (err as { message?: string })?.message || 'Không thể hủy bỏ yêu cầu'
      toast.error('Lỗi', errorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  // Get status config
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status?.trim()
    const configs = {
      Pending: {
        color: 'orange',
        text: 'Đang chờ',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        icon: Clock
      },
      pending: {
        color: 'orange',
        text: 'Đang chờ',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-600',
        icon: Clock
      },
      Completed: {
        color: 'green',
        text: 'Hoàn thành',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: CheckCircle
      },
      completed: {
        color: 'green',
        text: 'Hoàn thành',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600',
        icon: CheckCircle
      },
      Cancel: {
        color: 'red',
        text: 'Đã hủy',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: XCircle
      },
      cancel: {
        color: 'red',
        text: 'Đã hủy',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600',
        icon: XCircle
      }
    }
    return (
      configs[normalizedStatus as keyof typeof configs] || {
        color: 'gray',
        text: normalizedStatus || 'Unknown',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
        icon: Clock
      }
    )
  }

  // Get type config
  const getTypeConfig = (type: string) => {
    if (type === 'Withdrawal') {
      return {
        text: 'Rút tiền',
        icon: ArrowUpRight,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    }
    return {
      text: 'Hoàn tiền',
      icon: ArrowDownRight,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  }

  // Get transaction status config
  const getTransactionStatusConfig = (status: string) => {
    const statusMap: Record<string, { text: string; bgColor: string; textColor: string }> = {
      Pending: { text: 'Đang chờ', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      Completed: { text: 'Hoàn thành', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      Cancel: { text: 'Đã hủy', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
      Approved: { text: 'Đã duyệt', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      Rejected: { text: 'Đã từ chối', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      Disputed: { text: 'Tranh chấp', bgColor: 'bg-orange-100', textColor: 'text-orange-800' }
    }
    return (
      statusMap[status] || {
        text: status || 'Không xác định',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      }
    )
  }

  // Get transaction type icon color
  const getTransactionTypeColor = (type: string) => {
    const isPositive = ['Deposit', 'CommissionReceived', 'Refund', 'RefundToCustomer'].includes(type)
    return isPositive ? 'text-green-600' : 'text-red-600'
  }

  // Get order status config - convert sang tiếng Việt
  const getOrderStatusConfig = (status: string) => {
    const statusMap: Record<string, { text: string; bgColor: string; textColor: string }> = {
      // === TRẠNG THÁI KHỞI TẠO VÀ CHỜ XỬ LÝ ===
      NotYet: { text: 'Chưa xác nhận', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
      Processing: { text: 'Chờ xác nhận', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
      PendingPayment: { text: 'Chờ thanh toán', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
      Pending: { text: 'Đang chờ', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },

      // === TRẠNG THÁI ĐÃ XÁC NHẬN VÀ CHUẨN BỊ ===
      Confirmed: { text: 'Đã xác nhận', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      ReadyToPick: { text: 'Sẵn sàng lấy hàng', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
      Picking: { text: 'Đang lấy hàng', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
      Picked: { text: 'Đã lấy hàng', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },

      // === TRẠNG THÁI VẬN CHUYỂN ===
      Storing: { text: 'Đang lưu kho', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
      Transporting: { text: 'Đang vận chuyển', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
      Sorting: { text: 'Đang phân loại', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800' },
      Delivering: { text: 'Đang giao hàng', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },

      // === TRẠNG THÁI HOÀN THÀNH ===
      Delivered: { text: 'Đã giao hàng', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      Paid: { text: 'Đã thanh toán', bgColor: 'bg-green-100', textColor: 'text-green-800' },
      Received: { text: 'Đã nhận hàng', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800' },

      // === TRẠNG THÁI TRẢ HÀNG VÀ HOÀN TIỀN ===
      Refunding: { text: 'Đang hoàn tiền', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
      Returning: { text: 'Đang trả hàng', bgColor: 'bg-amber-100', textColor: 'text-amber-800' },
      Returned: { text: 'Đã trả hàng', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      Refunded: { text: 'Đã hoàn tiền', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800' },
      DeliveryFail: { text: 'Giao hàng thất bại', bgColor: 'bg-red-100', textColor: 'text-red-800' },

      // === TRẠNG THÁI SỰ CỐ VÀ KHIẾU NẠI ===
      Exception: { text: 'Gặp sự cố', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      Damaged: { text: 'Hàng hư hỏng', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      Lost: { text: 'Hàng thất lạc', bgColor: 'bg-red-100', textColor: 'text-red-800' },
      Complaining: { text: 'Đang phản hồi', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
      Complained: { text: 'Đã phản hồi', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },

      // === TRẠNG THÁI HỦY ===
      Cancel: { text: 'Đã hủy', bgColor: 'bg-gray-100', textColor: 'text-gray-800' }
    }
    return (
      statusMap[status] || {
        text: status || 'Không xác định',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800'
      }
    )
  }

  // Render request row
  const renderRequestRow = (request: RequestWalletMoney, index: number) => {
    const statusConfig = getStatusConfig(request.status)
    const typeConfig = getTypeConfig(request.type)
    const StatusIcon = statusConfig.icon
    const TypeIcon = typeConfig.icon

    return (
      <motion.tr
        key={request.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className='border-b border-gray-100 hover:bg-gray-50 transition-colors'
      >
        <td className='px-4 md:px-6 py-4'>
          <div className='flex items-center gap-2 md:gap-3'>
            <Avatar className='w-8 h-8'>
              <AvatarFallback className='bg-blue-100 text-blue-600 text-xs font-medium'>
                {request.userEmail.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <p className='text-gray-900 text-xs md:text-sm font-medium truncate'>{request.userEmail}</p>
              <p className='text-gray-500 text-xs truncate'>{request.userPhoneNumber}</p>
            </div>
          </div>
        </td>

        <td className='px-4 md:px-6 py-4'>
          <div className='flex items-center gap-2'>
            <div className={`p-1.5 rounded ${typeConfig.bgColor}`}>
              <TypeIcon className={`w-3 h-3 md:w-4 md:h-4 ${typeConfig.color}`} />
            </div>
            <span className='text-gray-700 text-xs md:text-sm'>{typeConfig.text}</span>
          </div>
        </td>

        <td className='px-4 md:px-6 py-4'>
          <span className='font-semibold text-gray-900 text-xs md:text-sm'>
            {request.amount.toLocaleString('vi-VN')}₫
          </span>
        </td>

        <td className='px-4 md:px-6 py-4 hidden md:table-cell'>
          <span className='text-gray-600 text-xs md:text-sm'>{formatDate(request.createdAt) || ''}</span>
        </td>

        <td className='px-4 md:px-6 py-4'>
          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 px-2 py-1 text-xs`}>
            <StatusIcon className='w-3 h-3 mr-1' />
            {statusConfig.text}
          </Badge>
        </td>

        <td className='px-4 md:px-6 py-4'>
          <div className='flex items-center gap-1 md:gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleViewDetail(request)}
              className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
              title='Xem chi tiết'
            >
              <Eye size={14} />
            </Button>
            {canProcessRequest(request.status) && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleOpenUpdateModal(request)}
                  className='h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-full'
                  title='Xử lý yêu cầu'
                >
                  <CheckCircle size={14} />
                </Button>
              </motion.div>
            )}
          </div>
        </td>
      </motion.tr>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className='space-y-4 md:space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen'
    >
      {/* Header */}
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
        <h1 className='text-xl md:text-2xl font-bold text-gray-900'>Quản lý yêu cầu rút tiền & hoàn tiền</h1>
        <p className='text-gray-600 mt-1 text-sm md:text-base'>Theo dõi và xử lý các yêu cầu rút tiền, hoàn tiền</p>
      </motion.div>

      {/* Summary Cards */}
      <div className='grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-3 md:gap-6'>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className='bg-white shadow-sm'>
            <CardContent className='p-4 md:p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs md:text-sm text-gray-600 mb-1'>Số dư khả dụng</p>
                  <p className='text-xl md:text-2xl font-bold text-emerald-600'>
                    {walletData ? `${walletData.availableBalance.toLocaleString('vi-VN')}₫` : '--'}
                  </p>
                  <Button
                    size='sm'
                    className='mt-3 bg-emerald-600 hover:bg-emerald-700 text-white'
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={!walletData || walletData.availableBalance <= 0}
                  >
                    Tạo yêu cầu rút
                  </Button>
                </div>
                <div className='w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-lg flex items-center justify-center'>
                  <DollarSign className='w-5 h-5 md:w-6 md:h-6 text-emerald-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className='bg-white shadow-sm'>
            <CardContent className='p-4 md:p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs md:text-sm text-gray-600 mb-1'>Tổng yêu cầu</p>
                  <p className='text-xl md:text-2xl font-bold text-gray-900'>{stats.total.toLocaleString()}</p>
                </div>
                <div className='w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <Wallet className='w-5 h-5 md:w-6 md:h-6 text-blue-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className='bg-white shadow-sm'>
            <CardContent className='p-4 md:p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs md:text-sm text-gray-600 mb-1'>Đang chờ</p>
                  <p className='text-xl md:text-2xl font-bold text-orange-600'>{stats.pending.toLocaleString()}</p>
                </div>
                <div className='w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                  <Clock className='w-5 h-5 md:w-6 md:h-6 text-orange-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className='bg-white shadow-sm'>
            <CardContent className='p-4 md:p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs md:text-sm text-gray-600 mb-1'>Hoàn thành</p>
                  <p className='text-xl md:text-2xl font-bold text-green-600'>{stats.completed.toLocaleString()}</p>
                </div>
                <div className='w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <CheckCircle className='w-5 h-5 md:w-6 md:h-6 text-green-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className='hidden md:block'
        >
          <Card className='bg-white shadow-sm'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-600 mb-1'>Đã hủy</p>
                  <p className='text-2xl font-bold text-red-600'>{stats.cancelled.toLocaleString()}</p>
                </div>
                <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center'>
                  <XCircle className='w-6 h-6 text-red-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Total Withdrawn Card */}
      {walletData && walletData.TotalWithdrawn !== undefined && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className='mt-4 md:mt-6'
        >
          <Card className='bg-white shadow-sm'>
            <CardContent className='p-4 md:p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-xs md:text-sm text-gray-600 mb-1'>Tổng đã rút</p>
                  <p className='text-xl md:text-2xl font-bold text-indigo-600'>
                    {walletData.TotalWithdrawn.toLocaleString('vi-VN')}₫
                  </p>
                </div>
                <div className='w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-lg flex items-center justify-center'>
                  <ArrowUpRight className='w-5 h-5 md:w-6 md:h-6 text-indigo-600' />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <Search size={16} className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                  <Input
                    placeholder='Tìm kiếm theo ID, email, SĐT, số tài khoản...'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className='pl-10 h-10 border-gray-200 text-sm'
                  />
                </div>
              </div>

              <Select
                value={typeFilter}
                onValueChange={(value: 'all' | 'Withdrawal' | 'Refund') => setTypeFilter(value)}
              >
                <SelectTrigger className='w-full md:w-48 h-10 border-gray-200 text-sm'>
                  <SelectValue placeholder='Loại yêu cầu' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả loại</SelectItem>
                  <SelectItem value='Withdrawal'>Rút tiền</SelectItem>
                  <SelectItem value='Refund'>Hoàn tiền</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'Pending' | 'Completed' | 'Cancel') => setStatusFilter(value)}
              >
                <SelectTrigger className='w-full md:w-48 h-10 border-gray-200 text-sm'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='Pending'>Đang chờ</SelectItem>
                  <SelectItem value='Completed'>Hoàn thành</SelectItem>
                  <SelectItem value='Cancel'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Button className='h-10 px-4 md:px-6 bg-blue-600 hover:bg-blue-700' onClick={handleFilter}>
                <Filter size={16} className='mr-2' />
                <span className='hidden md:inline'>Lọc</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Requests Table */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-0'>
            {/* Table Header */}
            <div className='px-4 md:px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg md:text-xl font-bold text-gray-900'>Danh sách yêu cầu rút tiền & hoàn tiền</h2>
              <p className='text-gray-600 text-sm mt-1'>Quản lý và xử lý các yêu cầu rút tiền, hoàn tiền từ người dùng</p>
            </div>

            {error && (
              <div className='p-6 text-center'>
                <p className='text-red-600 text-sm'>{error}</p>
                <Button variant='outline' size='sm' onClick={fetchRequests} className='mt-4'>
                  <RefreshCw size={14} className='mr-2' />
                  Thử lại
                </Button>
              </div>
            )}

            {loading && !error ? (
              <div className='p-12'>
                <Loading size='md' text='Đang tải dữ liệu...' />
              </div>
            ) : !error ? (
              <>
                <div className='overflow-x-auto'>
                  <table className='w-full'>
                    <thead>
                      <tr className='border-b border-gray-200 bg-gray-50'>
                        <th className='text-left px-4 md:px-6 py-3 md:py-4 font-medium text-gray-700 text-xs md:text-sm'>
                          Người dùng
                        </th>
                        <th className='text-left px-4 md:px-6 py-3 md:py-4 font-medium text-gray-700 text-xs md:text-sm'>
                          Loại
                        </th>
                        <th className='text-left px-4 md:px-6 py-3 md:py-4 font-medium text-gray-700 text-xs md:text-sm'>
                          Số tiền
                        </th>
                        <th className='text-left px-4 md:px-6 py-3 md:py-4 font-medium text-gray-700 text-xs md:text-sm hidden md:table-cell'>
                          Ngày tạo
                        </th>
                        <th className='text-left px-4 md:px-6 py-3 md:py-4 font-medium text-gray-700 text-xs md:text-sm'>
                          Trạng thái
                        </th>
                        <th className='text-left px-4 md:px-6 py-3 md:py-4 font-medium text-gray-700 text-xs md:text-sm'>
                          Hành động
                        </th>
                      </tr>
                    </thead>

                    <tbody className='bg-white'>
                      <AnimatePresence>
                        {displayedRequests.length === 0 ? (
                          <tr>
                            <td colSpan={7} className='px-6 py-12 text-center'>
                              <p className='text-gray-500 text-sm'>Không có yêu cầu nào</p>
                            </td>
                          </tr>
                        ) : (
                          displayedRequests.map((request, index) => renderRequestRow(request, index))
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className='px-4 md:px-6 py-4 border-t border-gray-200'>
                  <div className='flex flex-col md:flex-row items-center justify-between gap-3 mb-4'>
                    <span className='text-gray-600 text-xs md:text-sm'>
                      Hiển thị {displayedRequests.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
                      {Math.min(currentPage * pageSize, filteredRequests.length)} của {filteredRequests.length} kết quả
                    </span>
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(filteredRequests.length / pageSize)}
                    onPageChange={setCurrentPage}
                    maxVisiblePages={2}
                  />
                </div>
              </>
            ) : (
              <div className='p-12 text-center'>
                <p className='text-gray-600 text-sm'>Không có yêu cầu nào</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className='max-w-2xl w-full max-h-[90vh] flex flex-col'>
          {selectedRequest && (
            <>
              <DialogHeader className='flex-shrink-0'>
                <DialogTitle className='text-lg font-bold text-gray-900'>Chi tiết yêu cầu</DialogTitle>
              </DialogHeader>

              <div className='space-y-6 mt-4 overflow-y-auto flex-1 pr-2'>
                <div>
                  <p className='text-sm font-semibold text-gray-900 mb-2'>ID Đơn hàng</p>
                  <span className='font-mono text-sm text-gray-700'>{selectedRequest.orderId || 'Không có'}</span>
                </div>

                {/* Thông tin trạng thái đơn hàng */}
                {orderDetail && (
                  <div className='space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-100'>
                    <h3 className='text-sm font-semibold text-gray-900'>Trạng thái đơn hàng</h3>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>Trạng thái:</span>
                      {orderDetail?.data?.status ? (
                        <Badge
                          className={`${getOrderStatusConfig(orderDetail.data.status.trim()).bgColor
                            } ${getOrderStatusConfig(orderDetail.data.status.trim()).textColor} border-0`}
                        >
                          {getOrderStatusConfig(orderDetail.data.status.trim()).text}
                        </Badge>
                      ) : (
                        <span className='text-sm text-gray-500'>Không xác định</span>
                      )}
                    </div>
                  </div>
                )}

                {loadingOrderDetail && (
                  <div className='py-4'>
                    <Loading size='sm' text='Đang tải thông tin đơn hàng...' />
                  </div>
                )}
                {/* Thông tin người dùng */}
                <div className='space-y-3'>
                  <h3 className='text-sm font-semibold text-gray-900 border-b pb-2'>Thông tin người dùng</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Email:</span>
                      <span className='text-sm font-medium text-gray-900 text-right'>{selectedRequest.userEmail}</span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Số điện thoại:</span>
                      <span className='text-sm font-medium text-gray-900'>{selectedRequest.userPhoneNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Thông tin yêu cầu */}
                <div className='space-y-3'>
                  <h3 className='text-sm font-semibold text-gray-900 border-b pb-2'>Thông tin yêu cầu</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Loại yêu cầu:</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {getTypeConfig(selectedRequest.type).text}
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Số tiền:</span>
                      <span className='text-sm font-semibold text-gray-900'>
                        {selectedRequest.amount.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Trạng thái:</span>
                      <Badge
                        className={`${getStatusConfig(selectedRequest.status).bgColor} ${getStatusConfig(selectedRequest.status).textColor
                          } border-0`}
                      >
                        {getStatusConfig(selectedRequest.status).text}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Thông tin ngân hàng */}
                {/* <div className='space-y-3'>
                  <h3 className='text-sm font-semibold text-gray-900 border-b pb-2'>Thông tin ngân hàng</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Tên ngân hàng:</span>
                      <span className='text-sm font-medium text-gray-900'>{selectedRequest.bankName}</span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Số tài khoản:</span>
                      <span className='text-sm font-medium text-gray-900 font-mono'>{selectedRequest.bankAccount}</span>
                    </div>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Tên chủ tài khoản:</span>
                      <span className='text-sm font-medium text-gray-900'>{selectedRequest.accountHolderName}</span>
                    </div>
                  </div>
                </div> */}

                {/* Ghi chú xử lý */}
                {selectedRequest.processNote && (
                  <div className='space-y-3'>
                    <h3 className='text-sm font-semibold text-gray-900 border-b pb-2'>Ghi chú xử lý</h3>
                    <p className='text-sm text-gray-700 bg-gray-50 p-3 rounded-md'>{selectedRequest.processNote}</p>
                  </div>
                )}

                {/* Thông tin bổ sung */}
                <div className='space-y-3'>
                  <h3 className='text-sm font-semibold text-gray-900 border-b pb-2'>Thông tin bổ sung</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-start'>
                      <span className='text-sm text-gray-600'>Ngày tạo:</span>
                      <span className='text-sm font-medium text-gray-900'>{formatDate(selectedRequest.createdAt)}</span>
                    </div>
                    {selectedRequest.processedAt && (
                      <div className='flex justify-between items-start'>
                        <span className='text-sm text-gray-600'>Ngày xử lý:</span>
                        <span className='text-sm font-medium text-gray-900'>
                          {formatDate(selectedRequest.processedAt)}
                        </span>
                      </div>
                    )}
                    {selectedRequest.processedBy && (
                      <div className='flex justify-between items-start'>
                        <span className='text-sm text-gray-600'>Người xử lý:</span>
                        <span className='text-sm font-medium text-gray-900'>{selectedRequest.processedBy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className='flex-shrink-0 border-t pt-4 mt-4'>
                <Button variant='outline' onClick={() => setIsDetailModalOpen(false)}>
                  Đóng
                </Button>
                {selectedRequest.status === 'Pending' && (
                  <Button
                    onClick={() => handleOpenUpdateModal(selectedRequest)}
                    className='bg-blue-600 hover:bg-blue-700'
                  >
                    Xử lý yêu cầu
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Modal */}
      <Dialog
        open={isWithdrawModalOpen}
        onOpenChange={(open) => {
          setIsWithdrawModalOpen(open)
          if (!open) {
            setWithdrawAmount('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo yêu cầu rút tiền</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 mt-2'>
            <div>
              <p className='text-sm text-gray-600 mb-1'>
                Số dư khả dụng:{' '}
                <span className='font-semibold text-emerald-600'>
                  {walletData ? `${walletData.availableBalance.toLocaleString('vi-VN')}₫` : '--'}
                </span>
              </p>
              <Input
                type='number'
                min={0}
                step='1000'
                placeholder='Nhập số tiền muốn rút'
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <p className='text-xs text-gray-500 mt-1'>Số tiền tối thiểu 1.000₫ và không vượt quá số dư khả dụng.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsWithdrawModalOpen(false)
                setWithdrawAmount('')
              }}
              disabled={isSubmittingWithdraw}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateWithdrawal} disabled={!withdrawAmount || isSubmittingWithdraw}>
              {isSubmittingWithdraw ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang tạo...
                </>
              ) : (
                'Xác nhận tạo yêu cầu'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Modal */}
      <AnimatePresence>
        {isUpdateModalOpen && selectedRequest && (
          <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
            <DialogContent className='max-w-lg w-full max-h-[90vh] flex flex-col'>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className='flex flex-col h-full'
              >
                <DialogHeader className='flex-shrink-0'>
                  <DialogTitle className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                    <CheckCircle className='w-5 h-5 text-blue-600' />
                    Xử lý yêu cầu
                  </DialogTitle>
                  <p className='text-sm text-gray-500 mt-1'>
                    {getTypeConfig(selectedRequest.type).text} - {selectedRequest.amount.toLocaleString('vi-VN')}₫
                  </p>
                </DialogHeader>

                <div className='space-y-4 mt-4 overflow-y-auto flex-1 pr-2'>
                  {/* Thông tin yêu cầu */}
                  <Card className='bg-gray-50 border-gray-200'>
                    <CardContent className='p-4'>
                      <div className='space-y-2 text-sm'>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Người dùng:</span>
                          <span className='font-medium text-gray-900'>{selectedRequest.userEmail}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Số điện thoại:</span>
                          <span className='font-medium text-gray-900'>{selectedRequest.userPhoneNumber}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Ngân hàng:</span>
                          <span className='font-medium text-gray-900'>{selectedRequest.bankName}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-gray-600'>Số tài khoản:</span>
                          <span className='font-medium text-gray-900 font-mono'>{selectedRequest.bankAccount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ghi chú */}
                  <div>
                    <label className='text-sm font-medium text-gray-700 mb-2 block'>
                      Ghi chú <span className='text-gray-400 text-xs'>(bắt buộc)</span>
                    </label>
                    <Textarea
                      placeholder='Nhập ghi chú về việc xử lý yêu cầu này...'
                      value={updateNote}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value.length <= 200) {
                          setUpdateNote(value)
                        }
                      }}
                      rows={4}
                      className='resize-none'
                      disabled={isUpdating}
                      maxLength={200}
                    />
                    <div className='flex justify-between items-center mt-1'>
                      <p className='text-xs text-gray-500'>Ghi chú này sẽ được lưu lại và hiển thị cho người dùng</p>
                      <p className={`text-xs ${updateNote.length >= 200 ? 'text-red-500' : 'text-gray-500'}`}>
                        {updateNote.length}/200
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className='mt-6 flex gap-3 flex-shrink-0 border-t pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => setIsUpdateModalOpen(false)}
                    disabled={isUpdating}
                    className='flex-1 min-w-[120px]'
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={handleCancelRequest}
                    disabled={isUpdating}
                    className='flex-1 min-w-[120px] bg-red-600 hover:bg-red-700'
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <XCircle className='w-4 h-4 mr-2' />
                        Hủy bỏ yêu cầu
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleAcceptRequest}
                    disabled={isUpdating}
                    className='flex-1 min-w-[120px] bg-green-600 hover:bg-green-700'
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-4 h-4 mr-2' />
                        Chấp nhận yêu cầu
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Wallet Transactions History */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <Card className='bg-white shadow-sm'>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-center justify-between mb-4 md:mb-6'>
              <div>
                <h2 className='text-lg md:text-xl font-bold text-gray-900'>Lịch sử giao dịch ví</h2>
                <p className='text-gray-600 text-sm mt-1'>Xem tất cả các giao dịch ví của hệ thống</p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={fetchWalletTransactions}
                disabled={loadingTransactions}
                className='h-9'
              >
                <RefreshCw size={14} className={`mr-2 ${loadingTransactions ? 'animate-spin' : ''}`} />
                <span className='hidden md:inline'>Làm mới</span>
              </Button>
            </div>

            {loadingTransactions ? (
              <div className='py-12'>
                <Loading size='md' text='Đang tải lịch sử giao dịch...' />
              </div>
            ) : walletTransactions.length === 0 ? (
              <div className='py-12 text-center'>
                <Wallet className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500 text-sm'>Chưa có giao dịch nào</p>
              </div>
            ) : (
              <>
                <div className='space-y-3'>
                  {walletTransactions.map((transaction, index) => {
                    const statusConfig = getTransactionStatusConfig(transaction.status || '')
                    const typeColor = getTransactionTypeColor(transaction.type)
                    const isPositive = ['Deposit', 'CommissionReceived', 'Refund', 'RefundToCustomer'].includes(
                      transaction.type
                    )

                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className='hover:shadow-md transition-shadow'>
                          <CardContent className='p-4'>
                            <div className='flex items-center justify-between gap-4'>
                              {/* Left Section - Transaction Type and Status */}
                              <div className='flex items-center gap-3 flex-shrink-0'>
                                <div>
                                  <div className='flex items-center gap-2 mb-1'>
                                    <p className='text-sm font-bold text-gray-900'>
                                      {getTransactionTypeLabel(transaction.type)}
                                    </p>
                                    <Badge
                                      className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 text-xs`}
                                    >
                                      {statusConfig.text}
                                    </Badge>
                                  </div>
                                  {transaction.description && (
                                    <p className='text-xs text-gray-500'>{transaction.description}</p>
                                  )}
                                  <p className='text-xs text-gray-400 mt-1'>
                                    {formatDate(transaction.createdAt) || 'Không xác định'}
                                  </p>
                                </div>
                              </div>

                              {/* Right Section - Amount and Balance */}
                              <div className='flex items-center gap-6 flex-shrink-0'>
                                <div className='text-right'>
                                  <p className={`text-xl font-bold ${typeColor} mb-1`}>
                                    {isPositive ? '+' : '-'}
                                    {transaction.amount.toLocaleString('vi-VN')}₫
                                  </p>
                                  <p className='text-xs text-gray-500'>
                                    Số dư sau:{' '}
                                    <span className='font-semibold text-gray-700'>
                                      {transaction.balanceAfter.toLocaleString('vi-VN')}₫
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Pagination for Transactions */}
                {walletTransactions.length > 0 && (
                  <div className='mt-6 pt-4 border-t border-gray-200'>
                    <Pagination
                      currentPage={transactionPage}
                      totalPages={
                        walletTransactions.length >= transactionPageSize
                          ? transactionPage + 1
                          : transactionPage
                      }
                      onPageChange={setTransactionPage}
                      maxVisiblePages={2}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default RequestWalletMoneyManagement
