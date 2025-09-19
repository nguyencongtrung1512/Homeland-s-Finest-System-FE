import { useState } from 'react'
import { Card, Input, Select, DatePicker, Button, Table, Avatar, Tag, Pagination } from 'antd'
import { Search, Filter, Eye, Unlock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'

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
  status: 'locked'
  lockedDate: string
  reason: string
}

function LockedStores() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const storeData: StoreData[] = [
    {
      key: '1',
      store: {
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=100&auto=format&fit=crop',
        name: 'Fashion Store',
        id: 'ST001'
      },
      owner: {
        name: 'Nguyễn Thị Mai',
        email: 'mai.nguyen@email.com'
      },
      createdDate: '15/11/2024',
      products: 245,
      status: 'locked',
      lockedDate: '20/11/2024',
      reason: 'Vi phạm chính sách bán hàng'
    },
    {
      key: '2',
      store: {
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop',
        name: 'Tech World',
        id: 'ST002'
      },
      owner: {
        name: 'Trần Văn Nam',
        email: 'nam.tran@email.com'
      },
      createdDate: '12/11/2024',
      products: 89,
      status: 'locked',
      lockedDate: '18/11/2024',
      reason: 'Sản phẩm giả mạo'
    },
    {
      key: '3',
      store: {
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&auto=format&fit=crop',
        name: 'Home & Garden',
        id: 'ST003'
      },
      owner: {
        name: 'Lê Thị Hoa',
        email: 'hoa.le@email.com'
      },
      createdDate: '10/11/2024',
      products: 156,
      status: 'locked',
      lockedDate: '16/11/2024',
      reason: 'Không tuân thủ quy định vận chuyển'
    }
  ]

  const handleUnlock = (storeId: string) => {
    console.log('Unlocking store:', storeId)
    // Implement unlock logic
  }

  const columns: ColumnsType<StoreData> = [
    {
      title: 'Cửa hàng',
      dataIndex: 'store',
      key: 'store',
      render: (store) => (
        <div className="flex items-center gap-3">
          <Avatar src={store.avatar} size={40} />
          <div>
            <div className="font-medium text-gray-900">{store.name}</div>
            <div className="text-sm text-gray-500">#{store.id}</div>
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
          <div className="font-medium text-gray-900">{owner.name}</div>
          <div className="text-sm text-gray-500">{owner.email}</div>
        </div>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date) => <span className="text-gray-700">{date}</span>
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'products',
      key: 'products',
      render: (products) => <span className="text-gray-700">{products}</span>
    },
    {
      title: 'Ngày khóa',
      dataIndex: 'lockedDate',
      key: 'lockedDate',
      render: (date) => <span className="text-red-600 font-medium">{date}</span>
    },
    {
      title: 'Lý do khóa',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => (
        <span className="text-red-600 text-sm" title={reason}>
          {reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}
        </span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="red">Bị khóa</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            type="text"
            icon={<Eye size={16} />}
            onClick={() => navigate(`/storeDetail/${record.store.id}`)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
          />
          <Button
            type="text"
            icon={<Unlock size={16} />}
            onClick={() => handleUnlock(record.store.id)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
          />
        </div>
      )
    }
  ]

  const handleFilter = () => {
    console.log('Filtering with:', { searchText, categoryFilter, dateFilter })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cửa hàng bị khóa</h1>
        <p className="text-gray-600 mt-1">Quản lý các cửa hàng bị khóa do vi phạm quy định</p>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <AntSearch
              placeholder="Tìm kiếm theo tên cửa hàng hoặc ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<Search size={16} className="text-gray-400" />}
              className="w-full"
            />
          </div>

          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            className="w-40"
            placeholder="Tất cả ngành hàng"
          >
            <Option value="all">Tất cả ngành hàng</Option>
            <Option value="fashion">Thời trang</Option>
            <Option value="tech">Công nghệ</Option>
            <Option value="home">Gia dụng</Option>
          </Select>

          <DatePicker
            placeholder="mm/dd/yyyy"
            value={dateFilter}
            onChange={setDateFilter}
            className="w-40"
          />

          <Button
            type="primary"
            icon={<Filter size={16} />}
            onClick={handleFilter}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Lọc
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={storeData}
          pagination={false}
          className="w-full"
        />

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Hiển thị 1 đến 10 của 15 kết quả
          </div>
          <Pagination
            current={currentPage}
            total={15}
            pageSize={10}
            onChange={setCurrentPage}
            showSizeChanger={false}
            className="flex items-center gap-2"
          />
        </div>
      </Card>
    </div>
  )
}

export default LockedStores
