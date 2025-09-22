import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Settings, FileText, MapPin } from 'lucide-react'
import type { Address, AddressCreateInput } from '../../../types/addressType'
import ProfileContent from './components/ProfileContent'
import OrdersContent from './components/OrdersContent'
import AddressContent from './components/AddressContent'
import AddressModal from './components/AddressModal'

export default function Profile() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('profile')

  // Khi vào trang, nếu có query tab=orders thì active tab đơn hàng
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab === 'orders') {
      setActiveTab('orders')
    } else if (tab === 'addresses') {
      setActiveTab('addresses')
    } else if (tab === 'profile') {
      setActiveTab('profile')
    }
  }, [location.search])

  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Address handlers
  const handleAddAddress = () => {
    setEditingAddress(null)
    setShowAddressModal(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setShowAddressModal(true)
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      // Simulate API call
      setTimeout(() => {
        setAddresses(addresses.filter((addr) => addr.id !== addressId))
      }, 1000)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    // Simulate API call
    setTimeout(() => {
      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      )
    }, 1000)
  }

  const handleSaveAddress = async (formData: AddressCreateInput) => {
    // Simulate API call
    setTimeout(() => {
      if (editingAddress) {
        // Update existing address
        setAddresses(
          addresses.map((addr) =>
            addr.id === editingAddress.id
              ? {
                  ...addr,
                  ...formData,
                  updatedAt: new Date().toISOString()
                }
              : addr
          )
        )
      } else {
        // Add new address
        const newAddress: Address = {
          id: Date.now().toString(),
          ...formData,
          isDefault: formData.isDefault || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
        setAddresses([...addresses, newAddress])
      }
      setShowAddressModal(false)
    }, 1000)
  }

  return (
    <div className='min-h-screen bg-[#f8f9f5]'>
      {/* Profile Header */}
      <Card className='border-b rounded-none'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <Avatar className='w-20 h-20'>
              <img src='/src/assets/react.svg' alt='Profile' className='w-full h-full object-cover rounded-full' />
            </Avatar>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Chào mừng trở lại, Minh Anh</h2>
              <p className='text-sm text-gray-500'>Thành viên từ Tháng 1 năm 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='flex'>
        {/* Sidebar */}
        <Card className='w-64 min-h-screen border-r rounded-none'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-lg font-medium text-gray-900'>Quản lý tài khoản</CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <nav className='space-y-2'>
              <Button
                variant={activeTab === 'profile' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'profile' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('profile')}
              >
                <Settings className='w-4 h-4 mr-2' />
                Thông tin cá nhân
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'orders' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('orders')}
              >
                <FileText className='w-4 h-4 mr-2' />
                Đơn hàng của tôi
              </Button>
              <Button
                variant={activeTab === 'addresses' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'addresses' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('addresses')}
              >
                <MapPin className='w-4 h-4 mr-2' />
                Sổ địa chỉ
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className='flex-1 p-6'>
          <Card className='h-full'>
            <CardContent className='p-6'>
              {activeTab === 'profile' && <ProfileContent />}
              {activeTab === 'orders' && <OrdersContent />}
              {activeTab === 'addresses' && (
                <AddressContent
                  userId='user-1'
                  onAddAddress={handleAddAddress}
                  onEditAddress={handleEditAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onSetDefault={handleSetDefault}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        address={editingAddress}
        onSave={handleSaveAddress}
      />
    </div>
  )
}
