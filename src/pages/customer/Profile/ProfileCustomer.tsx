import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Settings, FileText, MapPin, Gift, MessageSquare, Wallet } from 'lucide-react'
import type { Address, AddressCreateInput } from '../../../types/addressType'
import type { Order, OrderStatus } from '../../../types/orderType'
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
import { formApi } from '../../../apis/form.api'
import { useAuth } from '../../../contexts/auth.context'
import { getUserById, updateUser, type User } from '../../../apis/user.api'
import ProfileContent from './components/profile/ProfileContent'
import OrdersContent from './components/order/OrdersContent'
import AddressContent from './components/address/AddressContent'
import PromotionsContent from './components/promotion/PromotionsContent'
import FormsContent from './components/form/FormsContent'
import AddressModal from './components/address/AddressModal'
import WalletContent from './components/wallet/WalletContent'
import AvatarUploadModal from './components/profile/AvatarUploadModal'
import { Camera } from 'lucide-react'
import type { FormDTO } from '../../../types/form.type'

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
    } else if (tab === 'wallet') {
      setActiveTab('wallet')
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPromotions((response.data as any) || [])
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
  const [showAvatarModal, setShowAvatarModal] = useState(false)

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
    if (!authUser?.userId) {
      console.error('User ID not found')
      return
    }
    try {
      // Call API to set address as default
      await addressApi.setAsDefault(addressId, authUser.userId)

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
          receiverName: formData.receiverName ?? null,
          receiverPhoneNumber: formData.receiverPhoneNumber ?? null,
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

  const formatMemberSince = (dateString?: string | null) => {
    if (!dateString) return 'N/A'

    const parsedDate = new Date(dateString)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    }

    const dateMatch = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      const fallbackDate = new Date(Number(year), Number(month) - 1, Number(day))
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
      }
    }

    return 'N/A'
  }

  const handleAvatarSave = async (file: File) => {
    if (!authUser?.userId) return

    try {
      await updateUser(authUser.userId, { avatar: file })
      // Reload user data
      const updatedUser = await getUserById(authUser.userId)
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating avatar:', error)
      throw error
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className='min-h-screen bg-[#f8f9f5]'
    >
      {/* Profile Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className='border-b rounded-none'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-4'>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 200 }}
                className='relative group'
              >
                <Avatar className='w-20 h-20'>
                  <img
                    src={user?.avatar || 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'}
                    alt='Profile'
                    className='w-full h-full object-cover rounded-full'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg'
                    }}
                  />
                </Avatar>
                <motion.button
                  onClick={() => setShowAvatarModal(true)}
                  className='absolute bottom-0 right-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors shadow-lg opacity-0 group-hover:opacity-100'
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Camera className='w-4 h-4' />
                </motion.button>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className='text-xl font-bold text-gray-900'
                >
                  Chào mừng trở lại, {displayName}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className='text-sm text-gray-500'
                >
                  Thành viên từ {formatMemberSince(user?.createdAt)}
                </motion.p>
                <div className='flex gap-4 mt-2'>
                  {user?.userPoint !== undefined && (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.6, type: 'spring', stiffness: 200 }}
                      className='text-sm font-semibold text-green-600'
                    >
                      Điểm tích lũy: {user.userPoint} điểm
                    </motion.p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.7, type: 'spring', stiffness: 200 }}
                    className='flex items-center gap-1'
                  >

                  </motion.div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className='flex'>
        {/* Sidebar */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className='w-64 min-h-screen border-r rounded-none'>
            <CardHeader className='pb-4'>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <CardTitle className='text-lg font-medium text-gray-900'>Quản lý tài khoản</CardTitle>
              </motion.div>
            </CardHeader>
            <CardContent className='pt-0'>
              <nav className='space-y-2'>
                {[
                  { id: 'profile', icon: Settings, label: 'Thông tin cá nhân' },
                  { id: 'orders', icon: FileText, label: 'Đơn hàng của tôi' },
                  { id: 'wallet', icon: Wallet, label: 'Ví của tôi' },
                  { id: 'addresses', icon: MapPin, label: 'Sổ địa chỉ' },
                  { id: 'promotions', icon: Gift, label: 'Khuyến mãi của tôi' },
                  { id: 'forms', icon: MessageSquare, label: 'Khiếu nại của tôi' }
                ].map((tab, index) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <motion.div
                      key={tab.id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        className={`w-full justify-start text-sm transition-all ${isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <Icon className='w-4 h-4 mr-2' />
                        {tab.label}
                      </Button>
                    </motion.div>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className='flex-1 p-6'
        >
          <Card className='h-full'>
            <CardContent className='p-6'>
              <AnimatePresence mode='wait'>
                {activeTab === 'profile' && (
                  <motion.div
                    key='profile'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProfileContent />
                  </motion.div>
                )}
                {activeTab === 'orders' && (
                  <motion.div
                    key='orders'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <OrdersContent
                      orders={orders}
                      loading={ordersLoading}
                      onRefreshOrders={() => loadCustomerOrders()}
                      onFilterByStatus={(status) => loadCustomerOrders(status as OrderStatus)}
                    />
                  </motion.div>
                )}
                {activeTab === 'wallet' && (
                  <motion.div
                    key='wallet'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <WalletContent
                      bankAccount={user?.bankAccount || null}
                      customerName={user ? `${user.lastName} ${user.firstName}` : undefined}
                      onUpdateProfile={() => setActiveTab('profile')}
                    />
                  </motion.div>
                )}
                {activeTab === 'addresses' && authUser?.userId && (
                  <motion.div
                    key='addresses'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AddressContent
                      userId={authUser.userId}
                      onAddAddress={handleAddAddress}
                      onEditAddress={handleEditAddress}
                      onDeleteAddress={handleDeleteAddress}
                      onSetDefault={handleSetDefault}
                      refreshTrigger={refreshTrigger}
                    />
                  </motion.div>
                )}
                {activeTab === 'promotions' && (
                  <motion.div
                    key='promotions'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PromotionsContent
                      promotions={promotions}
                      loading={promotionsLoading}
                      onRefresh={loadUserPromotions}
                    />
                  </motion.div>
                )}
                {activeTab === 'forms' && (
                  <motion.div
                    key='forms'
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FormsContent forms={forms} loading={formsLoading} onRefresh={loadUserForms} />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
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

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSave={handleAvatarSave}
        currentAvatar={user?.avatar || null}
      />
    </motion.div>
  )
}
