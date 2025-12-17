import React from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Package, Calendar, ShoppingCart, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Card, CardContent } from '../../../components/ui/card'
import type { Product } from '../../../types/productType'
import { formatDate } from '../../../utils/formatDate'

// Extended Product type với createdAt (có thể có trong một số API response)
export interface ProductWithCreatedAt extends Product {
  createdAt?: string
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  products: ProductWithCreatedAt[]
  storeName: string
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}

const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  products,
  storeName,
  loading = false,
  error = null,
  onRetry
}) => {
  const navigate = useNavigate()

  const handleProductClick = (productId: string) => {
    onClose() // Đóng modal trước khi navigate
    navigate(`/admin/productManagement/detail-product/${productId}`)
  }

  // const renderStars = (rating: number | null | undefined) => {
  //   if (rating === null || rating === undefined) {
  //     return Array.from({ length: 5 }, (_, i) => <Star key={i} className='w-4 h-4 text-gray-300' />)
  //   }

  //   const stars = []
  //   const fullStars = Math.floor(rating)
  //   const hasHalfStar = rating % 1 !== 0

  //   for (let i = 0; i < 5; i++) {
  //     if (i < fullStars) {
  //       stars.push(<Star key={i} className='w-4 h-4 fill-yellow-400 text-yellow-400' />)
  //     } else if (i === fullStars && hasHalfStar) {
  //       stars.push(<Star key={i} className='w-4 h-4 fill-yellow-400/50 text-yellow-400' />)
  //     } else {
  //       stars.push(<Star key={i} className='w-4 h-4 text-gray-300' />)
  //     }
  //   }
  //   return stars
  // }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Package className='w-6 h-6 text-blue-600' />
            Danh sách sản phẩm - {storeName}
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='w-8 h-8 animate-spin text-blue-500 mb-4' />
              <p className='text-gray-600'>Đang tải danh sách sản phẩm...</p>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center py-12 text-red-500'>
              <Package className='w-16 h-16 mb-4 text-red-300' />
              <h3 className='text-lg font-medium mb-2'>Lỗi khi tải sản phẩm</h3>
              <p className='text-sm text-center mb-4'>{error}</p>
              {onRetry && (
                <Button onClick={onRetry} variant='outline'>
                  Thử lại
                </Button>
              )}
            </div>
          ) : products && products.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1'>
              {products.map((product) => (
                <Card
                  key={product.id}
                  className='border hover:shadow-md transition-shadow cursor-pointer'
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardContent className='p-4'>
                    {/* Product Image */}
                    <div className='aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden'>
                      {product.productImages && product.productImages.length > 0 ? (
                        <img
                          src={product.productImages[0]}
                          alt={product.name}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = 'https://i.pinimg.com/736x/c6/1c/ae/c61cae893723278b817cd64ffc966bf8.jpg' // Fallback image
                          }}
                        />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <Package className='w-12 h-12 text-gray-400' />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className='space-y-2'>
                      <div className='flex items-start justify-between gap-2'>
                        <h3 className='font-medium text-gray-900 line-clamp-2 text-sm'>{product.name}</h3>
                      </div>

                      {product.description && (
                        <p className='text-xs text-gray-600 line-clamp-2'>{product.description}</p>
                      )}

                      {/* Sales and Date */}
                      <div className='flex items-center justify-between text-xs text-gray-500'>
                        <div className='flex items-center gap-1'>
                          <ShoppingCart className='w-3 h-3' />
                          <span>{product.saleCount || 0} đã bán</span>
                        </div>
                        {product.createdAt && (
                          <div className='flex items-center gap-1'>
                            <Calendar className='w-3 h-3' />
                            <span>{formatDate(product.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
              <Package className='w-16 h-16 mb-4 text-gray-300' />
              <h3 className='text-lg font-medium mb-2'>Không có sản phẩm</h3>
              <p className='text-sm text-center'>Cửa hàng này chưa có sản phẩm nào hoặc dữ liệu chưa được tải.</p>
            </div>
          )}
        </div>

        <div className='flex-shrink-0 flex justify-between items-center pt-4 border-t'>
          <div className='text-sm text-gray-600'>
            Tổng cộng: <span className='font-medium'>{products?.length || 0}</span> sản phẩm
          </div>
          <Button onClick={onClose} variant='outline'>
            <X className='w-4 h-4 mr-2' />
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductModal
