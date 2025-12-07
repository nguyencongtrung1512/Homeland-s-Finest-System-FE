import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Star, MapPin, Flag, AlertCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import StorySection from './components/StorySection'
import MapComponent from '../../../components/Mapbox/mapBox'
import { useStore } from '../../../hooks/useStore'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import CertificatesSection from './components/CertificatesSection'
import ReportModal from './components/ReportModal'
import ProductCard from '../Products/Product/productCard'
import { productApi } from '../../../apis/product.api'
import type { Product } from '../../../types'
import { PromotionBubble } from '../../../components/PromotionBubble'
import { formatDate } from '../../../utils/formatDate'
import AsideFilter from './components/asideFilter'
import SortBar, { type SortOption } from './components/SortBar'

const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('')
  const [sortOption, setSortOption] = useState<SortOption>('popular')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Use custom hook to fetch store data
  const { store, loading, error, refetch } = useStore(storeId)

  // Get initial tab from URL or default to 'story'
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get('tab') || 'story'
  })

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== 'story') {
      setSearchParams({ tab: activeTab })
    } else {
      setSearchParams({})
    }
  }, [activeTab, setSearchParams])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleAddressClick = () => {
    setIsMapModalOpen(true)
  }

  const handleRetry = () => {
    refetch()
  }

  // Fetch products by store
  const fetchProductsByStore = async (storeId: string) => {
    if (!storeId) return

    setProductsLoading(true)
    setProductsError(null)

    try {
      const response = await productApi.getByStore(storeId, {
        pageSize: 50, // Get more products to display
        pageNumber: 1
      })
      setProducts(response.data)
    } catch (err) {
      console.error('Error fetching products by store:', err)
      setProductsError('Không thể tải danh sách sản phẩm')
    } finally {
      setProductsLoading(false)
    }
  }

  // Fetch products when store is loaded
  useEffect(() => {
    if (store?.id) {
      fetchProductsByStore(store.id)
    }
  }, [store?.id])

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loading />
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <EmptyState
          type='error'
          title='Không thể tải thông tin cửa hàng'
          description={error || 'Cửa hàng không tồn tại hoặc đã bị xóa'}
          actionLabel='Thử lại'
          onAction={handleRetry}
        />
      </div>
    )
  }

  // Transform vendorApplicationImageUrl to certificates format
  const certificates =
    store.vendorApplicationImageUrl &&
      Array.isArray(store.vendorApplicationImageUrl) &&
      store.vendorApplicationImageUrl.length > 0
      ? store.vendorApplicationImageUrl.map((imageUrl, index) => ({
        id: `cert-${index}`,
        name: `Giấy phép kinh doanh ${index + 1}`,
        image: imageUrl,
        issueDate: store.submittedDate ? formatDate(store.submittedDate) : undefined
      }))
      : []

  // Filter and sort products
  const filteredProducts = [...products]
    .filter((product) => {
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase()
        const productName = product.name?.toLowerCase() || ''
        const productDescription = product.description?.toLowerCase() || ''
        const productMaterial = product.material?.toLowerCase() || ''

        return productName.includes(query) || productDescription.includes(query) || productMaterial.includes(query)
      }
      return true
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'popular':
          // Sort by rating (higher first), then by review count
          if (b.rating !== a.rating) {
            return b.rating - a.rating
          }
          return b.reviewCount - a.reviewCount

        case 'newest':
          // Sort by creation date (newest first) - assuming products have createdAt field
          // If not available, keep original order
          return 0

        case 'bestseller':
          // Sort by saleCount (higher first)
          return b.saleCount - a.saleCount

        case 'price-low':
          // Sort by price (lower first)
          return (a.price || 0) - (b.price || 0)

        case 'price-high':
          // Sort by price (higher first)
          return (b.price || 0) - (a.price || 0)

        default:
          return 0
      }
    })

  // Transform API data to match component expectations
  const storeData = {
    id: store.id,
    name: store.storeName,
    description: `Cửa hàng tại , ${store.ward} , ${store.district}, ${store.province}`,
    address: store.address,
    image:
      store.logoUrl || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=100&h=100&fit=crop&crop=center',
    coverImage:
      store.coverImageUrl ||
      'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&h=300&fit=crop&crop=center',
    story: 'Chúng tôi cam kết mang đến những sản phẩm chất lượng cao nhất cho khách hàng.',
    products: filteredProducts.map((product) => {
      // Get price directly from product, fallback to variants if needed
      const price = product.price || 0

      return {
        ...product, // Spread all product properties
        price: price, // Add price for ProductCard
        badge: product.status === 'active' ? { text: 'Đang bán', color: 'bg-green-500' } : undefined
      }
    }),
    certificates: certificates
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>
      {/* Store Header */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-8'>
        {/* Cover Image */}
        <div className='h-48 bg-gradient-to-r from-green-400 to-green-600 relative'>
          <img src={storeData.coverImage} alt='' className='w-full h-full object-cover opacity-80' />
        </div>

        {/* Store Info */}
        <div className='p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Store Avatar & Basic Info */}
            <div className='flex-shrink-0'>
              <img
                src={storeData.image}
                alt={storeData.name}
                className='w-24 h-24 rounded-lg border-4 border-white shadow-lg'
                onError={(e) => {
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=100&h=100&fit=crop&crop=center'
                }}
              />
            </div>

            <div className='flex-1'>
              <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h1 className='text-2xl font-bold text-gray-900 mb-2'>{storeData.name}</h1>
                      <p className='text-gray-600 mb-3'>{storeData.description}</p>

                      <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                        <div
                          className='flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors'
                          onClick={handleAddressClick}
                          title='Click để xem bản đồ'
                        >
                          <MapPin className='w-4 h-4' />
                          <span className='hover:underline'>{storeData.address}</span>
                        </div>

                        {store.status === 'Inactive' && (
                          <div className='flex items-center gap-1'>
                            <span className='px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                              Cửa hàng đã bị khóa
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Report Button */}
                    <button
                      onClick={() => setIsReportModalOpen(true)}
                      className='p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
                      title='Báo cáo cửa hàng'
                    >
                      <Flag className='w-5 h-5' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='story'>Câu Chuyện</TabsTrigger>
          <TabsTrigger value='products'>Sản Phẩm</TabsTrigger>
          <TabsTrigger value='certificates'>Giấy Chứng Nhận</TabsTrigger>
        </TabsList>

        {/* Câu Chuyện Tab */}
        <TabsContent value='story'>
          <StorySection storeName={storeData.name} story={storeData.story} storeId={store.id} />
        </TabsContent>

        {/* Sản Phẩm Tab */}
        <TabsContent value='products'>
          {productsLoading ? (
            <div className='flex items-center justify-center py-16'>
              <Loading />
              <span className='ml-2 text-gray-600'>Đang tải sản phẩm...</span>
            </div>
          ) : productsError ? (
            <div className='bg-white rounded-lg p-12 text-center shadow-sm'>
              <div className='text-red-500 mb-4'>
                <AlertCircle className='w-12 h-12 mx-auto' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>Không thể tải sản phẩm</h3>
              <p className='text-gray-600 mb-4'>{productsError}</p>
              <button
                onClick={() => store?.id && fetchProductsByStore(store.id)}
                className='px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className='flex flex-col lg:flex-row gap-6'>
              {/* Sidebar Filter */}
              <div className='lg:w-64 flex-shrink-0'>
                <AsideFilter
                  onCategoryChange={(category) => setSelectedCategory(category)}
                  onSuggestionChange={(suggestion) => setSelectedSuggestion(suggestion)}
                />
              </div>

              {/* Products Grid */}
              <div className='flex-1'>
                {storeData.products.length > 0 ? (
                  <>
                    {/* Sort Bar */}
                    <div className='mb-6'>
                      <SortBar
                        selectedSort={sortOption}
                        onSortChange={setSortOption}
                        onSearchChange={setSearchQuery}
                        searchValue={searchQuery}
                      />
                    </div>

                    {/* Products Grid */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                      {storeData.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className='bg-white rounded-lg p-12 text-center shadow-sm'>
                    <div className='text-gray-400 mb-4'>
                      <Star className='w-12 h-12 mx-auto' />
                    </div>
                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>Chưa có sản phẩm</h3>
                    <p className='text-gray-600'>
                      {selectedCategory || selectedSuggestion
                        ? 'Không tìm thấy sản phẩm phù hợp với bộ lọc đã chọn.'
                        : 'Cửa hàng này chưa có sản phẩm nào.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Giấy chứng nhận Tab */}
        <TabsContent value='certificates'>
          <CertificatesSection storeId={storeId || ''} certificates={storeData.certificates} />
        </TabsContent>
      </Tabs>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        storeName={storeData.name}
        storeId={storeId || ''}
      />

      {/* Map Modal */}
      <Dialog open={isMapModalOpen} onOpenChange={setIsMapModalOpen}>
        <DialogContent className='max-w-4xl w-full max-h-[90vh] overflow-y-auto p-0'>
          <DialogHeader className='p-6 border-b border-gray-200'>
            <DialogTitle className='text-xl font-bold text-gray-900'>Vị trí cửa hàng</DialogTitle>
            <p className='text-sm text-gray-600 mt-1'>{storeData.name}</p>
            <p className='text-sm text-gray-500 mt-1'>{storeData.address}</p>
          </DialogHeader>

          <div className='p-6'>
            <MapComponent storeAddress={storeData.address} storeName={storeData.name} />
          </div>
        </DialogContent>
      </Dialog>
      <PromotionBubble />
    </div>
  )
}

export default StorePage
