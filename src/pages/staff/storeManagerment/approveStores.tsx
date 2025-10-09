import { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Avatar,
  Tag,
  Pagination,
  Spin,
  Modal,
  Form,
  Upload
} from 'antd'
import { Search, Filter, Eye, RefreshCw, Upload as UploadIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { staffApi, type AssignedStore, type ReviewStoreRequest } from '../../../apis/staff.api'
import { toast } from 'react-toastify'

const { Search: AntSearch } = Input
const { Option } = Select

interface StoreData {
  key: string
  store: {
    avatar: string
    name: string
    id: string
  }
  owner: {
    name: string
    email: string
  }
  createdDate: string
  products: number
  status: 'Processing' | 'ReviewedByStaff'
}

function ApproveStores() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [storeData, setStoreData] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalStores, setTotalStores] = useState(0)
  const pageSize = 10

  // Review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewForm] = Form.useForm()
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // Function để convert API response thành UI format
  const convertAssignedStore = (apiStore: AssignedStore): StoreData => {
    // Tạo avatar từ tên store
    const avatarText = apiStore.storeName
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)

    // Format date
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN')
    }

    return {
      key: apiStore.id,
      store: {
        avatar: avatarText,
        name: apiStore.storeName,
        id: apiStore.id
      },
      owner: {
        name: 'Chủ cửa hàng',
        email: 'N/A'
      },
      createdDate: formatDate(apiStore.createdAt),
      products: 0,
      status: apiStore.status
    }
  }

  // Function để fetch assigned stores
  const fetchAssignedStores = async () => {
    try {
      setLoading(true)
      setError(null)

      // Lấy staffId từ localStorage
      const userString = localStorage.getItem('user')
      let staffId = null

      if (userString) {
        try {
          const user = JSON.parse(userString)
          staffId = user.userId || user.id
        } catch (parseError) {
          // Silent error handling
        }
      }

      if (!staffId) {
        setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.')
        return
      }

      const response = await staffApi.getAssignedStores(staffId, {
        pageSize: 100, // Lấy tất cả để có thể filter ở frontend
        pageNumber: 1
      })

      // axiosInstance trả về response.data, không phải full response
      // Nên response chính là data từ API
      if (response && Array.isArray(response)) {
        // Trường hợp API trả về array trực tiếp
        const convertedStores = response.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else if (response && response.data && Array.isArray(response.data)) {
        // Trường hợp API trả về object với data property
        const convertedStores = response.data.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else if (response && response.status === 200 && response.data && Array.isArray(response.data)) {
        // Trường hợp API trả về full response object
        const convertedStores = response.data.map(convertAssignedStore)
        setStoreData(convertedStores)
        setTotalStores(convertedStores.length)
      } else {
        setError('Định dạng dữ liệu không đúng')
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải danh sách cửa hàng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Load stores khi component mount
  useEffect(() => {
    fetchAssignedStores()
  }, [])

  // Handle image selection and preview
  const handleImageChange = (info: any) => {
    const fileList = info.fileList
    const files = fileList.map((file: any) => file.originFileObj).filter(Boolean)

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

  const handleReviewSubmit = async (values: ReviewStoreRequest) => {
    if (!selectedStore) return

    // Kiểm tra có ít nhất 1 ảnh
    if (selectedImages.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 hình ảnh')
      return
    }

    try {
      setReviewLoading(true)

      const response = await staffApi.reviewStore(selectedStore.store.id, {
        ...values,
        selectedImages: selectedImages
      })

      // Check success conditions - axiosInstance returns response.data (data payload only)
      // Success indicators: có storeId, newStatus, reviewedByStaffId, decisionDate
      if (response && response.storeId && response.newStatus && response.reviewedByStaffId && response.decisionDate) {
        toast.success('Đánh giá cửa hàng thành công!')
        setReviewModalOpen(false)
        reviewForm.resetFields()
        setSelectedImages([])
        setImagePreviews([])
        fetchAssignedStores() // Refresh data
      } else if (response && response.status === 202) {
        // Fallback: check status if available
        toast.success('Đánh giá cửa hàng thành công!')
        setReviewModalOpen(false)
        reviewForm.resetFields()
        setSelectedImages([])
        setImagePreviews([])
        fetchAssignedStores() // Refresh data
      } else if (response && response.message && response.message.includes('thành công')) {
        // Fallback: check if message contains success keywords
        toast.success('Đánh giá cửa hàng thành công!')
        setReviewModalOpen(false)
        reviewForm.resetFields()
        setSelectedImages([])
        setImagePreviews([])
        fetchAssignedStores() // Refresh data
      } else {
        console.error('❌ Unexpected response format:', response)
        toast.error(`Lỗi: ${response?.message || 'Không thể đánh giá cửa hàng'}`)
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi đánh giá cửa hàng')
    } finally {
      setReviewLoading(false)
    }
  }

  const columns: ColumnsType<StoreData> = [
    {
      title: 'Cửa hàng',
      dataIndex: 'store',
      key: 'store',
      render: (store) => (
        <div className='flex items-center gap-3'>
          <Avatar src={store.avatar} size={40} />
          <div>
            <div className='font-medium text-gray-900'>{store.name}</div>
            <div className='text-sm text-gray-500'>#{store.id}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner) => (
        <div>
          <div className='font-medium text-gray-900'>{owner.name}</div>
          <div className='text-sm text-gray-500'>{owner.email}</div>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date) => <span className='text-gray-700'>{date}</span>
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'products',
      key: 'products',
      render: (products) => <span className='text-gray-700'>{products}</span>
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          Processing: { color: 'blue', text: 'Đang xử lý' },
          ReviewedByStaff: { color: 'green', text: 'Đã xem xét' }
        }
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status }
        return <Tag color={config.color}>{config.text}</Tag>
      }
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <div className='flex items-center gap-2'>
          <Button
            type='text'
            icon={<Eye size={16} />}
            onClick={() => navigate(`/staff/store-detail/${record.store.id}`)}
            className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100'
            title='Xem chi tiết'
          />
        </div>
      )
    }
  ]

  const handleFilter = () => {
    // Implement filter logic
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Duyệt cửa hàng</h1>
          <p className='text-gray-600 mt-1'>Xem xét và phê duyệt các cửa hàng được phân công</p>
        </div>
        <Button
          onClick={fetchAssignedStores}
          disabled={loading}
          icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
          className='flex items-center gap-2'
        >
          {loading ? 'Đang tải...' : 'Làm mới'}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex-1 min-w-[300px]'>
            <AntSearch
              placeholder='Tìm kiếm theo tên cửa hàng hoặc ID...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<Search size={16} className='text-gray-400' />}
              className='w-full'
            />
          </div>

          <Select value={categoryFilter} onChange={setCategoryFilter} className='w-40' placeholder='Tất cả ngành hàng'>
            <Option value='all'>Tất cả ngành hàng</Option>
            <Option value='fashion'>Thời trang</Option>
            <Option value='tech'>Công nghệ</Option>
            <Option value='home'>Gia dụng</Option>
          </Select>

          <DatePicker placeholder='mm/dd/yyyy' value={dateFilter} onChange={setDateFilter} className='w-40' />

          <Button
            type='primary'
            icon={<Filter size={16} />}
            onClick={handleFilter}
            className='bg-blue-600 hover:bg-blue-700'
          >
            Lọc
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <Spin size='large' />
            <span className='ml-3 text-gray-600'>Đang tải danh sách cửa hàng...</span>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-red-500 text-lg mb-2'>⚠️</div>
              <p className='text-red-600 font-medium mb-4'>{error}</p>
              <Button onClick={fetchAssignedStores} type='primary'>
                Thử lại
              </Button>
            </div>
          </div>
        ) : storeData.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='text-gray-400 text-lg mb-2'>📦</div>
              <p className='text-gray-600'>Chưa có cửa hàng nào được phân công</p>
            </div>
          </div>
        ) : (
          <>
            <Table columns={columns} dataSource={storeData} pagination={false} className='w-full' />

            {/* Pagination */}
            <div className='flex items-center justify-between mt-6'>
              <div className='text-sm text-gray-600'>
                Hiển thị 1 đến {Math.min(pageSize, totalStores)} của {totalStores} kết quả
              </div>
              <Pagination
                current={currentPage}
                total={totalStores}
                pageSize={pageSize}
                onChange={setCurrentPage}
                showSizeChanger={false}
                className='flex items-center gap-2'
              />
            </div>
          </>
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        title={`Đánh giá cửa hàng: ${selectedStore?.store.name}`}
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
            label='Trạng thái'
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          >
            <Select disabled>
              <Option value='ReviewedByStaff'>Đã xem xét</Option>
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
            name='StaffFeedback'
            label='Phản hồi của nhân viên'
            rules={[{ required: true, message: 'Vui lòng nhập phản hồi' }]}
          >
            <Input.TextArea rows={4} placeholder='Nhập phản hồi về cửa hàng...' />
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

export default ApproveStores
