import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Settings, FileText, MapPin, Gift, MessageSquare } from 'lucide-react'
import type { Address, AddressCreateInput } from '../../../types/addressType'
import type { Order, OrderStatus } from '../../../types/orderType'
// Define the actual API response structure for user promotions
interface UserPromotionResponse {
  promotionUserID: string
  promotionID: string
  title: string
  description: string
  discountType: string
  discountValue: number
  startDate: string
  endDate: string
  quantity: number
  maxPerUser: number
  isActive: boolean
  isExpired: boolean
  daysRemaining: number
}
import { addressApi } from '../../../apis/address.api'
import { getCustomerOrders } from '../../../apis/order.api'
import { promotionApi } from '../../../apis/promotion.api'
import { formApi, type FormDTO } from '../../../apis/form.api'
import { useAuth } from '../../../contexts/auth.context'
import { getUserById, type User } from '../../../apis/user.api'
import ProfileContent from './components/ProfileContent'
import OrdersContent from './components/OrdersContent'
import AddressContent from './components/AddressContent'
import PromotionsContent from './components/PromotionsContent'
import FormsContent from './components/FormsContent'
import AddressModal from './components/AddressModal'

export default function Profile() {
  const location = useLocation()
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [promotions, setPromotions] = useState<UserPromotionResponse[]>([])
  const [promotionsLoading, setPromotionsLoading] = useState(false)
  const [forms, setForms] = useState<FormDTO[]>([])
  const [formsLoading, setFormsLoading] = useState(false)

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
    } else if (tab === 'promotions') {
      setActiveTab('promotions')
    } else if (tab === 'forms') {
      setActiveTab('forms')
    }
  }, [location.search])

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser?.userId) return

      try {
        const userData = await getUserById(authUser.userId)
        setUser(userData)
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [authUser?.userId])

  // Load customer orders
  const loadCustomerOrders = useCallback(
    async (status?: OrderStatus) => {
      if (!authUser?.userId) return

      try {
        setOrdersLoading(true)
        const customerOrders = await getCustomerOrders(authUser.userId, {
          pageSize: 0, // Load all orders for better UX
          pageNumber: 1,
          status: status, // Filter by status if provided
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        setOrders(customerOrders)
      } catch (error) {
        console.error('Error loading customer orders:', error)
      } finally {
        setOrdersLoading(false)
      }
    },
    [authUser?.userId]
  )

  // Load orders when component mounts or when switching to orders tab
  useEffect(() => {
    if (activeTab === 'orders') {
      loadCustomerOrders()
    }
  }, [activeTab, authUser?.userId, loadCustomerOrders])

  // Load user promotions
  const loadUserPromotions = useCallback(async () => {
    if (!authUser?.userId) return

    try {
      setPromotionsLoading(true)
      const response = await promotionApi.getUserPromotions(authUser.userId, 0, 1)
      setPromotions((response.data as any[]) || [])
    } catch (error) {
      console.error('Error loading user promotions:', error)
    } finally {
      setPromotionsLoading(false)
    }
  }, [authUser?.userId])

  // Load promotions when component mounts or when switching to promotions tab
  useEffect(() => {
    if (activeTab === 'promotions') {
      loadUserPromotions()
    }
  }, [activeTab, authUser?.userId, loadUserPromotions])

  // Load user forms
  const loadUserForms = useCallback(async () => {
    if (!authUser?.userId) return

    try {
      setFormsLoading(true)
      const response = await formApi.getCustomerForms(authUser.userId, {
        pageSize: 0, // Load all forms for better UX
        pageNumber: 1,
        sortBy: 'createdat',
        sortOrder: 'desc'
      })
      setForms(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Error loading user forms:', error)
    } finally {
      setFormsLoading(false)
    }
  }, [authUser?.userId])

  // Load forms when component mounts or when switching to forms tab
  useEffect(() => {
    if (activeTab === 'forms') {
      loadUserForms()
    }
  }, [activeTab, authUser?.userId, loadUserForms])

  const [addresses, setAddresses] = useState<Address[]>([])
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load addresses from API
  const loadAddresses = useCallback(async () => {
    if (!authUser?.userId) return

    try {
      const response = await addressApi.getUserAddresses(authUser.userId)
      // Handle both single address and array of addresses
      const addressesData = Array.isArray(response.data) ? response.data : [response.data]
      setAddresses(addressesData)
    } catch (error) {
      console.error('Error loading addresses:', error)
    }
  }, [authUser?.userId])

  // Load addresses when component mounts
  useEffect(() => {
    loadAddresses()
  }, [authUser?.userId, loadAddresses])

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
      try {
        // Call API to delete address
        await addressApi.delete(addressId)

        // Update local state
        setAddresses(addresses.filter((addr) => addr.id !== addressId))
      } catch (error) {
        console.error('Error deleting address:', error)
      }
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // Call API to set address as default
      await addressApi.setAsDefault(addressId)

      // Update local state
      setAddresses(
        addresses.map((addr) => ({
          ...addr,
          isDefault: addr.id === addressId
        }))
      )
    } catch (error) {
      console.error('Error setting default address:', error)
    }
  }

  const handleSaveAddress = async (formData: AddressCreateInput) => {
    if (!authUser?.userId) return

    try {
      if (editingAddress) {
        // Convert AddressCreateInput to AddressUpdateInput for update
        const updateData = {
          userId: authUser.userId,
          province: formData.province,
          district: formData.district,
          ward: formData.ward,
          provinceId: formData.provinceId,
          districtId: formData.districtId,
          wardId: formData.wardId,
          streetAddress: formData.streetAddress,
          isDefault: formData.isDefault
        }

        // Call API to update address
        const response = await addressApi.update(editingAddress.id, updateData)

        // Update local state
        setAddresses(
          addresses.map((addr) =>
            addr.id === editingAddress.id
              ? {
                ...addr,
                ...updateData,
                isDefault: updateData.isDefault || false,
                updatedAt: new Date().toISOString()
              }
              : addr
          )
        )

        console.log('Address updated successfully:', response)
      } else {
        const addressDataWithUserId = {
          ...formData,
          userId: authUser.userId
        }

        // Call API to create address
        const response = await addressApi.create(addressDataWithUserId)

        // Add new address to local state
        const newAddress: Address = {
          id: response.data.id,
          ...formData,
          userId: authUser.userId,
          isDefault: formData.isDefault || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
        setAddresses([...addresses, newAddress])

        console.log('Address created successfully:', response)
      }

      setShowAddressModal(false)
      // Trigger refresh of address list
      setRefreshTrigger((prev) => prev + 1)
    } catch (error) {
      console.error('Error in address operation:', error)
      // You can add toast notification here if needed
    }
  }

  const displayName = user ? `${user.lastName} ${user.firstName}` : 'Người dùng'

  return (
    <div className='min-h-screen bg-[#f8f9f5]'>
      {/* Profile Header */}
      <Card className='border-b rounded-none'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <Avatar className='w-20 h-20'>
              <img
                src={user?.avatar || '/src/assets/react.svg'}
                alt='Profile'
                className='w-full h-full object-cover rounded-full'
              />
            </Avatar>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Chào mừng trở lại, {displayName}</h2>
              <p className='text-sm text-gray-500'>
                Thành viên từ{' '}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                  : 'N/A'}
              </p>
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
              <Button
                variant={activeTab === 'promotions' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'promotions' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('promotions')}
              >
                <Gift className='w-4 h-4 mr-2' />
                Khuyến mãi của tôi
              </Button>
              <Button
                variant={activeTab === 'forms' ? 'default' : 'ghost'}
                className={`w-full justify-start text-sm ${activeTab === 'forms' ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('forms')}
              >
                <MessageSquare className='w-4 h-4 mr-2' />
                Khiếu nại của tôi
              </Button>
            </nav>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className='flex-1 p-6'>
          <Card className='h-full'>
            <CardContent className='p-6'>
              {activeTab === 'profile' && <ProfileContent />}
              {activeTab === 'orders' && (
                <OrdersContent
                  orders={orders}
                  loading={ordersLoading}
                  onRefreshOrders={() => loadCustomerOrders()}
                  onFilterByStatus={(status) => loadCustomerOrders(status as OrderStatus)}
                />
              )}
              {activeTab === 'addresses' && authUser?.userId && (
                <AddressContent
                  userId={authUser.userId}
                  onAddAddress={handleAddAddress}
                  onEditAddress={handleEditAddress}
                  onDeleteAddress={handleDeleteAddress}
                  onSetDefault={handleSetDefault}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {activeTab === 'promotions' && (
                <PromotionsContent promotions={promotions} loading={promotionsLoading} onRefresh={loadUserPromotions} />
              )}
              {activeTab === 'forms' && <FormsContent forms={forms} loading={formsLoading} onRefresh={loadUserForms} />}
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
        existingAddresses={addresses}
        userId={authUser?.userId}
      />
    </div>
  )
}
