import { createContext, useContext } from 'react'
import { useParams } from 'react-router-dom'
import ProductGallery from './productGallery/productGallery'
import { ProductTabs } from './ProductTab/productsTab'
import { ViewRating } from './Rating/viewRating'
import Brand from './brand/brand'
import Suggest from './suggested/suggest'
import Loading from '../../../../components/Loading/loading'
import EmptyState from '../../../../components/EmptyState/emptyState'
import { useProductDetail, type ProductDetailData } from '../../../../hooks/useProductDetail'
import { useAuth } from '../../../../contexts/auth.context'
import ChatSystem from '../../Chat/chatSystem'
import ChatBot from '../../../../components/ChatBot/chatbot'

// Context for sharing product data across components
interface ProductDetailContextType {
  product: ProductDetailData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

const ProductDetailContext = createContext<ProductDetailContextType | undefined>(undefined)

export const useProductDetailContext = () => {
  const context = useContext(ProductDetailContext)
  if (context === undefined) {
    // Fallback an toàn để tránh crash nếu component bị dùng sai ngữ cảnh.
    console.warn('useProductDetailContext used outside ProductDetailProvider – returning fallback context.')
    return {
      product: null,
      loading: false,
      error: 'Context unavailable',
      refetch: () => {}
    }
  }
  return context
}

function ProductsDetail() {
  const { isAuthenticated } = useAuth()
  const { id } = useParams<{ id: string }>()

  // Sử dụng custom hook
  const { product, loading, error, refetch } = useProductDetail(id)

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

  if (error || !product) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <EmptyState
          type='error'
          title='Không thể tải thông tin sản phẩm'
          description={error || 'Sản phẩm không tồn tại hoặc đã bị xóa'}
          actionLabel='Thử lại'
          onAction={handleRetry}
        />
      </div>
    )
  }

  const contextValue: ProductDetailContextType = {
    product,
    loading,
    error,
    refetch
  }

  return (
    <ProductDetailContext.Provider value={contextValue}>
      <div>
        <ProductGallery />
        <div className='max-w-7xl mx-auto px-6 py-8'>
          <Brand />
          <ProductTabs />
          <ViewRating />
          <Suggest />
        </div>
      </div>
      <div>{isAuthenticated ? <ChatSystem /> : <ChatBot />}</div>
    </ProductDetailContext.Provider>
  )
}

export default ProductsDetail
