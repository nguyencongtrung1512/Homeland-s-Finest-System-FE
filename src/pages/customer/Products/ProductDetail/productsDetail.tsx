import React from 'react'
import ProductGallery from './productGallery/productGallery'
import { ProductTabs } from './ProductTab/productsTab'
import { ViewRating } from './Rating/viewRating'

function productsDetail() {
  return (
    <div>
      <ProductGallery />
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <ViewRating />
        <ProductTabs />
      </div>
    </div>
  )
}

export default productsDetail