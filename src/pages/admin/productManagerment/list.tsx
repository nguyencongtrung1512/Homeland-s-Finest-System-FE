import { useState } from 'react'
import { Card, Input, Select, DatePicker, Button, Table, Tag, Pagination } from 'antd'
import { Search, Filter, Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'

const { Search: AntSearch } = Input
const { Option } = Select

interface ProductData {
  key: string
  product: {
    image: string
    name: string
    id: string
  }
  store: string
  createdDate: string
  price: number
  status: 'pending' | 'approved' | 'rejected' | 'correction'
}

function ManagerProductAdmin() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const productData: ProductData[] = [
    {
      key: '1',
      product: {
        image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=100&auto=format&fit=crop',
        name: 'iPhone 15 Pro Max',
        id: 'SP001'
      },
      store: 'TechStore VN',
      createdDate: '15/11/2024',
      price: 29990000,
      status: 'pending'
    },
    {
      key: '2',
      product: {
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=100&auto=format&fit=crop',
        name: 'Áo sơ mi nam cao cấp',
        id: 'SP002'
      },
      store: 'Fashion House',
      createdDate: '14/11/2024',
      price: 450000,
      status: 'approved'
    },
    {
      key: '3',
      product: {
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=100&auto=format&fit=crop',
        name: 'Sách lập trình Python',
        id: 'SP003'
      },
      store: 'BookWorld',
      createdDate: '13/11/2024',
      price: 250000,
      status: 'rejected'
    },
    {
      key: '4',
      product: {
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=100&auto=format&fit=crop',
        name: 'Laptop Gaming MSI',
        id: 'SP004'
      },
      store: 'Gaming Pro',
      createdDate: '12/11/2024',
      price: 25500000,
      status: 'correction'
    }
  ]

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color='orange'>Chờ duyệt</Tag>
      case 'approved':
        return <Tag color='green'>Đã duyệt</Tag>
      case 'rejected':
        return <Tag color='red'>Từ chối</Tag>
      case 'correction':
        return <Tag color='orange'>Yêu cầu sửa</Tag>
      default:
        return <Tag>{status}</Tag>
    }
  }

  const formatPrice = (price: number) => {
    return price.toLocaleString('vi-VN') + '₫'
  }

  const columns: ColumnsType<ProductData> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (product) => (
        <div className='flex items-center gap-3'>
          <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
            <span className='text-xs text-gray-500'>IMG 48x48</span>
          </div>
          <div>
            <div className='font-medium text-gray-900'>{product.name}</div>
            <div className='text-sm text-gray-500'>#{product.id}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'store',
      key: 'store',
      render: (store) => <span className='text-gray-700'>{store}</span>
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date) => <span className='text-gray-700'>{date}</span>
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span className='font-medium text-gray-900'>{formatPrice(price)}</span>
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
        <Button
          type='text'
          icon={<Eye size={16} />}
          onClick={() => navigate(`/detailProduct/${record.product.id}`)}
          className='flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100'
        />
      )
    }
  ]

  const handleFilter = () => {
    console.log('Filtering with:', { searchText, statusFilter, categoryFilter, dateFilter })
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
              prefix={<Search size={16} className='text-gray-400' />}
              className='w-full'
            />
          </div>

          <Select value={statusFilter} onChange={setStatusFilter} className='w-40' placeholder='Trạng thái'>
            <Option value='all'>Tất cả</Option>
            <Option value='pending'>Chờ duyệt</Option>
            <Option value='approved'>Đã duyệt</Option>
            <Option value='rejected'>Từ chối</Option>
            <Option value='correction'>Yêu cầu sửa</Option>
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
        <Table columns={columns} dataSource={productData} pagination={false} className='w-full' />

        {/* Pagination */}
        <div className='flex items-center justify-between mt-6'>
          <div className='text-sm text-gray-600'>Hiển thị 1 đến 4 của 24 kết quả</div>
          <Pagination
            current={currentPage}
            total={24}
            pageSize={4}
            onChange={setCurrentPage}
            showSizeChanger={false}
            className='flex items-center gap-2'
          />
        </div>
      </Card>
    </div>
  )
}

export default ManagerProductAdmin
