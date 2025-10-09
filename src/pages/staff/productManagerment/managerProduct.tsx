import { useState, useEffect } from 'react'
import { Card, Input, Select, DatePicker, Button, Table, Tag, Pagination, message } from 'antd'
import { Search, Filter, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import { staffApi, type ProductForReview } from '../../../apis/staff.api'
import { useAuth } from '../../../contexts/auth.context'
import path from '../../../constants/path'

const { Search: AntSearch } = Input
const { Option } = Select

function ManagerProduct() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductForReview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch products for review
  const fetchProductsForReview = async (page: number = 1, search: string = '', status: string = 'all') => {
    try {
      setLoading(true)

      if (!user?.userId) {
        message.error('Không tìm thấy thông tin staff')
        return
      }

      const params = {
        pageNumber: page,
        pageSize: pageSize,
        ...(search && { search }),
        ...(status !== 'all' && { status })
      }

      const response = await staffApi.getProductsForReview(user.userId, params)

      if (response) {
        setProducts(response.data)
        if (response.pagination) {
          setTotalItems(response.pagination.totalItems)
          setTotalPages(response.pagination.totalPages)
        } else {
          setTotalItems(0)
          setTotalPages(0)
        }
      } else {
        message.error('Không thể tải danh sách sản phẩm')
        setProducts([])
        setTotalItems(0)
        setTotalPages(0)
      }
    } catch (error) {
      message.error('Có lỗi xảy ra khi tải dữ liệu')
      setProducts([])
      setTotalItems(0)
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }

  // Load products on component mount
  useEffect(() => {
    if (user?.userId) {
      fetchProductsForReview(currentPage, searchText, statusFilter)
    }
  }, [user?.userId, currentPage])

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Tag color='orange'>Chờ duyệt</Tag>
      case 'approved':
        return <Tag color='green'>Đã duyệt</Tag>
      case 'rejected':
        return <Tag color='red'>Từ chối</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const [time, date] = dateString.split(' ')
      const [day, month, year] = date.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return dateString
    }
  }

  const columns: ColumnsType<ProductForReview> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden'>
            {record.productImages && record.productImages.length > 0 ? (
              <img
                src={record.productImages[0]}
                alt={name}
                className='w-full h-full object-cover'
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling!.style.display = 'flex'
                }}
              />
            ) : null}
            <span className='text-xs text-gray-500'>IMG</span>
          </div>
          <div>
            <div className='font-medium text-gray-900'>{name}</div>
            <div className='text-sm text-gray-500'>#{record.id.slice(0, 8)}...</div>
          </div>
        </div>
      )
    },
    {
      title: 'Loại sản phẩm',
      dataIndex: 'typeProduct',
      key: 'typeProduct',
      render: (typeProduct) => <span className='text-gray-700'>{typeProduct}</span>
    },
    {
      title: 'Xuất xứ',
      dataIndex: 'madeBy',
      key: 'madeBy',
      render: (madeBy) => <span className='text-gray-700'>{madeBy}</span>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span className='text-gray-700'>{formatDate(date)}</span>
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating, record) => (
        <span className='text-gray-700'>
          {rating.toFixed(1)} ⭐ ({record.reviewCount})
        </span>
      )
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
            onClick={() => {
              const detailPath = `${path.detailProductStaff.replace(':id', record.id)}`
              navigate(detailPath)
            }}
            className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100'
            title='Xem chi tiết'
          />
        </div>
      )
    }
  ]

  const handleFilter = () => {
    setCurrentPage(1)
    fetchProductsForReview(1, searchText, statusFilter)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchProductsForReview(page, searchText, statusFilter)
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrentPage(1)
    fetchProductsForReview(1, value, statusFilter)
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Quản lý sản phẩm</h1>
        <p className='text-gray-600 mt-1'>Duyệt và quản lý tất cả sản phẩm được phân công</p>
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
            <Option value='all'>Tất cả</Option>
            <Option value='Pending'>Chờ duyệt</Option>
            <Option value='Approved'>Đã duyệt</Option>
            <Option value='Rejected'>Từ chối</Option>
          </Select>

          <Select value={categoryFilter} onChange={setCategoryFilter} className='w-40' placeholder='Danh mục'>
            <Option value='all'>Tất cả</Option>
            <Option value='electronics'>Điện tử</Option>
            <Option value='fashion'>Thời trang</Option>
            <Option value='books'>Sách</Option>
            <Option value='gaming'>Gaming</Option>
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
          dataSource={products}
          pagination={false}
          loading={loading}
          rowKey="id"
          className='w-full'
        />

        {/* Pagination */}
        <div className='flex items-center justify-between mt-6'>
          <div className='text-sm text-gray-600'>
            Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(currentPage * pageSize, totalItems)} của {totalItems} kết quả
          </div>
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            onChange={handlePageChange}
            showSizeChanger={false}
            showQuickJumper={false}
            disabled={loading}
            hideOnSinglePage={false}
          />
        </div>
      </Card>
    </div>
  )
}

export default ManagerProduct
