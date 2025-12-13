import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../components/ui/dialog'
import {
  FileText,
  Plus,
  Loader2,
  CheckCircle,
  Paperclip,
  User,
  Clock,
  XCircle,
  AlertCircle,
  X
} from 'lucide-react'
import CreateHelpModal from './createHelp'
import ImagePreviewModal from '../../../components/ui/image-preview-modal'
import { formApi } from '../../../apis/form.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { toast } from '../../../utils/toast'
import { useAuth } from '../../../contexts/auth.context'
import { formatDate } from '../../../utils/formatDate'
import Pagination from '../../../components/Pagination/Pagination'
import { Eye } from 'lucide-react'

function HelpCenter() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('pending')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [supportRequests, setSupportRequests] = useState<FormDTO[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<FormDTO | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Fetch support requests
  useEffect(() => {
    const fetchSupportRequests = async () => {
      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await formApi.getCustomerForms(user.userId)
        setSupportRequests(data)
      } catch (error) {
        console.error('Error fetching support requests:', error)
        setError('Không thể tải danh sách yêu cầu hỗ trợ')
        toast.error('Không thể tải danh sách yêu cầu hỗ trợ')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSupportRequests()
  }, [user?.userId])

  // Refresh data after creating new request
  const handleRefreshData = async () => {
    if (!user?.userId) return

    try {
      const data = await formApi.getCustomerForms(user.userId)
      setSupportRequests(data)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  // Map FormStatus to Vietnamese and get badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200'>Chờ xử lý</Badge>
      case 'Processing':
        return <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200'>Đang xử lý</Badge>
      case 'ApprovedByStaff':
        return <Badge className='bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200'>Staff đã phê duyệt</Badge>
      case 'DeniedByStaff':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-100 border-red-200'>Staff từ chối</Badge>
      case 'ApprovedByAdmin':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>Đã giải quyết</Badge>
      case 'DeniedByAdmin':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-100 border-red-200'>Admin từ chối</Badge>
      case 'Rejected':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-100 border-red-200'>Bị từ chối</Badge>
      case 'Confirmed':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>Đã xác nhận</Badge>
      case 'Cancel':
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200'>Đã hủy</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200'>{status}</Badge>
    }
  }

  // Format date

  // Map FormType to Vietnamese
  const getFormTypeLabel = (type: FormType): string => {
    const typeMap: Record<FormType, string> = {
      ComplaintOrder: 'Khiếu nại đơn hàng',
      ReportSeller: 'Báo cáo người bán',
      Orther: 'Hỗ trợ khác'
    }
    return typeMap[type] || type
  }

  // Get status display with icon
  const getStatusDisplay = (status: FormStatus) => {
    const statusMap: Record<FormStatus, { text: string; icon: React.ReactElement; className: string }> = {
      Pending: {
        text: 'Chờ xử lý',
        icon: <Clock className='w-4 h-4' />,
        className: 'text-yellow-600'
      },
      Processing: {
        text: 'Đang xử lý',
        icon: <Clock className='w-4 h-4' />,
        className: 'text-blue-600'
      },
      ApprovedByStaff: {
        text: 'Staff đã phê duyệt',
        icon: <CheckCircle className='w-4 h-4' />,
        className: 'text-cyan-600'
      },
      DeniedByStaff: {
        text: 'Staff từ chối',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-red-600'
      },
      ApprovedByAdmin: {
        text: 'Đã giải quyết',
        icon: <CheckCircle className='w-4 h-4' />,
        className: 'text-green-600'
      },
      DeniedByAdmin: {
        text: 'Admin từ chối',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-red-600'
      },
      Rejected: {
        text: 'Bị từ chối',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-red-600'
      },
      Confirmed: {
        text: 'Đang xử lý',
        icon: <CheckCircle className='w-4 h-4' />,
        className: 'text-green-600'
      },
      Cancel: {
        text: 'Đã hủy',
        icon: <XCircle className='w-4 h-4' />,
        className: 'text-gray-600'
      }
    }

    const statusInfo = statusMap[status] || {
      text: status,
      icon: <AlertCircle className='w-4 h-4' />,
      className: 'text-gray-600'
    }

    return (
      <div className={`flex items-center gap-2 ${statusInfo.className} font-medium`}>
        {statusInfo.icon}
        <span>{statusInfo.text}</span>
      </div>
    )
  }

  // Get file name from URL
  const getFileNameFromUrl = (url: string) => {
    const parts = url.split('/')
    return parts[parts.length - 1]
  }

  const handleCreateRequest = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleCreateSuccess = () => {
    handleRefreshData()
    setIsCreateModalOpen(false)
  }

  const handleViewDetails = (request: FormDTO) => {
    setSelectedRequest(request)
    setIsDetailOpen(true)
  }

  const handleCancelRequest = async () => {
    if (!selectedRequest) return

    try {
      setIsCancelling(true)
      await formApi.cancelForm(selectedRequest.id)
      toast.success('Hủy yêu cầu hỗ trợ thành công!')
      setShowCancelModal(false)
      setIsDetailOpen(false)
      // Refresh data
      await handleRefreshData()
    } catch (error: unknown) {
      console.error('Error cancelling form:', error)
      const errorMessage =
        (error && typeof error === 'object' && 'response' in error
          ? (error.response as { data?: { message?: string } })?.data?.message
          : null) ||
        (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          ? error.message
          : null) ||
        'Có lỗi xảy ra khi hủy yêu cầu hỗ trợ'
      toast.error(errorMessage)
    } finally {
      setIsCancelling(false)
    }
  }

  const filteredRequests = useMemo(() => {
    return supportRequests.filter((request) => {
      if (activeTab === 'all') return true
      if (activeTab === 'pending') return !['ApprovedByAdmin', 'Confirmed', 'Cancel'].includes(request.status)
      if (activeTab === 'resolved') return ['ApprovedByAdmin', 'Confirmed'].includes(request.status)
      return true
    })
  }, [supportRequests, activeTab])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredRequests.length / pageSize)), [filteredRequests.length, pageSize])
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages))
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startIndex = (currentPage - 1) * pageSize
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + pageSize)
  const displayStart = filteredRequests.length === 0 ? 0 : startIndex + 1
  const displayEnd = Math.min(startIndex + paginatedRequests.length, filteredRequests.length)

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-green-700 mb-2'>Trung tâm trợ giúp</h1>
        <p className='text-gray-600'>Chúng tôi có thể giúp gì cho bạn?</p>
      </div>

      {/* Support Requests Section */}
      <div>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-xl font-semibold text-green-700'>Yêu cầu Hỗ trợ của tôi</h2>
          <Button onClick={handleCreateRequest} className='bg-yellow-500 hover:bg-yellow-600 text-white'>
            <Plus className='w-4 h-4 mr-2' />
            Tạo yêu cầu mới
          </Button>
        </div>

        {/* Tabs */}
        <div className='flex space-x-8 pb-3 border-b border-gray-200 mb-6'>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Đang chờ xử lý' },
            { key: 'resolved', label: 'Đã giải quyết' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 px-3 text-sm font-medium transition-colors ${activeTab === tab.key
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Support Requests Table */}
        <Card>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-8 h-8 text-green-600 animate-spin' />
                <span className='ml-3 text-gray-600'>Đang tải...</span>
              </div>
            ) : error ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <p className='text-gray-600 mb-4'>{error}</p>
                <Button onClick={() => window.location.reload()} className='bg-green-600 hover:bg-green-700 text-white'>
                  Thử lại
                </Button>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <p className='text-gray-600 mb-4'>Chưa có yêu cầu hỗ trợ nào</p>
                <Button onClick={handleCreateRequest} variant='yellow'>
                  <Plus className='w-4 h-4 mr-2' />
                  Tạo yêu cầu đầu tiên
                </Button>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Mã yêu cầu</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Tiêu đề</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Ngày gửi</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Trạng thái</th>
                      <th className='text-left py-4 px-6 font-medium text-gray-700'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRequests.map((request) => (
                      <tr key={request.id} className='border-b border-gray-100 hover:bg-gray-50'>
                        <td className='py-4 px-6 text-gray-900 font-medium'>
                          #{request.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className='py-4 px-6 text-gray-700'>{request.subject}</td>
                        <td className='py-4 px-6 text-gray-700'>{formatDate(request.createdAt)}</td>
                        <td className='py-4 px-6'>{getStatusBadge(request.status)}</td>
                        <td className='py-4 px-6'>
                          <button
                            onClick={() => handleViewDetails(request)}
                            className='text-yellow-600 text-sm font-medium hover:text-yellow-700'
                          >
                            Xem chi tiết →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className='flex flex-col gap-4 p-6 border-t border-gray-200 lg:flex-row lg:items-center lg:justify-between'>
              <div className='text-sm text-gray-700'>
                {`Hiển thị ${displayStart}-${displayEnd} trong tổng số ${filteredRequests.length} yêu cầu`}
              </div>
              {filteredRequests.length > pageSize && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Help Modal */}
      <CreateHelpModal isOpen={isCreateModalOpen} onClose={handleCloseModal} onSuccess={handleCreateSuccess} />

      {/* Detail Popup */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <FileText className='w-5 h-5 text-green-600' />
              Chi tiết yêu cầu hỗ trợ
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className='space-y-6'>
              {/* Request Info Card */}
              <Card>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Mã yêu cầu</p>
                      <p className='font-medium text-gray-900'>#{selectedRequest.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Loại yêu cầu</p>
                      <p className='font-medium text-gray-900'>{getFormTypeLabel(selectedRequest.type)}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Ngày gửi</p>
                      <p className='font-medium text-gray-900'>{selectedRequest.createdAt}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600 mb-1'>Trạng thái</p>
                      {getStatusDisplay(selectedRequest.status)}
                    </div>
                  </div>

                  {selectedRequest.orderId && (
                    <div className='mt-4 pt-4 border-t border-gray-200'>
                      <p className='text-sm text-gray-600 mb-1'>Mã đơn hàng</p>
                      <p className='font-medium text-gray-900'>{selectedRequest.orderId}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Request Section */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='text-lg font-semibold text-green-700'>Nội dung yêu cầu của bạn</h3>
                  <span className='text-sm text-gray-500'>Bạn đã gửi vào lúc {selectedRequest.createdAt}</span>
                </div>

                <Card>
                  <CardContent className='p-6'>
                    <div className='border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-lg'>
                      {/* Subject */}
                      <h4 className='font-semibold text-gray-900 mb-3'>{selectedRequest.subject}</h4>

                      {/* Description */}
                      <div className='whitespace-pre-line text-gray-700 mb-4'>{selectedRequest.description}</div>

                      {/* Attachments */}
                      {selectedRequest.imageUrl && selectedRequest.imageUrl.length > 0 && (
                        <div className='mt-4 pt-4 border-t border-gray-200'>
                          <p className='text-sm font-medium text-gray-700 mb-3'>Tệp đính kèm:</p>
                          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
                            {selectedRequest.imageUrl.map((url, index) => {
                              // Check if file is an image
                              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('image')
                              const isPdf = /\.pdf$/i.test(url) || url.includes('pdf')

                              return (
                                <div
                                  key={index}
                                  className='relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 hover:border-green-400 transition-all'
                                  onClick={() => {
                                    if (isImage) {
                                      setPreviewImages(selectedRequest.imageUrl || [])
                                      setPreviewInitialIndex(index)
                                      setImagePreviewOpen(true)
                                    } else {
                                      window.open(url, '_blank')
                                    }
                                  }}
                                >
                                  {isImage ? (
                                    <>
                                      <img
                                        src={url}
                                        alt={`Đính kèm ${index + 1}`}
                                        className='w-full h-32 object-cover group-hover:scale-105 transition-transform'
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement
                                          target.style.display = 'none'
                                        }}
                                      />
                                      <div className='absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                        <Eye className='w-6 h-6 text-white' />
                                      </div>
                                    </>
                                  ) : (
                                    <div className='w-full h-32 bg-gray-100 flex flex-col items-center justify-center p-2'>
                                      <Paperclip className='w-8 h-8 text-gray-400 mb-2' />
                                      <span className='text-xs text-gray-600 text-center truncate w-full'>
                                        {isPdf ? 'PDF' : getFileNameFromUrl(url)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Support Response Section - Only show if there's a reply from staff */}
              {selectedRequest.reply && selectedRequest.staffName && (
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-green-700'>Phản hồi từ đội ngũ hỗ trợ</h3>
                    <span className='text-sm text-gray-500'>
                      {selectedRequest.staffName} đã phản hồi vào lúc {selectedRequest.updatedAt}
                    </span>
                  </div>

                  <Card>
                    <CardContent className='p-6'>
                      <div className='border-l-4 border-yellow-500 bg-gray-50 p-4 rounded-r-lg'>
                        {/* Agent Info */}
                        <div className='flex items-center gap-3 mb-4'>
                          <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                            <User className='w-5 h-5 text-green-600' />
                          </div>
                          <div>
                            <p className='font-medium text-gray-900'>{selectedRequest.staffName}</p>
                            <p className='text-sm text-gray-600'>Chuyên viên hỗ trợ</p>
                          </div>
                        </div>

                        {/* Response Content */}
                        <div className='whitespace-pre-line text-gray-700'>{selectedRequest.reply}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Status Information */}
              {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Processing') && (
                <Card className='bg-blue-50 border-blue-200'>
                  <CardContent className='p-4'>
                    <div className='flex items-start gap-3'>
                      <Clock className='w-5 h-5 text-blue-600 mt-0.5' />
                      <div>
                        <p className='font-medium text-blue-900 mb-1'>
                          {selectedRequest.status === 'Pending' ? 'Yêu cầu đang chờ xử lý' : 'Yêu cầu đang được xử lý'}
                        </p>
                        <p className='text-sm text-blue-700'>
                          {selectedRequest.status === 'Pending'
                            ? 'Chúng tôi đã nhận được yêu cầu của bạn và sẽ xử lý trong thời gian sớm nhất.'
                            : 'Đội ngũ hỗ trợ đang xem xét và xử lý yêu cầu của bạn. Vui lòng chờ phản hồi.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons - Show Cancel button when status is Pending */}
              {selectedRequest.status === 'Pending' && (
                <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
                  <Button
                    variant='outline'
                    onClick={() => setShowCancelModal(true)}
                    className='border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700'
                  >
                    <X className='w-4 h-4 mr-2' />
                    Hủy đơn
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-red-700'>
              <AlertCircle className='w-6 h-6 text-red-600' />
              Xác nhận hủy yêu cầu hỗ trợ
            </DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn hủy yêu cầu hỗ trợ này không?</DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='rounded-2xl border-2 border-red-200 bg-red-50 p-6 space-y-3'>
              <div className='flex items-start gap-3'>
                <div className='flex-shrink-0 pt-0.5'>
                  <AlertCircle className='w-5 h-5 text-red-600' />
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-red-900 mb-2'>Lưu ý quan trọng</h3>
                  <p className='text-sm text-red-800'>
                    Sau khi hủy, yêu cầu hỗ trợ này sẽ không thể được khôi phục. Bạn sẽ cần tạo yêu cầu mới nếu cần hỗ trợ sau này.
                  </p>
                </div>
              </div>
            </div>
            {selectedRequest && (
              <div className='rounded-xl border border-gray-200 bg-gray-50 p-4'>
                <p className='text-sm text-gray-600 mb-1'>Mã yêu cầu</p>
                <p className='font-medium text-gray-900'>#{selectedRequest.id.substring(0, 8).toUpperCase()}</p>
                <p className='text-sm text-gray-600 mt-2 mb-1'>Tiêu đề</p>
                <p className='font-medium text-gray-900'>{selectedRequest.subject}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowCancelModal(false)}
              variant='outline'
              disabled={isCancelling}
              className='px-6'
            >
              <X className='w-4 h-4 mr-2' />
              Không hủy
            </Button>
            <Button
              onClick={handleCancelRequest}
              className='bg-red-600 hover:bg-red-700 text-white px-6'
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang hủy...
                </>
              ) : (
                <>
                  <XCircle className='w-4 h-4 mr-2' />
                  Xác nhận hủy
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        images={previewImages}
        initialIndex={previewInitialIndex}
        alt='Xem chi tiết hình ảnh đính kèm'
      />
    </div>
  )
}

export default HelpCenter
