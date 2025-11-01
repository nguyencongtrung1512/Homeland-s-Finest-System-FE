import { useState, useEffect } from 'react'
import { Card, Button, Avatar, Spin, Modal, Form, Upload, Input, Select } from 'antd'
import {
  ArrowLeft,
  Store,
  User,
  FileText,
  Clock,
  Edit,
  Mail,
  Phone,
  CreditCard,
  Upload as UploadIcon
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { staffApi, type ReviewStoreRequest } from '../../../apis/staff.api'
import { toast } from 'react-toastify'

const { Option } = Select

function StaffStoreDetail() {
  const navigate = useNavigate()
  const { storeId } = useParams<{ storeId: string }>()
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewForm] = Form.useForm()
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('')

  const handleBack = () => {
    navigate(-1)
  }

  const fetchStoreDetail = async () => {
    if (!storeId) {
      setError('Không tìm thấy ID cửa hàng')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreById(storeId)
      console.log('data', response)
      // Handle different response formats
      let storeData = null
      if (response) {
        if ('id' in response || 'storeName' in response) {
          storeData = response
        } else if ('data' in response && response.data && ('id' in response.data || 'storeName' in response.data)) {
          storeData = response.data
        }
      }

      if (storeData) {
        setStore(storeData as StoreResponse)
      } else {
        setError('Không tìm thấy thông tin cửa hàng')
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải thông tin cửa hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreDetail()
  }, [storeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReview = () => {
    if (store) {
      setReviewModalOpen(true)
      reviewForm.resetFields()
    }
  }

  // Handle image selection and preview
  const handleImageChange = (info: { fileList: Array<{ originFileObj?: File }> }) => {
    const fileList = info.fileList
    const files = fileList.map((file) => file.originFileObj).filter(Boolean) as File[]

    setSelectedImages(files)

    // Create previews
    const previews = files.map((file: File) => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  // Remove image
  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    setSelectedImages(newImages)
    setImagePreviews(newPreviews)
  }
  const handleImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl)
    setImagePreviewOpen(true)
  }

  const handleCloseImagePreview = () => {
    setImagePreviewOpen(false)
    setPreviewImageUrl('')
  }

  const handleReviewSubmit = async (values: ReviewStoreRequest) => {
    if (!store || !storeId) return

    // Kiểm tra có ít nhất 1 ảnh
    if (selectedImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hình ảnh')
      return
    }

    try {
      setReviewLoading(true)

      const response = await staffApi.reviewStore(storeId, {
        ...values,
        selectedImages: selectedImages
      })

      // Check success conditions
      if (response) {
        toast.success('Đánh giá cửa hàng thành công!')
        setReviewModalOpen(false)
        reviewForm.resetFields()
        setSelectedImages([])
        setImagePreviews([])
        fetchStoreDetail() // Refresh store data
      } else {
        console.error('❌ Unexpected response format:', response)
        toast.error('Không thể đánh giá cửa hàng')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi đánh giá cửa hàng')
    } finally {
      setReviewLoading(false)
    }
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusDisplay = (status: string) => {
    const statusMap = {
      Processing: { text: 'Đang xử lý', color: 'blue' },
      ApprovedByStaff: { text: 'Đã chấp nhận', color: 'green' },
      RejectedByStaff: { text: 'Đã từ chối', color: 'red' },
      Approved: { text: 'Đã duyệt', color: 'green' },
      Rejected: { text: 'Từ chối', color: 'red' },
      Active: { text: 'Hoạt động', color: 'green' },
      Inactive: { text: 'Không hoạt động', color: 'gray' }
    }
    return statusMap[status as keyof typeof statusMap] || { text: status, color: 'gray' }
  }

  const getStoreAvatar = (storeName: string) => {
    return storeName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getFullAddress = (store: StoreResponse) => {
    return `${store.address}, ${store.ward}, ${store.district}, ${store.province}`
  }

  const getFullName = (userInfo: { firstName?: string | null; lastName?: string | null }) => {
    const firstName = userInfo.firstName || ''
    const lastName = userInfo.lastName || ''
    return `${firstName} ${lastName}`.trim() || 'Chưa cập nhật'
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Spin size='large' />
        <span className='ml-3 text-gray-600'>Đang tải thông tin cửa hàng...</span>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='text-red-500 text-lg mb-2'>⚠️</div>
          <p className='text-red-600 font-medium mb-4'>{error || 'Không tìm thấy thông tin cửa hàng'}</p>
          <Button onClick={handleBack} type='primary'>
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const statusDisplay = getStatusDisplay(store.status)

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button
            type='text'
            icon={<ArrowLeft size={16} />}
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            Trở về danh sách cửa hàng
          </Button>
        </div>
        <h1 className='text-2xl font-bold text-gray-900'>Chi tiết cửa hàng</h1>
        <div></div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Store Information */}
          <Card
            title={
              <div className='flex items-center gap-2 text-blue-600'>
                <Store size={18} />
                <span>Thông tin cửa hàng</span>
              </div>
            }
            className='border-l-4 border-l-blue-500'
          >
            <div className='flex items-start gap-4 mb-4'>
              <div className='w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center'>
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.storeName} className='w-full h-full object-cover rounded-lg' />
                ) : (
                  <span className='text-white text-2xl font-bold'>{getStoreAvatar(store.storeName)}</span>
                )}
              </div>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <h2 className='text-xl font-bold text-gray-900'>{store.storeName}</h2>
                  <div className='flex items-center gap-1'>
                    <div
                      className={`w-3 h-3 rounded-full ${statusDisplay.color === 'green' ? 'bg-green-500' : statusDisplay.color === 'orange' ? 'bg-orange-500' : statusDisplay.color === 'blue' ? 'bg-blue-500' : statusDisplay.color === 'red' ? 'bg-red-500' : 'bg-gray-500'}`}
                    ></div>
                    <span
                      className={`font-medium ${statusDisplay.color === 'green' ? 'text-green-600' : statusDisplay.color === 'orange' ? 'text-orange-600' : statusDisplay.color === 'blue' ? 'text-blue-600' : statusDisplay.color === 'red' ? 'text-red-600' : 'text-gray-600'}`}
                    >
                      {statusDisplay.text}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <div>
                  <span className='text-sm text-gray-500'>Tên doanh nghiệp:</span>
                  <p className='font-medium text-gray-900'>{store.sellerInfo.businessName || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <span className='text-sm text-gray-500'>Địa chỉ kinh doanh:</span>
                  <p className='font-medium text-gray-900'>{getFullAddress(store)}</p>
                </div>
              </div>
              <div className='space-y-3'>
                <div>
                  <span className='text-sm text-gray-500'>Ngày đăng ký:</span>
                  <p className='font-medium text-gray-900'>{formatDate(store.createdAt)}</p>
                </div>
                <div>
                  <span className='text-sm text-gray-500'>Số lượng sản phẩm:</span>
                  <div className='flex items-center gap-2'>
                    <p className='font-medium text-gray-900'>{store.products?.length || 0} sản phẩm</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Representative */}
          <Card
            title={
              <div className='flex items-center gap-2 text-purple-600'>
                <User size={18} />
                <span>Người đại diện pháp lý</span>
              </div>
            }
            className='border-l-4 border-l-purple-500'
          >
            <div className='flex items-start gap-4'>
              <Avatar size={64} src={store.sellerInfo.userInfo.avatar} className='border-2 border-gray-200'>
                {!store.sellerInfo.userInfo.avatar && getStoreAvatar(getFullName(store.sellerInfo.userInfo))}
              </Avatar>
              <div className='flex-1'>
                <h3 className='text-lg font-bold text-gray-900 mb-3'>{getFullName(store.sellerInfo.userInfo)}</h3>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Mail size={16} className='text-gray-400' />
                    <span className='text-gray-700'>{store.sellerInfo.userInfo.email}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Phone size={16} className='text-gray-400' />
                    <span className='text-gray-700'>{store.sellerInfo.userInfo.phoneNumber || 'Chưa cập nhật'}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CreditCard size={16} className='text-gray-400' />
                    <span className='text-gray-700'>{store.sellerInfo.identifyCard || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className='mt-6'>
              <p className='text-sm text-gray-500 mb-3'>Ảnh CMND/CCCD</p>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-2'>Mặt trước</p>
                  {store.sellerInfo.identifyFrontImage ? (
                    <img
                      src={store.sellerInfo.identifyFrontImage}
                      alt='CMND mặt trước'
                      className='w-full h-full object-cover rounded-lg border'
                    />
                  ) : (
                    <div className='w-full h-full bg-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300'>
                      <div className='text-center'>
                        <div className='w-16 h-10 bg-blue-600 rounded mb-2 mx-auto'></div>
                        <p className='text-xs text-blue-600'>Chưa có ảnh</p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className='text-sm text-gray-500 mb-2'>Mặt sau</p>
                  {store.sellerInfo.identifyBackImage ? (
                    <img
                      src={store.sellerInfo.identifyBackImage}
                      alt='CMND mặt sau'
                      className='w-full h-full object-cover rounded-lg border'
                    />
                  ) : (
                    <div className='w-full h-full bg-red-100 rounded-lg flex items-center justify-center border-2 border-dashed border-red-300'>
                      <div className='text-center'>
                        <div className='w-16 h-10 bg-red-600 rounded mb-2 mx-auto'></div>
                        <p className='text-xs text-red-600'>Chưa có ảnh</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Documents & Bank Account */}
          <Card
            title={
              <div className='flex items-center gap-2 text-green-600'>
                <FileText size={18} />
                <span>Giấy tờ & tài khoản pháp lý</span>
              </div>
            }
            className='border-l-4 border-l-green-500'
          >
            <div className='space-y-6'>
              {/* Certification Documents */}
              <div>
                <h4 className='font-semibold text-gray-900 mb-3'>Giấy tờ chứng nhận</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <FileText size={16} className='text-gray-400' />
                      <span className='text-gray-700'>Giấy phép kinh doanh</span>
                    </div>
                    {store.vendorApplicationImageUrl && store.vendorApplicationImageUrl.length > 0 ? (
                      <div className='space-y-2'>
                        <p className='text-sm font-medium text-gray-700'>
                          Ảnh giấy phép ({store.vendorApplicationImageUrl.length} ảnh)
                        </p>
                        <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                          {store.vendorApplicationImageUrl.map((imageUrl, index) => (
                            <div
                              key={index}
                              className='cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={() => handleImagePreview(imageUrl)}
                            >
                              <img
                                src={imageUrl}
                                alt={`Giấy phép ${index + 1}`}
                                className='w-full h-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow'
                              />
                              <p className='text-xs text-center text-gray-500 mt-1'>Ảnh {index + 1}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className='text-gray-400 text-sm'>Chưa có</span>
                    )}
                  </div>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-3'>
                      <FileText size={16} className='text-gray-400' />
                      <span className='text-gray-700'>Mã số thuế</span>
                    </div>
                    <span className='text-gray-700'>{store.sellerInfo.taxCode || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>

              {/* Bank Account Information */}
              <div>
                <h4 className='font-semibold text-gray-900 mb-3'>Thông tin tài khoản ngân hàng</h4>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <span className='text-sm text-gray-500'>Số tài khoản</span>
                    <p className='font-medium text-gray-900'>
                      {store.sellerInfo.userInfo.bankAccount || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <span className='text-sm text-gray-500'>Chủ tài khoản</span>
                    <p className='font-medium text-gray-900'>{getFullName(store.sellerInfo.userInfo)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Processing History */}
          <Card
            title={
              <div className='flex items-center gap-2 text-orange-600'>
                <Clock size={18} />
                <span>Lịch sử xử lý</span>
              </div>
            }
            className='border-l-4 border-l-orange-500'
          >
            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <div className='w-3 h-3 bg-blue-500 rounded-full mt-2'></div>
                <div>
                  <p className='font-medium text-gray-900'>Đăng ký cửa hàng</p>
                  <p className='text-sm text-gray-500'>{formatDate(store.createdAt)}</p>
                </div>
              </div>
              {store.submittedDate && (
                <div className='flex items-start gap-3'>
                  <div className='w-3 h-3 bg-orange-500 rounded-full mt-2'></div>
                  <div>
                    <p className='font-medium text-gray-900'>Nộp hồ sơ</p>
                    <p className='text-sm text-gray-500'>{formatDate(store.submittedDate)}</p>
                  </div>
                </div>
              )}
              {store.decisionDate && (
                <div className='flex items-start gap-3'>
                  <div
                    className={`w-3 h-3 rounded-full mt-2 ${store.status === 'Approved' ? 'bg-green-500' : store.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'}`}
                  ></div>
                  <div>
                    <p className='font-medium text-gray-900'>
                      {store.status === 'Approved'
                        ? 'Duyệt cửa hàng thành công'
                        : store.status === 'Rejected'
                          ? 'Từ chối duyệt cửa hàng'
                          : 'Cập nhật trạng thái'}
                    </p>
                    <p className='text-sm text-gray-500'>{formatDate(store.decisionDate)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Staff Notes & Feedback */}
          {store.staffNotes && (
            <Card
              title={
                <div className='flex items-center gap-2 text-indigo-600'>
                  <FileText size={18} />
                  <span>Ghi chú của nhân viên</span>
                </div>
              }
              className='border-l-4 border-l-indigo-500'
            >
              <div className='space-y-4'>
                {store.staffNotes && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Ghi chú của nhân viên</h4>
                    <p className='text-gray-700 bg-gray-50 p-3 rounded-lg'>{store.staffNotes}</p>
                  </div>
                )}
                {store.staffImage && (
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-2'>Ảnh từ nhân viên</h4>
                    <div
                      className='cursor-pointer hover:opacity-80 transition-opacity'
                      onClick={() => handleImagePreview(store.staffImage!)}
                    >
                      <img
                        src={store.staffImage}
                        alt='Ảnh từ nhân viên'
                        className='w-full max-w-md h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow'
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className='space-y-6'>
          <Card
            title={
              <div className='flex items-center gap-2 text-gray-600'>
                <Edit size={18} />
                <span>Hành động</span>
              </div>
            }
            className='border-l-4 border-l-gray-400'
          >
            <div className='space-y-3'>
              {/* Add Review button if store status allows it */}
              {store && store.status === 'Processing' && (
                <Button
                  type='primary'
                  icon={<FileText size={16} />}
                  onClick={handleReview}
                  className='w-full bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600'
                  size='large'
                >
                  Đánh giá cửa hàng
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Modal
        open={imagePreviewOpen}
        onCancel={handleCloseImagePreview}
        footer={null}
        width='80%'
        style={{ maxWidth: '800px' }}
        centered
        className='image-preview-modal'
      >
        <div className='text-center'>
          <img src={previewImageUrl} alt='Preview' className='w-full h-auto max-h-[70vh] object-contain rounded-lg' />
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal
        title={`Đánh giá cửa hàng: ${store?.storeName}`}
        open={reviewModalOpen}
        onCancel={() => {
          setReviewModalOpen(false)
          reviewForm.resetFields()
          setSelectedImages([])
          setImagePreviews([])
        }}
        footer={null}
        width={600}
      >
        <Form form={reviewForm} layout='vertical' onFinish={handleReviewSubmit}>
          <Form.Item
            name='NewStatus'
            label='Quyết định'
            rules={[{ required: true, message: 'Vui lòng chọn quyết định' }]}
          >
            <Select placeholder='Chọn quyết định đánh giá'>
              <Option value='ApprovedByStaff'>Chấp nhận cửa hàng</Option>
              <Option value='RejectedByStaff'>Từ chối cửa hàng</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='StaffNotes'
            label='Ghi chú của nhân viên'
            rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
          >
            <Input.TextArea rows={4} placeholder='Nhập ghi chú về cửa hàng...' />
          </Form.Item>

          <Form.Item
            name='StaffImages'
            label='Hình ảnh đính kèm (Bắt buộc)'
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 hình ảnh' }]}
          >
            <div className='space-y-4'>
              <Upload
                multiple
                beforeUpload={() => false} // Prevent auto upload
                onChange={handleImageChange}
                showUploadList={false}
                accept='image/*'
              >
                <Button icon={<UploadIcon size={16} />}>Chọn hình ảnh</Button>
              </Upload>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className='grid grid-cols-2 gap-4'>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className='relative border rounded-lg p-2'>
                      <img src={preview} alt={`Preview ${index + 1}`} className='w-full h-32 object-cover rounded' />
                      <button
                        type='button'
                        onClick={() => removeImage(index)}
                        className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600'
                      >
                        ×
                      </button>
                      <div className='text-xs text-gray-500 mt-1 truncate'>{selectedImages[index]?.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Form.Item>

          <div className='flex justify-end gap-2 mt-4'>
            <Button
              onClick={() => {
                setReviewModalOpen(false)
                reviewForm.resetFields()
                setSelectedImages([])
                setImagePreviews([])
              }}
            >
              Hủy
            </Button>
            <Button type='primary' htmlType='submit' loading={reviewLoading}>
              Xác nhận đánh giá
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default StaffStoreDetail
