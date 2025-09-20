import ProductGallery from './productGallery/productGallery'
import { ProductTabs } from './ProductTab/productsTab'
import { ViewRating } from './Rating/viewRating'
import Brand from './brand/brand'

function productsDetail() {
  return (
    <div>
      <ProductGallery />
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <Brand />
        <ProductTabs />
        <ViewRating />
      </div>
    </div>
  )
}

export default productsDetail
