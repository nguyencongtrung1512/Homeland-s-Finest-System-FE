import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Avatar } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'

export default function Profile() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className='min-h-screen bg-[#f8f9f5]'>
      {/* Profile Header */}
      <div className='bg-white p-6 border-b'>
        <div className='flex items-center gap-4'>
          <Avatar className='w-20 h-20'>
            <img src='/src/assets/react.svg' alt='Profile' className='w-full h-full object-cover rounded-full' />
          </Avatar>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>Chào mừng trở lại, Minh Anh</h1>
            <p className='text-sm text-gray-500'>Thành viên từ Tháng 1 năm 2024</p>
          </div>
        </div>
      </div>

      <div className='flex'>
        {/* Sidebar */}
        <div className='w-64 bg-white min-h-screen border-r'>
          <div className='p-4'>
            <h3 className='font-medium text-gray-900 mb-4'>Quản lý tài khoản</h3>
            <nav className='space-y-2'>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'profile' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                🔧 Thông tin cá nhân
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'orders' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                📋 Đơn hàng của tôi
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 p-6'>
          {activeTab === 'profile' && <ProfileContent />}
          {activeTab === 'orders' && <OrdersContent />}
        </div>
      </div>
    </div>
  )
}

function ProfileContent() {
  return (
    <div className='max-w-2xl'>
      <h2 className='text-lg font-semibold text-gray-900 mb-6'>Thông tin cá nhân</h2>

      {/* Stats Cards */}
      <div className='grid grid-cols-3 gap-4 mb-8'>
        <div className='bg-white p-4 rounded-lg border text-center'>
          <div className='text-2xl font-bold text-green-600'>24</div>
          <div className='text-sm text-gray-500'>Đơn hàng hoàn thành</div>
        </div>
        <div className='bg-white p-4 rounded-lg border text-center'>
          <div className='text-2xl font-bold text-green-600'>1250</div>
          <div className='text-sm text-gray-500'>Điểm tích lũy</div>
        </div>
        <div className='bg-white p-4 rounded-lg border text-center'>
          <div className='text-2xl font-bold text-green-600'>6</div>
          <div className='text-sm text-gray-500'>Sản phẩm yêu thích</div>
        </div>
      </div>

      {/* Profile Form */}
      <div className='bg-white p-6 rounded-lg border'>
        <div className='grid grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='fullName'>Họ và tên</Label>
            <Input id='fullName' defaultValue='Nguyễn Minh Anh' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' defaultValue='minhanh@email.com' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='phone'>Số điện thoại</Label>
            <Input id='phone' defaultValue='0362 345 678' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='birthDate'>Ngày sinh</Label>
            <Input id='birthDate' type='date' defaultValue='1990-01-15' className='mt-1' />
          </div>
        </div>

        <div className='mt-6'>
          <Button className='bg-[#2D5016] hover:bg-[#1f3710] text-white'>Cập nhật thông tin</Button>
        </div>
      </div>
    </div>
  )
}

function OrdersContent() {
  const orders = [
    {
      id: 'SH6E764506940',
      status: 'Đã giao hàng',
      statusColor: 'bg-green-100 text-green-800',
      products: ['Cafe Rang I Sóc Trăng Phương Vy', 'Cà phê Robusta Đắk Lắk Thượng Hạng Quận Góng'],
      total: '199.000đ',
      deliveryInfo: {
        address: '123 Đường Loa Hương Thống Nhất, Thành Phố Biên Hòa, Đồng Nai',
        name: 'Đức Đỗ Minh',
        phone: '0943 675 XXX'
      }
    },
    {
      id: 'SH6E764506941',
      status: 'Đã giao hàng',
      statusColor: 'bg-green-100 text-green-800',
      products: ['Gia vị Tôm Khô Cà Mau Đặc Biệt Quận Góng', 'Tôm Khô Đặc Sản Thượng Hạng Cà Mau Quận Góng'],
      total: '265.000đ',
      deliveryInfo: {
        address: '123 Đường Loa Hương Thống Nhất, Thành Phố Biên Hòa, Đồng Nai',
        name: 'Đức Đỗ Minh',
        phone: '0943 675 XXX'
      }
    }
  ]

  return (
    <div>
      <h2 className='text-lg font-semibold text-gray-900 mb-6'>Đơn hàng của tôi</h2>

      <div className='space-y-6'>
        {orders.map((order) => (
          <div key={order.id} className='bg-white p-6 rounded-lg border'>
            <div className='flex justify-between items-start mb-4'>
              <div>
                <h3 className='font-medium text-gray-900'>Đơn hàng #{order.id}</h3>
                <Badge className={order.statusColor}>{order.status}</Badge>
              </div>
              <div className='text-right'>
                <div className='font-semibold text-lg'>{order.total}</div>
              </div>
            </div>

            <div className='space-y-2 mb-4'>
              {order.products.map((product, index) => (
                <div key={index} className='text-sm text-gray-600'>
                  • {product}
                </div>
              ))}
            </div>

            <div className='border-t pt-4'>
              <h4 className='text-sm font-medium text-gray-900 mb-2'>Thông tin giao hàng</h4>
              <div className='text-sm text-gray-600'>
                <div>Tên: {order.deliveryInfo.name}</div>
                <div>SĐT: {order.deliveryInfo.phone}</div>
                <div>Địa chỉ: {order.deliveryInfo.address}</div>
              </div>
            </div>

            <div className='flex gap-2 mt-4'>
              <Button variant='outline' size='sm'>
                Xem chi tiết
              </Button>
              <Button variant='outline' size='sm'>
                Mua lại
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
