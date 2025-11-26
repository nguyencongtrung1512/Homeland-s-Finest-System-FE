import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { useAuth } from '../../../contexts/auth.context'
import { useChat } from '../../../contexts/chat.context'
import { getComboById } from '../../../apis/combo.api'
import { type Combo } from '../../../types/combo.type'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { ComboReview } from './review'
import path from '../../../constants/path'
import ChatSystem from '../Chat/chatSystem'
import ThreeDCard from '../../../components/ui/threed-card'

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
  const { openChatWithStore } = useChat()
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

  // Reset quantity when combo changes to ensure it doesn't exceed availableQuantity
  useEffect(() => {
    if (combo && combo.availableQuantity && quantity > combo.availableQuantity) {
      setQuantity(combo.availableQuantity)
    }
  }, [combo])

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
      navigate('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (!combo) return

    const maxQuantity = combo.availableQuantity || 1
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity)
    }
  }

  const handleExploreStore = () => {
    if (combo?.storeId) {
      navigate(`${path.store.replace(':storeId', combo.storeId)}?tab=products`)
    }
  }

  const handleViewStory = () => {
    if (combo?.storeId) {
      navigate(`${path.store.replace(':storeId', combo.storeId)}?tab=story`)
    }
  }

  const handleSendMessage = () => {
    if (combo?.storeId && combo?.storeName) {
      openChatWithStore(combo.storeId, combo.storeName)
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
              <ThreeDCard
                className='aspect-square [&>div]:bg-transparent [&>div]:p-0'
                enableGlow={true}
                enableShadow={true}
                enableParallax={true}
                maxRotation={15}
                glowOpacity={0.2}
              >
                <div className='relative w-full h-full rounded-2xl overflow-hidden bg-gray-100'>
                  <img
                    src={combo.thumbnailUrl || '/images/placeholder.jpg'}
                    alt={combo.name}
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/600x600?text=No+Image'
                    }}
                  />

                  {/* Discount Badge */}
                  {combo.totalBasePrice > combo.totalFinalPrice && (
                    <span className='absolute top-2 right-2 sm:top-4 sm:right-4 bg-yellow-500 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium z-20 shadow-lg'>
                      Giảm giá{' '}
                      {Math.round(((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100)}%
                    </span>
                  )}
                </div>
              </ThreeDCard>
            </div>

            {/* Combo Information */}
            <div className='space-y-4 sm:space-y-6'>
              {/* Combo Title and Status */}
              <div>
                <h1 className='text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4'>{combo.name}</h1>

                <div className='flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4'>
                  <div className='flex items-center gap-1'>
                    <svg className='w-4 h-4 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                      />
                    </svg>
                    <span className='text-sm sm:text-base text-gray-600 truncate'>{combo.storeName}</span>
                  </div>
                </div>

                {/* Status */}
                <div className='flex flex-wrap items-center gap-2 mb-3 sm:mb-4'>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${combo.isActive && combo.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}
                  >
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
              </div>

              {/* Combo Items */}
              {combo.comboItems && combo.comboItems.length > 0 && (
                <div>
                  <h3 className='text-base sm:text-lg font-semibold mb-3'>Sản phẩm trong combo:</h3>
                  <div className='space-y-2 sm:space-y-3'>
                    {combo.comboItems.map((item, index) => (
                      <div
                        key={index}
                        className='flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg gap-2 sm:gap-0'
                      >
                        <div className='flex-1'>
                          <div className='font-medium text-gray-900 text-sm sm:text-base truncate'>
                            {item.comboItemName}
                          </div>
                          <div className='text-xs sm:text-sm text-gray-600'>Số lượng: {item.quantity}</div>
                        </div>
                        <div className='text-left sm:text-right'>
                          <div className='font-semibold text-green-600 text-sm sm:text-base'>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(item.basePrice)}
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
                    <span className='px-3 sm:px-4 py-2 border-l border-r border-gray-300 text-sm sm:text-base'>
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={!combo || quantity >= (combo.availableQuantity || 0)}
                      className='px-2 sm:px-3 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base'
                    >
                      +
                    </button>
                  </div>
                  <span className='text-gray-500 text-sm'>{combo.availableQuantity} combo có sẵn</span>
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
                      <>{!combo.isActive || combo.status !== 'Approved' ? 'Không có sẵn' : 'Thêm vào giỏ hàng'}</>
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
            </div>
          </div>
        </div>

        {/* Store Information Section */}
        {combo.storeId && combo.storeName && (
          <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8'>
            <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='bg-gray-50 rounded-lg p-6'>
                <div className='flex flex-col lg:flex-row gap-6'>
                  {/* Left Section - Store Information */}
                  <div className='flex-1'>
                    {/* Store Header */}
                    <div className='flex items-start gap-4 mb-6'>
                      {/* Store Logo */}
                      <div className='w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0'>
                        <svg className='w-8 h-8 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>

                      {/* Store Info */}
                      <div className='flex-1'>
                        <h2 className='text-2xl font-bold text-gray-900 mb-2'>{combo.storeName}</h2>
                        <p className='text-gray-700 text-base leading-6 mb-4'>
                          Cửa hàng chuyên cung cấp combo và sản phẩm chất lượng cao. Cam kết mang đến những sản phẩm tốt
                          nhất cho khách hàng.
                        </p>

                        {/* Send Message Button */}
                        <button
                          onClick={handleSendMessage}
                          className='bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-2'
                        >
                          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Nhắn tin
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Action Buttons */}
                  <div className='lg:w-80'>
                    <div className='space-y-4 gap-4'>
                      <div className=''>
                        <button
                          onClick={handleExploreStore}
                          className='w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2'
                        >
                          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Khám phá cửa hàng
                        </button>
                      </div>

                      <div className='p-1'>
                        <button
                          onClick={handleViewStory}
                          className='w-full border border-green-600 text-green-600 py-3 px-6 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center justify-center gap-2'
                        >
                          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H9a1 1 0 00-1 1v6a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z'
                              clipRule='evenodd'
                            />
                          </svg>
                          Xem câu chuyện
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combo Reviews Section */}
        <div className='mt-8'>
          <ComboReview />
        </div>
        <ChatSystem />
      </div>

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Đăng nhập để tiếp tục</DialogTitle>
            <DialogDescription>Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowLoginModal(false)}>
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
