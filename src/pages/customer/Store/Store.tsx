import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Star, MapPin, Flag } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'

// Import components
import StorySection from './components/StorySection'
import ProductsSection from './components/ProductsSection'
import CertificatesSection from './components/CertificatesSection'
import ReportModal from './components/ReportModal'

// Import types
import type { Store } from './types'

const Store = () => {
  const { storeId } = useParams<{ storeId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

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

  // TODO: Replace with actual API calls
  // const { data: storeData, isLoading: storeLoading } = useQuery(['store', storeId], () => fetchStore(storeId))
  // const { data: productsData, isLoading: productsLoading } = useQuery(['store-products', storeId], () => fetchStoreProducts(storeId))
  // const { data: certificatesData, isLoading: certificatesLoading } = useQuery(['store-certificates', storeId], () => fetchStoreCertificates(storeId))

  // Mock data - Replace with actual API call
  const mockStore: Store = {
    id: '1',
    name: 'Nông sản sạch Việt Nam',
    description: 'Chuyên cung cấp các sản phẩm nông sản sạch, tươi ngon từ các vùng miền Việt Nam',
    address: 'Hà Nội, Việt Nam',
    rating: 4.8,
    ratingCount: 1250,
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=100&h=100&fit=crop&crop=center',
    coverImage: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=800&h=300&fit=crop&crop=center',
    story:
      'Chúng tôi là một cửa hàng chuyên cung cấp các sản phẩm nông sản sạch từ các vùng miền Việt Nam. Với hơn 10 năm kinh nghiệm trong ngành, chúng tôi cam kết mang đến cho khách hàng những sản phẩm tươi ngon, an toàn và chất lượng cao nhất.',
    certificates: [
      {
        name: 'Chứng nhận VietGAP',
        description: 'Chứng nhận thực hành nông nghiệp tốt Việt Nam',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=150&fit=crop'
      },
      {
        name: 'Chứng nhận HACCP',
        description: 'Hệ thống phân tích mối nguy và điểm kiểm soát tới hạn',
        image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=150&fit=crop'
      }
    ],
    products: [
      {
        id: '1',
        name: 'Gạo ST25 cao cấp',
        price: 25000,
        originalPrice: 30000,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
        rating: 4.9,
        ratingCount: 150,
        discount: 17,
        badge: { text: 'Best Seller', color: 'bg-red-500' }
      },
      {
        id: '2',
        name: 'Rau củ quả hữu cơ',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=300&h=200&fit=crop',
        rating: 4.7,
        ratingCount: 89,
        badge: { text: 'Organic', color: 'bg-green-500' }
      },
      {
        id: '3',
        name: 'Trái cây tươi ngon',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&h=200&fit=crop',
        rating: 4.8,
        ratingCount: 234
      }
    ]
  }

  const store = mockStore

  if (!store) {
    return (
      <div className='max-w-7xl mx-auto px-6 py-8 text-center'>
        <h2 className='text-2xl font-bold text-gray-900 mb-4'>Không tìm thấy cửa hàng</h2>
        <Button onClick={() => navigate('/products')}>Quay lại trang sản phẩm</Button>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto px-6 py-8'>
      {/* Store Header */}
      <div className='bg-white rounded-lg shadow-sm overflow-hidden mb-8'>
        {/* Cover Image */}
        <div className='h-48 bg-gradient-to-r from-green-400 to-green-600 relative'>
          <img src={store.coverImage} alt='' className='w-full h-full object-cover opacity-80' />
        </div>

        {/* Store Info */}
        <div className='p-6'>
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* Store Avatar & Basic Info */}
            <div className='flex-shrink-0'>
              <img
                src={store.image}
                alt={store.name}
                className='w-24 h-24 rounded-lg border-4 border-white shadow-lg'
              />
            </div>

            <div className='flex-1'>
              <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
                <div className='flex-1'>
                  <div className='flex items-start justify-between'>
                    <div>
                      <h1 className='text-2xl font-bold text-gray-900 mb-2'>{store.name}</h1>
                      <p className='text-gray-600 mb-3'>{store.description}</p>

                      <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                        <div className='flex items-center gap-1'>
                          <MapPin className='w-4 h-4' />
                          <span>{store.address}</span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Star className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                          <span className='font-medium'>{store.rating}</span>
                          <span>({store.ratingCount} đánh giá)</span>
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
          <StorySection storeName={store.name} story={store.story} />
        </TabsContent>

        {/* Sản Phẩm Tab */}
        <TabsContent value='products'>
          <ProductsSection storeId={storeId || ''} products={store.products} />
        </TabsContent>

        {/* Giấy chứng nhận Tab */}
        <TabsContent value='certificates'>
          <CertificatesSection storeId={storeId || ''} certificates={store.certificates} />
        </TabsContent>
      </Tabs>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        storeName={store.name}
        storeId={storeId || ''}
      />
    </div>
  )
}

export default Store
