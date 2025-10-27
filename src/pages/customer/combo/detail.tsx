import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import { getComboById } from '../../../apis/combo.api'
import { type Combo } from '../../../types/combo.type'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { toast } from 'react-toastify'

// Context for sharing combo data across components
interface ComboDetailContextType {
  combo: Combo | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const ComboDetailContext = createContext<ComboDetailContextType | undefined>(undefined)

export const useComboDetailContext = () => {
  const context = useContext(ComboDetailContext)
  if (context === undefined) {
    throw new Error('useComboDetailContext must be used within a ComboDetailProvider')
  }
  return context
}

function ComboDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const [combo, setCombo] = useState<Combo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  const fetchComboDetail = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)
      const response = await getComboById(id)

      if (response.data) {
        setCombo(response.data)
      } else {
        setError('Combo không tồn tại')
      }
    } catch {
      setError('Không thể tải thông tin combo')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchComboDetail()
  }, [id, fetchComboDetail])

  const handleAddToCart = async () => {
    if (!combo) return

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      setIsAddingToCart(true)
      await addToCart('', quantity, combo.id)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    if (!combo) return

    if (!isAuthenticated) {
      setShowLoginModal(true)
      return
    }

    try {
      setIsAddingToCart(true)
      await addToCart('', quantity, combo.id)
      // Sau khi thêm vào giỏ hàng thành công, chuyển đến trang Cart
      if (response.status === 200) {
        navigate('/cart')
      } else {
        toast.error(response.message || 'Thêm vào giỏ hàng thất bại')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity)
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loading />
      </div>
    )
  }

  if (error || !combo) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <EmptyState
          type='error'
          title='Không thể tải thông tin combo'
          description={error || 'Combo không tồn tại hoặc đã bị xóa'}
          actionLabel='Thử lại'
          onAction={fetchComboDetail}
        />
      </div>
    )
  }

  // Calculate savings
  const individualItemsTotal = combo.comboItems?.reduce((sum, item) => {
    return sum + item.finalPrice
  }, 0) || 0

  const savingsAmount = individualItemsTotal - combo.totalFinalPrice
  const savingsPercentage = combo.totalFinalPrice > 0 ? Math.round((savingsAmount / combo.totalFinalPrice) * 100) : 0

  const contextValue: ComboDetailContextType = {
    combo,
    loading,
    error,
    refetch: fetchComboDetail
  }

  return (
    <ComboDetailContext.Provider value={contextValue}>
      <div className='bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12'>
            {/* Combo Image */}
            <div className='space-y-4'>
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden relative'>
                <img
                  src={combo.thumbnailUrl || '/images/placeholder.jpg'}
                  alt={combo.name}
                  className='w-full h-full object-cover'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/600x600?text=No+Image'
                  }}
                />

                {/* Savings Badge - Yellow in top-right */}
                {(savingsAmount > 0 || savingsAmount < 0) && (
                  <span className='absolute top-2 right-2 sm:top-4 sm:right-4 bg-yellow-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium'>
                    {savingsAmount > 0
                      ? `Tiết kiệm ${savingsPercentage}%`
                      : `đắt hơn ${Math.abs(savingsPercentage)}%`}
                  </span>
                )}

                {/* Discount Badge - Red in top-left */}
                {combo.totalBasePrice > combo.totalFinalPrice && (
                  <span className='absolute top-2 left-2 sm:top-4 sm:left-4 bg-red-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full'>
                    Giảm giá {Math.round(((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Combo Information */}
            <div className='space-y-4 sm:space-y-6'>
              {/* Combo Title and Status */}
              <div>
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4'>{combo.name}</h1>

                <div className='flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4'>
                  <div className='flex items-center gap-1'>
                    <svg className='w-4 h-4 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                    </svg>
                    <span className='text-sm sm:text-base text-gray-600 truncate'>{combo.storeName}</span>
                  </div>
                </div>

                {/* Status */}
                <div className='flex flex-wrap items-center gap-2 mb-3 sm:mb-4'>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${combo.isActive && combo.status === 'Approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                    }`}>
                    {combo.isActive && combo.status === 'Approved' ? 'Còn hàng' : 'Không có sẵn'}
                  </span>
                  <span className='text-gray-500 hidden sm:inline'>•</span>
                  <span className='text-xs sm:text-sm text-gray-600'>Gồm {combo.comboItems?.length || 0} sản phẩm</span>
                </div>
              </div>

              {/* Price */}
              <div className='border-t border-b border-gray-200 py-4 sm:py-6'>
                <div className='text-2xl sm:text-3xl font-bold text-red-600 mb-2'>
                  {new Intl.NumberFormat('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                  }).format(combo.totalFinalPrice)}
                </div>

                {combo.totalBasePrice > combo.totalFinalPrice && (
                  <div className='text-base sm:text-lg text-gray-500 line-through'>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(combo.totalBasePrice)}
                  </div>
                )}

                {/* Savings Info */}
                {savingsAmount !== 0 && (
                  <div className='mt-2 text-xs sm:text-sm'>
                    {savingsAmount > 0 ? (
                      <span className='text-green-600 font-medium'>
                        Tiết kiệm {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(savingsAmount)} so với mua lẻ
                      </span>
                    ) : (
                      <span className='text-red-600 font-medium'>
                        Đắt hơn {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(Math.abs(savingsAmount))} so với mua lẻ
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Combo Items */}
              {combo.comboItems && combo.comboItems.length > 0 && (
                <div>
                  <h3 className='text-base sm:text-lg font-semibold mb-3'>Sản phẩm trong combo:</h3>
                  <div className='space-y-2 sm:space-y-3'>
                    {combo.comboItems.map((item, index) => (
                      <div key={index} className='flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg gap-2 sm:gap-0'>
                        <div className='flex-1'>
                          <div className='font-medium text-gray-900 text-sm sm:text-base truncate'>{item.comboItemName}</div>
                          <div className='text-xs sm:text-sm text-gray-600'>Số lượng: {item.quantity}</div>
                        </div>
                        <div className='text-left sm:text-right'>
                          <div className='font-semibold text-green-600 text-sm sm:text-base'>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.finalPrice)}
                          </div>
                          <div className='text-xs sm:text-sm text-gray-500'>
                            Tổng: {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.finalPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className='text-base sm:text-lg font-semibold mb-3'>Số lượng:</h3>
                <div className='flex items-center gap-2 sm:gap-4'>
                  <div className='flex items-center border border-gray-300 rounded-lg'>
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className='px-2 sm:px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
                    >
                      -
                    </button>
                    <span className='px-3 sm:px-4 py-2 border-l border-r border-gray-300 text-sm sm:text-base'>{quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className='px-2 sm:px-3 py-2 hover:bg-gray-100 text-sm sm:text-base'
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className='space-y-3 sm:space-y-4'>
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2'>
                  <Button
                    onClick={handleAddToCart}
                    disabled={!combo.isActive || combo.status !== 'Approved' || isAddingToCart}
                    className='flex-1 bg-green-600 text-white py-3 px-4 sm:px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base'
                  >
                    {isAddingToCart ? (
                      <>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                        <span className='hidden sm:inline'>Đang thêm...</span>
                        <span className='sm:hidden'>Đang thêm...</span>
                      </>
                    ) : (
                      <>
                        {!combo.isActive || combo.status !== 'Approved' ? 'Không có sẵn' : 'Thêm vào giỏ hàng'}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleBuyNow}
                    variant='greenLight'
                    disabled={!combo.isActive || combo.status !== 'Approved'}
                    className='flex-1'
                  >
                    {!combo.isActive || combo.status !== 'Approved' ? 'Không có sẵn' : 'Mua ngay'}
                  </Button>
                </div>
              </div>

              {/* Combo Description */}
              {combo.description && (
                <div className='border-t border-gray-200 pt-4 sm:pt-6'>
                  <h3 className='text-base sm:text-lg font-semibold mb-3'>Mô tả combo:</h3>
                  <p className='text-sm sm:text-base text-gray-700 leading-relaxed'>{combo.description}</p>
                </div>
              )}

              {/* Debug Info - Temporary */}
              <div className='text-xs text-gray-400 border-t pt-3 sm:pt-4'>
                <div className='space-y-1'>
                  <div>Individual total: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(individualItemsTotal)}</div>
                  <div>Combo price: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(combo.totalFinalPrice)}</div>
                  <div>Savings: {savingsAmount > 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(savingsAmount)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
            <DialogDescription>
              Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoginModal(false)}>
              Hủy
            </Button>
            <Button variant='green' onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ComboDetailContext.Provider>
  )
}

export default ComboDetail
