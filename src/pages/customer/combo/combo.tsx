import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../../../contexts/cart.context'
import { Button } from '../../../components/ui/button'
import Loading from '../../../components/Loading/loading'
import Pagination from '../../../components/Pagination/Pagination'
import { getAllCombos } from '../../../apis/combo.api'

interface Combo {
  id: string
  name: string
  image?: string
  price?: number
  itemCount?: number
  storeId?: string
  items?: Array<{ name: string }>
}

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
        setCombos(Array.isArray(data) ? data : data?.data || [])
      } catch (err) {
        setError('Không thể tải combo, vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    fetchCombos()
  }, [currentPage])

  const filteredCombos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return combos
    return combos.filter((c) => c.name?.toLowerCase().includes(q))
  }, [searchQuery, combos])

  const handleAddCombo = async (comboId: string) => {
    try {
      await addToCart({ comboId, quantity: 1 })
    } catch {
      // swallow and rely on global error handling/toast if any
    }
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>
      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Combo</h1>
        <div className='flex w-full max-w-[420px] items-center rounded-full border border-[#D5E4CF] bg-white px-3 py-1.5 shadow-sm'>
          <svg className='mr-2 h-4 w-4 text-gray-400' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z' />
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

      {loading && (
        <div className='py-12'>
          <Loading size='lg' text='Đang tải combo...' />
        </div>
      )}

      {error && (
        <div className='text-center py-12'>
          <div className='text-red-600 mb-4'>
            <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z' />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Có lỗi xảy ra</h3>
          <p className='text-gray-600 mb-4'>{error}</p>
          <Button onClick={() => setCurrentPage(1)} className='bg-green-600 text-white hover:bg-green-700'>Thử lại</Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
            {filteredCombos.map((combo) => (
              <div key={combo.id} className='bg-white rounded-lg border shadow-sm overflow-hidden'>
                <div className='relative h-40 bg-gray-100'>
                  <img src={combo.image || '/src/assets/react.svg'} alt={combo.name} className='w-full h-full object-cover' />
                  <span className='absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full'>Combo tiết kiệm</span>
                </div>
                <div className='p-4'>
                  <h3 className='font-medium text-gray-900 mb-1 line-clamp-2'>{combo.name}</h3>
                  <p className='text-sm text-gray-600 mb-2'>Gồm {combo.itemCount ?? combo.items?.length ?? 0} món</p>
                  {combo.price !== undefined && (
                    <p className='text-green-700 font-semibold mb-3'>{combo.price.toLocaleString('vi-VN')}₫</p>
                  )}
                  {combo.items?.length ? (
                    <ul className='text-xs text-gray-600 space-y-1 mb-3'>
                      {combo.items.slice(0, 3).map((i, idx) => (
                        <li key={idx}>• {i.name}</li>
                      ))}
                      {combo.items.length > 3 && <li>• ...</li>}
                    </ul>
                  ) : null}
                  <Button onClick={() => handleAddCombo(combo.id)} className='w-full bg-green-600 hover:bg-green-700 text-white'>Thêm combo vào giỏ</Button>
                </div>
              </div>
            ))}
          </div>

          <div className='mt-6'>
            <Pagination currentPage={currentPage} totalPages={10} onPageChange={(p) => setCurrentPage(p)} maxVisiblePages={5} />
          </div>
        </>
      )}
    </div>
  )
}