import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { MapPin, Flag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import StorySection from './components/StorySection'
import MapComponent from '../../../components/Mapbox/mapBox'
import { useStore } from '../../../hooks/useStore'
import { useStoreProducts } from '../../../hooks/useStoreProducts'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import CertificatesSection from './components/CertificatesSection'
import ReportModal from './components/ReportModal'
import type { Product } from '../../../types'
import type { StoreProductItemDTO } from '../../../apis/store.api'
import { getHashtagsByStoreId } from '../../../apis/hashtag.api'
import type { HashtagItem } from '../../../apis/hashtag.api'
import { PromotionBubble } from '../../../components/PromotionBubble'
import { formatDate } from '../../../utils/formatDate'
import AsideFilter from './components/asideFilter'
import SortBar, { type SortOption } from './components/SortBar'
import ProductsGrid from './components/ProductsGrid'

const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

  // Filter state - mặc định là "Tất cả" (empty string = không filter theo type)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedHashtagIds, setSelectedHashtagIds] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<SortOption>('popular')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Pagination state
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize] = useState(20)

  // Hashtags state
  const [storeHashtags, setStoreHashtags] = useState<HashtagItem[]>([])
  const [hashtagsLoading, setHashtagsLoading] = useState(false)

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

  // Memoize callbacks để tránh re-render không cần thiết
  const handleCategoryChange = useCallback((category: string) => {
    // Nếu category là 'all' thì set empty string (không filter theo type)
    setSelectedCategory(category === 'all' ? '' : category)
  }, [])

  const handleSuggestionChange = useCallback((hashtagIds: string[]) => {
    setSelectedHashtagIds(hashtagIds)
  }, [])

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort)
  }, [])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  // Map sort option to API format
  const mapSortOption = (option: SortOption): 'popular' | 'newest' | 'price-low' | 'price-high' => {
    switch (option) {
      case 'bestseller':
        return 'popular' // Map bestseller to popular
      case 'popular':
      case 'newest':
      case 'price-low':
      case 'price-high':
        return option
      default:
        return 'popular'
    }
  }

  // Extract hashtagIds string for dependency comparison
  const hashtagIdsString = selectedHashtagIds.join(',')

  // Use store products hook
  const {
    products: storeProducts,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts
  } = useStoreProducts(store?.id, {
    pageSize,
    pageNumber,
    productType: selectedCategory === 'Product' ? 'Product' : selectedCategory === 'combo' ? 'Combo' : null,
    hashtagIds: selectedHashtagIds.length > 0 ? selectedHashtagIds : undefined,
    sortBy: mapSortOption(sortOption),
    name: searchQuery.trim() || undefined
  })

  // Fetch store hashtags when store is loaded
  useEffect(() => {
    const fetchStoreHashtags = async () => {
      if (!store?.id) {
        setStoreHashtags([])
        return
      }

      try {
        setHashtagsLoading(true)
        const response = await getHashtagsByStoreId(store.id, 0, 1) // Get all hashtags (pageSize=0 means all)
        setStoreHashtags(response.data || [])
      } catch (err) {
        console.error('Error fetching store hashtags:', err)
        setStoreHashtags([])
      } finally {
        setHashtagsLoading(false)
      }
    }

    fetchStoreHashtags()
  }, [store?.id])

  // Reset pagination when filters change
  useEffect(() => {
    setPageNumber(1)
  }, [selectedCategory, hashtagIdsString, sortOption, searchQuery])

  // Map StoreProductItemDTO to Product type for ProductCard
  const mapStoreProductToProduct = (item: StoreProductItemDTO): Product => {
    return {
      id: item.id,
      storeId: store?.id || '',
      storeName: store?.storeName || '',
      provinceId: store?.provinceId || 0,
      editedById: '',
      summaryPrice: item.price,
      price: item.price,
      name: item.name,
      description: item.description || '',
      productImages: item.imageUrl ? [item.imageUrl] : [],
      productVideo: '',
      material: '',
      saleCount: item.saleCount,
      rating: item.rating,
      reviewCount: item.reviewCount,
      isActive: !item.soldOut,
      typeProduct: item.type,
      status: 'Approved',
      staffNote: '',
      soldOut: item.soldOut,
      variantGroups: [],
      productCategories: {
        id: '',
        name: '',
        description: '',
        isActive: true,
        createdAt: '',
        updatedAt: ''
      },
      productCertificateDTOs: []
    }
  }

  // Memoize products để tránh re-render không cần thiết
  const products = useMemo(() => {
    return storeProducts.map(mapStoreProductToProduct)
  }, [storeProducts, store?.id, store?.storeName, store?.provinceId])

  // Memoize storeData để tránh re-render không cần thiết
  const storeData = useMemo(() => {
    return {
      id: store?.id || '',
      name: store?.storeName || '',
      description: `Cửa hàng tại , ${store?.ward || ''} , ${store?.district || ''}, ${store?.province || ''}`,
      address: store?.address || '',
      image:
        store?.logoUrl || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=100&h=100&fit=crop&crop=center',
      coverImage:
        store?.coverImageUrl ||
        'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&h=300&fit=crop&crop=center',
      story: 'Chúng tôi cam kết mang đến những sản phẩm chất lượng cao nhất cho khách hàng.',
      products: products.map((product) => ({
        ...product,
        // Hiển thị badge "Combo" nếu type là "Combo", không hiển thị gì nếu là "Product"
        badge: product.typeProduct === 'Combo' ? { text: 'Combo', color: 'bg-orange-500' } : undefined
      })),
      certificates:
        store?.vendorApplicationImageUrl &&
        Array.isArray(store.vendorApplicationImageUrl) &&
        store.vendorApplicationImageUrl.length > 0
          ? store.vendorApplicationImageUrl.map((imageUrl, index) => ({
              id: `cert-${index}`,
              name: `Giấy phép kinh doanh ${index + 1}`,
              image: imageUrl,
              issueDate: store.submittedDate ? formatDate(store.submittedDate) : undefined
            }))
          : []
    }
  }, [store, products])

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
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Sidebar Filter - Luôn hiển thị, không bị reload */}
            <div className='lg:w-64 flex-shrink-0'>
              <AsideFilter
                selectedCategory={selectedCategory}
                selectedHashtagIds={selectedHashtagIds}
                onCategoryChange={handleCategoryChange}
                onSuggestionChange={handleSuggestionChange}
                hashtags={storeHashtags}
                hashtagsLoading={hashtagsLoading}
              />
            </div>

            {/* Products Content - Chỉ phần này reload khi filter */}
            <div className='flex-1'>
              {/* Sort Bar - Luôn hiển thị, không bị reload */}
              <div className='mb-6'>
                <SortBar
                  selectedSort={sortOption}
                  onSortChange={handleSortChange}
                  onSearchChange={handleSearchChange}
                  searchValue={searchQuery}
                />
              </div>

              {/* Products Grid - Chỉ phần này thay đổi khi loading */}
              <ProductsGrid
                products={storeData.products}
                loading={productsLoading}
                error={productsError}
                onRetry={refetchProducts}
                selectedCategory={selectedCategory}
                selectedHashtagIds={selectedHashtagIds}
                searchQuery={searchQuery}
              />
            </div>
          </div>
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
