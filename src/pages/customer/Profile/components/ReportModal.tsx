import { useState } from 'react'
import { Button } from '../../../../components/ui/button'
import { Textarea } from '../../../../components/ui/textarea'

interface Product {
  name: string
  image: string
  category?: string
  rating?: number
  reviewCount?: number
}

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
}

export default function ReportModal({ isOpen, onClose, product }: ReportModalProps) {
  const [reportReason, setReportReason] = useState('')
  const [description, setDescription] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])

  const reportReasons = ['sản phẩm', 'Chất lượng kém', 'Không giống mô tả', 'Hàng giả/nhái', 'Dịch vụ tồi', 'Khác']

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setSelectedImages((prev) => [...prev, ...Array.from(files)])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reportReason || !description) {
      alert('Vui lòng điền đầy đủ thông tin báo cáo')
      return
    }

    // Handle report submission
    console.log('Report submitted:', {
      product: product.name,
      reason: reportReason,
      description,
      images: selectedImages
    })

    // Reset form
    setReportReason('')
    setDescription('')
    setSelectedImages([])
    onClose()
  }

  const handleCancel = () => {
    setReportReason('')
    setDescription('')
    setSelectedImages([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]'
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className='bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl'>
        {/* Header */}
        <div className='flex justify-between items-center p-6 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>Báo cáo Sản Phẩm</h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-xl font-bold'>
            ×
          </button>
        </div>

        {/* Product Info */}
        <div className='p-6 border-b'>
          <div className='flex items-start space-x-3'>
            <img src={product.image} alt={product.name} className='w-16 h-16 rounded-xl border object-cover' />
            <div className='flex-1'>
              <h4 className='font-medium text-gray-900 mb-1'>{product.name}</h4>
              <p className='text-sm text-gray-500 mb-1'>
                Phân loại: {product.category || 'Gốm sứ truyền thống - Màu xanh lá'}
              </p>
              <div className='flex items-center text-sm'>
                <span className='text-yellow-500'>★</span>
                <span className='ml-1 text-gray-600'>
                  {product.rating || '4.8'} · {product.reviewCount || '127'} đánh giá
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='p-6 max-h-[60vh] overflow-y-auto'>
          <form onSubmit={handleSubmit}>
            {/* Report Reason */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-900 mb-3'>
                Báo cáo: <span className='text-orange-500'>{reportReason || 'sản phẩm'}</span>
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {reportReasons.map((reason) => (
                  <button
                    key={reason}
                    type='button'
                    onClick={() => setReportReason(reason)}
                    className={`px-3 py-2 text-sm border rounded-xl text-left ${
                      reportReason === reason
                        ? 'border-green-600 bg-green-50 text-green-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-900 mb-2'>Mô tả</label>
              <Textarea
                placeholder='Điều gì làm bạn báo cáo về sản phẩm này?'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='min-h-[100px] resize-none rounded-xl'
                required
              />
            </div>

            {/* Image Upload */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-900 mb-2'>Thêm hình ảnh (tùy chọn)</label>
              <div className='border-2 border-dashed border-gray-300 rounded-xl p-4 text-center'>
                <input
                  type='file'
                  id='image-upload'
                  multiple
                  accept='image/*'
                  onChange={handleImageUpload}
                  className='hidden'
                />
                <label htmlFor='image-upload' className='cursor-pointer flex flex-col items-center'>
                  <div className='w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mb-2'>
                    <span className='text-gray-500 text-lg'>📷</span>
                  </div>
                  <span className='text-sm text-green-600 font-medium'>Thêm Hình ảnh</span>
                  <span className='text-xs text-gray-500 mt-1'>
                    Hình ảnh thực tế sẽ giúp đánh giá của bạn hữu ích hơn
                  </span>
                </label>
              </div>

              {/* Display selected images */}
              {selectedImages.length > 0 && (
                <div className='mt-3 grid grid-cols-3 gap-2'>
                  {selectedImages.map((file, index) => (
                    <div key={index} className='relative'>
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className='w-full h-16 object-cover rounded-xl border'
                      />
                      <button
                        type='button'
                        onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                        className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center'
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex space-x-3'>
              <Button type='button' variant='outline' onClick={handleCancel} className='flex-1 rounded-xl'>
                Trở lại
              </Button>
              <Button type='submit' className='flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl'>
                Hoàn thành
              </Button>
            </div>

            <p className='text-xs text-gray-500 text-center mt-3'>Đánh giá của bạn sẽ giúp cộng đồng mua sắm tốt hơn</p>
          </form>
        </div>
      </div>
    </div>
  )
}
