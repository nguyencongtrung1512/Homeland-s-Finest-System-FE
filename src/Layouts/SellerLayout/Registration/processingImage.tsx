import React, { useState, useCallback } from 'react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Upload as AntUpload, message } from 'antd'
import type { UploadFile, UploadProps } from 'antd'
import { Scan, Check, AlertCircle, Camera, FileImage } from 'lucide-react'
import { toast } from 'react-toastify'
import Loading from '../../../components/Loading/loading'
import { extractCCCDInfo, type ExtractedCCCDInfo } from '../../../apis/fptai.api'

// Interface cho dữ liệu đã xử lý
export interface ProcessedCCCDData {
  firstName: string
  lastName: string
  identifyCard: string
  gender: string
  dateOfBirth: string
  address: string
  province: string
  district: string
  ward: string
  street: string
  frontImage: File | null
  backImage: File | null
}

interface ProcessingImageProps {
  isOpen: boolean
  onClose: () => void
  onDataProcessed: (data: ProcessedCCCDData) => void
}

const ProcessingImage: React.FC<ProcessingImageProps> = ({ isOpen, onClose, onDataProcessed }) => {
  // States cho upload ảnh
  const [frontImageList, setFrontImageList] = useState<UploadFile[]>([])
  const [backImageList, setBackImageList] = useState<UploadFile[]>([])
  const [previewImage, setPreviewImage] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  // States cho xử lý OCR
  const [, setIsProcessing] = useState(false)
  const [, setExtractedData] = useState<ExtractedCCCDInfo | null>(null)
  const [processingStep, setProcessingStep] = useState<'upload' | 'processing' | 'review' | 'complete'>('upload')
  // States cho chỉnh sửa thông tin
  const [editableData, setEditableData] = useState<ProcessedCCCDData>({
    firstName: '',
    lastName: '',
    identifyCard: '',
    gender: 'male',
    dateOfBirth: '',
    address: '',
    province: '',
    district: '',
    ward: '',
    street: '',
    frontImage: null,
    backImage: null
  })

  // Reset states khi đóng dialog
  const resetStates = useCallback(() => {
    setFrontImageList([])
    setBackImageList([])
    setExtractedData(null)
    setProcessingStep('upload')
    setEditableData({
      firstName: '',
      lastName: '',
      identifyCard: '',
      gender: 'male',
      dateOfBirth: '',
      address: '',
      province: '',
      district: '',
      ward: '',
      street: '',
      frontImage: null,
      backImage: null
    })
  }, [])

  // Xử lý khi đóng dialog
  const handleClose = () => {
    resetStates()
    onClose()
  }

  // Xử lý upload ảnh mặt trước
  const handleFrontImageChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFrontImageList(newFileList)

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj
      setEditableData((prev) => ({ ...prev, frontImage: file }))

      // Tự động xử lý OCR khi có ảnh mặt trước
      handleOCRProcessing(file)
    }
  }

  // Xử lý upload ảnh mặt sau
  const handleBackImageChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setBackImageList(newFileList)

    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj
      setEditableData((prev) => ({ ...prev, backImage: file }))
    }
  }

  // Xử lý OCR
  const handleOCRProcessing = async (file: File) => {
    setIsProcessing(true)
    setProcessingStep('processing')

    try {
      const result = await extractCCCDInfo(file)

      if (result) {
        setExtractedData(result)

        // Parse tên
        const nameParts = result.name.trim().split(' ')
        const lastName = nameParts[0] || ''
        const firstName = nameParts.slice(1).join(' ') || ''

        // Cập nhật dữ liệu có thể chỉnh sửa
        setEditableData((prev) => ({
          ...prev,
          firstName,
          lastName,
          identifyCard: result.id,
          gender: result.sex,
          dateOfBirth: result.dob,
          address: result.address,
          province: result.province,
          district: result.district,
          ward: result.ward,
          street: result.street
        }))

        setProcessingStep('review')
        toast.success('Đã đọc thông tin từ CCCD thành công!')
      }
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Không thể đọc thông tin từ ảnh CCCD. Vui lòng kiểm tra lại ảnh hoặc nhập thủ công.')
      setProcessingStep('upload')
    } finally {
      setIsProcessing(false)
    }
  }

  // Xử lý thay đổi dữ liệu chỉnh sửa
  const handleEditableDataChange = (field: keyof ProcessedCCCDData, value: string) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  // Xử lý xác nhận và chuyển dữ liệu
  const handleConfirmData = () => {
    // Validate dữ liệu cơ bản
    if (!editableData.firstName || !editableData.lastName || !editableData.identifyCard) {
      toast.error('Vui lòng điền đầy đủ thông tin cơ bản (Họ, Tên, Số CCCD)')
      return
    }

    if (!editableData.frontImage) {
      toast.error('Vui lòng upload ảnh mặt trước CCCD')
      return
    }

    // Chuyển dữ liệu về component cha
    onDataProcessed(editableData)
    setProcessingStep('complete')

    // Đóng dialog sau 1 giây
    setTimeout(() => {
      handleClose()
    }, 1000)
  }

  // Validate file upload
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

    return false // Prevent auto upload
  }

  // Xử lý preview ảnh
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

  // Render upload button
  const renderUploadButton = (type: 'front' | 'back') => (
    <div className='flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors cursor-pointer'>
      <div className='flex flex-col items-center space-y-2'>
        <FileImage className='w-8 h-8 text-gray-400' />
        <div className='text-sm text-gray-600'>{type === 'front' ? 'Chọn ảnh mặt trước' : 'Chọn ảnh mặt sau'}</div>
        <div className='text-xs text-gray-500'>JPG, PNG (tối đa 10MB)</div>
        {type === 'front' && (
          <div className='flex items-center space-x-1 text-xs text-blue-600'>
            <Scan size={12} />
            <span>Tự động đọc thông tin</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center space-x-2'>
              <Camera className='w-5 h-5' />
              <span>Xử lý ảnh Căn cước công dân</span>
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Step 1: Upload ảnh */}
            {processingStep === 'upload' && (
              <div className='space-y-4'>
                <div className='text-center'>
                  <h3 className='text-lg font-semibold mb-2'>Tải lên ảnh CCCD</h3>
                  <p className='text-gray-600'>Vui lòng tải lên ảnh mặt trước và mặt sau của CCCD</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Ảnh mặt trước */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>
                      Mặt trước CCCD <span className='text-red-500'>*</span>
                    </Label>
                    <AntUpload
                      listType='picture-card'
                      fileList={frontImageList}
                      onChange={handleFrontImageChange}
                      beforeUpload={beforeUpload}
                      onPreview={handlePreview}
                      maxCount={1}
                      accept='image/*'
                      className='w-full'
                    >
                      {frontImageList.length === 0 && renderUploadButton('front')}
                    </AntUpload>
                  </div>

                  {/* Ảnh mặt sau */}
                  <div className='space-y-2'>
                    <Label className='text-sm font-medium'>Mặt sau CCCD</Label>
                    <AntUpload
                      listType='picture-card'
                      fileList={backImageList}
                      onChange={handleBackImageChange}
                      beforeUpload={beforeUpload}
                      onPreview={handlePreview}
                      maxCount={1}
                      accept='image/*'
                      className='w-full'
                    >
                      {backImageList.length === 0 && renderUploadButton('back')}
                    </AntUpload>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Đang xử lý */}
            {processingStep === 'processing' && (
              <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                <Loading size='lg' />
                <h3 className='text-lg font-semibold'>Đang xử lý ảnh CCCD...</h3>
                <p className='text-gray-600 text-center'>
                  Hệ thống đang đọc thông tin từ ảnh CCCD của bạn.
                  <br />
                  Quá trình này có thể mất vài giây.
                </p>
              </div>
            )}

            {/* Step 3: Review và chỉnh sửa thông tin */}
            {processingStep === 'review' && (
              <div className='space-y-4'>
                <div className='flex items-center space-x-2 text-green-600'>
                  <Check className='w-5 h-5' />
                  <h3 className='text-lg font-semibold'>Thông tin đã được đọc thành công</h3>
                </div>

                <div className='bg-blue-50 p-4 rounded-lg'>
                  <div className='flex items-start space-x-2'>
                    <AlertCircle className='w-5 h-5 text-blue-600 mt-0.5' />
                    <div className='text-sm text-blue-800'>
                      <p className='font-medium'>Vui lòng kiểm tra và chỉnh sửa thông tin nếu cần</p>
                      <p>Hệ thống có thể đọc sai một số thông tin. Bạn có thể chỉnh sửa trước khi xác nhận.</p>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Họ *</Label>
                    <Input
                      id='lastName'
                      value={editableData.lastName}
                      onChange={(e) => handleEditableDataChange('lastName', e.target.value)}
                      placeholder='Nhập họ'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>Tên *</Label>
                    <Input
                      id='firstName'
                      value={editableData.firstName}
                      onChange={(e) => handleEditableDataChange('firstName', e.target.value)}
                      placeholder='Nhập tên'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='identifyCard'>Số CCCD *</Label>
                    <Input
                      id='identifyCard'
                      value={editableData.identifyCard}
                      onChange={(e) => handleEditableDataChange('identifyCard', e.target.value)}
                      placeholder='Nhập số CCCD'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='gender'>Giới tính *</Label>
                    <select
                      id='gender'
                      value={editableData.gender}
                      onChange={(e) => handleEditableDataChange('gender', e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    >
                      <option value='male'>Nam</option>
                      <option value='female'>Nữ</option>
                    </select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='dateOfBirth'>Ngày sinh *</Label>
                    <Input
                      id='dateOfBirth'
                      type='date'
                      value={editableData.dateOfBirth}
                      onChange={(e) => handleEditableDataChange('dateOfBirth', e.target.value)}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='address'>Địa chỉ</Label>
                    <Input
                      id='address'
                      value={editableData.address}
                      onChange={(e) => handleEditableDataChange('address', e.target.value)}
                      placeholder='Địa chỉ đầy đủ'
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Hoàn thành */}
            {processingStep === 'complete' && (
              <div className='flex flex-col items-center justify-center py-12 space-y-4'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                  <Check className='w-8 h-8 text-green-600' />
                </div>
                <h3 className='text-lg font-semibold text-green-600'>Xử lý thành công!</h3>
                <p className='text-gray-600 text-center'>
                  Thông tin đã được chuyển vào form đăng ký.
                  <br />
                  Cửa sổ sẽ tự động đóng...
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {processingStep === 'upload' && (
              <Button variant='outline' onClick={handleClose}>
                Hủy
              </Button>
            )}

            {processingStep === 'review' && (
              <div className='flex space-x-2'>
                <Button variant='outline' onClick={handleClose}>
                  Hủy
                </Button>
                <Button onClick={handleConfirmData} className='bg-blue-600 hover:bg-blue-700'>
                  Xác nhận và tiếp tục
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className='max-w-4xl'>
          <DialogHeader>
            <DialogTitle>Xem trước ảnh</DialogTitle>
          </DialogHeader>
          <div className='flex justify-center'>
            <img src={previewImage} alt='Preview' className='max-w-full max-h-96 object-contain rounded-lg' />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProcessingImage
