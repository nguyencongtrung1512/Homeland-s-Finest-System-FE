import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, UserPlus, Search, Filter } from 'lucide-react'
import { formApi, type FormDTO, type FormStatus, type FormType } from '../../../apis/form.api'
import { toast } from 'react-toastify'
import AssignStaffModal from './components/AssignStaffModal'
import FormDetailModal from './components/FormDetailModal'

export default function AdminFormManagement() {
  const [forms, setForms] = useState<FormDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<FormStatus | 'all'>('all')
  const [selectedType, setSelectedType] = useState<FormType | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedFormForAssign, setSelectedFormForAssign] = useState<{ id: string; subject: string } | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedFormId, setSelectedFormId] = useState<string>('')

  // Load forms from API
  const loadForms = async () => {
    try {
      setLoading(true)
      const response = await formApi.getAllForms({
        pageSize: 0, // Load all forms
        pageNumber: 1,
        sortBy: 'createdat',
        sortOrder: 'desc'
      })
      setForms(response || [])
    } catch (error) {
      console.error('Error loading forms:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách khiếu nại')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForms()
  }, [])

  // Filter forms based on selected filters
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
          text: 'Đang xử lý',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50'
        }
      case 'ApprovedByStaff':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt (Staff)',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByStaff':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối (Staff)',
          color: 'text-red-700',
          bgColor: 'bg-red-50'
        }
      case 'ApprovedByAdmin':
        return {
          icon: <CheckCircle className='w-4 h-4 text-green-500' />,
          badge: 'default',
          text: 'Đã duyệt (Admin)',
          color: 'text-green-700',
          bgColor: 'bg-green-50'
        }
      case 'DeniedByAdmin':
        return {
          icon: <XCircle className='w-4 h-4 text-red-500' />,
          badge: 'destructive',
          text: 'Từ chối (Admin)',
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
          text: 'Đã xác nhận',
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

  // Get type text in Vietnamese
  const getTypeText = (type: FormType) => {
    switch (type) {
      case 'SupportAccount':
        return 'Hỗ trợ tài khoản'
      case 'SupportPayment':
        return 'Hỗ trợ thanh toán'
      case 'SupportTechnical':
        return 'Hỗ trợ kỹ thuật'
      case 'ComplaintContent':
        return 'Khiếu nại nội dung'
      case 'RequestInformation':
        return 'Yêu cầu thông tin'
      case 'ReportSeller':
        return 'Báo cáo người bán'
      case 'FeedbackSuggestion':
        return 'Phản hồi góp ý'
      case 'PrivacyDataRequest':
        return 'Yêu cầu dữ liệu cá nhân'
      case 'SupportMarketing':
        return 'Hỗ trợ marketing'
      case 'SupportOther':
        return 'Hỗ trợ khác'
      case 'SupportRefundMoney':
        return 'Hỗ trợ hoàn tiền'
      default:
        return type
    }
  }

  // Handle assign staff
  const handleAssignStaff = (formId: string, formSubject: string) => {
    setSelectedFormForAssign({ id: formId, subject: formSubject })
    setShowAssignModal(true)
  }

  // Handle assign modal close
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedFormForAssign(null)
  }

  // Handle assign success
  const handleAssignSuccess = () => {
    loadForms() // Reload forms to get updated status
  }

  // Handle view form detail
  const handleViewDetail = (formId: string) => {
    setSelectedFormId(formId)
    setShowDetailModal(true)
  }

  // Handle close detail modal
  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedFormId('')
  }

  if (loading) {
    return <Loading size='lg' text='Đang tải danh sách khiếu nại...' />
  }

  return (
    <div className='max-w-7xl mx-auto p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý khiếu nại</h1>
          <p className='text-gray-600 mt-1'>Quản lý và phân công xử lý các khiếu nại từ khách hàng</p>
        </div>
        <Button onClick={loadForms} variant='outline' className='text-green-600 border-green-600 hover:bg-green-50'>
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='w-5 h-5' />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {/* Search */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Tìm kiếm</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm theo tiêu đề, mô tả, ID...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={(value: FormStatus | 'all') => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả</SelectItem>
                  <SelectItem value='Pending'>Chờ phân công</SelectItem>
                  <SelectItem value='Processing'>Đang xử lý</SelectItem>
                  <SelectItem value='ApprovedByStaff'>Đã duyệt (Staff)</SelectItem>
                  <SelectItem value='DeniedByStaff'>Từ chối (Staff)</SelectItem>
                  <SelectItem value='ApprovedByAdmin'>Đã duyệt (Admin)</SelectItem>
                  <SelectItem value='DeniedByAdmin'>Từ chối (Admin)</SelectItem>
                  <SelectItem value='Rejected'>Bị từ chối</SelectItem>
                  <SelectItem value='Confirmed'>Đã xác nhận</SelectItem>
                  <SelectItem value='Cancel'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Loại khiếu nại</Label>
              <Select value={selectedType} onValueChange={(value: FormType | 'all') => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn loại' />
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

            {/* Stats */}
            <div>
              <Label className='text-sm font-medium text-gray-700 mb-2 block'>Thống kê</Label>
              <div className='bg-gray-50 rounded-lg p-3'>
                <p className='text-sm text-gray-600'>
                  Tổng: <span className='font-medium'>{forms.length}</span>
                </p>
                <p className='text-sm text-gray-600'>
                  Hiển thị: <span className='font-medium'>{filteredForms.length}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      {filteredForms.length > 0 ? (
        <div className='space-y-4'>
          {filteredForms.map((form) => {
            const statusInfo = getStatusInfo(form.status)
            return (
              <Card key={form.id} className='hover:shadow-md transition-shadow'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-3 mb-2'>
                        <span className='font-medium text-gray-900'>#{form.id}</span>
                        <Badge
                          variant={statusInfo.badge as 'default' | 'secondary' | 'destructive' | 'outline'}
                          className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}
                        >
                          <div className='flex items-center gap-1'>
                            {statusInfo.icon}
                            {statusInfo.text}
                          </div>
                        </Badge>
                        <Badge variant='outline' className='text-xs'>
                          {getTypeText(form.type)}
                        </Badge>
                      </div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-2'>{form.subject}</h3>
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
                          {form.imageUrl.map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`Attachment ${index + 1}`}
                              className='w-16 h-16 object-cover rounded border'
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
                      {form.updatedAt !== form.createdAt && (
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
        </div>
      ) : (
        <EmptyState
          title='Không có khiếu nại nào'
          description='Không tìm thấy khiếu nại nào phù hợp với bộ lọc hiện tại.'
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
