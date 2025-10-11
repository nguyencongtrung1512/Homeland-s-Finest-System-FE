import { useParams, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Star, MapPin, Flag } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'

// Import components
import StorySection from './components/StorySection'

import MapComponent from '../../../components/Mapbox/mapBox'

// Import hooks and types
import { useStore } from '../../../hooks/useStore'
import Loading from '../../../components/Loading/loading'
import EmptyState from '../../../components/EmptyState/emptyState'
import ProductsSection from './components/ProductsSection'
import CertificatesSection from './components/CertificatesSection'
import ReportModal from './components/ReportModal'

const StorePage = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)

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

  // Transform API data to match component expectations
  const storeData = {
    id: store.id,
    name: store.storeName,
    description: `Cửa hàng tại , ${store.ward} , ${store.district}, ${store.province}`,
    address: store.address,
    rating: 4.8, // TODO: Calculate from actual reviews when available
    ratingCount: 0, // TODO: Get from actual reviews when available
    image:
      store.logoUrl || 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=100&h=100&fit=crop&crop=center',
    coverImage:
      store.coverImageUrl ||
      'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&h=300&fit=crop&crop=center',
    story:
      store.storeStories?.[0]?.title || 'Chúng tôi cam kết mang đến những sản phẩm chất lượng cao nhất cho khách hàng.',
    products:
      store.products?.map((product) => ({
        id: product.id,
        name: product.name,
        price: 'lấy từ variant', // TODO: Get from product variants when available
        image:
          product.productImages?.[0] ||
          'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
        rating: product.rating || 0,
        ratingCount: product.reviewCount || 0,
        badge: product.status === 'active' ? { text: 'Đang bán', color: 'bg-green-500' } : undefined
      })) || [],
    certificates: [] // TODO: Add certificates when available in API
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
                        <div className='flex items-center gap-1'>
                          <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                          <span className='font-medium'>{storeData.rating}</span>
                          <span>({storeData.ratingCount} đánh giá)</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              store.status === 'Approved'
                                ? 'bg-green-100 text-green-800'
                                : store.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {store.status === 'Approved'
                              ? 'Đã duyệt'
                              : store.status === 'Pending'
                                ? 'Đang chờ duyệt'
                                : store.status}
                          </span>
                        </div>
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
          <TabsTrigger value='certificates'>Giấy chứng nhận</TabsTrigger>
        </TabsList>

        {/* Câu Chuyện Tab */}
        <TabsContent value='story'>
          <StorySection storeName={storeData.name} story={storeData.story} />
        </TabsContent>

        {/* Sản Phẩm Tab */}
        <TabsContent value='products'>
          <ProductsSection storeId={storeId || ''} products={storeData.products} />
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
    </div>
  )
}

export default StorePage
