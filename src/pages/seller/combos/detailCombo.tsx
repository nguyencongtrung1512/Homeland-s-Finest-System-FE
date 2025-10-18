import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { ArrowLeft, Edit, Package, MapPin, FileText } from 'lucide-react'
import path from '../../../constants/path'
import type { Combo } from '../../../types/combo.type'

// Mock data cứng (giống với listCombo.tsx)
const mockCombos: Combo[] = [
  {
    id: '1',
    name: 'Combo Gạo Sạch Miền Tây',
    provinceId: 1,
    provinceName: 'An Giang',
    description: 'Combo gạo sạch chất lượng cao từ miền Tây Nam Bộ, đảm bảo an toàn thực phẩm',
    isActive: true,
    thumbnailUrl: 'https://tse1.mm.bing.net/th/id/OIP.xS6YZHwSZbjL4L_kfFPHEQHaEL?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3',
    staffNote: 'Combo được duyệt và đang bán tốt',
    comboItems: [
      {
        id: '1-1',
        productVariantId: 'pv-1',
        comboItemName: 'Gạo ST25 5kg',
        comboItemImageUrl: 'https://tse2.mm.bing.net/th/id/OIP.HTagk8TrUtzQbnYskxV_bwHaEK?cb=12&pid=ImgDet&w=184&h=103&c=7&dpr=1.3&o=7&rm=3',
        price: 150000,
        quantity: 1,
        isActive: true,
        productName: 'Gạo ST25',
        variantName: '5kg',
        storeName: 'Cửa hàng Gạo Sạch Miền Tây'
      },
      {
        id: '1-2',
        productVariantId: 'pv-2',
        comboItemName: 'Gạo Jasmine 2kg',
        comboItemImageUrl: 'https://tse3.mm.bing.net/th/id/OIP.lVQdtmjBTXhN-BzGdkkVWAHaFs?cb=12&w=780&h=600&rs=1&pid=ImgDetMain&o=7&rm=3',
        price: 80000,
        quantity: 1,
        isActive: true,
        productName: 'Gạo Jasmine',
        variantName: '2kg',
        storeName: 'Cửa hàng Gạo Sạch Miền Tây'
      },
      {
        id: '1-3',
        productVariantId: 'pv-3',
        comboItemName: 'Gạo Nàng Thơm 3kg',
        comboItemImageUrl: 'https://tse3.mm.bing.net/th/id/OIP.lVQdtmjBTXhN-BzGdkkVWAHaFs?cb=12&w=780&h=600&rs=1&pid=ImgDetMain&o=7&rm=3',
        price: 120000,
        quantity: 1,
        isActive: true,
        productName: 'Gạo Nàng Thơm',
        variantName: '3kg',
        storeName: 'Cửa hàng Gạo Sạch Miền Tây'
      }
    ]
  }
]

function DetailComboSeller() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchCombo = useCallback(async () => {
    setLoading(true)
    try {
      // Simulate delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const foundCombo = mockCombos.find((c) => c.id === id)
      if (foundCombo) {
        setCombo(foundCombo)
      } else {
        setCombo(null)
      }
    } catch (error) {
      console.error('Error fetching combo:', error)
      setCombo(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchCombo()
    }
  }, [id, fetchCombo])

  const handleBack = () => {
    navigate(-1)
  }

  const handleEdit = () => {
    if (combo) {
      navigate(`../${path.updateComboSeller.replace(':id', combo.id)}`)
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    if (!isActive) {
      return {
        text: 'Đã xóa',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      }
    }
    return {
      text: 'Hoạt động',
      className: 'bg-green-100 text-green-800 hover:bg-green-100'
    }
  }

  const calculateTotalPrice = () => {
    if (!combo) return 0
    return combo.comboItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateTotalItems = () => {
    if (!combo) return 0
    return combo.comboItems.reduce((total, item) => total + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
          <span className='ml-2 text-gray-600'>Đang tải...</span>
        </div>
      </div>
    )
  }

  if (!combo) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold text-gray-900 mb-4'>Không tìm thấy combo</h2>
          <p className='text-gray-600 mb-6'>Combo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={handleBack} className='bg-green-600 hover:bg-green-700'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusBadge(combo.isActive)
  const totalPrice = calculateTotalPrice()
  const totalItems = calculateTotalItems()

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' onClick={handleBack}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Quay lại
          </Button>
          <h1 className='text-2xl font-semibold text-gray-900'>{combo.name}</h1>
        </div>
        <Button onClick={handleEdit} className='bg-green-600 hover:bg-green-700'>
          <Edit className='w-4 h-4 mr-2' />
          Chỉnh sửa
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Info */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Combo Image */}
          <Card>
            <CardContent className='p-0'>
              <img src={combo.thumbnailUrl} alt={combo.name} className='w-full h-64 object-cover rounded-t-lg' />
            </CardContent>
          </Card>

          {/* Combo Items */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Sản phẩm trong combo ({combo.comboItems.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {combo.comboItems.map((item) => (
                  <div key={item.id} className='border rounded-lg p-4 hover:shadow-md transition-shadow'>
                    <div className='flex gap-4'>
                      <img
                        src={item.comboItemImageUrl}
                        alt={item.comboItemName}
                        className='w-16 h-16 object-cover rounded-lg'
                      />
                      <div className='flex-1'>
                        <h4 className='font-medium text-gray-900'>{item.comboItemName}</h4>
                        <p className='text-sm text-gray-600'>
                          {item.productName} - {item.variantName}
                        </p>
                        <p className='text-sm text-gray-500'>{item.storeName}</p>
                        <div className='flex justify-between items-center mt-2'>
                          <span className='text-sm text-gray-600'>Số lượng: {item.quantity}</span>
                          <span className='font-semibold text-green-600'>
                            {(item.price * item.quantity).toLocaleString()}₫
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Status & Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin combo</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Trạng thái:</span>
                <Badge variant='secondary' className={statusInfo.className}>
                  {statusInfo.text}
                </Badge>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Tổng giá:</span>
                <span className='text-lg font-semibold text-green-600'>{totalPrice.toLocaleString()}₫</span>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Tổng số lượng:</span>
                <span className='text-lg font-semibold text-gray-900'>{totalItems}</span>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                Vị trí
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600'>{combo.provinceName}</p>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Mô tả
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600'>{combo.description}</p>
            </CardContent>
          </Card>

          {/* Staff Note */}
          {combo.staffNote && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='w-5 h-5' />
                  Ghi chú từ staff
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-600'>{combo.staffNote}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default DetailComboSeller