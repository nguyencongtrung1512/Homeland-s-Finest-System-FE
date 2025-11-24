import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Search,
  BarChart2,
} from 'lucide-react'
import { formApi } from '../../../apis/form.api'
import { storeApi } from '../../../apis/store.api'
import type { FormDTO, FormStatus, FormType } from '../../../types/form.type'
import { toast } from 'react-toastify'
import AssignStaffModal from './components/AssignStaffModal'
import FormDetailModal from './components/FormDetailModal'
import { CopyButton } from '../../../components/ui/copy'
import Pagination from '../../../components/Pagination/Pagination'

export default function FormStoreManagement() {
  const [forms, setForms] = useState<FormDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<FormStatus | 'all'>('all')
  const [selectedType, setSelectedType] = useState<FormType | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedFormForAssign, setSelectedFormForAssign] = useState<{ id: string; subject: string } | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<string>('')
  const [storeNames, setStoreNames] = useState<Record<string, string>>({})

  const navigate = useNavigate()
  const hasStoreId = useCallback((id: FormDTO['storeId']): id is string => Boolean(id), [])
  // const handleResetFilters = () => {
  //   setSelectedStatus('all')
  //   setSelectedType('all')
  //   setSearchTerm('')
  // }
  // const hasActiveFilters = useMemo(
  //   () => selectedStatus !== 'all' || selectedType !== 'all' || Boolean(searchTerm.trim()),
  //   [searchTerm, selectedStatus, selectedType]
  // )

  // Load store-related forms (exclude ComplaintOrder)
  const loadForms = async () => {
    try {
      setLoading(true)
      const response = await formApi.getAllForms({
        pageSize: 0,
        pageNumber: 1,
        sortBy: 'createdat',
        sortOrder: 'desc'
      })
      const storeForms = (response || []).filter((f) => f.type !== 'ComplaintOrder')
      setForms(storeForms)
    } catch (error) {
      console.error('Error loading store complaints:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khiếu nại cửa hàng')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
  }, [])

  useEffect(() => {
    const storeIds = Array.from(new Set(forms.map((form) => form.storeId).filter(hasStoreId)))
    const missingIds = storeIds.filter((id) => !storeNames[id])
    if (missingIds.length === 0) return

    const fetchStoreNames = async () => {
      try {
        const results = await Promise.all(
          missingIds.map(async (id) => {
            try {
              const response = await storeApi.getStoreById(id)
              const storeName = response?.storeName || response?.data?.storeName || id
              return { id, storeName }
            } catch (error) {
              console.error(`Error fetching store ${id}:`, error)
              return { id, storeName: 'Không tìm thấy' }
            }
          })
        )

        setStoreNames((prev) => {
          const updated = { ...prev }
          results.forEach(({ id, storeName }) => {
            updated[id] = storeName
          })
          return updated
        })
      } catch (error) {
        console.error('Error fetching store names:', error)
      }
    }

    fetchStoreNames()
  }, [forms, hasStoreId, storeNames])

  // Filter forms based on status, type and search
  const filteredForms = useMemo(() => {
    let filtered = forms

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((form) => form.status === selectedStatus)
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter((form) => form.type === selectedType)
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (form) =>
          form.subject.toLowerCase().includes(term) ||
          form.description.toLowerCase().includes(term) ||
          form.id.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [forms, selectedStatus, selectedType, searchTerm])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedStatus, selectedType, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredForms.length / pageSize))
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentForms = filteredForms.slice(startIndex, endIndex)

  const stats = useMemo(() => {
    const pendingCount = forms.filter((form) => form.status === 'Pending').length
    const processingCount = forms.filter((form) => form.status === 'Processing').length
    const uniqueStoreCount = new Set(forms.map((form) => form.storeId).filter(hasStoreId)).size

    return {
      pendingCount,
      processingCount,
      uniqueStoreCount,
      total: forms.length,
      filtered: filteredForms.length
    }
  }, [filteredForms, forms, hasStoreId])

  // Get status icon and styling
  const getStatusInfo = (status: FormStatus) => {
    switch (status) {
      case 'Pending':
        return {
          icon: <Clock className='w-4 h-4 text-yellow-500' />,
          badge: 'secondary',
          text: 'Chờ phân công',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50'
        }
      case 'Processing':
        return {
          icon: <AlertCircle className='w-4 h-4 text-blue-500' />,
          badge: 'default',
          text: 'Chờ xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByStaff':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Chấp nhận bởi nhân viên',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối bởi nhân viên',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'Rejected':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Bị từ chối',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'Confirmed':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Nhân viên đang xử lý',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'Cancel':
        return {
          icon: <XCircle className='w-4 h-4 text-gray-500' />,
          badge: 'outline',
          text: 'Đã hủy',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
      default:
        return {
          icon: <Clock className='w-4 h-4 text-gray-500' />,
          badge: 'secondary',
          text: status,
          color: 'text-gray-700',
          bgColor: 'bg-gray-50'
        }
    }
  }

  const getTypeText = (type: FormType) => {
    switch (type) {
      case 'ComplaintContent':
        return 'Khiếu nại nội dung'
      case 'SupportRefundMoney':
        return 'Hỗ trợ hoàn tiền'
      case 'ReportSeller':
        return 'Báo cáo người bán'
      case 'SupportAccount':
        return 'Hỗ trợ tài khoản'
      case 'SupportPayment':
        return 'Hỗ trợ thanh toán'
      case 'SupportTechnical':
        return 'Hỗ trợ kỹ thuật'
      case 'RequestInformation':
        return 'Yêu cầu thông tin'
      case 'FeedbackSuggestion':
        return 'Phản hồi góp ý'
      case 'PrivacyDataRequest':
        return 'Yêu cầu dữ liệu cá nhân'
      case 'SupportMarketing':
        return 'Hỗ trợ marketing'
      case 'SupportOther':
        return 'Hỗ trợ khác'
      default:
        return type
    }
  }

  const handleAssignStaff = (formId: string, formSubject: string) => {
    setSelectedFormForAssign({ id: formId, subject: formSubject })
    setShowAssignModal(true)
  }

  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedFormForAssign(null)
  }

  const handleAssignSuccess = () => {
    loadForms()
  }

  const handleViewDetail = (formId: string) => {
    setSelectedFormId(formId)
    setShowDetailModal(true)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedFormId('')
  }

  const handleStoreClick = (storeId: string) => {
    navigate(`/admin/storeManagement/store-detail/${storeId}`)
  }

  if (loading) {
    return <Loading size='lg' text='Đang tải khiếu nại cửa hàng...' />
  }

  return (
    <div className='max-w-7xl mx-auto p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-2'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Khiếu nại cửa hàng</h1>
          </div>
        </div>
        <Button onClick={loadForms} variant='outline' className='text-green-600 border-green-600 hover:bg-green-50'>
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <Card className='mb-6 border border-gray-100 shadow-sm py-2'>
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-base   text-gray-800'>
            <BarChart2 className='w-5 h-5 text-blue-600' />
            Thống kê
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            <div className='rounded-xl border border-blue-100 bg-blue-50/60 p-4'>
              <p className=' uppercase text-blue-600'>Tổng form</p>
              <p className='text-2xl   text-blue-900 mt-1'>{stats.total}</p>
              <p className='text-xs text-blue-700 mt-1'>Tất cả khiếu nại cửa hàng</p>
            </div>
            <div className='rounded-xl border border-green-100 bg-green-50/70 p-4'>
              <p className=' uppercase text-green-600'>Đang hiển thị</p>
              <p className='text-2xl   text-green-900 mt-1'>{stats.filtered}</p>
              <p className='text-xs text-green-700 mt-1'>Theo bộ lọc hiện tại</p>
            </div>
            <div className='rounded-xl border border-amber-100 bg-amber-50/70 p-4'>
              <p className=' uppercase tracking-wide text-amber-600'>Cần xử lý</p>
              <p className='text-2xl   text-amber-900 mt-1'>{stats.pendingCount}</p>
              <p className='text-xs text-amber-700 mt-1'>Trạng thái chờ phân công</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className='mb-6 py-2'>
        <CardContent>
          <div className='flex flex-nowrap gap-4 overflow-x-auto pb-2'>
            {/* Search */}
            <div className='min-w-[260px] flex-1'>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Tìm kiếm</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm theo tiêu đề, mô tả'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />

              </div>
            </div>

            {/* Status Filter */}
            <div className='min-w-[220px]'>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={(value: FormStatus | 'all') => setSelectedStatus(value)}>
                <SelectTrigger className='capitalize w-[250px]'>
                  <SelectValue placeholder='Chọn trạng thái'>
                    {selectedStatus === 'all' ? 'Tất cả' : getStatusInfo(selectedStatus as FormStatus).text}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='Pending'>Chờ phân công</SelectItem>
                  <SelectItem value='Processing'>Chờ xử lý</SelectItem>
                  <SelectItem value='ApprovedByStaff'>Chấp nhận bởi nhân viên</SelectItem>
                  <SelectItem value='DeniedByStaff'>Từ chối bởi nhân viên</SelectItem>
                  <SelectItem value='ApprovedByAdmin'>Đã duyệt</SelectItem>
                  <SelectItem value='DeniedByAdmin'>Từ chối</SelectItem>
                  <SelectItem value='Rejected'>Bị từ chối</SelectItem>
                  <SelectItem value='Confirmed'>Nhân viên đang xử lý</SelectItem>
                  <SelectItem value='Cancel'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className='min-w-[220px]'>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Loại khiếu nại</Label>
              <Select value={selectedType} onValueChange={(value: FormType | 'all') => setSelectedType(value)}>
                <SelectTrigger className='capitalize w-[250px]'>
                  <SelectValue placeholder='Chọn loại'>
                    {selectedType === 'all' ? 'Tất cả' : getTypeText(selectedType as FormType)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='ComplaintContent'>Khiếu nại nội dung</SelectItem>
                  <SelectItem value='SupportRefundMoney'>Hỗ trợ hoàn tiền</SelectItem>
                  <SelectItem value='ReportSeller'>Báo cáo người bán</SelectItem>
                  <SelectItem value='SupportAccount'>Hỗ trợ tài khoản</SelectItem>
                  <SelectItem value='SupportPayment'>Hỗ trợ thanh toán</SelectItem>
                  <SelectItem value='SupportTechnical'>Hỗ trợ kỹ thuật</SelectItem>
                  <SelectItem value='RequestInformation'>Yêu cầu thông tin</SelectItem>
                  <SelectItem value='FeedbackSuggestion'>Phản hồi góp ý</SelectItem>
                  <SelectItem value='PrivacyDataRequest'>Yêu cầu dữ liệu cá nhân</SelectItem>
                  <SelectItem value='SupportMarketing'>Hỗ trợ marketing</SelectItem>
                  <SelectItem value='SupportOther'>Hỗ trợ khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      {filteredForms.length > 0 ? (
        <div className='space-y-4'>
          {currentForms.map((form) => {
            const statusInfo = getStatusInfo(form.status)
            const storeId = form.storeId
            return (
              <Card key={form.id} className='hover:shadow-lg transition-shadow border border-gray-100'>
                <CardHeader className='pb-4 border-b border-gray-100'>
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-wrap items-center gap-2 text-xs font-medium text-gray-700'>
                      <span className='px-3 py-1 text-center text-xl rounded-full bg-green-50 text-green-700 border border-green-100'>
                        {getTypeText(form.type)}
                      </span>
                      <Badge
                        variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                        className={`${statusInfo.bgColor} ${statusInfo.color} border-0 flex items-center gap-1`}
                      >
                        {statusInfo.icon}
                        {statusInfo.text}
                      </Badge>
                    </div>
                    <div className='flex flex-wrap items-center gap-2 text-xs font-medium text-gray-700'>
                      {hasStoreId(storeId) && (
                        <button
                          type='button'
                          onClick={() => handleStoreClick(storeId)}
                          className='flex items-center gap-1 text-xs text-green-600 hover:text-green-700 underline-offset-2 hover:underline'
                          title='Xem chi tiết cửa hàng'
                        >
                          Cửa hàng: {storeNames[storeId] || 'Đang tải...'}
                        </button>
                      )}
                      {form.orderId && (
                        <div className='flex items-center gap-2'>
                          <CopyButton
                            textToCopy={form.orderId}
                            idleText={`${form.orderId}`}
                            copiedText='Đã copy'
                            className='h-7 px-3 text-xs bg-white text-green-700 border border-green-200 hover:bg-green-50'
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className='text-lg   text-gray-900 mb-1'>{form.subject}</h3>
                      <p className='text-sm text-gray-600 line-clamp-2'>{form.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='space-y-3'>
                    {/* Images */}
                    {form.imageUrl && form.imageUrl.length > 0 && (
                      <div>
                        <p className='text-xs text-gray-500 mb-2'>Hình ảnh đính kèm:</p>
                        <div className='flex gap-2 flex-wrap'>
                          {form.imageUrl.map((imageUrl: string, index: number) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`Attachment ${index + 1}`}
                              className='w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={() => window.open(imageUrl, '_blank')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/src/assets/react.svg'
                                target.alt = 'Image not available'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Staff Assignment Info */}
                    {form.staffName && (
                      <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
                        <p className='text-sm text-blue-800'>
                          <span className='font-medium'>Đã phân công cho:</span> {form.staffName}
                        </p>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className='flex items-center gap-4 text-xs text-gray-500 pt-2 border-t'>
                      <div className='flex items-center gap-1'>
                        <Calendar className='w-3 h-3' />
                        Tạo: {form.createdAt}
                      </div>
                      {form.updatedAt && form.updatedAt !== form.createdAt && (
                        <div className='flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          Cập nhật: {form.updatedAt}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className='flex gap-2 pt-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleViewDetail(form.id)}
                        className='text-green-600 border-green-600 hover:bg-green-50'
                      >
                        Xem chi tiết
                      </Button>
                      {form.status === 'Pending' && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleAssignStaff(form.id, form.subject)}
                          className='text-blue-600 border-blue-600 hover:bg-blue-50'
                        >
                          <UserPlus className='w-4 h-4 mr-2' />
                          Phân công nhân viên
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          <div className='flex flex-col gap-3 border-t border-gray-100 pt-4'>
            <p className='text-sm text-gray-600'>
              Hiển thị {filteredForms.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredForms.length)} của{' '}
              {filteredForms.length} kết quả
            </p>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      ) : (
        <EmptyState
          title='Không có khiếu nại cửa hàng'
          description='Không tìm thấy khiếu nại cửa hàng nào phù hợp với bộ lọc hiện tại.'
          type='search'
        />
      )}

      {/* Assign Staff Modal */}
      {selectedFormForAssign && (
        <AssignStaffModal
          isOpen={showAssignModal}
          onClose={handleCloseAssignModal}
          formId={selectedFormForAssign.id}
          formSubject={selectedFormForAssign.subject}
          onSuccess={handleAssignSuccess}
        />
      )}

      {/* Form Detail Modal */}
      <FormDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        formId={selectedFormId}
        onSuccess={loadForms}
      />
    </div>
  )
}
