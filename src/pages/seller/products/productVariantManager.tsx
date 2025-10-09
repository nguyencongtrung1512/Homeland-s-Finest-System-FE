import { useState } from 'react'
import { toast } from 'react-toastify'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Switch } from '../../../components/ui/switch'
import { Edit, Plus, X, Info, DollarSign } from 'lucide-react'
import { productVariantApi } from '../../../apis/productVariant.api'

interface Variant {
  id?: string
  variantName: string
  quantity: number
  price: number
  isActive: boolean
  length: number
  width: number
  height: number
  weight: number
}

interface ProductVariantManagerProps {
  productId: string
  initialVariants: Variant[]
  onVariantsChange: (variants: Variant[]) => void
}

const EMPTY_VARIANT: Variant = {
  variantName: '',
  quantity: 0,
  price: 0,
  isActive: true,
  length: 0,
  width: 0,
  height: 0,
  weight: 0
}

export default function ProductVariantManager({
  productId,
  initialVariants,
  onVariantsChange
}: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<Variant[]>(initialVariants)
  const [showVariantForm, setShowVariantForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [newVariant, setNewVariant] = useState<Variant>(EMPTY_VARIANT)

  // Handlers
  const handleAddVariantClick = () => {
    setNewVariant(EMPTY_VARIANT)
    setEditingVariant(null)
    setShowVariantForm(true)
  }

  const handleEditVariant = (variantId: string) => {
    const variant = variants.find((v) => v.id === variantId)
    if (variant) {
      setNewVariant({
        variantName: variant.variantName || '',
        quantity: variant.quantity || 0,
        price: variant.price || 0,
        isActive: variant.isActive !== undefined ? variant.isActive : true,
        length: variant.length || 0,
        width: variant.width || 0,
        height: variant.height || 0,
        weight: variant.weight || 0
      })
      setEditingVariant(variantId)
      setShowVariantForm(true)
    }
  }

  const handleCancelVariant = () => {
    setNewVariant(EMPTY_VARIANT)
    setEditingVariant(null)
    setShowVariantForm(false)
  }

  const handleNewVariantChange = (field: keyof Variant, value: string | number | boolean) => {
    setNewVariant((prev) => ({ ...prev, [field]: value }))
  }

  const validateVariant = (): boolean => {
    if (!newVariant.variantName.trim()) {
      toast.error('Vui lòng nhập tên loại sản phẩm')
      return false
    }
    if (newVariant.price <= 0) {
      toast.error('Vui lòng nhập giá bán hợp lệ')
      return false
    }
    if (newVariant.quantity < 0) {
      toast.error('Vui lòng nhập số lượng tồn kho hợp lệ')
      return false
    }
    return true
  }

  const handleSaveVariant = async () => {
    if (!validateVariant()) return

    try {
      if (editingVariant) {
        // Update existing variant
        const updateData = {
          variants: [
            {
              id: editingVariant,
              variantName: newVariant.variantName,
              quantity: newVariant.quantity,
              price: newVariant.price,
              isActive: newVariant.isActive,
              length: newVariant.length,
              width: newVariant.width,
              height: newVariant.height,
              weight: newVariant.weight
            }
          ]
        }

        const response = await productVariantApi.update(productId, updateData)

        if (response.status === 202 || response.status === 200) {
          const updatedVariants = variants.map((v) => (v.id === editingVariant ? { ...v, ...newVariant } : v))
          setVariants(updatedVariants)
          onVariantsChange(updatedVariants)
          toast.success('Cập nhật loại sản phẩm thành công!')
        } else {
          toast.error('Có lỗi xảy ra khi cập nhật loại sản phẩm')
        }
      } else {
        // Create new variant
        if (!productId) {
          toast.error('Không tìm thấy ID sản phẩm')
          return
        }

        const variantData = {
          variantName: newVariant.variantName,
          quantity: newVariant.quantity,
          price: newVariant.price,
          length: newVariant.length,
          width: newVariant.width,
          height: newVariant.height,
          weight: newVariant.weight
        }

        const response = await productVariantApi.create(productId, variantData)

        // Check for both 201 (Created) and 200 (OK)
        if (response.status === 201 || response.status === 200) {
          // Extract variant from response - handle the new response structure
          const responseData = response.data

          if (responseData.createdVariants && responseData.createdVariants.length > 0) {
            const createdVariant = responseData.createdVariants[0]

            const newVariantWithId: Variant = {
              id: createdVariant.id,
              variantName: createdVariant.variantName,
              quantity: createdVariant.quantity,
              price: createdVariant.price,
              isActive: createdVariant.isActive,
              length: createdVariant.length,
              width: createdVariant.width,
              height: createdVariant.height,
              weight: createdVariant.weight
            }

            const updatedVariants = [...variants, newVariantWithId]
            setVariants(updatedVariants)
            onVariantsChange(updatedVariants)
            toast.success('Tạo loại sản phẩm thành công!')
          } else {
            console.error('Unexpected response format:', response.data)
            toast.error('Không nhận được dữ liệu variant từ server')
          }
        } else {
          toast.error('Có lỗi xảy ra khi tạo loại sản phẩm')
        }
      }

      // Reset form
      handleCancelVariant()
    } catch (error: any) {
      console.error('Error saving variant:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi lưu loại sản phẩm'
      toast.error(`Lỗi: ${errorMessage}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-green-700'>Loại sản phẩm</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {/* Existing Variants List */}
          {variants.length > 0 && (
            <div className='space-y-4'>
              {variants.map((variant, index) => (
                <div key={variant.id || index} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-medium text-gray-900'>Loại sản phẩm {index + 1}</h3>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => variant.id && handleEditVariant(variant.id)}
                        className='text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                      >
                        <Edit className='w-4 h-4 mr-1' />
                        Sửa
                      </Button>
                    </div>
                  </div>

                  {/* Variant Preview */}
                  <div className='bg-white border border-gray-200 rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium text-gray-900'>{variant.variantName || 'Tên sản phẩm chưa nhập'}</p>
                        <p className='text-sm text-gray-600'>
                          {variant.weight > 0 && `Trọng lượng: ${variant.weight}g • `}
                          {variant.length > 0 &&
                            variant.width > 0 &&
                            variant.height > 0 &&
                            `Kích thước: ${variant.length}x${variant.width}x${variant.height}cm • `}
                          Tồn kho: {variant.quantity || 0}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-lg font-bold text-green-600'>
                          {variant.price ? `${variant.price.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                        </p>
                        <div className='flex items-center gap-2 mt-1'>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              variant.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add/Edit Variant Form */}
          {showVariantForm && (
            <div className='border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium text-green-800'>
                  {editingVariant ? 'Chỉnh sửa loại sản phẩm' : 'Thêm loại sản phẩm mới'}
                </h3>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleCancelVariant}
                  className='text-gray-600 hover:text-gray-700'
                >
                  <X className='w-4 h-4 mr-1' />
                  Hủy
                </Button>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {/* Tên loại sản phẩm */}
                <div>
                  <Label className='text-sm font-medium'>
                    Tên loại <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    placeholder='VD: Gạo tám xoan 5kg'
                    value={newVariant.variantName}
                    onChange={(e) => handleNewVariantChange('variantName', e.target.value)}
                    className='mt-1'
                  />
                </div>

                {/* Giá */}
                <div>
                  <Label className='text-sm font-medium'>
                    Giá bán <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      type='number'
                      placeholder='0'
                      value={newVariant.price || ''}
                      onChange={(e) => handleNewVariantChange('price', parseFloat(e.target.value) || 0)}
                      className='pl-10 mt-1'
                      min='0'
                      step='1000'
                    />
                  </div>
                </div>

                {/* Số lượng tồn kho */}
                <div>
                  <Label className='text-sm font-medium'>
                    Số lượng tồn kho <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='number'
                    placeholder='0'
                    value={newVariant.quantity || ''}
                    onChange={(e) => handleNewVariantChange('quantity', parseInt(e.target.value) || 0)}
                    className='mt-1'
                    min='0'
                  />
                </div>

                {/* Trọng lượng */}
                <div>
                  <Label className='text-sm font-medium'>Trọng lượng (gram)</Label>
                  <Input
                    type='number'
                    placeholder='0'
                    value={newVariant.weight || ''}
                    onChange={(e) => handleNewVariantChange('weight', parseInt(e.target.value) || 0)}
                    className='mt-1'
                    min='0'
                  />
                </div>

                {/* Chiều dài */}
                <div>
                  <Label className='text-sm font-medium'>Chiều dài (cm)</Label>
                  <Input
                    type='number'
                    placeholder='0'
                    value={newVariant.length || ''}
                    onChange={(e) => handleNewVariantChange('length', parseInt(e.target.value) || 0)}
                    className='mt-1'
                    min='0'
                  />
                </div>

                {/* Chiều rộng */}
                <div>
                  <Label className='text-sm font-medium'>Chiều rộng (cm)</Label>
                  <Input
                    type='number'
                    placeholder='0'
                    value={newVariant.width || ''}
                    onChange={(e) => handleNewVariantChange('width', parseInt(e.target.value) || 0)}
                    className='mt-1'
                    min='0'
                  />
                </div>

                {/* Chiều cao */}
                <div>
                  <Label className='text-sm font-medium'>Chiều cao (cm)</Label>
                  <Input
                    type='number'
                    placeholder='0'
                    value={newVariant.height || ''}
                    onChange={(e) => handleNewVariantChange('height', parseInt(e.target.value) || 0)}
                    className='mt-1'
                    min='0'
                  />
                </div>

                {/* Trạng thái - chỉ hiển thị khi cập nhật variant */}
                {editingVariant && (
                  <div className='flex items-center space-x-3 pt-5'>
                    <Switch
                      id='isActive'
                      className='data-[state=checked]:bg-green-600'
                      checked={newVariant.isActive}
                      onCheckedChange={(checked) => handleNewVariantChange('isActive', checked)}
                    />
                    <Label
                      htmlFor='isActive'
                      className={`text-sm font-medium pl-1 ${newVariant.isActive ? 'text-green-600' : 'text-gray-500'}`}
                    >
                      {newVariant.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                    </Label>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className='flex justify-end gap-3 mt-6'>
                <Button variant='outline' onClick={handleCancelVariant} className='px-6'>
                  Hủy
                </Button>
                <Button onClick={handleSaveVariant} className='bg-green-600 hover:bg-green-700 text-white px-6'>
                  {editingVariant ? 'Cập nhật' : 'Thêm loại'}
                </Button>
              </div>
            </div>
          )}

          {/* Add new variant button */}
          {!showVariantForm && (
            <div className='flex justify-center'>
              <Button
                variant='outline'
                onClick={handleAddVariantClick}
                className='border-dashed border-2 border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'
              >
                <Plus className='w-4 h-4 mr-2' />
                {variants.length === 0 ? 'Thêm loại sản phẩm' : 'Thêm loại sản phẩm mới'}
              </Button>
            </div>
          )}

          {/* Summary */}
          {variants.length > 0 && (
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <div className='flex items-start gap-3'>
                <Info className='w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='font-medium text-blue-900 mb-1'>Tóm tắt loại sản phẩm</h4>
                  <div className='text-sm text-blue-800 space-y-1'>
                    <p>• Tổng số loại: {variants.length}</p>
                    <p>• Tổng tồn kho: {variants.reduce((sum, v) => sum + (v.quantity || 0), 0)} sản phẩm</p>
                    <p>
                      • Giá từ: {Math.min(...variants.map((v) => v.price || 0)).toLocaleString('vi-VN')} ₫ đến{' '}
                      {Math.max(...variants.map((v) => v.price || 0)).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
