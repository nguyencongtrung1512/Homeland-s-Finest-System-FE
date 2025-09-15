import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'

interface Store {
  id: string
  name: string
  ownerName: string
  ownerEmail: string
  ownerAvatar: string
  createDate: string
  productCount: number
  status: 'active' | 'pending' | 'locked'
}

function StoreManagement() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Mock data
  const stores: Store[] = [
    {
      id: 'ST001',
      name: 'Fashion Store',
      ownerName: 'Nguyễn Thị Mai',
      ownerEmail: 'mai.nguyen@email.com',
      ownerAvatar: 'NM',
      createDate: '15/11/2024',
      productCount: 245,
      status: 'active'
    },
    {
      id: 'ST002',
      name: 'Tech World',
      ownerName: 'Trần Văn Nam',
      ownerEmail: 'nam.tran@email.com',
      ownerAvatar: 'TN',
      createDate: '12/11/2024',
      productCount: 89,
      status: 'pending'
    },
    {
      id: 'ST003',
      name: 'Home & Garden',
      ownerName: 'Lê Thị Hoa',
      ownerEmail: 'hoa.le@email.com',
      ownerAvatar: 'LH',
      createDate: '10/11/2024',
      productCount: 156,
      status: 'locked'
    },
    {
      id: 'ST004',
      name: 'Beauty Corner',
      ownerName: 'Phạm Văn Đức',
      ownerEmail: 'duc.pham@email.com',
      ownerAvatar: 'PD',
      createDate: '08/11/2024',
      productCount: 78,
      status: 'active'
    },
    {
      id: 'ST005',
      name: 'Sports Zone',
      ownerName: 'Hoàng Thị Lan',
      ownerEmail: 'lan.hoang@email.com',
      ownerAvatar: 'HL',
      createDate: '05/11/2024',
      productCount: 134,
      status: 'pending'
    }
  ]

  const getStatusConfig = (status: string) => {
    const configs = {
      active: {
        text: 'Hoạt động',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      },
      pending: {
        text: 'Chờ duyệt',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      },
      locked: {
        text: 'Bị khóa',
        bgColor: 'bg-red-100',
        textColor: 'text-red-600'
      }
    }
    return configs[status as keyof typeof configs] || configs.pending
  }

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      searchText === '' ||
      store.name.toLowerCase().includes(searchText.toLowerCase()) ||
      store.id.toLowerCase().includes(searchText.toLowerCase()) ||
      store.ownerName.toLowerCase().includes(searchText.toLowerCase())

    const matchesStatus = statusFilter === 'all' || store.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredStores.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentStores = filteredStores.slice(startIndex, endIndex)

  const handleView = (store: Store) => {
    navigate(`/admin/store/${store.id}`)
  }

  const handleFilter = () => {
    // Filter logic here
    console.log('Filtering with:', { searchText, statusFilter, dateFilter })
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-bold text-gray-900'>Quản lý cửa hàng</h1>
        </div>
      </div>

      {/* Search and Filter Section */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-end gap-4'>
            {/* Search Bar */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm theo tên cửa hàng hoặc ID...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-10 h-10'
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Tất cả trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='active'>Hoạt động</SelectItem>
                  <SelectItem value='pending'>Chờ duyệt</SelectItem>
                  <SelectItem value='locked'>Bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Filter */}
            <div className='w-40'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Ngày tạo</label>
              <Input
                placeholder='mm/dd/yyyy'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='h-10'
              />
            </div>

            {/* Filter Button */}
            <div>
              <Button
                onClick={handleFilter}
                className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg shadow-sm'
              >
                <Filter className='w-4 h-4 mr-2' />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách cửa hàng</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredStores.length)} của {filteredStores.length} cửa hàng
            </p>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50'>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Cửa hàng</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Chủ sở hữu</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Ngày tạo</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Sản phẩm</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Trạng thái</th>
                  <th className='text-left px-6 py-3 font-medium text-gray-700 text-sm'>Hành động</th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {currentStores.map((store) => {
                  const statusConfig = getStatusConfig(store.status)

                  return (
                    <tr key={store.id} className='border-b border-gray-100 hover:bg-gray-50'>
                      <td className='px-6 py-3'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='w-10 h-10'>
                            <AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold'>
                              {store.ownerAvatar}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{store.name}</p>
                            <p className='text-xs text-gray-600'>#{store.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-3'>
                        <div>
                          <p className='font-medium text-gray-900 text-sm'>{store.ownerName}</p>
                          <p className='text-xs text-gray-600'>{store.ownerEmail}</p>
                        </div>
                      </td>
                      <td className='px-6 py-3'>
                        <span className='text-sm text-gray-700'>{store.createDate}</span>
                      </td>
                      <td className='px-6 py-3'>
                        <span className='text-sm text-gray-700'>{store.productCount}</span>
                      </td>
                      <td className='px-6 py-3'>
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                        >
                          {statusConfig.text}
                        </div>
                      </td>
                      <td className='px-6 py-3'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleView(store)}
                          className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
                        >
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-600'>
              Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredStores.length)} của {filteredStores.length} kết quả
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className='h-8 px-3 flex items-center gap-1'
              >
                <ChevronLeft className='w-4 h-4' />
                Trước
              </Button>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant='outline'
                size='sm'
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className='h-8 px-3 flex items-center gap-1'
              >
                Sau
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StoreManagement
