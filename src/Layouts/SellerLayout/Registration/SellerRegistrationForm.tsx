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
import {
  ChevronDownIcon,
  Eye,
  EyeOff,
  Loader2,
  MapPinIcon,
  Image as ImageIcon,
  X,
  ChevronsUpDown,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
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
import {
  extractCCCDInfo,
  extractCCCDBackInfo,
  type ExtractedCCCDInfo,
  type ExtractedCCCDBackInfo
} from '../../../apis/fptai.api'
import { getBanks, verifyBankAccount, type Bank } from '../../../apis/user.api'
import ComboBox from '../../../components/ui/combo-box'
import { validateCertificate, type ValidateCertificateResponse } from '../../../apis/n8n.api'
import CertificateInfoDisplay from '../../../components/CertificateInfoDisplay'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../../../components/ui/command'

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
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = React.useRef(0)

  const processOCR = async (file: File) => {
    if (enableOCR && onOCRData) {
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

  const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    setFileList(newFileList)
    const newFiles = newFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)
    onChange(newFiles)

    if (enableOCR && newFiles.length > 0 && onOCRData) {
      await processOCR(newFiles[0])
    }
  }

  const validateFile = (file: File): boolean => {
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

    return true
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    if (validFiles.length === 0) return

    // Kiểm tra số lượng file
    const currentCount = fileList.length
    const remainingSlots = maxCount - currentCount

    if (remainingSlots <= 0) {
      message.warning(`Chỉ được upload tối đa ${maxCount} file`)
      return
    }

    const filesToAdd = multiple ? validFiles.slice(0, remainingSlots) : validFiles.slice(0, 1)

    if (validFiles.length > filesToAdd.length) {
      message.warning(`Chỉ được upload tối đa ${maxCount} file. Đã chọn ${filesToAdd.length} file đầu tiên.`)
    }

    // Tạo UploadFile objects
    const newUploadFiles: UploadFile[] = filesToAdd.map((file) => ({
      uid: `${Date.now()}-${Math.random()}`,
      name: file.name,
      status: 'done',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originFileObj: file as any
    }))

    const updatedFileList = [...fileList, ...newUploadFiles]
    setFileList(updatedFileList)
    const allFiles = updatedFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)
    onChange(allFiles)

    // Process OCR for first file if enabled
    if (enableOCR && filesToAdd.length > 0 && onOCRData) {
      await processOCR(filesToAdd[0])
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessingOCR) {
      dragCounter.current++
      if (dragCounter.current === 1) {
        setIsDragging(true)
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessingOCR && dragCounter.current === 0) {
      dragCounter.current = 1
      setIsDragging(true)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    if (isProcessingOCR) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFiles(files)
    }
  }

  const beforeUpload = (file: File) => {
    if (!validateFile(file)) {
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

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative transition-all duration-200 ${isDragging ? 'ring-2 ring-green-500 ring-offset-2' : ''} ${isProcessingOCR ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div
          className={`absolute inset-0 z-10 bg-green-50 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center pointer-events-none transition-all duration-200 ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
        >
          <div className='text-center transform transition-transform duration-200'>
            <div className='text-green-600 font-semibold text-lg mb-2'>Thả file vào đây</div>
            <div className='text-green-500 text-sm'>{multiple ? `Tối đa ${maxCount} file` : 'Chỉ 1 file'}</div>
          </div>
        </div>
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
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='max-w-4xl max-h-4xl'>
          <DialogHeader>
            <DialogTitle>Preview ảnh</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center'>
            <img src={previewImage} alt='Xem trước' className='max-w-full max-h-96 object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

const FileUploadFieldWithBackOCR = ({
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
  onOCRData?: (data: ExtractedCCCDBackInfo) => void
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
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = React.useRef(0)

  const processOCR = async (file: File) => {
    if (enableOCR && onOCRData) {
      setIsProcessingOCR(true)
      try {
        const ocrResult = await extractCCCDBackInfo(file)
        if (ocrResult) {
          onOCRData(ocrResult)
        } else {
          toast.warning('Không thể đọc thông tin từ ảnh. Vui lòng nhập thủ công.')
        }
      } catch (error) {
        console.error('OCR Error:', error)
        toast.error('Lỗi khi đọc thông tin từ mặt sau CCCD. Vui lòng thử lại hoặc nhập thủ công.')
      } finally {
        setIsProcessingOCR(false)
      }
    }
  }

  const handleChange: UploadProps['onChange'] = async ({ fileList: newFileList }) => {
    setFileList(newFileList)
    const newFiles = newFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)
    onChange(newFiles)

    if (enableOCR && newFiles.length > 0 && onOCRData) {
      await processOCR(newFiles[0])
    }
  }

  const validateFile = (file: File): boolean => {
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

    return true
  }

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []

    fileArray.forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    if (validFiles.length === 0) return

    // Kiểm tra số lượng file
    const currentCount = fileList.length
    const remainingSlots = maxCount - currentCount

    if (remainingSlots <= 0) {
      message.warning(`Chỉ được upload tối đa ${maxCount} file`)
      return
    }

    const filesToAdd = multiple ? validFiles.slice(0, remainingSlots) : validFiles.slice(0, 1)

    if (validFiles.length > filesToAdd.length) {
      message.warning(`Chỉ được upload tối đa ${maxCount} file. Đã chọn ${filesToAdd.length} file đầu tiên.`)
    }

    // Tạo UploadFile objects
    const newUploadFiles: UploadFile[] = filesToAdd.map((file) => ({
      uid: `${Date.now()}-${Math.random()}`,
      name: file.name,
      status: 'done',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originFileObj: file as any
    }))

    const updatedFileList = [...fileList, ...newUploadFiles]
    setFileList(updatedFileList)
    const allFiles = updatedFileList.filter((file) => file.originFileObj).map((file) => file.originFileObj as File)
    onChange(allFiles)

    // Process OCR for first file if enabled
    if (enableOCR && filesToAdd.length > 0 && onOCRData) {
      await processOCR(filesToAdd[0])
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessingOCR) {
      dragCounter.current++
      if (dragCounter.current === 1) {
        setIsDragging(true)
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessingOCR && dragCounter.current === 0) {
      dragCounter.current = 1
      setIsDragging(true)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    if (isProcessingOCR) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      await processFiles(files)
    }
  }

  const beforeUpload = (file: File) => {
    if (!validateFile(file)) {
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

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative transition-all duration-200 ${isDragging ? 'ring-2 ring-green-500 ring-offset-2' : ''} ${isProcessingOCR ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div
          className={`absolute inset-0 z-10 bg-green-50 border-2 border-dashed border-green-500 rounded-lg flex items-center justify-center pointer-events-none transition-all duration-200 ${isDragging ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
        >
          <div className='text-center transform transition-transform duration-200'>
            <div className='text-green-600 font-semibold text-lg mb-2'>Thả file vào đây</div>
            <div className='text-green-500 text-sm'>{multiple ? `Tối đa ${maxCount} file` : 'Chỉ 1 file'}</div>
          </div>
        </div>
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
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='max-w-4xl max-h-4xl'>
          <DialogHeader>
            <DialogTitle>Preview ảnh</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center'>
            <img src={previewImage} alt='Xem trước' className='max-w-full max-h-96 object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component upload đơn giản theo style productCertificate
const SimpleFileUploadField = ({
  label,
  onChange,
  accept = 'image/*',
  required = false,
  multiple = false,
  description,
  maxCount = 1,
  disabled = false,
  previewUrls = [],
  onRemove
}: {
  label: string
  onChange: (files: File[]) => void
  accept?: string
  required?: boolean
  multiple?: boolean
  description?: string
  maxCount?: number
  disabled?: boolean
  previewUrls?: string[]
  onRemove?: (index: number) => void
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = React.useRef(0)

  const validateFile = (file: File): boolean => {
    const isImage = file.type.startsWith('image/') || file.type === 'application/pdf'
    if (!isImage) {
      toast.error('Chỉ được upload file ảnh hoặc PDF!')
      return false
    }

    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      toast.error('Kích thước file phải nhỏ hơn 10MB!')
      return false
    }

    return true
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    const validFiles: File[] = []
    files.forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      // Kiểm tra số lượng file
      const currentCount = previewUrls.length
      const remainingSlots = maxCount - currentCount

      if (remainingSlots <= 0) {
        toast.warning(`Chỉ được upload tối đa ${maxCount} file`)
        return
      }

      const filesToAdd = multiple ? validFiles.slice(0, remainingSlots) : validFiles.slice(0, 1)

      if (validFiles.length > filesToAdd.length) {
        toast.warning(`Chỉ được upload tối đa ${maxCount} file. Đã chọn ${filesToAdd.length} file đầu tiên.`)
      }

      onChange(filesToAdd)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      dragCounter.current++
      if (dragCounter.current === 1) {
        setIsDragging(true)
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && dragCounter.current === 0) {
      dragCounter.current = 1
      setIsDragging(true)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const validFiles: File[] = []
    files.forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      // Kiểm tra số lượng file
      const currentCount = previewUrls.length
      const remainingSlots = maxCount - currentCount

      if (remainingSlots <= 0) {
        toast.warning(`Chỉ được upload tối đa ${maxCount} file`)
        return
      }

      const filesToAdd = multiple ? validFiles.slice(0, remainingSlots) : validFiles.slice(0, 1)

      if (validFiles.length > filesToAdd.length) {
        toast.warning(`Chỉ được upload tối đa ${maxCount} file. Đã chọn ${filesToAdd.length} file đầu tiên.`)
      }

      onChange(filesToAdd)
    }
  }

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className='space-y-2'>
      <Label className='text-sm font-medium'>
        {label} {required && <span className='text-red-500'>*</span>}
      </Label>
      {description && <p className='text-xs text-gray-500'>{description}</p>}

      {previewUrls.length > 0 ? (
        <div className='space-y-3'>
          {previewUrls.map((url, index) => (
            <div key={index} className='relative border-2 border-slate-200 rounded-lg overflow-hidden'>
              <img src={url} alt={`Preview ${index + 1}`} className='w-full h-48 object-cover' />
              {onRemove && !disabled && (
                <button
                  type='button'
                  onClick={() => onRemove(index)}
                  className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors'
                >
                  <X className='w-4 h-4' />
                </button>
              )}
            </div>
          ))}
          {previewUrls.length < maxCount && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer bg-slate-50/50 overflow-hidden ${isDragging
                ? 'border-emerald-400 bg-emerald-50/50 scale-[1.02] shadow-lg'
                : 'border-slate-300 hover:border-emerald-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleClick}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div
                className={`absolute inset-0 bg-emerald-50/80 flex items-center justify-center transition-all duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
              >
                <div className='text-center transform transition-transform duration-200'>
                  <div className='text-emerald-600 font-semibold text-lg mb-2'>Thả file vào đây</div>
                  <div className='text-emerald-500 text-sm'>{multiple ? `Tối đa ${maxCount} file` : 'Chỉ 1 file'}</div>
                </div>
              </div>
              <div className={`transition-all duration-200 ${isDragging ? 'opacity-0 scale-95' : 'opacity-100'}`}>
                <ImageIcon className='w-12 h-12 text-slate-400 mx-auto mb-3' />
                <p className='text-slate-600 mb-1 font-medium'>Kéo thả hoặc click để tải ảnh lên</p>
                <p className='text-xs text-slate-500'>PNG, JPG, PDF tối đa 10MB</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer bg-slate-50/50 overflow-hidden ${isDragging
            ? 'border-emerald-400 bg-emerald-50/50 scale-[1.02] shadow-lg'
            : 'border-slate-300 hover:border-emerald-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div
            className={`absolute inset-0 bg-emerald-50/80 flex items-center justify-center transition-all duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
          >
            <div className='text-center transform transition-transform duration-200'>
              <div className='text-emerald-600 font-semibold text-lg mb-2'>Thả file vào đây</div>
              <div className='text-emerald-500 text-sm'>{multiple ? `Tối đa ${maxCount} file` : 'Chỉ 1 file'}</div>
            </div>
          </div>
          <div className={`transition-all duration-200 ${isDragging ? 'opacity-0 scale-95' : 'opacity-100'}`}>
            <ImageIcon className='w-12 h-12 text-slate-400 mx-auto mb-3' />
            <p className='text-slate-600 mb-1 font-medium'>Kéo thả hoặc click để tải ảnh lên</p>
            <p className='text-xs text-slate-500'>PNG, JPG, PDF tối đa 10MB</p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className='hidden'
        disabled={disabled}
      />
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

  // State cho ngày cấp từ mặt sau CCCD
  const [issueDate, setIssueDate] = useState<string>('')
  const [issueLocation, setIssueLocation] = useState<string>('')

  // States cho tỉnh định hướng
  const [orientationProvinces, setOrientationProvinces] = useState<Province[]>([])
  const [selectedOrientationProvince, setSelectedOrientationProvince] = useState<Province | null>(null)
  const [isLoadingOrientationProvinces, setIsLoadingOrientationProvinces] = useState(false)
  const [orientationProvinceOpen, setOrientationProvinceOpen] = useState(false)
  const [orientationProvinceSearchValue, setOrientationProvinceSearchValue] = useState('')

  // Tọa độ store (geocode)
  const [storeCoordinates, setStoreCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isGeocodingStoreAddress, setIsGeocodingStoreAddress] = useState(false)

  // States cho validation giấy tờ - lưu theo index của file
  const [businessLicenseValidation, setBusinessLicenseValidation] = useState<{
    isValid: boolean | null
    reason: string
    isValidating: boolean
    validationResult?: ValidateCertificateResponse
  }>({ isValid: null, reason: '', isValidating: false })
  const [vendorApplicationValidations, setVendorApplicationValidations] = useState<
    Map<
      number,
      {
        isValid: boolean | null
        reason: string
        isValidating: boolean
        validationResult?: ValidateCertificateResponse
      }
    >
  >(new Map())

  // States cho preview URLs
  const [businessLicensePreviewUrl, setBusinessLicensePreviewUrl] = useState<string | null>(null)
  const [vendorApplicationPreviewUrls, setVendorApplicationPreviewUrls] = useState<string[]>([])

  // Tạo preview URL cho business license
  React.useEffect(() => {
    if (formData.businessLicense.length > 0) {
      const file = formData.businessLicense[0]
      const url = URL.createObjectURL(file)
      setBusinessLicensePreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setBusinessLicensePreviewUrl(null)
    }
  }, [formData.businessLicense])

  // Tạo preview URLs cho vendor application images
  React.useEffect(() => {
    const urls = formData.vendorApplicationImageUrl.map((file) => URL.createObjectURL(file))
    setVendorApplicationPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [formData.vendorApplicationImageUrl])

  // ===== Xử lý dữ liệu từ OCR mặt sau =====
  const handleOCRBackData = async (backData: ExtractedCCCDBackInfo) => {
    console.log('OCR Back Data received:', {
      issueDate: backData.issueDate,
      issueLocation: backData.issueLocation
    })

    setIssueDate(backData.issueDate)
    setIssueLocation(backData.issueLocation)

    toast.success('Đã đọc thông tin ngày cấp từ mặt sau CCCD thành công!')
  }

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

  const handleFileChange = async (field: string, files: File[]) => {
    const oldFiles = formData[field as keyof FormData] as File[]

    // Nếu là vendorApplicationImageUrl và multiple, append files mới vào files cũ
    let filesToSet = files
    if (field === 'vendorApplicationImageUrl' && Array.isArray(oldFiles) && oldFiles.length > 0) {
      // Kết hợp files cũ và files mới, loại bỏ duplicate dựa trên name và size
      const combinedFiles = [...oldFiles]
      files.forEach((newFile) => {
        const isDuplicate = combinedFiles.some(
          (existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size
        )
        if (!isDuplicate) {
          combinedFiles.push(newFile)
        }
      })
      filesToSet = combinedFiles
    }

    setFormData((prev) => ({
      ...prev,
      [field]: filesToSet
    }))

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Reset validation khi xóa file hoặc thay đổi số lượng file
    if (field === 'businessLicense') {
      if (files.length === 0) {
        setBusinessLicenseValidation({ isValid: null, reason: '', isValidating: false })
      } else if (files.length > 0) {
        // Tự động validate file mới
        const newFile = files[0]
        const oldFile = oldFiles?.[0]
        // Chỉ validate nếu là file mới (khác file cũ)
        if (!oldFile || newFile.name !== oldFile.name || newFile.size !== oldFile.size) {
          validateFile('businessLicense', newFile)
        }
      }
    } else if (field === 'vendorApplicationImageUrl') {
      // Rebuild validation map dựa trên file name và size để match file cũ với file mới
      const newValidations = new Map<number, { isValid: boolean | null; reason: string; isValidating: boolean }>()

      // QUAN TRỌNG: Sử dụng filesToSet (đã combine) thay vì files (chỉ files mới) để giữ đúng thứ tự
      filesToSet.forEach((file, currentIndex) => {
        // Tìm file tương ứng trong danh sách cũ dựa trên name và size
        const matchingOldIndex =
          oldFiles?.findIndex((oldFile) => oldFile.name === file.name && oldFile.size === file.size) ?? -1

        if (matchingOldIndex !== -1 && vendorApplicationValidations.has(matchingOldIndex)) {
          // Giữ nguyên validation nếu file vẫn còn và match
          const oldValidation = vendorApplicationValidations.get(matchingOldIndex)!
          newValidations.set(currentIndex, oldValidation)
        } else {
          // File mới - tự động validate
          newValidations.set(currentIndex, { isValid: null, reason: '', isValidating: true })
          validateFile('vendorApplicationImageUrl', file, currentIndex)
        }
      })

      setVendorApplicationValidations(newValidations)
    }
  }

  const validateFile = async (field: string, file: File, fileIndex?: number) => {
    // Timeout 1 phút (60000ms)
    const timeoutPromise = new Promise<{ isValid: boolean; reason: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          isValid: true,
          reason: 'Đã quá thời gian chờ (1 phút). Hệ thống tự động cho phép tiếp tục.'
        })
      }, 60000)
    })

    // Chỉ validate businessLicense và vendorApplicationImageUrl
    if (field === 'businessLicense') {
      setBusinessLicenseValidation((prev) => ({ ...prev, isValidating: true }))
      try {
        const result = await Promise.race([validateCertificate(file), timeoutPromise])
        // Nếu result là ValidateCertificateResponse (có type, data, level)
        if ('type' in result && 'level' in result) {
          const fullResult = result as ValidateCertificateResponse
          // Kiểm tra category: phải là "Store" hoặc không có category (backward compatibility)
          const categoryCheck = !fullResult.category || fullResult.category.toLowerCase() === 'store'
          const levelValid = fullResult.level.toLowerCase() === 'good'
          const isValid = categoryCheck && levelValid

          setBusinessLicenseValidation({
            isValid,
            reason: categoryCheck
              ? fullResult.reason || ''
              : 'Vui lòng upload ảnh giấy chứng nhận cửa hàng. Ảnh này là chứng nhận sản phẩm.',
            isValidating: false,
            validationResult: fullResult
          })
        } else {
          // Backward compatibility: format cũ chỉ có isValid và reason
          setBusinessLicenseValidation({
            isValid: result.isValid,
            reason: result.reason || '',
            isValidating: false
          })
        }
      } catch (error) {
        console.error('Error validating business license:', error)
        setBusinessLicenseValidation({
          isValid: false,
          reason: 'Không thể kiểm tra giấy tờ. Vui lòng thử lại.',
          isValidating: false
        })
      }
    } else if (field === 'vendorApplicationImageUrl' && fileIndex !== undefined) {
      try {
        const result = await Promise.race([validateCertificate(file), timeoutPromise])
        // Nếu result là ValidateCertificateResponse (có type, data, level)
        if ('type' in result && 'level' in result) {
          const fullResult = result as ValidateCertificateResponse
          // Kiểm tra category: phải là "Store" hoặc không có category (backward compatibility)
          const categoryCheck = !fullResult.category || fullResult.category.toLowerCase() === 'store'
          const levelValid = fullResult.level.toLowerCase() === 'good'
          const isValid = categoryCheck && levelValid

          setVendorApplicationValidations((prev) => {
            const newValidations = new Map(prev)
            newValidations.set(fileIndex, {
              isValid,
              reason: categoryCheck
                ? fullResult.reason || ''
                : 'Vui lòng upload ảnh giấy chứng nhận cửa hàng. Ảnh này là chứng nhận sản phẩm.',
              isValidating: false,
              validationResult: fullResult
            })
            return newValidations
          })
        } else {
          // Backward compatibility: format cũ chỉ có isValid và reason
          setVendorApplicationValidations((prev) => {
            const newValidations = new Map(prev)
            newValidations.set(fileIndex, {
              isValid: result.isValid,
              reason: result.reason || '',
              isValidating: false
            })
            return newValidations
          })
        }
      } catch (error) {
        console.error('Error validating vendor application:', error)
        setVendorApplicationValidations((prev) => {
          const newValidations = new Map(prev)
          newValidations.set(fileIndex, {
            isValid: false,
            reason: 'Không thể kiểm tra giấy tờ. Vui lòng thử lại.',
            isValidating: false
          })
          return newValidations
        })
      }
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

  // Geocode địa chỉ cửa hàng để lấy tọa độ
  const geocodeStoreAddress = async (
    provinceName: string,
    districtName: string,
    wardName: string,
    specific: string
  ) => {
    if (!provinceName || !districtName || !wardName || !specific.trim()) {
      setStoreCoordinates(null)
      return
    }

    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
    if (!mapboxToken) {
      console.error('Mapbox access token is missing')
      setStoreCoordinates(null)
      return
    }

    setIsGeocodingStoreAddress(true)
    try {
      const fullAddress = `${specific}, ${wardName}, ${districtName}, ${provinceName}, Việt Nam`
      const resp = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          fullAddress
        )}.json?access_token=${mapboxToken}&country=vn&limit=1`
      )
      const data = await resp.json()

      if (data.features && data.features.length > 0) {
        const coordinates = data.features[0].geometry.coordinates as [number, number]
        setStoreCoordinates({ lng: coordinates[0], lat: coordinates[1] })
      } else {
        console.warn('Geocode not found for address:', fullAddress)
        setStoreCoordinates(null)
      }
    } catch (error) {
      console.error('Geocode error:', error)
      setStoreCoordinates(null)
    } finally {
      setIsGeocodingStoreAddress(false)
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

  // Tự động geocode khi địa chỉ cửa hàng đầy đủ (debounce 1s)
  React.useEffect(() => {
    if (selectedProvince && selectedDistrict && selectedWard && specificAddress.trim()) {
      const timer = setTimeout(() => {
        geocodeStoreAddress(selectedProvince.name, selectedDistrict.name, selectedWard.name, specificAddress)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setStoreCoordinates(null)
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

  // Hàm chuyển đổi mã lỗi từ tiếng Anh sang tiếng Việt
  const translateBankError = (errorMessage: string): string => {
    const errorMap: { [key: string]: string } = {
      INVALID_BANK_BIN: 'Mã ngân hàng không hợp lệ',
      INVALID_ACCOUNT_NUMBER: 'Số tài khoản không hợp lệ',
      ACCOUNT_NOT_FOUND: 'Không tìm thấy tài khoản',
      BANK_NOT_SUPPORTED: 'Ngân hàng không được hỗ trợ',
      NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại sau',
      TIMEOUT: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại',
      UNAUTHORIZED: 'Không có quyền truy cập',
      SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau'
    }

    // Kiểm tra nếu errorMessage chứa một trong các mã lỗi
    for (const [key, value] of Object.entries(errorMap)) {
      if (errorMessage.toUpperCase().includes(key)) {
        return value
      }
    }

    // Nếu không tìm thấy, trả về thông báo mặc định
    return errorMessage || 'Không thể kiểm tra tài khoản ngân hàng'
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
      const rawErrorMessage = error instanceof Error ? error.message : 'Không thể kiểm tra tài khoản ngân hàng'
      const translatedErrorMessage = translateBankError(rawErrorMessage)
      setAccountVerificationError(translatedErrorMessage)
      setAccountOwnerName(null)
      toast.error(translatedErrorMessage)
    } finally {
      setIsVerifyingAccount(false)
    }
  }

  // Load orientation provinces
  const loadOrientationProvinces = async () => {
    setIsLoadingOrientationProvinces(true)
    try {
      const data = await getProvinces()
      setOrientationProvinces(data)
    } catch (error) {
      console.error('Error loading orientation provinces:', error)
    } finally {
      setIsLoadingOrientationProvinces(false)
    }
  }

  // Filter orientation provinces based on search
  const filteredOrientationProvinces = orientationProvinces.filter(
    (province) =>
      province.name.toLowerCase().includes(orientationProvinceSearchValue.toLowerCase()) ||
      province.region.toLowerCase().includes(orientationProvinceSearchValue.toLowerCase())
  )

  // Handle orientation province change
  const handleOrientationProvinceChange = (provinceId: number) => {
    const province = orientationProvinces.find((p) => p.id === provinceId)
    if (province) {
      setSelectedOrientationProvince(province)
    }
    setOrientationProvinceOpen(false)
  }

  React.useEffect(() => {
    loadProvinces()
    loadUserProvinces()
    loadBanks()
    loadOrientationProvinces()
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

    // Validate tài khoản ngân hàng - phải được verify thành công
    if (formData.bankAccount && formData.bankAccount.trim()) {
      // Nếu có lỗi verification thì không cho submit
      if (accountVerificationError) {
        newErrors.bankAccount = accountVerificationError
      }
      // Nếu chưa verify thành công (chưa có accountOwnerName) thì không cho submit
      else if (!accountOwnerName) {
        newErrors.bankAccount = 'Vui lòng kiểm tra tài khoản ngân hàng trước khi tiếp tục'
      }
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
          DateOfIssue: issueDate || '',
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
          vendorApplicationImageUrl: formData.vendorApplicationImageUrl,
          // Thêm tọa độ nếu có
          lat: storeCoordinates ? storeCoordinates.lat.toString() : '',
          lng: storeCoordinates ? storeCoordinates.lng.toString() : '',
          // Tỉnh định hướng (targetProvinceId)
          targetProvinceId: selectedOrientationProvince?.id ?? 0
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

                <FileUploadFieldWithBackOCR
                  label='Mặt sau CCCD'
                  onChange={(files) => handleFileChange('identifyBackImage', files)}
                  onOCRData={handleOCRBackData}
                  enableOCR={true}
                  required
                  description='File ảnh rõ nét, đầy đủ 4 góc, định dạng JPG/PNG. Hệ thống sẽ tự động đọc ngày cấp.'
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
                      filterFunction={(ward, searchValue) =>
                        ward.name.toLowerCase().includes(searchValue.toLowerCase())
                      }
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

          {/* Thông tin seller */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                <span className='text-green-600 font-semibold'>2</span>
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>Thông tin người bán</h2>
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

            {/* Ngày cấp CCCD - tự động điền từ mặt sau */}
            {issueDate && (
              <div className='space-y-2'>
                <Label>Ngày cấp CCCD</Label>
                <div className='p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center gap-2 mb-2'>
                    <p className='text-sm font-medium text-green-900'>Đã đọc từ mặt sau CCCD</p>
                  </div>
                  <p className='text-sm text-gray-700'>
                    Ngày cấp:{' '}
                    <span className='font-semibold'>{format(new Date(issueDate), 'dd/MM/yyyy', { locale: vi })}</span>
                  </p>
                  {issueLocation && (
                    <p className='text-sm text-gray-700 mt-1'>
                      Nơi cấp: <span className='font-semibold'>{issueLocation}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Thông tin cửa hàng */}
          <div className='space-y-6'>
            <div className='flex items-center space-x-3 border-b border-gray-200 pb-3'>
              <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                <span className='text-orange-600 font-semibold'>3</span>
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
                      !selectedDistrict ? 'Chọn quận/huyện trước' : isLoadingWards ? 'Đang tải...' : 'Chọn phường/xã'
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

              {/* Trạng thái geocode tọa độ */}
              {isGeocodingStoreAddress && (
                <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='flex items-center gap-2 text-blue-800 text-sm'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>Đang xác định tọa độ cửa hàng...</span>
                  </div>
                </div>
              )}
              {!storeCoordinates &&
                !isGeocodingStoreAddress &&
                selectedProvince &&
                selectedDistrict &&
                selectedWard &&
                specificAddress.trim() && (
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800'>
                    Không lấy được tọa độ. Vẫn có thể gửi, nhưng bản đồ có thể không chính xác.
                  </div>
                )}

              {errors.address && <p className='text-sm text-red-500'>{errors.address}</p>}
            </div>
            {/* Tỉnh định hướng */}
            <div className='space-y-2'>
              <Label>Bạn đang bán sản phẩm vùng nào</Label>
              <Popover open={orientationProvinceOpen} onOpenChange={setOrientationProvinceOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    aria-expanded={orientationProvinceOpen}
                    className='w-full justify-between bg-transparent border-none border-b-2 rounded-none h-auto py-2 px-0 font-normal focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none border-b-gray-300 focus-visible:border-b-green-600'
                    disabled={isLoadingOrientationProvinces}
                    type='button'
                  >
                    <span className='flex-1 truncate mr-2 text-left'>
                      {isLoadingOrientationProvinces
                        ? 'Đang tải...'
                        : selectedOrientationProvince
                          ? `${selectedOrientationProvince.name} - ${selectedOrientationProvince.region}`
                          : 'Chọn tỉnh/thành phố'}
                    </span>
                    <ChevronsUpDown className='h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0' align='start'>
                  <Command>
                    <CommandInput
                      placeholder='Tìm kiếm tỉnh/thành phố...'
                      value={orientationProvinceSearchValue}
                      onValueChange={setOrientationProvinceSearchValue}
                    />
                    <CommandList>
                      <CommandEmpty>Không tìm thấy tỉnh/thành phố nào.</CommandEmpty>
                      <CommandGroup>
                        {filteredOrientationProvinces.map((province) => (
                          <CommandItem
                            key={province.id}
                            value={`${province.name} - ${province.region}`}
                            onSelect={() => handleOrientationProvinceChange(province.id)}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${selectedOrientationProvince?.id === province.id ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                            {province.name} - {province.region}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                  <div>
                    <SimpleFileUploadField
                      label='Giấy phép kinh doanh'
                      onChange={(files) => handleFileChange('businessLicense', files)}
                      required
                      description='Bắt buộc: 1 file ảnh/PDF rõ nét. Hệ thống sẽ tự động kiểm tra sau khi upload.'
                      accept='image/*,.pdf'
                      maxCount={1}
                      disabled={businessLicenseValidation.isValidating}
                      previewUrls={businessLicensePreviewUrl ? [businessLicensePreviewUrl] : []}
                      onRemove={() => {
                        setFormData((prev) => ({ ...prev, businessLicense: [] }))
                        setBusinessLicenseValidation({ isValid: null, reason: '', isValidating: false })
                      }}
                    />
                    {businessLicenseValidation.isValidating && (
                      <div className='mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm animate-pulse'>
                        <div className='flex items-center gap-3'>
                          <div className='relative'>
                            <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
                            <div className='absolute inset-0 rounded-full border-2 border-blue-200 animate-ping'></div>
                          </div>
                          <div className='flex-1'>
                            <p className='text-sm font-medium text-blue-900'>Đang kiểm tra giấy phép kinh doanh...</p>
                            <p className='text-xs text-blue-700 mt-1'>Vui lòng chờ trong giây lát</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {!businessLicenseValidation.isValidating && businessLicenseValidation.isValid !== null && (
                      <div className='mt-3'>
                        {businessLicenseValidation.validationResult && businessLicenseValidation.isValid ? (
                          <CertificateInfoDisplay validationResult={businessLicenseValidation.validationResult} />
                        ) : (
                          <div
                            className={`p-4 rounded-xl border-2 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${businessLicenseValidation.isValid
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-green-100 shadow-sm'
                              : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 shadow-red-100 shadow-sm'
                              }`}
                          >
                            <div className='flex items-start gap-3'>
                              {businessLicenseValidation.isValid ? (
                                <div className='flex-shrink-0 p-2 bg-green-100 rounded-full'>
                                  <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                    <path
                                      fillRule='evenodd'
                                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                                      clipRule='evenodd'
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div className='flex-shrink-0 p-2 bg-red-100 rounded-full'>
                                  <svg className='w-6 h-6 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                                    <path
                                      fillRule='evenodd'
                                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                                      clipRule='evenodd'
                                    />
                                  </svg>
                                </div>
                              )}
                              <div className='flex-1'>
                                <p
                                  className={`text-sm font-semibold ${businessLicenseValidation.isValid ? 'text-green-900' : 'text-red-900'
                                    }`}
                                >
                                  {businessLicenseValidation.isValid
                                    ? '✓ Giấy phép kinh doanh hợp lệ'
                                    : '✗ Giấy phép kinh doanh không hợp lệ'}
                                </p>
                                {businessLicenseValidation.reason && (
                                  <p
                                    className={`text-xs mt-2 leading-relaxed ${businessLicenseValidation.isValid ? 'text-green-800' : 'text-red-800'
                                      }`}
                                  >
                                    {businessLicenseValidation.reason}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <SimpleFileUploadField
                      label='Chứng nhận cửa hàng'
                      onChange={(files) => handleFileChange('vendorApplicationImageUrl', files)}
                      multiple
                      description='Có thể upload nhiều file (tối đa 5 file), định dạng JPG/PNG/PDF. Hệ thống sẽ tự động kiểm tra từng file sau khi upload.'
                      maxCount={5}
                      disabled={Array.from(vendorApplicationValidations.values()).some((v) => v.isValidating)}
                      previewUrls={vendorApplicationPreviewUrls}
                      onRemove={(index) => {
                        setFormData((prev) => ({
                          ...prev,
                          vendorApplicationImageUrl: prev.vendorApplicationImageUrl.filter((_, i) => i !== index)
                        }))
                        // Xóa validation tương ứng
                        setVendorApplicationValidations((prev) => {
                          const newValidations = new Map()
                          prev.forEach((val, idx) => {
                            if (idx < index) {
                              newValidations.set(idx, val)
                            } else if (idx > index) {
                              newValidations.set(idx - 1, val)
                            }
                          })
                          return newValidations
                        })
                      }}
                    />
                    {/* Hiển thị danh sách file với validation */}
                    {formData.vendorApplicationImageUrl.length > 0 && (
                      <div className='mt-4 space-y-4'>
                        {formData.vendorApplicationImageUrl.map((file, index) => {
                          const validation = vendorApplicationValidations.get(index) || {
                            isValid: null,
                            reason: '',
                            isValidating: false,
                            validationResult: undefined
                          }
                          const previewUrl = vendorApplicationPreviewUrls[index]
                          // Tạo key stable dựa trên file name và size
                          const fileKey = `${file.name}-${file.size}-${index}`

                          return (
                            <div
                              key={fileKey}
                              className={`group relative border-2 rounded-xl transition-all duration-300 overflow-hidden ${validation.isValidating
                                ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm animate-pulse'
                                : validation.isValid === true
                                  ? 'border-green-400 bg-white shadow-md hover:shadow-lg'
                                  : validation.isValid === false
                                    ? 'border-red-400 bg-white shadow-md hover:shadow-lg'
                                    : 'border-gray-300 bg-gray-50'
                                }`}
                            >
                              {/* Header với preview và status */}
                              <div className='flex gap-4 p-4'>
                                {/* Preview ảnh */}
                                {previewUrl && (
                                  <div className='flex-shrink-0'>
                                    <div
                                      className={`w-24 h-24 rounded-lg overflow-hidden border-2 ${validation.isValid === true
                                        ? 'border-green-300'
                                        : validation.isValid === false
                                          ? 'border-red-300'
                                          : 'border-gray-200'
                                        }`}
                                    >
                                      <img
                                        src={previewUrl}
                                        alt={`Preview ${index + 1}`}
                                        className='w-full h-full object-cover'
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Thông tin file và status */}
                                <div className='flex-1 min-w-0'>
                                  <div className='flex items-start justify-between gap-3 mb-2'>
                                    <div className='flex-1 min-w-0'>
                                      <div className='flex items-center gap-2 mb-1'>
                                        <span
                                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${validation.isValid === true
                                            ? 'bg-green-100 text-green-700'
                                            : validation.isValid === false
                                              ? 'bg-red-100 text-red-700'
                                              : validation.isValidating
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                          {index + 1}
                                        </span>
                                        <p className='text-sm font-semibold text-gray-900 truncate'>{file.name}</p>
                                      </div>
                                      <p className='text-xs text-gray-500'>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>

                                    {/* Status Badge */}
                                    <div className='flex-shrink-0 flex flex-col items-end gap-2'>
                                      {validation.isValidating && (
                                        <div className='flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full'>
                                          <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
                                          <span className='text-xs font-medium text-blue-700'>Đang kiểm tra</span>
                                        </div>
                                      )}
                                      {validation.isValid === true && (
                                        <div className='flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full'>
                                          <CheckCircle2 className='h-4 w-4 text-green-600' />
                                          <span className='text-xs font-semibold text-green-700'>Hợp lệ</span>
                                        </div>
                                      )}
                                      {validation.isValid === false && (
                                        <div className='flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full'>
                                          <AlertCircle className='h-4 w-4 text-red-600' />
                                          <span className='text-xs font-semibold text-red-700'>Không hợp lệ</span>
                                        </div>
                                      )}
                                      {validation.isValid === null && !validation.isValidating && (
                                        <div className='flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full'>
                                          <span className='text-xs font-medium text-gray-600'>Chưa kiểm tra</span>
                                        </div>
                                      )}

                                      {/* Nút xóa */}
                                      <button
                                        type='button'
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            vendorApplicationImageUrl: prev.vendorApplicationImageUrl.filter(
                                              (_, i) => i !== index
                                            )
                                          }))
                                          // Xóa validation tương ứng
                                          setVendorApplicationValidations((prev) => {
                                            const newValidations = new Map()
                                            prev.forEach((val, idx) => {
                                              if (idx < index) {
                                                newValidations.set(idx, val)
                                              } else if (idx > index) {
                                                newValidations.set(idx - 1, val)
                                              }
                                            })
                                            return newValidations
                                          })
                                        }}
                                        className='p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100'
                                        title='Xóa file'
                                        disabled={Array.from(vendorApplicationValidations.values()).some(
                                          (v) => v.isValidating
                                        )}
                                      >
                                        <X className='w-4 h-4' />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Thông báo lỗi hoặc chi tiết */}
                                  {validation.isValidating && (
                                    <div className='mt-3 p-3 bg-white/80 rounded-lg border border-blue-200'>
                                      <div className='flex items-center gap-2'>
                                        <Loader2 className='h-4 w-4 animate-spin text-blue-600' />
                                        <p className='text-sm text-blue-800 font-medium'>Đang kiểm tra file...</p>
                                      </div>
                                      <p className='text-xs text-blue-600 mt-1 ml-6'>Vui lòng chờ trong giây lát</p>
                                    </div>
                                  )}

                                  {!validation.isValidating && validation.isValid === false && validation.reason && (
                                    <div className='mt-3 p-3 bg-red-50 rounded-lg border border-red-200'>
                                      <div className='flex items-start gap-2'>
                                        <AlertCircle className='h-4 w-4 text-red-600 flex-shrink-0 mt-0.5' />
                                        <div className='flex-1'>
                                          <p className='text-sm font-medium text-red-900 mb-1'>Lý do không hợp lệ:</p>
                                          <p className='text-xs text-red-800 leading-relaxed'>{validation.reason}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Chi tiết chứng chỉ (nếu hợp lệ) */}
                              {!validation.isValidating &&
                                validation.isValid === true &&
                                validation.validationResult && (
                                  <div className='border-t border-gray-200 bg-gray-50'>
                                    <CertificateInfoDisplay validationResult={validation.validationResult} />
                                  </div>
                                )}
                            </div>
                          )
                        })}
                        {/* Cảnh báo tổng thể nếu có file không hợp lệ */}
                        {Array.from(vendorApplicationValidations.values()).some((v) => v.isValid === false) && (
                          <div className='mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl shadow-orange-100 shadow-sm animate-in fade-in slide-in-from-bottom-2'>
                            <div className='flex items-start gap-3'>
                              <div className='flex-shrink-0 p-2 bg-orange-100 rounded-full'>
                                <svg className='w-6 h-6 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                                  <path
                                    fillRule='evenodd'
                                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                              </div>
                              <div className='flex-1'>
                                <p className='text-sm font-semibold text-orange-900'>
                                  ⚠️ Cảnh báo: Có file không hợp lệ
                                </p>
                                <p className='text-xs text-orange-800 mt-2 leading-relaxed'>
                                  Nếu gửi ảnh không hợp lệ, tỷ lệ không được duyệt sẽ thấp. Vui lòng kiểm tra và thay
                                  thế các file không hợp lệ bằng file hợp lệ.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

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
                      window.open('/portal?type=seller', '_blank')
                      setHasOpenedTermsPage(true)
                    }}
                    className='text-green-600 hover:text-green-700 underline font-medium'
                  >
                    Điều khoản dịch vụ
                  </button>
                  {!hasOpenedTermsPage && (
                    <span className='ml-2 text-orange-600 text-xs'>
                      * Vui lòng mở và đọc điều khoản trước khi đồng ý
                    </span>
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
                      window.open('/portal?type=seller', '_blank')
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
