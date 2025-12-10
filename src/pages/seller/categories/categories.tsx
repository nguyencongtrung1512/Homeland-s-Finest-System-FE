import { useState, useEffect, useCallback } from 'react'
import { useStore } from '../../../contexts/store.context'
import { storeApi, type StoreCategory } from '../../../apis/store.api'
import { toast } from '../../../utils/toast'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import { Package, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { resolveImageUrl } from '../../../utils/image'

function CategoriesSeller() {
  const { store, loading: storeLoading } = useStore()
  const [categories, setCategories] = useState<StoreCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    if (!store?.id) {
      setError('Không tìm thấy thông tin cửa hàng')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await storeApi.getStoreCategories(store.id)

      // axiosInstance đã trả về response.data rồi, nên response đã là data object
      if (response?.data && Array.isArray(response.data)) {
        setCategories(response.data)
      } else {
        setCategories([])
      }
    } catch (err: unknown) {
      console.error('Error fetching categories:', err)
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Có lỗi xảy ra khi tải danh sách danh mục'
      setError(errorMessage)
      toast.error(errorMessage)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    if (store?.id) {
      fetchCategories()
    }
  }, [store?.id, fetchCategories])

  if (storeLoading || loading) {
    return <Loading />
  }

  if (!store?.id) {
    return (
      <div className='p-6'>
        <EmptyState title='Không tìm thấy cửa hàng' description='Vui lòng thiết lập cửa hàng trước.' type='search' />
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className='p-6'>
        <div className='text-center py-12'>
          <p className='text-red-500 mb-4'>{error}</p>
          <Button onClick={fetchCategories} variant='outline'>
            <RefreshCw className='w-4 h-4 mr-2' />
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const totalProducts = categories.reduce((sum, category) => sum + category.products.length, 0)

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-green-700'>Danh mục sử dụng</h1>
          <p className='text-gray-600 mt-1'>
            Quản lý danh mục và sản phẩm của cửa hàng bạn
            {totalProducts > 0 && <span className='ml-2 text-green-600 font-medium'>({totalProducts} sản phẩm)</span>}
          </p>
        </div>
        <Button
          onClick={fetchCategories}
          variant='outline'
          className='text-green-600 border-green-600 hover:bg-green-50'
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Đang tải...
            </>
          ) : (
            <>
              <RefreshCw className='w-4 h-4 mr-2' />
              Làm mới
            </>
          )}
        </Button>
      </div>

      {/* Categories List */}
      {categories.length > 0 ? (
        <div className='space-y-4'>
          {categories.map((category) => (
            <Card key={category.categoryId} className='hover:shadow-lg transition-shadow border border-gray-100'>
              <CardHeader className='pb-4 border-b border-gray-100'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
                    <Package className='w-5 h-5 text-green-600' />
                    {category.categoryName}
                  </CardTitle>
                  <Badge variant='secondary' className='bg-green-100 text-green-800 hover:bg-green-100'>
                    {category.products.length} sản phẩm
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='pt-4'>
                {category.products.length > 0 ? (
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
                    {category.products.map((product) => (
                      <div
                        key={product.id}
                        className='group relative bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 overflow-hidden'
                      >
                        <div className='aspect-square w-full bg-gray-100 relative overflow-hidden'>
                          {product.imageUrl ? (
                            <img
                              src={resolveImageUrl(product.imageUrl)}
                              alt={product.name}
                              className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-200'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = '/placeholder-image.png'
                              }}
                            />
                          ) : (
                            <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                              <Package className='w-12 h-12 text-gray-400' />
                            </div>
                          )}
                        </div>
                        <div className='p-3'>
                          <h3 className='text-sm font-medium text-gray-900 line-clamp-2 min-h-[2.5rem]'>
                            {product.name}
                          </h3>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8 text-gray-500'>
                    <Package className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                    <p className='text-sm'>Chưa có sản phẩm trong danh mục này</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title='Chưa có danh mục nào'
          description='Cửa hàng của bạn chưa có danh mục sản phẩm nào.'
          type='search'
        />
      )}
    </div>
  )
}

export default CategoriesSeller
