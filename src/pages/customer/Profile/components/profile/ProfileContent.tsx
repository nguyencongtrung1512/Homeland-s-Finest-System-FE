import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '../../../../../components/ui/button'
import { Input } from '../../../../../components/ui/input'
import { Label } from '../../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../components/ui/select'
import { Calendar } from '../../../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../../../components/ui/popover'
import { ShimmerBorder } from '../../../../../components/ui/shimmer'
import ProfileCard3D from '../../../../../components/ui/ProfileCard3D'
import ComboBox from '../../../../../components/ui/combo-box'
import { useAuth } from '../../../../../contexts/auth.context'
import { getUserById, updateUser, getBanks, type User as UserType, type Bank } from '../../../../../apis/user.api'
import { getProvinces, type Province } from '../../../../../apis/province'
import { changePassword } from '../../../../../apis/auth.api'
import { toast } from '../../../../../utils/toast'
import { MapPin, CreditCard, Building2, User, CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const convertDateFormat = (dateString: string): string => {
  if (!dateString) return ''

  if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
    return dateString
  }

  // Convert DD/MM/YYYY or DD-MM-YYYY to YYYY-MM-DD
  const separator = dateString.includes('/') ? '/' : '-'
  const parts = dateString.split(separator)
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return dateString
}

export default function ProfileContent() {
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    provinceId: '',
    bankAccount: '',
    bankName: '',
    avatar: null as File | null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    note: ''
  })
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [banks, setBanks] = useState<Bank[]>([])
  const [loadingBanks, setLoadingBanks] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showBankingSection, setShowBankingSection] = useState(false)
  const [showPersonalInfoSection, setShowPersonalInfoSection] = useState(true)
  const [updatingPersonalInfo, setUpdatingPersonalInfo] = useState(false)
  const [updatingBankingInfo, setUpdatingBankingInfo] = useState(false)
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined)

  // Load provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const data = await getProvinces()
        setProvinces(data)
      } catch (error) {
        console.error('Error fetching provinces:', error)
        toast.error('Không thể tải danh sách tỉnh/thành phố')
      } finally {
        setLoadingProvinces(false)
      }
    }
    fetchProvinces()
  }, [])

  // Load banks
  useEffect(() => {
    const fetchBanks = async () => {
      setLoadingBanks(true)
      try {
        const data = await getBanks()
        setBanks(data)
      } catch (error) {
        console.error('Error fetching banks:', error)
        toast.error('Không thể tải danh sách ngân hàng')
      } finally {
        setLoadingBanks(false)
      }
    }
    fetchBanks()
  }, [])

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!authUser?.userId) return

      try {
        setLoading(true)
        const userData = await getUserById(authUser.userId)
        console.log('trung', userData)
        setUser(userData)

        // Parse date of birth
        let parsedDate: Date | undefined = undefined
        if (userData.dateOfBirth) {
          const convertedDate = convertDateFormat(userData.dateOfBirth)
          parsedDate = new Date(convertedDate)
        }

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: userData.dateOfBirth ? convertDateFormat(userData.dateOfBirth) : '',
          gender: userData.gender || '',
          provinceId: userData.provinceId?.toString() || '',
          bankAccount: userData.bankAccount || '',
          bankName: userData.bankName || '',
          avatar: null,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          note: userData.note || ''
        })

        setDateOfBirth(parsedDate)
      } catch (error) {
        console.error('Error loading user data:', error)
        toast.error('Không thể tải thông tin người dùng')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [authUser?.userId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setDateOfBirth(date)
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      handleInputChange('dateOfBirth', formattedDate)
    }
  }

  // Helper function to prepare update data with all fields
  const prepareUpdateData = () => {
    const formattedDateOfBirth = formData.dateOfBirth ? formData.dateOfBirth.split('-').reverse().join('-') : ''

    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formattedDateOfBirth,
      gender: formData.gender,
      provinceId: formData.provinceId ? parseInt(formData.provinceId) : undefined,
      bankAccount: formData.bankAccount,
      bankName: formData.bankName,
      note: (formData.note || 'Cập nhật từ trang Profile').trim(),
      avatar: formData.avatar || undefined
    }
  }

  // Update personal information
  const handleUpdatePersonalInfo = async () => {
    if (!authUser?.userId) return

    try {
      setUpdatingPersonalInfo(true)
      const updateData = prepareUpdateData()

      await updateUser(authUser.userId, updateData)

      toast.success('Cập nhật thông tin cá nhân thành công!')

      // Reload user data
      const updatedUser = await getUserById(authUser.userId)
      setUser(updatedUser)
    } catch (error) {
      console.error('Error updating personal info:', error)
      toast.error('Cập nhật thông tin thất bại')
    } finally {
      setUpdatingPersonalInfo(false)
    }
  }

  // Update banking information
  const handleUpdateBankingInfo = async () => {
    if (!authUser?.userId) return

    try {
      setUpdatingBankingInfo(true)
      const updateData = prepareUpdateData()

      await updateUser(authUser.userId, updateData)

      toast.success('Cập nhật thông tin ngân hàng thành công!')

      // Reload user data
      const updatedUser = await getUserById(authUser.userId)
      setUser(updatedUser)
      setShowBankingSection(false)
    } catch (error) {
      console.error('Error updating banking info:', error)
      toast.error('Cập nhật thông tin ngân hàng thất bại')
    } finally {
      setUpdatingBankingInfo(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin mật khẩu')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('Mật khẩu mới phải khác mật khẩu hiện tại')
      return
    }

    if (!authUser?.email) {
      toast.error('Không thể lấy thông tin email người dùng')
      return
    }

    try {
      setChangingPassword(true)

      const response = await changePassword({
        email: authUser.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      })

      if (response.success) {
        toast.success(response.message || 'Đổi mật khẩu thành công!', {
          position: 'top-right',
          autoClose: 5000
        })

        // Clear password fields
        setFormData((prev) => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        toast.error(response.message || 'Đổi mật khẩu thất bại')
      }
    } catch (error: unknown) {
      console.error('Change password error:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } }; message?: string }).response?.data?.message ||
        (error as { message?: string }).message ||
        'Có lỗi xảy ra khi đổi mật khẩu'
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return <div className='flex justify-center items-center h-64'>Đang tải...</div>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'
    >
      {/* Profile Card 3D */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className='mb-8'
      >
        <ProfileCard3D user={user} className='rounded-lg overflow-hidden' />
      </motion.div>

      {/* Personal Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className='mb-6'
      >
        <ShimmerBorder>
          <div className='rounded-lg'>
            <motion.button
              onClick={() => setShowPersonalInfoSection(!showPersonalInfoSection)}
              className='w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg'
              whileHover={{ backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                <User className='w-5 h-5 mr-2 text-green-600' />
                Cập nhật thông tin cá nhân
              </h3>
              <motion.div animate={{ rotate: showPersonalInfoSection ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {showPersonalInfoSection ? (
                  <ChevronUp className='w-5 h-5 text-gray-500' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-gray-500' />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showPersonalInfoSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <div className='px-6 py-6 border-t'>
                    <p className='text-sm text-gray-600 mb-6'>
                      Cập nhật thông tin cá nhân của bạn để có trải nghiệm tốt hơn
                    </p>

                    <div className='grid grid-cols-2 gap-6'>
                      <div>
                        <Label htmlFor='firstName'>Họ</Label>
                        <Input
                          id='firstName'
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <Label htmlFor='lastName'>Tên</Label>
                        <Input
                          id='lastName'
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          type='email'
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <Label htmlFor='phoneNumber'>Số điện thoại</Label>
                        <Input
                          id='phoneNumber'
                          value={formData.phoneNumber}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <Label htmlFor='gender'>Giới tính</Label>
                        <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                          <SelectTrigger className='mt-1'>
                            <SelectValue placeholder='Chọn giới tính' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Male'>Nam</SelectItem>
                            <SelectItem value='Female'>Nữ</SelectItem>
                            <SelectItem value='Other'>Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor='provinceId'>Tỉnh/Thành phố</Label>
                        <div className='relative'>
                          <MapPin className='absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10' />
                          <Select
                            value={formData.provinceId}
                            onValueChange={(value) => handleInputChange('provinceId', value)}
                            disabled={loadingProvinces}
                          >
                            <SelectTrigger className='mt-1 pl-10'>
                              <SelectValue placeholder={loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'} />
                            </SelectTrigger>
                            <SelectContent>
                              {provinces.map((province) => (
                                <SelectItem key={province.id} value={province.id.toString()}>
                                  {province.name} - {province.region}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor='dateOfBirth'>Ngày sinh</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant='outline' className='w-full justify-start text-left font-normal mt-1'>
                              <CalendarIcon className='mr-2 h-4 w-4' />
                              {dateOfBirth ? format(dateOfBirth, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày sinh'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={dateOfBirth}
                              onSelect={handleDateSelect}
                              initialFocus
                              locale={vi}
                              fromYear={1950}
                              toYear={new Date().getFullYear()}
                              captionLayout='dropdown'
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className='mt-6 flex items-center gap-2'
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className='bg-green-600 hover:bg-green-700 text-white'
                          onClick={handleUpdatePersonalInfo}
                          disabled={updatingPersonalInfo}
                        >
                          {updatingPersonalInfo ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ShimmerBorder>
      </motion.div>

      {/* Banking Information Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className='mt-6'
      >
        <ShimmerBorder>
          <div className='rounded-lg'>
            <motion.button
              onClick={() => setShowBankingSection(!showBankingSection)}
              className='w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg'
              whileHover={{ backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className='text-lg font-semibold text-gray-900 flex items-center'>
                <CreditCard className='w-5 h-5 mr-2 text-green-600' />
                Thông tin ngân hàng
              </h3>
              <motion.div animate={{ rotate: showBankingSection ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {showBankingSection ? (
                  <ChevronUp className='w-5 h-5 text-gray-500' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-gray-500' />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showBankingSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <div className='px-6 py-6 border-t'>
                    <p className='text-sm text-gray-600 mb-6'>
                      Cập nhật thông tin ngân hàng để thanh toán và nhận hoàn tiền dễ dàng hơn
                    </p>

                    <div className='grid grid-rows-2 gap-6'>
                      <div>
                        <Label htmlFor='bankName' className='py-2'>Tên ngân hàng</Label>
                        <div className='mt-1 relative'>
                          {(() => {
                            return (
                              <>
                                <div className='w-full'>
                                  <ComboBox<Bank>
                                    options={banks}
                                    placeholder={loadingBanks ? 'Đang tải...' : 'Chọn ngân hàng'}
                                    value={formData.bankName}
                                    disabled={loadingBanks}
                                    getOptionLabel={(bank) => `${bank.name} (${bank.shortName})`}
                                    getOptionValue={(bank) => bank.name}
                                    onSelect={(bank) => handleInputChange('bankName', bank?.name || '')}
                                    filterFunction={(bank, searchValue) => {
                                      const search = searchValue.toLowerCase()
                                      return (
                                        bank.name.toLowerCase().includes(search) ||
                                        bank.shortName.toLowerCase().includes(search) ||
                                        bank.code.toLowerCase().includes(search)
                                      )
                                    }}
                                    renderOption={(bank) => (
                                      <div className='flex items-center gap-3 py-1'>
                                        <img
                                          src={bank.logo}
                                          alt={bank.name}
                                          className='w-12 h-12 object-contain rounded'
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                          }}
                                        />
                                        <div className='flex flex-col'>
                                          <span className='text-sm font-medium'>{bank.name}</span>
                                          <span className='text-xs text-gray-500'>{bank.shortName}</span>
                                        </div>
                                      </div>
                                    )}
                                  />
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor='bankAccount' className='py-2'>Số tài khoản ngân hàng</Label>
                        <div className='relative'>
                          <CreditCard className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                          <Input
                            id='bankAccount'
                            value={formData.bankAccount}
                            onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                            placeholder='Nhập số tài khoản ngân hàng'
                            className='mt-1 pl-10'
                          />
                        </div>
                      </div>

                    </div>

                    <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                      <div className='text-sm text-blue-800'>
                        <div className='font-medium mb-1'>Lưu ý về thông tin ngân hàng:</div>
                        <ul className='text-xs space-y-1 text-blue-700'>
                          <li>✓ Thông tin ngân hàng sẽ được sử dụng để thanh toán và hoàn tiền</li>
                          <li>✓ Đảm bảo số tài khoản chính xác để tránh lỗi giao dịch</li>
                          <li>✓ Thông tin được mã hóa và bảo mật theo tiêu chuẩn quốc tế</li>
                        </ul>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className='mt-6 flex items-center gap-2'
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          className='bg-green-600 hover:bg-green-700 text-white'
                          onClick={handleUpdateBankingInfo}
                          disabled={updatingBankingInfo}
                        >
                          {updatingBankingInfo ? 'Đang cập nhật...' : 'Cập nhật'}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant='outline'
                          className='ml-3'
                          disabled={updatingBankingInfo}
                          onClick={() => setShowBankingSection(false)}
                        >
                          Hủy bỏ
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ShimmerBorder>
      </motion.div>

      {/* Change Password Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className='mt-6'
      >
        <ShimmerBorder>
          <div className='rounded-lg'>
            <motion.button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className='w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-lg'
              whileHover={{ backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className='text-lg font-semibold text-gray-900'>Đổi mật khẩu</h3>
              <motion.div animate={{ rotate: showPasswordSection ? 180 : 0 }} transition={{ duration: 0.3 }}>
                {showPasswordSection ? (
                  <ChevronUp className='w-5 h-5 text-gray-500' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-gray-500' />
                )}
              </motion.div>
            </motion.button>

            <AnimatePresence>
              {showPasswordSection && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className='overflow-hidden'
                >
                  <div className='px-6 py-6 border-t'>
                    <p className='text-sm text-gray-600 mb-6 mt-6'>Cập nhật mật khẩu của bạn để đảm bảo tính bảo mật</p>

                    <div className='space-y-4 max-w-md'>
                      <div>
                        <Label htmlFor='currentPassword'>Mật khẩu hiện tại</Label>
                        <Input
                          id='currentPassword'
                          type='password'
                          placeholder='Nhập mật khẩu hiện tại'
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <Label htmlFor='newPassword'>Mật khẩu mới</Label>
                        <Input
                          id='newPassword'
                          type='password'
                          placeholder='Nhập mật khẩu mới'
                          value={formData.newPassword}
                          onChange={(e) => handleInputChange('newPassword', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                      <div>
                        <Label htmlFor='confirmPassword'>Xác nhận mật khẩu mới</Label>
                        <Input
                          id='confirmPassword'
                          type='password'
                          placeholder='Nhập lại mật khẩu mới'
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className='mt-1'
                        />
                      </div>
                    </div>

                    {/* Password Requirements */}
                    <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
                      <div className='text-sm text-blue-800'>
                        <div className='font-medium mb-1'>🛡️ Mẹo bảo mật:</div>
                        <ul className='text-xs space-y-1 text-blue-700'>
                          <li>✓ Sử dụng mật khẩu mạnh, ít nhất 8 ký tự bao gồm chữ và số</li>
                          <li>✓ Tránh sử dụng mật khẩu dễ đoán như ngày sinh hoặc tên</li>
                          <li>✓ Không chia sẻ mật khẩu với người khác, kể cả nhân viên</li>
                        </ul>
                      </div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className='mt-6'
                    >
                      <motion.div className='flex items-center gap-2'>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            className='bg-green-600 hover:bg-green-700 text-white'
                            onClick={handleUpdatePassword}
                            disabled={changingPassword}
                          >
                            {changingPassword ? 'Đang đổi mật khẩu...' : 'Cập nhật mật khẩu'}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            variant='outline'
                            className='ml-3'
                            disabled={changingPassword}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              }))
                            }}
                          >
                            Hủy bỏ
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ShimmerBorder>
      </motion.div>
    </motion.div>
  )
}
