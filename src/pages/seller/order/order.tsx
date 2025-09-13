import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent} from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Search, Eye } from 'lucide-react'

function OrderManagement() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const orders = [
    {
      id: 'DH001',
      date: '15/03/2024',
      customerName: 'Nguyễn Thị Lan',
      totalAmount: 450000,
      status: 'pending'
    },
    {
      id: 'DH002',
      date: '14/03/2024',
      customerName: 'Trần Văn Minh',
      totalAmount: 320000,
      status: 'delivering'
    },
    {
      id: 'DH003',
      date: '13/03/2024',
      customerName: 'Lê Thị Hoa',
      totalAmount: 680000,
      status: 'delivered'
    }
  ]

  const tabs = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending', label: 'Chờ xác nhận' },
    { key: 'delivering', label: 'Đang giao' },
    { key: 'delivered', label: 'Đã giao' },
    { key: 'cancelled', label: 'Đã hủy' }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className='bg-orange-100 text-orange-800 hover:bg-orange-100'>
            Chờ xác nhận
          </Badge>
        )
      case 'delivering':
        return (
          <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-100'>
            Đang giao
          </Badge>
        )
      case 'delivered':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100'>
            Đã giao
          </Badge>
        )
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>
            {status}
          </Badge>
        )
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status === activeTab
    const matchesSearch = searchTerm === '' ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesTab && matchesSearch
  })

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-green-700 mb-6'>Quản lý Đơn hàng</h1>

        {/* Tabs */}
        <div className='flex space-x-8 border-b border-gray-200 mb-6'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors ${activeTab === tab.key
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          <Input
            placeholder='Tìm theo Mã đơn hàng hoặc Tên khách hàng...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 rounded-lg border-gray-300'
          />
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-4 px-6 font-medium text-gray-700'>Mã đơn hàng</th>
                  <th className='text-left py-4 px-6 font-medium text-gray-700'>Ngày đặt</th>
                  <th className='text-left py-4 px-6 font-medium text-gray-700'>Tên khách hàng</th>
                  <th className='text-left py-4 px-6 font-medium text-gray-700'>Tổng tiền</th>
                  <th className='text-left py-4 px-6 font-medium text-gray-700'>Trạng thái</th>
                  <th className='text-left py-4 px-6 font-medium text-gray-700'>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className='border-b border-gray-100 hover:bg-gray-50'>
                    <td className='py-4 px-6 text-gray-900 font-medium'>#{order.id}</td>
                    <td className='py-4 px-6 text-gray-700'>{order.date}</td>
                    <td className='py-4 px-6 text-gray-700'>{order.customerName}</td>
                    <td className='py-4 px-6 text-gray-900 font-medium'>
                      {order.totalAmount.toLocaleString()}₫
                    </td>
                    <td className='py-4 px-6'>
                      {getStatusBadge(order.status)}
                    </td>
                    <td className='py-4 px-6'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-green-600 hover:text-green-700 hover:bg-green-50'
                        onClick={() => navigate(`/orderDetail/${order.id}`)}
                      >
                        <Eye className='w-4 h-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OrderManagement
