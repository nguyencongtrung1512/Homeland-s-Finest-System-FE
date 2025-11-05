import { useState, useEffect } from 'react'
import { Card, Input, Select, DatePicker, Button, Table, Tag, Pagination, message } from 'antd'
import { Search, Filter, Eye, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { adminApi, type AdminProduct, type Staff } from '../../../apis/admin.api'
import { staffApi, type StaffInfo } from '../../../apis/staff.api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Button as UIButton } from '../../../components/ui/button'
import StaffComboBox from '../../../components/ui/staff-combo-box'
import { toast } from '../../../utils/toast'

const { Search: AntSearch } = Input
const { Option } = Select

interface ProductTableData {
  key: string
  product: {
    image: string
    name: string
    id: string
  }
  storeId: string
  createdDate: string
  price: number | null
  status: string
  assignedToId: string | null
}

function ManagerProductAdmin() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('Approved')
  const [dateFilter, setDateFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [staffNames, setStaffNames] = useState<Map<string, string>>(new Map())
  const [loadingStaff, setLoadingStaff] = useState<Set<string>>(new Set())

  // States for assign staff modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loadingStaffList, setLoadingStaffList] = useState(false)
  const [assigning, setAssigning] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params: {
        pageSize: number
        pageNumber: number
        status?: 'Pending' | 'Processing' | 'Confirmed' | 'Rejected' | 'Denied' | 'Approved'
        search?: string
      } = {
        pageSize,
        pageNumber: currentPage
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter as 'Pending' | 'Processing' | 'Confirmed' | 'Rejected' | 'Denied' | 'Approved'
      }

      if (searchText) {
        params.search = searchText
      }

      const response = await adminApi.getProducts(params)

      if (response.data) {
        setProducts(response.data)
        if (response.pagination) {
          setTotalItems(response.pagination.totalItems)
        } else {
          setTotalItems(response.data.length)
        }
      } else {
        setProducts([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      message.error('Không thể tải danh sách sản phẩm')
      setProducts([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // Fetch staff info by ID
  const fetchStaffInfo = async (staffId: string) => {
    // Check if already in cache or loading
    if (staffNames.has(staffId) || loadingStaff.has(staffId)) {
      return
    }

    try {
      setLoadingStaff((prev) => new Set(prev).add(staffId))
      const response = await staffApi.getStaffInfo(staffId)

      // Response structure: response.data = { status, message, data: StaffInfo }
      const staffInfo: StaffInfo | undefined =
        response.data?.data || (response.data as StaffInfo) || (response as unknown as StaffInfo)

      if (staffInfo && staffInfo.firstName && staffInfo.lastName) {
        const fullName = `${staffInfo.firstName} ${staffInfo.lastName}`.trim()

        setStaffNames((prev) => {
          const newMap = new Map(prev)
          newMap.set(staffId, fullName)
          return newMap
        })
      }
    } catch (error) {
      console.error(`Error fetching staff info for ${staffId}:`, error)
    } finally {
      setLoadingStaff((prev) => {
        const newSet = new Set(prev)
        newSet.delete(staffId)
        return newSet
      })
    }
  }

  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, statusFilter])

  // Fetch staff info for all assigned staff when products change
  useEffect(() => {
    products.forEach((product) => {
      if (product.assignedToId && !staffNames.has(product.assignedToId) && !loadingStaff.has(product.assignedToId)) {
        fetchStaffInfo(product.assignedToId)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  // Load staff list for assign modal
  const loadStaffList = async () => {
    try {
      setLoadingStaffList(true)
      const response = await adminApi.getAllStaff()

      if (response && response.data && Array.isArray(response.data)) {
        setStaffList(response.data)
      } else {
        setStaffList([])
      }
    } catch (error) {
      console.error('Error loading staff list:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên')
      setStaffList([])
    } finally {
      setLoadingStaffList(false)
    }
  }

  // Handle open assign modal
  const handleOpenAssignModal = (productId: string) => {
    setSelectedProductId(productId)
    setSelectedStaffId('')
    setShowAssignModal(true)
    loadStaffList()
  }

  // Handle close assign modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false)
    setSelectedProductId(null)
    setSelectedStaffId('')
    setStaffList([])
  }

  // Handle assign staff
  const handleAssignStaff = async () => {
    if (!selectedProductId || !selectedStaffId) {
      toast.error('Vui lòng chọn nhân viên')
      return
    }

    try {
      setAssigning(true)
      const response = await adminApi.reassignProduct(selectedProductId, selectedStaffId)

      const successMessage = (response as { message?: string })?.message || 'Gán nhân viên thành công'

      toast.success(successMessage)
      handleCloseAssignModal()
      await fetchProducts() // Refresh product list

      // Refresh staff name for the newly assigned staff
      if (selectedStaffId) {
        await fetchStaffInfo(selectedStaffId)
      }
    } catch (error) {
      console.error('Error assigning staff:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Có lỗi xảy ra khi gán nhân viên'
      toast.error(errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  // Transform products to table data
  const productTableData: ProductTableData[] = products.map((product) => ({
    key: product.id,
    product: {
      image: product.productImages && product.productImages.length > 0 ? product.productImages[0] : '',
      name: product.name,
      id: product.id
    },
    storeId: product.storeId,
    createdDate: product.createdAt,
    price: product.price,
    status: product.status,
    assignedToId: product.assignedToId
  }))

  const getStatusTag = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Tag color='orange'>Chờ duyệt</Tag>
      case 'processing':
        return <Tag color='blue'>Đang xử lý</Tag>
      case 'confirmed':
        return <Tag color='cyan'>Đã xác nhận</Tag>
      case 'approved':
        return <Tag color='green'>Đã duyệt</Tag>
      case 'rejected':
        return <Tag color='red'>Từ chối xử lí </Tag>
      case 'denied':
        return <Tag color='red'>Từ chối</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const formatDate = (dateString: string) => {
    // Format: "19:23:34 21/10/2025" -> "21/10/2025"
    if (dateString.includes(' ')) {
      return dateString.split(' ')[1] || dateString
    }
    return dateString
  }

  const columns: ColumnsType<ProductTableData> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (product) => (
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden'>
            {product.image ? (
              <img src={product.image} alt={product.name} className='w-full h-full object-cover' />
            ) : (
              <span className='text-xs text-gray-500'>IMG</span>
            )}
          </div>
          <div>
            <div className='font-medium text-gray-900'>{product.name}</div>
            <div className='text-sm text-gray-500'>#{product.id.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    // {
    //   title: 'Cửa hàng',
    //   dataIndex: 'storeId',
    //   key: 'storeId',
    //   render: (storeId) => <span className='text-gray-700'>{storeId.slice(0, 8)}...</span>
    // },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date) => <span className='text-gray-700'>{formatDate(date)}</span>
    },
    {
      title: 'Nhân viên xử lý',
      dataIndex: 'assignedToId',
      key: 'assignedToId',
      render: (assignedToId: string | null) => {
        if (!assignedToId) {
          return <span className='text-gray-400'>Chưa phân công</span>
        }

        const staffName = staffNames.get(assignedToId)
        const isLoading = loadingStaff.has(assignedToId)

        if (isLoading) {
          return <span className='text-gray-400'>Đang tải...</span>
        }

        return <span className='text-gray-700'>{staffName || assignedToId.slice(0, 8) + '...'}</span>
      }
    },

    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <div className='flex items-center gap-2'>
          <Button
            type='text'
            icon={<Eye size={16} />}
            onClick={() => navigate(`/admin/productManagement/detail-product/${record.product.id}`)}
            className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100'
            title='Xem chi tiết'
          />
          <Button
            type='text'
            icon={<UserPlus size={16} />}
            onClick={() => handleOpenAssignModal(record.product.id)}
            className='flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100'
            title='Gán nhân viên'
          />
        </div>
      )
    }
  ]

  const handleFilter = () => {
    setCurrentPage(1)
    fetchProducts()
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
    fetchProducts()
  }

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page)
    if (size) {
      setPageSize(size)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Quản lý sản phẩm</h1>
        <p className='text-gray-600 mt-1'>Duyệt và quản lý tất cả sản phẩm trên hệ thống</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className='flex flex-wrap items-center gap-4'>
          <div className='flex-1 min-w-[300px]'>
            <AntSearch
              placeholder='Tên sản phẩm hoặc ID...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              prefix={<Search size={16} className='text-gray-400' />}
              className='w-full'
            />
          </div>

          <Select value={statusFilter} onChange={setStatusFilter} className='w-40' placeholder='Trạng thái'>
            <Option value='Pending'>Chờ duyệt</Option>
            <Option value='Processing'>Đang xử lý</Option>
            <Option value='Confirmed'>Đã xác nhận</Option>
            <Option value='Approved'>Đã duyệt</Option>
            <Option value='Rejected'>Từ chối</Option>
            <Option value='Denied'>Từ chối xử lý</Option>
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
        <Table
          columns={columns}
          dataSource={productTableData}
          pagination={false}
          loading={loading}
          rowKey='key'
          className='w-full'
        />

        {/* Pagination */}
        <div className='flex items-center justify-between mt-6'>
          <div className='text-sm text-gray-600'>
            Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, totalItems)} của{' '}
            {totalItems} kết quả
          </div>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            disabled={loading}
            className='flex items-center gap-2'
          />
        </div>
      </Card>

      {/* Assign Staff Modal */}
      <Dialog open={showAssignModal} onOpenChange={handleCloseAssignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gán nhân viên xử lý</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div>
              <Label htmlFor='staff-select' className='text-sm font-medium'>
                Chọn nhân viên
              </Label>
              {loadingStaffList ? (
                <div className='mt-2 flex items-center justify-center py-4 border border-gray-300 rounded-lg'>
                  <span className='text-sm text-gray-500'>Đang tải danh sách nhân viên...</span>
                </div>
              ) : (
                <div className='mt-2'>
                  <StaffComboBox
                    options={staffList}
                    placeholder='Chọn nhân viên xử lý...'
                    value={selectedStaffId}
                    onSelect={(staffId) => setSelectedStaffId(staffId || '')}
                    disabled={assigning}
                  />
                </div>
              )}
              {staffList.length > 0 && !loadingStaffList && (
                <p className='text-xs text-gray-500 mt-1'>Tìm thấy {staffList.length} nhân viên</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <UIButton variant={'outline'} onClick={handleCloseAssignModal} disabled={assigning}>
              Hủy
            </UIButton>
            <UIButton
              onClick={handleAssignStaff}
              disabled={!selectedStaffId || assigning}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {assigning ? 'Đang gán...' : 'Xác nhận'}
            </UIButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ManagerProductAdmin
