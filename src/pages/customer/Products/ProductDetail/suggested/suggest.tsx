import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../../../../../contexts/cart.context'
import { useActiveUserGuard } from '../../../../../hooks/useActiveUserGuard'
import { getCombosByProductId } from '../../../../../apis/combo.api'
import { type Combo } from '../../../../../types/combo.type'
import { Button } from '../../../../../components/ui/button'
import Loading from '../../../../../components/Loading/loading'
import { Eye, ShoppingCart, Package } from 'lucide-react'
import { ShimmerBorder } from '../../../../../components/ui/shimmer'

function Suggest() {
  const { id: productId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isActiveUser } = useActiveUserGuard()
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCombos = async () => {
      if (!productId) return

      try {
        setLoading(true)
        setError(null)
        const response = await getCombosByProductId(productId)

        // Filter for active and approved combos only
        const filteredCombos = response.data.filter((combo) => combo.isActive === true && combo.status === 'Approved')

        setCombos(filteredCombos)
      } catch (err) {
        console.error('Error fetching suggested combos:', err)
        setError('Không thể tải combo gợi ý')
      } finally {
        setLoading(false)
      }
    }

    fetchCombos()
  }, [productId])

  const handleCardClick = (comboId: string) => {
    navigate(`/combo/${comboId}`)
  }

  const handleAddToCart = async (e: React.MouseEvent, comboId: string) => {
    e.stopPropagation()
    if (!isActiveUser) return
    try {
      await addToCart('', 1, comboId)
    } catch (err) {
      console.error('Error adding combo to cart:', err)
    }
  }

  // Don't render if no combos or still loading (to avoid showing empty section)
  if (loading) {
    return (
      <div className='mt-8'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>Combo gợi ý</h2>
        <div className='py-8'>
          <Loading size='md' text='Đang tải combo gợi ý...' />
        </div>
      </div>
    )
  }

  if (error || combos.length === 0) {
    return null // Don't show anything if there's an error or no combos
  }

  return (
    <div className='mt-8'>
      <div className='flex items-center gap-2 mb-4'>
        <Package className='w-5 h-5 text-green-600' />
        <h2 className='text-xl font-semibold text-gray-900'>Combo gợi ý</h2>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        {combos.map((combo) => {
          // Calculate savings
          const individualItemsTotal =
            combo.comboItems?.reduce((sum, item) => {
              return sum + item.finalPrice
            }, 0) || 0
          const savingsAmount = individualItemsTotal - combo.totalFinalPrice
          const discountPercentage =
            combo.totalBasePrice > 0
              ? Math.round(((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100)
              : 0

          return (
            <div
              key={combo.id}
              className='bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer'
              onClick={() => handleCardClick(combo.id)}
            >
              {/* Thumbnail */}
              <div className='relative h-32 bg-gray-100'>
                <img
                  src={combo.thumbnailUrl || '/src/assets/react.svg'}
                  alt={combo.name}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/src/assets/react.svg'
                  }}
                />
                {discountPercentage > 0 && (
                  <span className='absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
                    Giảm {discountPercentage}%
                  </span>
                )}
              </div>

              {/* Content */}
              <div className='p-3'>
                <h3 className='font-medium text-gray-900 mb-1 line-clamp-2 text-sm'>{combo.name}</h3>

                {/* Store Information */}
                <div className='flex items-center gap-1 mb-2'>
                  <svg className='w-3 h-3 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                    />
                  </svg>
                  <span className='text-xs text-gray-600 truncate'>{combo.storeName}</span>
                </div>

                {/* Pricing */}
                <div className='mb-2'>
                  {combo.totalBasePrice > combo.totalFinalPrice ? (
                    <div className='flex items-center gap-2'>
                      <span className='text-xs text-gray-500 line-through'>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(combo.totalBasePrice)}
                      </span>
                      <span className='text-green-700 font-semibold text-sm'>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(combo.totalFinalPrice)}
                      </span>
                    </div>
                  ) : (
                    <span className='text-green-700 font-semibold text-sm'>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(combo.totalFinalPrice)}
                    </span>
                  )}
                </div>

                {/* Savings info */}
                {savingsAmount > 0 && (
                  <div className='text-xs text-green-600 mb-2 font-medium'>
                    Tiết kiệm{' '}
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(savingsAmount)}
                  </div>
                )}

                {/* Combo Items Count */}
                <div className='flex items-center gap-1 mb-2'>
                  <svg className='w-3 h-3 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                    />
                  </svg>
                  <span className='text-xs text-gray-600'>Gồm {combo.comboItems?.length || 0} sản phẩm</span>
                </div>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                  <ShimmerBorder>
                    <Button
                      variant='success'
                      size='sm'
                      title='Xem chi tiết'
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCardClick(combo.id)
                      }}
                      className='flex-1'
                    >
                      <Eye className='w-3 h-3 mr-1' />
                      Xem
                    </Button>
                  </ShimmerBorder>
                  <Button
                    variant='success'
                    size='icon'
                    title='Thêm vào giỏ hàng'
                    onClick={(e) => handleAddToCart(e, combo.id)}
                    className='flex-shrink-0'
                  >
                    <ShoppingCart className='w-3 h-3' />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Suggest
