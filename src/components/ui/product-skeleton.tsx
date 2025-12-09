export function ProductSkeleton() {
  return (
    <div className='bg-white rounded-xl shadow-md p-2 flex flex-col animate-pulse'>
      {/* Image skeleton */}
      <div className='relative h-40 w-full rounded-lg overflow-hidden bg-gray-200' />

      {/* Content skeleton */}
      <div className='mt-3 space-y-2'>
        {/* Title skeleton */}
        <div className='h-5 bg-gray-200 rounded w-3/4' />
        {/* Material skeleton */}
        <div className='h-4 bg-gray-200 rounded w-1/2' />
        {/* Price skeleton */}
        <div className='h-6 bg-gray-200 rounded w-1/3 mt-2' />
      </div>
    </div>
  )
}

export function ProductsGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  )
}

