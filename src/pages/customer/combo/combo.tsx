import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../../contexts/cart.context'
import { Button } from '../../../components/ui/button'
import Loading from '../../../components/Loading/loading'
import Pagination from '../../../components/Pagination/Pagination'
import { getAllCombos } from '../../../apis/combo.api'
import { type Combo } from '../../../types/combo.type'
import { Eye, ShoppingCart } from 'lucide-react'
import { ShimmerBorder } from '../../../components/ui/shimmer'

// ComboCard component for displaying individual combo cards
interface ComboCardProps {
  combo: Combo & {
    individualItemsTotal: number
    savingsAmount: number
    savingsPercentage: number
  }
  onAddToCart: (comboId: string) => void
}

export const ComboCard = ({ combo, onAddToCart }: ComboCardProps) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/combo/${combo.id}`)
  }

  return (
    <div className='bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer'>
      <div className='relative h-40 bg-gray-100'>
        <img
          src={combo.thumbnailUrl || '/src/assets/react.svg'}
          alt={combo.name}
          className='w-full h-full object-cover'
        />
        {combo.totalBasePrice > combo.totalFinalPrice && (
          <span className='absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium'>
            Giảm giá {Math.round(((combo.totalBasePrice - combo.totalFinalPrice) / combo.totalBasePrice) * 100)}%
          </span>
        )}
      </div>
      <div className='p-4'>
        <h3 className='font-medium text-gray-900 mb-1 line-clamp-2'>{combo.name}</h3>

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
        <div className='mb-3'>
          {combo.totalBasePrice > combo.totalFinalPrice ? (
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-500 line-through'>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(combo.totalBasePrice)}
              </span>
              <span className='text-green-700 font-semibold'>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(combo.totalFinalPrice)}
              </span>
            </div>
          ) : (
            <span className='text-green-700 font-semibold'>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(combo.totalFinalPrice)}
            </span>
          )}
        </div>

        {/* Combo Items Count */}
        <div className='flex items-center gap-1 mb-3'>
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
        <div className='flex items-center gap-2'>
          <ShimmerBorder>
            <Button variant='success' title='Xem chi tiết' onClick={handleCardClick}>
              <Eye className='w-4 h-4' />
              Xem chi tiết
            </Button>
          </ShimmerBorder>
          <Button
            variant='success'
            size='icon'
            title='Thêm vào giỏ hàng'
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(combo.id)
            }}
          >
            <ShoppingCart className='w-4 h-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}

// ComboList component for displaying combo grid
interface ComboListProps {
  combos: Combo[]
  loading: boolean
  error: string | null
  onAddToCart: (comboId: string) => void
  currentPage: number
  onPageChange: (page: number) => void
}

export const ComboList = ({ combos, loading, error, onAddToCart, currentPage, onPageChange }: ComboListProps) => {
  // Filter combos for active and approved only
  const filteredCombos = combos.filter((combo) => combo.isActive === true && combo.status === 'Approved')

  // Calculate savings for each combo
  const combosWithSavings = filteredCombos.map((combo) => {
    // Calculate total price if buying items individually (sum of finalPrice only, not multiplied by quantity)
    const individualItemsTotal =
      combo.comboItems?.reduce((sum, item) => {
        return sum + item.finalPrice
      }, 0) || 0

    // Calculate savings
    const savingsAmount = individualItemsTotal - combo.totalFinalPrice
    // Correct formula: Savings percentage = (Savings / Combo) × 100%
    const savingsPercentage = combo.totalFinalPrice > 0 ? Math.round((savingsAmount / combo.totalFinalPrice) * 100) : 0

    return {
      ...combo,
      individualItemsTotal,
      savingsAmount,
      savingsPercentage
    }
  })

  if (loading) {
    return (
      <div className='py-12'>
        <Loading size='lg' text='Đang tải combo...' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-600 mb-4'>
          <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Có lỗi xảy ra</h3>
        <p className='text-gray-600 mb-4'>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
        >
          Thử lại
        </button>
      </div>
    )
  }

  if (combosWithSavings.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-gray-400 mb-4'>
          <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
            />
          </svg>
        </div>
        <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy combo</h3>
        <p className='text-gray-600'>Hãy thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</p>
      </div>
    )
  }

  return (
    <>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {combosWithSavings.map((combo) => (
          <ComboCard key={combo.id} combo={combo} onAddToCart={onAddToCart} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage + 1}
        totalPages={1}
        onPageChange={(page) => onPageChange(page - 1)}
        maxVisiblePages={5}
      />

      {/* Results info */}
      <div className='text-center text-sm text-gray-600 mt-4'>Hiển thị {combosWithSavings.length} combo</div>
    </>
  )
}

// Main ComboPage component (standalone combo page)
export default function ComboPage() {
  const { addToCart } = useCart()
  const [combos, setCombos] = useState<Combo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getAllCombos({ pageNumber: currentPage, pageSize: 12 })
        setCombos(data.data)
      } catch {
        setError('Không thể tải combo, vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    fetchCombos()
  }, [currentPage])

  const filteredCombos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    let filtered = combos

    // Filter for active and approved combos only
    filtered = filtered.filter((combo) => combo.isActive === true && combo.status === 'Approved')

    // Apply search filter
    if (q) {
      filtered = filtered.filter((c) => c.name?.toLowerCase().includes(q))
    }

    return filtered
  }, [searchQuery, combos])

  const handleAddCombo = async (comboId: string) => {
    try {
      await addToCart('', 1, comboId)
    } catch {
      // swallow and rely on global error handling/toast if any
    }
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Combo</h1>
        <div className='flex w-full max-w-[420px] items-center rounded-full border border-[#D5E4CF] bg-white px-3 py-1.5 shadow-sm'>
          <svg
            className='mr-2 h-4 w-4 text-gray-400'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z'
            />
          </svg>
          <input
            className='w-full border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none'
            type='text'
            placeholder='Tìm kiếm combo...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ComboList
        combos={filteredCombos}
        loading={loading}
        error={error}
        onAddToCart={handleAddCombo}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
