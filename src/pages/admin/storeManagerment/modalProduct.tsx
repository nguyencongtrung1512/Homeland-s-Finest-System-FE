import React from 'react'
import { X, Package, Star, Calendar, ShoppingCart } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'

// Interface cho Product từ API response
interface Product {
  id: string
  name: string
  description: string
  productImages: string[]
  saleCount: number
  rating: number
  reviewCount: number
  isActive: boolean
  status: string
  createdAt: string
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  storeName: string
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, products, storeName }) => {
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Ngày không hợp lệ'
    }
  }

  const getStatusBadge = (isActive: boolean, status: string) => {
    if (!isActive) {
      return <Badge variant="destructive">Không hoạt động</Badge>
    }
    
    switch (status?.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Hoạt động</Badge>
      case 'pending':
        return <Badge variant="secondary">Chờ duyệt</Badge>
      case 'rejected':
        return <Badge variant="destructive">Từ chối</Badge>
      default:
        return <Badge variant="outline">{status || 'Không xác định'}</Badge>
    }
  }

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />)
      } else {
        stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />)
      }
    }
    return stars
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-6 h-6 text-blue-600" />
            Danh sách sản phẩm - {storeName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {products.map((product) => (
                <Card key={product.id} className="border hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    {/* Product Image */}
                    <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                      {product.productImages && product.productImages.length > 0 ? (
                        <img
                          src={product.productImages[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-product.png' // Fallback image
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                          {product.name}
                        </h3>
                        {getStatusBadge(product.isActive, product.status)}
                      </div>

                      {product.description && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Rating and Reviews */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {renderStars(product.rating)}
                        </div>
                        <span className="text-xs text-gray-500">
                          {product.rating.toFixed(1)} ({product.reviewCount} đánh giá)
                        </span>
                      </div>

                      {/* Sales and Date */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="w-3 h-3" />
                          <span>{product.saleCount} đã bán</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(product.createdAt)}</span>
                        </div>
                      </div>

                      {/* Product ID */}
                      <div className="pt-2 border-t">
                        <p className="text-xs text-gray-400 font-mono">
                          ID: {product.id}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Package className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Không có sản phẩm</h3>
              <p className="text-sm text-center">
                Cửa hàng này chưa có sản phẩm nào hoặc dữ liệu chưa được tải.
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Tổng cộng: <span className="font-medium">{products?.length || 0}</span> sản phẩm
          </div>
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductModal