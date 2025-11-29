import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Checkbox } from '../../../components/ui/checkbox'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { ChevronDownIcon, Eye, EyeOff, Loader2, MapPinIcon } from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Upload as AntUpload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import 'antd/dist/reset.css'
import { toast } from '../../../utils/toast'
import { path } from '../../../constants/path'
import { registerSeller } from '../../../apis/auth.api'
import { getProvinces, getDistricts, getWards, type Province, type District, type Ward } from '../../../apis/province'
import Loading from '../../../components/Loading/loading'
import { extractCCCDInfo, type ExtractedCCCDInfo } from '../../../apis/fptai.api'
import { getBanks, verifyBankAccount, type Bank } from '../../../apis/user.api'
import ComboBox from '../../../components/ui/combo-box'

const checkboxStyles = `
  .custom-checkbox {
    appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    background-color: white;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease-in-out;
  }
  
  .custom-checkbox:hover {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .custom-checkbox:checked {
    background-color: #10b981;
    border-color: #10b981;
  }
  
  .custom-checkbox:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-size: 14px;
    font-weight: bold;
  }
  
  .custom-checkbox:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  }
`

interface FormData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
  gender: string
  dateOfBirth: string
  businessName: string
  businessLicense: File[]
  description: string
  taxCode: string
  bankName: string
  bankAccount: string
  identifyCard: string
  identifyFrontImage: File[]
  identifyBackImage: File[]
  vendorApplicationImageUrl: File[]
  storeName: string
  address: string
  agreements: {
    terms: boolean
    policy: boolean
    commission: boolean
    productQuality: boolean
  }
}

interface FormErrors {
  [key: string]: string
}

const FileUploadFieldWithOCR = ({
  label,
  onChange,
  onOCRData,
  accept = 'image/*',
  required = false,
  multiple = false,
  description,
  maxCount = 1,
  enableOCR = false
}: {
  label: string
  onChange: (files: File[]) => void
  onOCRData?: (data: ExtractedCCCDInfo) => void
  accept?: string
  required?: boolean
  multiple?: boolean
  description?: string
  maxCount?: number
  enableOCR?: boolean
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewImage, setPreviewImage] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)

  const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    setFileList(newFileList)
    const newFiles = newFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)
    onChange(newFiles)

    if (enableOCR && newFiles.length > 0 && onOCRData) {
      const file = newFiles[0]
      setIsProcessingOCR(true)

      try {
        const ocrResult = await extractCCCDInfo(file)

        if (ocrResult) {
          onOCRData(ocrResult)
          toast.success('Đã đọc thông tin từ CCCD thành công!')
        } else {
          toast.warning('Không thể đọc thông tin từ ảnh. Vui lòng nhập thủ công.')
        }
      } catch (error) {
        console.error('OCR Error:', error)
        toast.error('Lỗi khi đọc thông tin từ CCCD. Vui lòng thử lại hoặc nhập thủ công.')
      } finally {
        setIsProcessingOCR(false)
      }
    }
  }

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('Chỉ được upload file ảnh!')
      return false
    }

    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('Kích thước file phải nhỏ hơn 10MB!')
      return false
    }

    return false
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }
    setPreviewImage(file.url || file.preview || '')
    setShowPreview(true)
  }

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const uploadButton = (
    <div className='flex w-full h-full flex-col items-center justify-center space-y-2 p-4 cursor-pointer hover:bg-gray-100 rounded-lg'>
      {isProcessingOCR ? (
        <>
          <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
          <div className='text-sm text-blue-600'>Đang xử lý OCR...</div>
        </>
      ) : (
        <>
          <div className='text-sm text-gray-600'>Nhấp để chọn file</div>
          <div className='text-xs text-gray-500'>{multiple ? `Tối đa ${maxCount} file` : 'Chỉ chọn 1 file'}</div>
        </>
      )}
    </div>
  )

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      {description && <p className='text-xs text-gray-500'>{description}</p>}

      <AntUpload
        listType='picture-card'
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        onPreview={handlePreview}
        multiple={multiple}
        maxCount={maxCount}
        accept={accept}
        disabled={isProcessingOCR}
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: !isProcessingOCR,
          showDownloadIcon: false
        }}
        className='w-full'
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </AntUpload>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='max-w-4xl max-h-4xl'>
          <DialogHeader>
            <DialogTitle>Preview ảnh</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center'>
            <img src={previewImage} alt='Preview' className='max-w-full max-h-96 object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const FileUploadField = ({
  label,
  onChange,
  accept = 'image/*',
  required = false,
  multiple = false,
  description,
  maxCount = 1
}: {
  label: string
  onChange: (files: File[]) => void
  accept?: string
  required?: boolean
  multiple?: boolean
  description?: string
  maxCount?: number
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewImage, setPreviewImage] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList)
    const newFiles = newFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)
    onChange(newFiles)
  }

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('Chỉ được upload file ảnh!')
      return false
    }

    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('Kích thước file phải nhỏ hơn 10MB!')
      return false
    }

    return false
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File)
    }
    setPreviewImage(file.url || file.preview || '')
    setShowPreview(true)
  }

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const uploadButton = (
    <div className='flex w-full h-full flex-col items-center justify-center space-y-2 p-4 cursor-pointer hover:bg-gray-100 rounded-lg'>
      <div className='text-sm text-gray-600'>Nhấp để chọn file</div>
      <div className='text-xs text-gray-500'>{multiple ? `Tối đa ${maxCount} file` : 'Chỉ chọn 1 file'}</div>
    </div>
  )

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      {description && <p className='text-xs text-gray-500'>{description}</p>}

      <AntUpload
        listType='picture-card'
        fileList={fileList}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        onPreview={handlePreview}
        multiple={multiple}
        maxCount={maxCount}
        accept={accept}
        showUploadList={{
          showPreviewIcon: true,
          showRemoveIcon: true,
          showDownloadIcon: false
        }}
        className='w-full'
      >
        {fileList.length >= maxCount ? null : uploadButton}
      </AntUpload>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='max-w-4xl max-h-4xl'>
          <DialogHeader>
            <DialogTitle>Preview ảnh</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center'>
            <img src={previewImage} alt='Preview' className='max-w-full max-h-96 object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SellerRegistrationForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    gender: '',
    dateOfBirth: '',
    businessName: '',
    businessLicense: [],
    description: '',
    taxCode: '',
    bankName: '',
    bankAccount: '',
    identifyCard: '',
    identifyFrontImage: [],
    identifyBackImage: [],
    vendorApplicationImageUrl: [],
    storeName: '',
    address: '',
    agreements: {
      terms: false,
      policy: false,
      commission: false,
      productQuality: false
    }
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // States cho địa chỉ cửa hàng (chọn thủ công)
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null)
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null)
  const [specificAddress, setSpecificAddress] = useState<string>('')
  const [fullAddressDisplay, setFullAddressDisplay] = useState<string>('')
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  // States cho địa chỉ user (từ CCCD)
  const [userProvinces, setUserProvinces] = useState<Province[]>([])
  const [userDistricts, setUserDistricts] = useState<District[]>([])
  const [userWards, setUserWards] = useState<Ward[]>([])
  const [selectedUserProvince, setSelectedUserProvince] = useState<Province | null>(null)
  const [selectedUserDistrict, setSelectedUserDistrict] = useState<District | null>(null)
  const [selectedUserWard, setSelectedUserWard] = useState<Ward | null>(null)
  const [userStreetAddress, setUserStreetAddress] = useState<string>('')
  const [isLoadingUserProvinces, setIsLoadingUserProvinces] = useState(false)
  const [isLoadingUserDistricts, setIsLoadingUserDistricts] = useState(false)
  const [isLoadingUserWards, setIsLoadingUserWards] = useState(false)
  const [hasOpenedTermsPage, setHasOpenedTermsPage] = useState(false)

  // States cho ngân hàng
  const [banks, setBanks] = useState<Bank[]>([])
  const [isLoadingBanks, setIsLoadingBanks] = useState(false)
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false)
  const [accountOwnerName, setAccountOwnerName] = useState<string | null>(null)
  const [accountVerificationError, setAccountVerificationError] = useState<string | null>(null)

  // ===== Xử lý dữ liệu từ OCR =====
  const handleOCRData = async (ocrData: ExtractedCCCDInfo) => {
    // Helper function: Format tên từ IN HOA sang Title Case
    const formatVietnameseName = (name: string) => {
      return name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    // Parse và format tên (FPT AI trả về IN HOA: "NGUYỄN HỒNG THỊNH" → "Nguyễn Hồng Thịnh")
    const formattedFullName = formatVietnameseName(ocrData.name.trim())
    const nameParts = formattedFullName.split(' ')
    const lastName = nameParts[0] || ''
    const firstName = nameParts.slice(1).join(' ') || ''

    console.log('OCR Data received:', {
      originalName: ocrData.name,
      formattedName: formattedFullName,
      firstName,
      lastName,
      gender: ocrData.sex,
      dob: ocrData.dob,
      province: ocrData.province,
      district: ocrData.district,
      ward: ocrData.ward,
      street: ocrData.street
    })

    // Set form data trước
    setFormData((prev) => ({
      ...prev,
      firstName,
      lastName,
      identifyCard: ocrData.id,
      gender: ocrData.sex,
      dateOfBirth: ocrData.dob
    }))

    // Set địa chỉ user từ CCCD
    setUserStreetAddress(ocrData.street || '')

    // Load user provinces nếu chưa có
    let provincesToSearch = userProvinces
    if (provincesToSearch.length === 0) {
      await loadUserProvinces()
      // Reload provinces sau khi load xong
      provincesToSearch = await getProvinces()
    }

    // Auto-fill địa chỉ user: Province → District → Ward
    if (ocrData.province) {
      // Tìm province
      const foundProvince = provincesToSearch.find(
        (p) =>
          p.name.toLowerCase().includes(ocrData.province.toLowerCase()) ||
          ocrData.province.toLowerCase().includes(p.name.toLowerCase())
      )

      if (foundProvince) {
        setSelectedUserProvince(foundProvince)

        // Load districts và tìm district
        if (ocrData.district) {
          try {
            setIsLoadingUserDistricts(true)
            const districtList = await getDistricts(foundProvince.id)
            setUserDistricts(districtList)

            // Tìm district
            const foundDistrict = districtList.find(
              (d) =>
                d.name.toLowerCase().includes(ocrData.district.toLowerCase()) ||
                ocrData.district.toLowerCase().includes(d.name.toLowerCase())
            )

            if (foundDistrict) {
              setSelectedUserDistrict(foundDistrict)

              // Load wards và tìm ward
              if (ocrData.ward) {
                try {
                  setIsLoadingUserWards(true)
                  const wardList = await getWards(foundDistrict.id)
                  setUserWards(wardList)

                  // Tìm ward
                  const foundWard = wardList.find(
                    (w) =>
                      w.name.toLowerCase().includes(ocrData.ward.toLowerCase()) ||
                      ocrData.ward.toLowerCase().includes(w.name.toLowerCase())
                  )

                  if (foundWard) {
                    setSelectedUserWard(foundWard)
                    console.log('Auto-filled user address from CCCD:', {
                      province: foundProvince.name,
                      district: foundDistrict.name,
                      ward: foundWard.name,
                      street: ocrData.street
                    })
                  }
                } catch (error) {
                  console.error('Error loading user wards:', error)
                } finally {
                  setIsLoadingUserWards(false)
                }
              }
            }
          } catch (error) {
            console.error('Error loading user districts:', error)
          } finally {
            setIsLoadingUserDistricts(false)
          }
        }
      }
    }

    // Clear errors
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors.firstName
      delete newErrors.lastName
      delete newErrors.identifyCard
      delete newErrors.gender
      delete newErrors.dateOfBirth
      delete newErrors.address
      return newErrors
    })
  }
  // ===== HẾT PHẦN SỬA =====

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleAgreementChange = (field: keyof FormData['agreements'], value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [field]: value
      }
    }))

    if (errors.agreements) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.agreements
        return newErrors
      })
    }
  }

  const handleFileChange = (field: string, files: File[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: files
    }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const loadProvinces = async () => {
    setIsLoadingProvinces(true)
    try {
      const data = await getProvinces()
      setProvinces(data)
    } catch (error) {
      console.error('Error loading provinces:', error)
      toast.error('Không thể tải danh sách tỉnh/thành phố')
    } finally {
      setIsLoadingProvinces(false)
    }
  }

  const loadDistricts = async (provinceId: number) => {
    setIsLoadingDistricts(true)
    setDistricts([])
    setWards([])
    setSelectedDistrict(null)
    setSelectedWard(null)
    try {
      const data = await getDistricts(provinceId)
      setDistricts(data)
    } catch (error) {
      console.error('Error loading districts:', error)
      toast.error('Không thể tải danh sách quận/huyện')
    } finally {
      setIsLoadingDistricts(false)
    }
  }

  const loadWards = async (districtId: number) => {
    setIsLoadingWards(true)
    setWards([])
    setSelectedWard(null)
    try {
      const data = await getWards(districtId)
      setWards(data)
    } catch (error) {
      console.error('Error loading wards:', error)
      toast.error('Không thể tải danh sách phường/xã')
    } finally {
      setIsLoadingWards(false)
    }
  }

  const handleProvinceChange = (provinceId: string) => {
    const province = provinces.find((p) => p.id.toString() === provinceId)
    if (province) {
      setSelectedProvince(province)
      loadDistricts(province.id)
    }
  }

  const handleDistrictChange = (districtId: string) => {
    const district = districts.find((d) => d.id.toString() === districtId)
    if (district) {
      setSelectedDistrict(district)
      loadWards(district.id)
    }
  }

  const handleWardChange = (wardId: string) => {
    const ward = wards.find((w) => w.id.toString() === wardId)
    if (ward) {
      setSelectedWard(ward)
    }
  }

  // Load user provinces khi component mount
  const loadUserProvinces = async () => {
    setIsLoadingUserProvinces(true)
    try {
      const data = await getProvinces()
      setUserProvinces(data)
    } catch (error) {
      console.error('Error loading user provinces:', error)
      toast.error('Không thể tải danh sách tỉnh/thành phố')
    } finally {
      setIsLoadingUserProvinces(false)
    }
  }

  const loadUserDistricts = async (provinceId: number) => {
    setIsLoadingUserDistricts(true)
    setUserDistricts([])
    setUserWards([])
    setSelectedUserDistrict(null)
    setSelectedUserWard(null)
    try {
      const data = await getDistricts(provinceId)
      setUserDistricts(data)
    } catch (error) {
      console.error('Error loading user districts:', error)
      toast.error('Không thể tải danh sách quận/huyện')
    } finally {
      setIsLoadingUserDistricts(false)
    }
  }

  const loadUserWards = async (districtId: number) => {
    setIsLoadingUserWards(true)
    setUserWards([])
    setSelectedUserWard(null)
    try {
      const data = await getWards(districtId)
      setUserWards(data)
    } catch (error) {
      console.error('Error loading user wards:', error)
      toast.error('Không thể tải danh sách phường/xã')
    } finally {
      setIsLoadingUserWards(false)
    }
  }

  const handleUserProvinceChange = (provinceId: string) => {
    const province = userProvinces.find((p) => p.id.toString() === provinceId)
    if (province) {
      setSelectedUserProvince(province)
      loadUserDistricts(province.id)
    }
  }

  const handleUserDistrictChange = (districtId: string) => {
    const district = userDistricts.find((d) => d.id.toString() === districtId)
    if (district) {
      setSelectedUserDistrict(district)
      loadUserWards(district.id)
    }
  }

  const handleUserWardChange = (wardId: string) => {
    const ward = userWards.find((w) => w.id.toString() === wardId)
    if (ward) {
      setSelectedUserWard(ward)
    }
  }

  React.useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard && specificAddress.trim()) {
      const fullAddress = `${specificAddress}, ${selectedWard.name}, ${selectedDistrict.name}, ${selectedProvince.name}`
      setFullAddressDisplay(fullAddress)
    } else {
      setFullAddressDisplay('')
    }
  }, [selectedProvince, selectedDistrict, selectedWard, specificAddress])

  const loadBanks = async () => {
    setIsLoadingBanks(true)
    try {
      const data = await getBanks()
      setBanks(data)
    } catch (error) {
      console.error('Error loading banks:', error)
      toast.error('Không thể tải danh sách ngân hàng')
    } finally {
      setIsLoadingBanks(false)
    }
  }

  const handleVerifyBankAccount = async () => {
    if (!selectedBank) {
      toast.error('Vui lòng chọn ngân hàng trước')
      return
    }

    if (!formData.bankAccount || formData.bankAccount.trim() === '') {
      toast.error('Vui lòng nhập số tài khoản ngân hàng')
      return
    }

    try {
      setIsVerifyingAccount(true)
      setAccountVerificationError(null)
      setAccountOwnerName(null)

      const result = await verifyBankAccount(selectedBank.code, formData.bankAccount.trim())

      if (result.success && result.data) {
        setAccountOwnerName(result.data.ownerName)
        toast.success(`Tài khoản hợp lệ! Chủ tài khoản: ${result.data.ownerName}`)
      } else {
        throw new Error(result.msg || 'Không thể xác thực tài khoản')
      }
    } catch (error) {
      console.error('Error verifying bank account:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể kiểm tra tài khoản ngân hàng'
      setAccountVerificationError(errorMessage)
      setAccountOwnerName(null)
      toast.error(errorMessage)
    } finally {
      setIsVerifyingAccount(false)
    }
  }

  React.useEffect(() => {
    loadProvinces()
    loadUserProvinces()
    loadBanks()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    const requiredTextFields: (keyof FormData)[] = [
      'firstName',
      'lastName',
      'email',
      'phoneNumber',
      'password',
      'confirmPassword',
      'gender',
      'dateOfBirth',
      'businessName',
      'taxCode',
      'bankName',
      'bankAccount',
      'identifyCard',
      'storeName'
    ]

    requiredTextFields.forEach((field) => {
      const value = formData[field]
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field] = 'Trường này là bắt buộc'
      }
    })

    if (formData.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ'
      }
    }

    if (formData.phoneNumber) {
      const phoneRegex = /^[0-9]{10,12}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Số điện thoại phải có 10-12 chữ số'
      }
    }

    if (formData.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      if (!passwordRegex.test(formData.password)) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (formData.dateOfBirth) {
      try {
        const birthDate = new Date(formData.dateOfBirth)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }

        if (age < 18) {
          newErrors.dateOfBirth = 'Bạn phải ít nhất 18 tuổi để đăng ký'
        } else if (age > 100) {
          newErrors.dateOfBirth = 'Ngày sinh không hợp lệ'
        }
      } catch {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ'
      }
    }

    // Validate địa chỉ user (từ CCCD)
    if (!selectedUserProvince) {
      newErrors.userAddress = 'Vui lòng chọn tỉnh/thành phố cho địa chỉ từ CCCD'
    } else if (!selectedUserDistrict) {
      newErrors.userAddress = 'Vui lòng chọn quận/huyện cho địa chỉ từ CCCD'
    } else if (!selectedUserWard) {
      newErrors.userAddress = 'Vui lòng chọn phường/xã cho địa chỉ từ CCCD'
    } else if (!userStreetAddress.trim()) {
      newErrors.userAddress = 'Vui lòng nhập địa chỉ cụ thể cho địa chỉ từ CCCD'
    }

    // Validate địa chỉ cửa hàng
    if (!selectedProvince) {
      newErrors.address = 'Vui lòng chọn tỉnh/thành phố cho cửa hàng'
    } else if (!selectedDistrict) {
      newErrors.address = 'Vui lòng chọn quận/huyện cho cửa hàng'
    } else if (!selectedWard) {
      newErrors.address = 'Vui lòng chọn phường/xã cho cửa hàng'
    } else if (!specificAddress.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ cụ thể cho cửa hàng'
    }

    if (!formData.identifyFrontImage || formData.identifyFrontImage.length === 0) {
      newErrors.identifyFrontImage = 'Vui lòng tải lên mặt trước CCCD'
    }
    if (!formData.identifyBackImage || formData.identifyBackImage.length === 0) {
      newErrors.identifyBackImage = 'Vui lòng tải lên mặt sau CCCD'
    }
    if (!formData.vendorApplicationImageUrl || formData.vendorApplicationImageUrl.length === 0) {
      newErrors.vendorApplicationImageUrl = 'Vui lòng tải lên giấy phép kinh doanh'
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = 'Vui lòng nhập mô tả cửa hàng'
    }

    if (!formData.businessLicense || formData.businessLicense.length === 0) {
      newErrors.businessLicense = 'Vui lòng tải lên Giấy phép kinh doanh'
    }

    const allAgreed = Object.values(formData.agreements).every((value) => value === true)
    if (!allAgreed) {
      newErrors.agreements = 'Vui lòng đồng ý với tất cả các điều khoản bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin đã điền!')
      const firstErrorField = Object.keys(errors)[0]
      const errorElement = document.getElementById(firstErrorField)
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setIsLoading(true)
    try {
      const apiData = {
        userInfo: {
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          province: selectedUserProvince?.name || '',
          district: selectedUserDistrict?.name || '',
          ward: selectedUserWard?.name || '',
          streetAddress: userStreetAddress,
          provinceId: selectedUserProvince?.id || 0,
          districtId: selectedUserDistrict?.id || 0,
          wardId: selectedUserWard?.id || 0
        },
        sellerInfo: {
          businessName: formData.businessName,
          taxCode: formData.taxCode,
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          identifyCard: formData.identifyCard,
          identifyFrontImage: formData.identifyFrontImage[0] || null,
          identifyBackImage: formData.identifyBackImage[0] || null,
          businessLicense: formData.businessLicense[0] || null
        },
        storeInfo: {
          storeName: formData.storeName,
          address: specificAddress,
          province: selectedProvince?.name || '',
          district: selectedDistrict?.name || '',
          ward: selectedWard?.name || '',
          provinceID: selectedProvince?.id || 0,
          districtID: selectedDistrict?.id || 0,
          wardID: selectedWard?.id || 0,
          description: formData.description.trim(),
          vendorApplicationImageUrl: formData.vendorApplicationImageUrl
        }
      }

      const response = await registerSeller(apiData)

      if (response) {
        toast.success('Đăng ký thành công! Chúng tôi sẽ xem xét và phản hồi trong vòng 24h.')
        setTimeout(() => {
          navigate(path.loginSeller)
        }, 2000)
      }
    } catch (error: unknown) {
      console.error('Registration error:', error)

      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message) {
          toast.error(axiosError.response.data.message)
        } else {
          toast.error('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.')
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        const errorWithMessage = error as { message: string }
        toast.error(errorWithMessage.message)
      } else {
        toast.error('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại sau.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <style>{checkboxStyles}</style>

      <div className='text-center mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>Đăng ký trở thành đối tác bán hàng</h1>
        <p className='text-gray-600'>
          Cùng chúng tôi chia sẻ những sản phẩm đặc sản và thủ công tuyệt vời đến khắp mọi miền
        </p>
      </div>

      {isLoading && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-xl p-8 shadow-xl'>
            <Loading size='lg' text='Đang xử lý đăng ký...' />
          </div>
        </div>
      )}

      <div className='bg-white rounded-lg shadow-sm p-8'>
        <form onSubmit={handleSubmit} className='space-y-12'>
          {/* Thông tin tài khoản */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                <span className='text-blue-600 font-semibold'>1</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin tài khoản</h2>
                <p className='text-sm text-gray-500'>Thông tin đăng nhập và liên hệ của bạn</p>
              </div>
            </div>

            {/* Giấy tờ cá nhân */}
            <div className='rounded-xl p-6 border border-blue-200'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                  <svg className='w-5 h-5 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                    />
                  </svg>
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>Giấy tờ cá nhân</h3>
                  <p className='text-sm text-gray-600'>CCCD mặt trước và mặt sau</p>
                </div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FileUploadFieldWithOCR
                  label='Mặt trước CCCD'
                  onChange={(files) => handleFileChange('identifyFrontImage', files)}
                  onOCRData={handleOCRData}
                  enableOCR={true}
                  required
                  description='File ảnh rõ nét, đầy đủ 4 góc, định dạng JPG/PNG'
                  maxCount={1}
                />

                <FileUploadField
                  label='Mặt sau CCCD'
                  onChange={(files) => handleFileChange('identifyBackImage', files)}
                  required
                  description='File ảnh rõ nét, đầy đủ 4 góc, định dạng JPG/PNG'
                  maxCount={1}
                />
              </div>
              {errors.identifyFrontImage && <p className='text-sm text-red-500 mt-2'>{errors.identifyFrontImage}</p>}
              {errors.identifyBackImage && <p className='text-sm text-red-500 mt-2'>{errors.identifyBackImage}</p>}
            </div>
            {/* Địa chỉ từ CCCD */}
            <div className='rounded-xl p-6 border border-blue-200'>
              <div className='flex items-center gap-3 mb-6'>
                <MapPinIcon className='w-4 h-4 text-blue-600 mb-4' />
                <div>
                  <p>Địa chỉ thường trú</p>
                </div>
              </div>
              <div className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='userProvince' className='text-sm text-gray-600'>
                      Tỉnh/Thành phố <span className='text-red-500'>*</span>
                    </Label>
                    <ComboBox
                      options={userProvinces}
                      placeholder={isLoadingUserProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                      disabled={isLoadingUserProvinces}
                      value={selectedUserProvince?.id?.toString() || ''}
                      onSelect={(province) => {
                        if (province) {
                          handleUserProvinceChange(province.id.toString())
                        } else {
                          setSelectedUserProvince(null)
                        }
                      }}
                      getOptionLabel={(province) => province.name}
                      getOptionValue={(province) => province.id.toString()}
                      filterFunction={(province, searchValue) =>
                        province.name.toLowerCase().includes(searchValue.toLowerCase())
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='userDistrict' className='text-sm text-gray-600'>
                      Quận/Huyện <span className='text-red-500'>*</span>
                    </Label>
                    <ComboBox
                      options={userDistricts}
                      placeholder={
                        !selectedUserProvince
                          ? 'Chọn tỉnh/thành phố trước'
                          : isLoadingUserDistricts
                            ? 'Đang tải...'
                            : 'Chọn quận/huyện'
                      }
                      disabled={!selectedUserProvince || isLoadingUserDistricts}
                      value={selectedUserDistrict?.id?.toString() || ''}
                      onSelect={(district) => {
                        if (district) {
                          handleUserDistrictChange(district.id.toString())
                        } else {
                          setSelectedUserDistrict(null)
                        }
                      }}
                      getOptionLabel={(district) => district.name}
                      getOptionValue={(district) => district.id.toString()}
                      filterFunction={(district, searchValue) =>
                        district.name.toLowerCase().includes(searchValue.toLowerCase())
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='userWard' className='text-sm text-gray-600'>
                      Phường/Xã <span className='text-red-500'>*</span>
                    </Label>
                    <ComboBox
                      options={userWards}
                      placeholder={
                        !selectedUserDistrict
                          ? 'Chọn quận/huyện trước'
                          : isLoadingUserWards
                            ? 'Đang tải...'
                            : 'Chọn phường/xã'
                      }
                      disabled={!selectedUserDistrict || isLoadingUserWards}
                      value={selectedUserWard?.id?.toString() || ''}
                      onSelect={(ward) => {
                        if (ward) {
                          handleUserWardChange(ward.id.toString())
                        } else {
                          setSelectedUserWard(null)
                        }
                      }}
                      getOptionLabel={(ward) => ward.name}
                      getOptionValue={(ward) => ward.id.toString()}
                      filterFunction={(ward, searchValue) => ward.name.toLowerCase().includes(searchValue.toLowerCase())}
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='userStreetAddress' className='text-sm text-gray-600'>
                    Địa chỉ cụ thể (số nhà, tên đường) <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='userStreetAddress'
                    value={userStreetAddress}
                    onChange={(e) => setUserStreetAddress(e.target.value)}
                    placeholder='Số nhà, tên đường, tòa nhà...'
                    className='w-full'
                  />
                </div>
                {errors.userAddress && <p className='text-sm text-red-500'>{errors.userAddress}</p>}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='lastName'>
                  Họ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='lastName'
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder='Nhập họ (VD: Nguyễn)'
                />
                {errors.lastName && <p className='text-sm text-red-500'>{errors.lastName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='firstName'>
                  Tên <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='firstName'
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder='Nhập tên (VD: Công Trung)'
                />
                {errors.firstName && <p className='text-sm text-red-500'>{errors.firstName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>
                  Email <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder='example@email.com'
                />
                {errors.email && <p className='text-sm text-red-500'>{errors.email}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phoneNumber'>
                  Số điện thoại <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='phoneNumber'
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder='0987654321'
                />
                {errors.phoneNumber && <p className='text-sm text-red-500'>{errors.phoneNumber}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>
                  Mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder='Nhập mật khẩu'
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className='text-sm text-red-500'>{errors.password}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>
                  Xác nhận mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder='Nhập lại mật khẩu'
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className='text-sm text-red-500'>{errors.confirmPassword}</p>}
              </div>

              {/* ===== ĐÂY LÀ PHẦN ĐÃ SỬA: CHỈ CÓ 2 GIỚI TÍNH ===== */}
              <div className='space-y-2'>
                <Label htmlFor='gender'>
                  Giới tính <span className='text-red-500'>*</span>
                </Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger id='gender'>
                    <SelectValue placeholder='Chọn giới tính' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Male'>Nam</SelectItem>
                    <SelectItem value='Female'>Nữ</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className='text-sm text-red-500'>{errors.gender}</p>}
              </div>
              {/* ===== HẾT PHẦN SỬA ===== */}

              <div className='space-y-2'>
                <Label htmlFor='dateOfBirth' className='px-1'>
                  Ngày sinh<span className='text-destructive'>*</span>
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant='outline' id='dateOfBirth' className='w-full justify-between font-normal'>
                      {formData.dateOfBirth
                        ? format(new Date(formData.dateOfBirth), 'dd/MM/yyyy', { locale: vi })
                        : 'Chọn ngày sinh'}
                      <ChevronDownIcon className='h-4 w-4' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
                      captionLayout='dropdown'
                      onSelect={(date) => {
                        if (date) {
                          handleInputChange('dateOfBirth', date.toISOString().split('T')[0])
                        }
                        setCalendarOpen(false)
                      }}
                      disabled={(date) => {
                        const today = new Date()
                        const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
                        const hundredYearsAgo = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
                        return date > eighteenYearsAgo || date < hundredYearsAgo
                      }}
                      locale={vi}
                      defaultMonth={new Date(new Date().getFullYear() - 18, new Date().getMonth())}
                    />
                  </PopoverContent>
                </Popover>
                {errors.dateOfBirth && <p className='text-sm text-red-500'>{errors.dateOfBirth}</p>}
              </div>
            </div>


          </div>

          {/* Thông tin cửa hàng */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                <span className='text-green-600 font-semibold'>2</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin cửa hàng</h2>
                <p className='text-sm text-gray-500'>Thông tin về cửa hàng và sản phẩm kinh doanh</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='storeName'>
                  Tên cửa hàng <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='storeName'
                  value={formData.storeName}
                  onChange={(e) => handleInputChange('storeName', e.target.value)}
                  placeholder='Tên cửa hàng của bạn'
                />
                {errors.storeName && <p className='text-sm text-red-500'>{errors.storeName}</p>}
              </div>
            </div>
            <div className='space-y-4'>
              <Label className='text-sm font-medium'>
                Địa chỉ cửa hàng <span className='text-red-500'>*</span>
              </Label>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='province' className='text-sm text-gray-600'>
                    Tỉnh/Thành phố <span className='text-red-500'>*</span>
                  </Label>
                  <ComboBox
                    options={provinces}
                    placeholder={isLoadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                    disabled={isLoadingProvinces}
                    value={selectedProvince?.id?.toString() || ''}
                    onSelect={(province) => {
                      if (province) {
                        handleProvinceChange(province.id.toString())
                      } else {
                        setSelectedProvince(null)
                      }
                    }}
                    getOptionLabel={(province) => province.name}
                    getOptionValue={(province) => province.id.toString()}
                    filterFunction={(province, searchValue) =>
                      province.name.toLowerCase().includes(searchValue.toLowerCase())
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='district' className='text-sm text-gray-600'>
                    Quận/Huyện <span className='text-red-500'>*</span>
                  </Label>
                  <ComboBox
                    options={districts}
                    placeholder={
                      !selectedProvince
                        ? 'Chọn tỉnh/thành phố trước'
                        : isLoadingDistricts
                          ? 'Đang tải...'
                          : 'Chọn quận/huyện'
                    }
                    disabled={!selectedProvince || isLoadingDistricts}
                    value={selectedDistrict?.id?.toString() || ''}
                    onSelect={(district) => {
                      if (district) {
                        handleDistrictChange(district.id.toString())
                      } else {
                        setSelectedDistrict(null)
                      }
                    }}
                    getOptionLabel={(district) => district.name}
                    getOptionValue={(district) => district.id.toString()}
                    filterFunction={(district, searchValue) =>
                      district.name.toLowerCase().includes(searchValue.toLowerCase())
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='ward' className='text-sm text-gray-600'>
                    Phường/Xã <span className='text-red-500'>*</span>
                  </Label>
                  <ComboBox
                    options={wards}
                    placeholder={
                      !selectedDistrict
                        ? 'Chọn quận/huyện trước'
                        : isLoadingWards
                          ? 'Đang tải...'
                          : 'Chọn phường/xã'
                    }
                    disabled={!selectedDistrict || isLoadingWards}
                    value={selectedWard?.id?.toString() || ''}
                    onSelect={(ward) => {
                      if (ward) {
                        handleWardChange(ward.id.toString())
                      } else {
                        setSelectedWard(null)
                      }
                    }}
                    getOptionLabel={(ward) => ward.name}
                    getOptionValue={(ward) => ward.id.toString()}
                    filterFunction={(ward, searchValue) => ward.name.toLowerCase().includes(searchValue.toLowerCase())}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='specificAddress' className='text-sm text-gray-600'>
                  Địa chỉ cụ thể (số nhà, tên đường) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='specificAddress'
                  value={specificAddress}
                  onChange={(e) => setSpecificAddress(e.target.value)}
                  placeholder='Số nhà, tên đường, tòa nhà...'
                  className='w-full'
                />
              </div>

              {fullAddressDisplay && (
                <div className='p-3 bg-gray-50 rounded-lg border'>
                  <Label className='text-sm text-gray-600'>Địa chỉ hoàn chỉnh:</Label>
                  <p className='text-sm text-gray-800 mt-1'>{fullAddressDisplay}</p>
                </div>
              )}

              {errors.address && <p className='text-sm text-red-500'>{errors.address}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description' className='text-sm text-gray-600'>
                Mô tả cửa hàng <span className='text-red-500'>*</span>
              </Label>
              <div className='relative'>
                <textarea
                  id='description'
                  className='w-full border rounded p-2 min-h-[100px] pr-20'
                  value={formData.description}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= 200) {
                      handleInputChange('description', value)
                    }
                  }}
                  placeholder='Mô tả sản phẩm/dịch vụ, thế mạnh, nguồn hàng...'
                  maxLength={200}
                />
                <span className='absolute bottom-2 right-2 text-xs text-gray-500'>
                  {formData.description.length}/200
                </span>
              </div>
              {errors.description && <p className='text-sm text-red-500'>{errors.description}</p>}
            </div>
          </div>

          {/* Thông tin seller */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                <span className='text-yellow-600 font-semibold'>3</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin seller</h2>
                <p className='text-sm text-gray-500'>Thông tin kinh doanh và ngân hàng</p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='businessName'>
                  Tên doanh nghiệp <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='businessName'
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  placeholder='Tên doanh nghiệp/công ty'
                />
                {errors.businessName && <p className='text-sm text-red-500'>{errors.businessName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='taxCode'>
                  Mã số thuế <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='taxCode'
                  value={formData.taxCode}
                  onChange={(e) => handleInputChange('taxCode', e.target.value)}
                  placeholder='Mã số thuế doanh nghiệp'
                />
                {errors.taxCode && <p className='text-sm text-red-500'>{errors.taxCode}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bankName'>
                  Tên ngân hàng <span className='text-red-500'>*</span>
                </Label>
                <ComboBox
                  options={banks}
                  placeholder={isLoadingBanks ? 'Đang tải danh sách ngân hàng...' : 'Chọn ngân hàng'}
                  disabled={isLoadingBanks}
                  value={selectedBank ? selectedBank.id.toString() : ''}
                  onSelect={(bank) => {
                    if (bank) {
                      setSelectedBank(bank)
                      handleInputChange('bankName', bank.name)
                      // Reset verification when bank changes
                      setAccountOwnerName(null)
                      setAccountVerificationError(null)
                    } else {
                      setSelectedBank(null)
                      handleInputChange('bankName', '')
                      setAccountOwnerName(null)
                      setAccountVerificationError(null)
                    }
                  }}
                  getOptionLabel={(bank) => bank.name}
                  getOptionValue={(bank) => bank.id.toString()}
                  renderOption={(bank) => (
                    <div className='flex items-center gap-3'>
                      {bank.logo && (
                        <img
                          src={bank.logo}
                          alt={bank.name}
                          className='w-15 h-15 object-contain rounded'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <span className='flex-1'>{bank.name}</span>
                    </div>
                  )}
                  filterFunction={(bank, searchValue) =>
                    bank.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                    bank.shortName.toLowerCase().includes(searchValue.toLowerCase())
                  }
                />
                {errors.bankName && <p className='text-sm text-red-500'>{errors.bankName}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='bankAccount'>
                  Số tài khoản ngân hàng <span className='text-red-500'>*</span>
                </Label>
                <div className='flex gap-2'>
                  <Input
                    id='bankAccount'
                    value={formData.bankAccount}
                    onChange={(e) => {
                      handleInputChange('bankAccount', e.target.value)
                      // Reset verification when account number changes
                      setAccountOwnerName(null)
                      setAccountVerificationError(null)
                    }}
                    placeholder='Số tài khoản ngân hàng'
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='yellow'
                    onClick={handleVerifyBankAccount}
                    disabled={!selectedBank || !formData.bankAccount || isVerifyingAccount}
                  >
                    {isVerifyingAccount ? 'Đang kiểm tra...' : 'Kiểm tra'}
                  </Button>
                </div>
                {accountOwnerName && (
                  <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                    <p className='text-sm text-green-800'>
                      <span className='font-semibold'>✓ Tài khoản hợp lệ</span>
                      <br />
                      <span className='text-xs'>Chủ tài khoản: {accountOwnerName}</span>
                    </p>
                  </div>
                )}
                {accountVerificationError && (
                  <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
                    <p className='text-sm text-red-800'>
                      <span className='font-semibold'>✗ {accountVerificationError}</span>
                    </p>
                  </div>
                )}
                {errors.bankAccount && <p className='text-sm text-red-500'>{errors.bankAccount}</p>}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='identifyCard'>
                  Số CCCD <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='identifyCard'
                  value={formData.identifyCard}
                  onChange={(e) => handleInputChange('identifyCard', e.target.value)}
                  placeholder='Số căn cước công dân'
                />
                {errors.identifyCard && <p className='text-sm text-red-500'>{errors.identifyCard}</p>}
              </div>
            </div>
          </div>

          {/* Giấy tờ và chứng nhận */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                <span className='text-purple-600 font-semibold'>4</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Giấy tờ và chứng nhận</h2>
                <p className='text-sm text-gray-500'>Upload các giấy tờ cần thiết</p>
              </div>
            </div>

            <div className='space-y-8'>
              <div className='rounded-xl p-6 border border-green-200'>
                <div className='flex items-center gap-3 mb-6'>
                  <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
                    <svg className='w-5 h-5 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      Các giấy tờ liên quan đến hoạt động kinh doanh
                    </h3>
                  </div>
                </div>
                <div className='space-y-4'>
                  <FileUploadField
                    label='Giấy phép kinh doanh'
                    onChange={(files) => handleFileChange('businessLicense', files)}
                    required
                    description='Bắt buộc: 1 file ảnh/PDF rõ nét'
                    accept='image/*,.pdf'
                    maxCount={1}
                  />
                  <FileUploadField
                    label='Giấy tờ đăng ký bán hàng'
                    onChange={(files) => handleFileChange('vendorApplicationImageUrl', files)}
                    multiple
                    description='Có thể upload nhiều file (tối đa 5 file), định dạng JPG/PNG/PDF'
                    maxCount={5}
                  />

                  <div className='bg-white/60 rounded-lg p-4 border border-green-200'>
                    <h4 className='font-medium text-gray-900 mb-3'>Các loại giấy tờ có thể upload:</h4>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600'>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy phép kinh doanh</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy chứng nhận đăng ký thuế</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy phép vệ sinh an toàn thực phẩm</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span>Giấy chứng nhận chất lượng sản phẩm</span>
                      </div>
                    </div>
                  </div>
                  {errors.vendorApplicationImageUrl && (
                    <p className='text-sm text-red-500'>{errors.vendorApplicationImageUrl}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cam kết và thỏa thuận */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-4'>
              <div className='w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shadow-sm'>
                <span className='text-red-600 font-semibold'>5</span>
              </div>
              <div>
                <h2 className='text-lg md:text-xl font-semibold text-gray-900'>Cam kết của người bán</h2>
                <p className='text-sm text-gray-500'>
                  <span>Đọc và đồng ý với các điều khoản: </span>
                  <button
                    type='button'
                    onClick={() => {
                      window.open('/portal', '_blank')
                      setHasOpenedTermsPage(true)
                    }}
                    className='text-green-600 hover:text-green-700 underline font-medium'
                  >
                    Điều khoản dịch vụ
                  </button>
                  {!hasOpenedTermsPage && (
                    <span className='ml-2 text-orange-600 text-xs'>* Vui lòng mở và đọc điều khoản trước khi đồng ý</span>
                  )}
                </p>
              </div>
            </div>

            {!hasOpenedTermsPage && (
              <div className='bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4'>
                <p className='text-sm text-orange-800'>
                  <span className='font-semibold'>Lưu ý:</span> Vui lòng mở và đọc{' '}
                  <button
                    type='button'
                    onClick={() => {
                      window.open('/portal', '_blank')
                      setHasOpenedTermsPage(true)
                    }}
                    className='text-green-600 hover:text-green-700 underline font-medium'
                  >
                    Điều khoản dịch vụ
                  </button>{' '}
                  trước khi có thể đồng ý với các điều khoản.
                </p>
              </div>
            )}
            <div className='space-y-5'>
              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  id='terms'
                  checked={formData.agreements.terms}
                  onCheckedChange={(checked) => handleAgreementChange('terms', checked as boolean)}
                  disabled={!hasOpenedTermsPage}
                />
                <Label
                  htmlFor='terms'
                  onClick={(e) => {
                    if (!hasOpenedTermsPage) {
                      e.preventDefault()
                      toast.warning('Vui lòng mở và đọc Điều khoản dịch vụ trước khi đồng ý')
                    }
                  }}
                  className={`text-sm font-medium leading-5 ${!hasOpenedTermsPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  Tôi đồng ý với Điều khoản dịch vụ và Quy chế hoạt động
                  <span className='ml-1 text-red-500'>*</span>
                </Label>
              </div>

              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  id='policy'
                  checked={formData.agreements.policy}
                  onCheckedChange={(checked) => handleAgreementChange('policy', checked as boolean)}
                  disabled={!hasOpenedTermsPage}
                />
                <Label
                  htmlFor='policy'
                  onClick={(e) => {
                    if (!hasOpenedTermsPage) {
                      e.preventDefault()
                      toast.warning('Vui lòng mở và đọc Điều khoản dịch vụ trước khi đồng ý')
                    }
                  }}
                  className={`text-sm font-medium leading-5 ${!hasOpenedTermsPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  Tôi đồng ý với Chính sách bảo mật và xử lý dữ liệu cá nhân
                  <span className='ml-1 text-red-500'>*</span>
                </Label>
              </div>

              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  id='commission'
                  checked={formData.agreements.commission}
                  onCheckedChange={(checked) => handleAgreementChange('commission', checked as boolean)}
                  disabled={!hasOpenedTermsPage}
                />
                <Label
                  htmlFor='commission'
                  onClick={(e) => {
                    if (!hasOpenedTermsPage) {
                      e.preventDefault()
                      toast.warning('Vui lòng mở và đọc Điều khoản dịch vụ trước khi đồng ý')
                    }
                  }}
                  className={`text-sm font-medium leading-5 ${!hasOpenedTermsPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  Tôi đồng ý với chính sách hoa hồng và phí dịch vụ của nền tảng
                  <span className='ml-1 text-red-500'>*</span>
                </Label>
              </div>

              <div className='flex items-start gap-3'>
                <Checkbox
                  className='mt-1 h-5 w-5 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 data-[state=checked]:text-white border-2 border-gray-300 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  id='productQuality'
                  checked={formData.agreements.productQuality}
                  onCheckedChange={(checked) => handleAgreementChange('productQuality', checked as boolean)}
                  disabled={!hasOpenedTermsPage}
                />
                <div>
                  <Label
                    htmlFor='productQuality'
                    onClick={(e) => {
                      if (!hasOpenedTermsPage) {
                        e.preventDefault()
                        toast.warning('Vui lòng mở và đọc Điều khoản dịch vụ trước khi đồng ý')
                      }
                    }}
                    className={`text-sm font-medium leading-5 ${!hasOpenedTermsPage ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  >
                    Tôi cam kết về chất lượng, nguồn gốc và tính xác thực của sản phẩm
                    <span className='ml-1 text-red-500'>*</span>
                  </Label>
                  <p className='mt-1 text-xs text-gray-500'>
                    Tôi đồng ý chịu trách nhiệm hoàn toàn về chất lượng và nguồn gốc sản phẩm.
                  </p>
                </div>
              </div>
            </div>

            {errors.agreements && <p className='text-sm text-red-500 font-medium'>{errors.agreements}</p>}
          </div>

          {/* Submit buttons */}
          <div className='flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate(path.home)}
              className='w-full sm:w-auto px-8'
            >
              Hủy bỏ
            </Button>
            <Button
              type='submit'
              variant='green'
              disabled={isLoading}
              className='w-full sm:w-auto bg-green-600 hover:bg-green-700 px-8'
            >
              {isLoading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Đang xử lý...
                </div>
              ) : (
                'Đăng ký bán hàng'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SellerRegistrationForm
