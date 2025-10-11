import { useState, useEffect } from 'react'
import { productApi } from '../apis/product.api'

// Extended Product Detail interface based on API response
export interface ProductDetailData {
  id: string
  storeId: string
  provinceId: number
  editedById: string
  name: string
  description: string
  productImages: string[]
  productVideo: string
  material: string
  saleCount: number
  rating: number
  reviewCount: number
  isActive: boolean
  typeProduct: string
  status: string
  staffNote: string
  variants: ProductVariant[]
  productCategories: ProductCategory[]
  productCertificateDTOs: ProductCertificate[]
}

export interface ProductVariant {
  id: string
  variantName: string
  price: number
  basePrice: number
  quantity: number
  reservedCod: number
  reservedCombo: number
  availableQuantity: number
  isActive: boolean
  length: number
  width: number
  height: number
  weight: number
}

export interface ProductCategory {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductCertificate {
  id: string
  productId: string
  reviewedByStaffId: string
  imageUrl: string
  status: string
  staffNotes: string
  submittedDate: string
  decisionDate: string
  updatedAt: string
}

interface UseProductDetailReturn {
  product: ProductDetailData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useProductDetail = (productId: string | undefined): UseProductDetailReturn => {
  const [product, setProduct] = useState<ProductDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProductDetail = async () => {
    if (!productId) {
      setError('ID sản phẩm không hợp lệ')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await productApi.getById(productId)
      console.log('data sản phẩm của useProduct nè', response)
      if (response.status === 200 && response.data) {
        setProduct(response.data as ProductDetailData)
      } else {
        setError('Không thể tải thông tin sản phẩm')
      }
    } catch (err) {
      console.error('Error fetching product detail:', err)
      setError('Có lỗi xảy ra khi tải thông tin sản phẩm')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductDetail()
  }, [productId])

  const refetch = () => {
    fetchProductDetail()
  }

  return {
    product,
    loading,
    error,
    refetch
  }
}