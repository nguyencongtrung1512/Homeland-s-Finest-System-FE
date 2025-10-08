import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Trash2, Plus } from 'lucide-react'
import { productVariantApi } from '../../../apis/productVariant.api'
import type { ProductVariantInput } from '../../../types/productVariantType'
import { toast } from 'react-toastify'

interface VariantFormData {
  variantName: string
  price: number
  quantity: number
  length?: number
  width?: number
  height?: number
  weight?: number
}

const CreateProductVariant: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  // State cho nhiều variants
  const [variants, setVariants] = useState<VariantFormData[]>([
    {
      variantName: '',
      price: 0,
      quantity: 0,
      length: undefined,
      width: undefined,
      height: undefined,
      weight: undefined
    }
  ])

  // Thêm variant mới
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        variantName: '',
        price: 0,
        quantity: 0,
        length: undefined,
        width: undefined,
        height: undefined,
        weight: undefined
      }
    ])
  }



  // Cập nhật variant
  const updateVariant = (index: number, field: keyof VariantFormData, value: string | number) => {
    const updatedVariants = [...variants]
    if (field === 'variantName') {
      updatedVariants[index][field] = value as string
    } else {
      updatedVariants[index][field] = value === '' ? undefined : Number(value)
    }
    setVariants(updatedVariants)
  }

  // Validate form
  const validateForm = (): boolean => {
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i]
      if (!variant.variantName.trim()) {
        toast.error(`Variant ${i + 1}: Tên variant không được để trống`)
        return false
      }
      if (variant.price <= 0) {
        toast.error(`Variant ${i + 1}: Giá phải lớn hơn 0`)
        return false
      }
      if (variant.quantity < 0) {
        toast.error(`Variant ${i + 1}: Số lượng không được âm`)
        return false
      }
    }
    return true
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId) {
      toast.error('Không tìm thấy Product ID')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Tạo từng variant một cách tuần tự
      const results = []
      for (const variant of variants) {
        const variantData: ProductVariantInput = {
          productId,
          variantName: variant.variantName,
          price: variant.price,
          quantity: variant.quantity,
          length: variant.length,
          width: variant.width,
          height: variant.height,
          weight: variant.weight,
          isActive: true
        }

        const result = await productVariantApi.create(productId, variantData)
        results.push(result)
      }

      toast.success(`Đã tạo thành công ${results.length} variant(s)`)
      navigate(`/seller/products/${productId}`) // Điều hướng về trang chi tiết sản phẩm
    } catch (error: any) {
      console.error('Error creating variants:', error)
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo variants')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Tạo Product Variants</h1>
        <p className='text-gray-600'>Thêm các biến thể cho sản phẩm của bạn</p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {variants.map((variant, index) => (
          <Card key={index} className='relative'>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-lg'>Variant {index + 1}</CardTitle>
              {variants.length > 1 && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => removeVariant(index)}
                  className='text-red-600 hover:text-red-700'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              )}
            </CardHeader>

            <CardContent className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {/* Tên variant */}
              <div className='space-y-2'>
                <Label htmlFor={`variantName-${index}`}>Tên Variant *</Label>
                <Input
                  id={`variantName-${index}`}
                  type='text'
                  value={variant.variantName}
                  onChange={(e) => updateVariant(index, 'variantName', e.target.value)}
                  placeholder='Ví dụ: Size M, Màu đỏ...'
                  required
                />
              </div>

              {/* Giá */}
              <div className='space-y-2'>
                <Label htmlFor={`price-${index}`}>Giá (VNĐ) *</Label>
                <Input
                  id={`price-${index}`}
                  type='number'
                  min='0'
                  step='1000'
                  value={variant.price || ''}
                  onChange={(e) => updateVariant(index, 'price', e.target.value)}
                  placeholder='10000'
                  required
                />
              </div>

              {/* Số lượng */}
              <div className='space-y-2'>
                <Label htmlFor={`quantity-${index}`}>Số lượng *</Label>
                <Input
                  id={`quantity-${index}`}
                  type='number'
                  min='0'
                  value={variant.quantity || ''}
                  onChange={(e) => updateVariant(index, 'quantity', e.target.value)}
                  placeholder='100'
                  required
                />
              </div>

              {/* Chiều dài */}
              <div className='space-y-2'>
                <Label htmlFor={`length-${index}`}>Chiều dài (cm)</Label>
                <Input
                  id={`length-${index}`}
                  type='number'
                  min='0'
                  value={variant.length || ''}
                  onChange={(e) => updateVariant(index, 'length', e.target.value)}
                  placeholder='20'
                />
              </div>

              {/* Chiều rộng */}
              <div className='space-y-2'>
                <Label htmlFor={`width-${index}`}>Chiều rộng (cm)</Label>
                <Input
                  id={`width-${index}`}
                  type='number'
                  min='0'
                  value={variant.width || ''}
                  onChange={(e) => updateVariant(index, 'width', e.target.value)}
                  placeholder='15'
                />
              </div>

              {/* Chiều cao */}
              <div className='space-y-2'>
                <Label htmlFor={`height-${index}`}>Chiều cao (cm)</Label>
                <Input
                  id={`height-${index}`}
                  type='number'
                  min='0'
                  value={variant.height || ''}
                  onChange={(e) => updateVariant(index, 'height', e.target.value)}
                  placeholder='10'
                />
              </div>

              {/* Cân nặng */}
              <div className='space-y-2 md:col-span-2 lg:col-span-1'>
                <Label htmlFor={`weight-${index}`}>Cân nặng (gram)</Label>
                <Input
                  id={`weight-${index}`}
                  type='number'
                  min='0'
                  value={variant.weight || ''}
                  onChange={(e) => updateVariant(index, 'weight', e.target.value)}
                  placeholder='500'
                />
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Buttons */}
        <div className='flex flex-col sm:flex-row gap-4'>
          <Button type='button' variant='outline' onClick={addVariant} className='flex items-center gap-2'>
            <Plus className='h-4 w-4' />
            Thêm Variant
          </Button>

          <div className='flex gap-2 ml-auto'>
            <Button type='button' variant='outline' onClick={() => navigate(-1)} disabled={isLoading}>
              Hủy
            </Button>

            <Button type='submit' disabled={isLoading} className='min-w-[120px]'>
              {isLoading ? 'Đang tạo...' : `Tạo ${variants.length} Variant(s)`}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateProductVariant
