import { useState, useEffect, useMemo } from 'react'
import { Hash } from 'lucide-react'
import ProductImageCarousel from '../../../../components/ui/product-caroseu'
import { Badge } from '../../../../components/ui/badge'
import type { Product, VariantGroup, VariantOption } from '../../../../types/productType'
import { getHashtagById, type HashtagItem } from '../../../../apis/hashtag.api'

interface ProductLivePreviewProps {
  product: Product | null
}

// Selection state type: { groupAttributeType: optionId }
type VariantSelection = Record<string, string>

function ProductLivePreview({ product }: ProductLivePreviewProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<VariantSelection>({})
  const [hashtags, setHashtags] = useState<HashtagItem[]>([])
  const [loadingHashtags, setLoadingHashtags] = useState(false)

  // Helper function to extract Cloudflare Stream video ID from URL
  const extractVideoId = (url: string): string | undefined => {
    try {
      const match = url.match(/cloudflarestream\.com\/([a-f0-9]+)/i)
      return match ? match[1] : undefined
    } catch {
      return undefined
    }
  }

  // Process product video data to get video sources and ID
  const processProductVideo = (productData: Product) => {
    let video = ''
    let videoId: string | undefined = undefined
    let videoSources: { hls?: string; dash?: string; preview?: string; fallback?: string } | undefined = undefined

    // Priority: videoPlayBackUrl > videoPreviewUrl > videoFallBackUrl > productVideo
    if (productData.videoPlayBackUrl) {
      const playbackVideoId = extractVideoId(productData.videoPlayBackUrl)
      videoId = playbackVideoId

      const playbackUrls = productData.videoPlayBackUrl.split(',').map((url) => url.trim())
      const hlsUrl = playbackUrls.find((url) => url.includes('.m3u8'))
      const dashUrl = playbackUrls.find((url) => url.includes('.mpd'))

      videoSources = {}
      if (hlsUrl) videoSources.hls = hlsUrl
      if (dashUrl) videoSources.dash = dashUrl
      if (productData.videoPreviewUrl?.trim()) {
        videoSources.preview = productData.videoPreviewUrl.trim()
      }
      if (productData.videoFallBackUrl?.trim()) {
        videoSources.fallback = productData.videoFallBackUrl.trim()
      }

      video =
        productData.videoPreviewUrl?.trim() ||
        hlsUrl ||
        dashUrl ||
        productData.videoFallBackUrl?.trim() ||
        playbackUrls[0] ||
        ''
    } else if (productData.videoPreviewUrl) {
      video = productData.videoPreviewUrl.trim()
      const previewVideoId = extractVideoId(video)
      videoId = previewVideoId
      videoSources = {
        preview: productData.videoPreviewUrl.trim(),
        fallback: productData.videoFallBackUrl?.trim() || undefined
      }
    } else if (productData.videoFallBackUrl) {
      video = productData.videoFallBackUrl.trim()
      const fallbackVideoId = extractVideoId(video)
      videoId = fallbackVideoId
      videoSources = {
        fallback: productData.videoFallBackUrl.trim()
      }
    } else if (productData.productVideo) {
      video = productData.productVideo
      const legacyVideoId = extractVideoId(video)
      videoId = legacyVideoId
    }

    return { video, videoId, videoSources }
  }

  // Collect all images from product and all variants (recursive)
  const allImages = useMemo(() => {
    if (!product) return []

    const imageSet = new Set<string>()

    // Add product images
    if (product.productImages && product.productImages.length > 0) {
      product.productImages.forEach((img) => {
        if (img) imageSet.add(img)
      })
    }

    // Helper function to collect images from variant options recursively
    const collectVariantImages = (options: VariantOption[]) => {
      options.forEach((option) => {
        if (option.productImages && option.productImages.length > 0) {
          option.productImages.forEach((img) => {
            if (img) imageSet.add(img)
          })
        }

        // Recursively collect from child variant groups
        if (option.childVariantGroups && option.childVariantGroups.length > 0) {
          option.childVariantGroups.forEach((childGroup) => {
            collectVariantImages(childGroup.options)
          })
        }
      })
    }

    // Collect from all variant groups
    if (product.variantGroups && product.variantGroups.length > 0) {
      product.variantGroups.forEach((group) => {
        collectVariantImages(group.options)
      })
    }

    return Array.from(imageSet)
  }, [product])

  // Get deepest selected variant
  const getCurrentVariant = (): VariantOption | null => {
    if (!product?.variantGroups || product.variantGroups.length === 0) {
      return null
    }

    let currentOption: VariantOption | null = null

    // Level 1: Find selected option in main groups
    for (const group of product.variantGroups) {
      const selectedId = selectedVariants[group.attributeType]
      if (selectedId) {
        currentOption = group.options.find((opt) => opt.id === selectedId) || null
        if (currentOption) break
      }
    }

    if (!currentOption) return null

    // Level 2: If has child groups, find selected child
    if (currentOption.childVariantGroups && currentOption.childVariantGroups.length > 0) {
      for (const childGroup of currentOption.childVariantGroups) {
        const selectedChildId = selectedVariants[childGroup.attributeType]
        if (selectedChildId) {
          const childOption = childGroup.options.find((opt) => opt.id === selectedChildId)
          if (childOption) {
            return childOption // Return deepest level
          }
        }
      }
    }

    return currentOption
  }

  const currentVariant = getCurrentVariant()
  const currentPrice = currentVariant?.finalPrice || 0
  const currentStock = currentVariant?.quantity || 0

  // Get video data
  const videoData = useMemo(() => {
    if (!product) return null

    const { video, videoId, videoSources } = processProductVideo(product)
    if (!video) return null

    return {
      url: video,
      videoId,
      videoSources,
      thumbnail: product.productImages?.[0] || undefined
    }
    // processProductVideo is a pure function that doesn't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product])

  // Initialize variant selection
  useEffect(() => {
    if (product?.variantGroups && product.variantGroups.length > 0) {
      const initialSelection: VariantSelection = {}

      // Select first option in level 1
      const firstGroup = product.variantGroups[0]
      if (firstGroup.options.length > 0) {
        const firstOption = firstGroup.options[0]
        initialSelection[firstGroup.attributeType] = firstOption.id

        // If first option has child groups, select first child too
        if (firstOption.childVariantGroups && firstOption.childVariantGroups.length > 0) {
          const firstChildGroup = firstOption.childVariantGroups[0]
          if (firstChildGroup.options.length > 0) {
            initialSelection[firstChildGroup.attributeType] = firstChildGroup.options[0].id
          }
        }
      }

      setSelectedVariants(initialSelection)
    }
  }, [product])

  // Ensure selectedImage is always valid
  useEffect(() => {
    const hasVideo = videoData !== null
    const totalMediaCount = allImages.length + (hasVideo ? 1 : 0)

    if (totalMediaCount > 0 && selectedImage >= totalMediaCount) {
      setSelectedImage(0)
    } else if (totalMediaCount === 0) {
      setSelectedImage(0)
    }
  }, [allImages.length, selectedImage, videoData])

  // Auto-switch to first image of selected variant when variant changes
  useEffect(() => {
    const hasVideo = videoData !== null
    const totalMediaCount = allImages.length + (hasVideo ? 1 : 0)

    if (totalMediaCount === 0) {
      return
    }

    // When variant changes, always try to switch to variant's first image
    if (currentVariant?.productImages && currentVariant.productImages.length > 0) {
      const firstVariantImage = currentVariant.productImages[0]
      const imageIndex = allImages.findIndex((img) => img === firstVariantImage)
      if (imageIndex !== -1) {
        // Adjust index: if video exists, images start at index 1
        setSelectedImage(hasVideo ? imageIndex + 1 : imageIndex)
        return
      }
    }

    // Fallback: if variant has no images or image not found, ensure valid index
    if (selectedImage >= totalMediaCount) {
      setSelectedImage(hasVideo ? 1 : 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVariant?.id, videoData])

  // Fetch hashtags if product has hashtagIds
  useEffect(() => {
    const fetchHashtags = async () => {
      const productWithHashtags = product as Product & { hashtagIds?: string[] }
      if (!productWithHashtags?.hashtagIds || productWithHashtags.hashtagIds.length === 0) {
        setHashtags([])
        return
      }

      try {
        setLoadingHashtags(true)
        const hashtagPromises = productWithHashtags.hashtagIds.map((hashtagId) => getHashtagById(hashtagId))
        const responses = await Promise.all(hashtagPromises)

        const fetchedHashtags: HashtagItem[] = []
        responses.forEach((response) => {
          if (response.status === 200 && response.data) {
            fetchedHashtags.push(response.data)
          }
        })

        setHashtags(fetchedHashtags)
      } catch (error) {
        console.error('Error fetching hashtags:', error)
        setHashtags([])
      } finally {
        setLoadingHashtags(false)
      }
    }

    if (product) {
      fetchHashtags()
    }
  }, [product])

  // Handle variant selection (any level)
  const handleVariantSelect = (attributeType: string, optionId: string, parentOption?: VariantOption) => {
    const newSelection = { ...selectedVariants }
    newSelection[attributeType] = optionId

    // If selecting parent, reset child selections
    if (parentOption?.childVariantGroups) {
      parentOption.childVariantGroups.forEach((childGroup) => {
        delete newSelection[childGroup.attributeType]
      })

      // Auto-select first child if exists
      const selectedOption = parentOption.childVariantGroups[0]?.options.find((opt) => opt.id === optionId)
      if (selectedOption && selectedOption.childVariantGroups && selectedOption.childVariantGroups.length > 0) {
        const firstChildGroup = selectedOption.childVariantGroups[0]
        if (firstChildGroup.options.length > 0) {
          newSelection[firstChildGroup.attributeType] = firstChildGroup.options[0].id
        }
      }
    }

    setSelectedVariants(newSelection)
  }

  // Get selected parent option to show child groups
  const getSelectedParentOption = (group: VariantGroup): VariantOption | null => {
    const selectedId = selectedVariants[group.attributeType]
    if (!selectedId) return null
    return group.options.find((opt) => opt.id === selectedId) || null
  }

  if (!product) {
    return (
      <div className='flex items-center justify-center py-12 text-gray-500'>
        <p>Không có dữ liệu sản phẩm để preview</p>
      </div>
    )
  }

  const defaultImageUrl = 'https://i.pinimg.com/736x/91/7a/51/917a51df0d444def3cade8d626305a67.jpg'

  return (
    <div id='product-live-preview' className='bg-white'>
      <div className='max-w-7xl mx-auto px-6 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 auto-rows-min'>
          {/* Media Gallery - Product Images and Video */}
          <div className='space-y-3'>
            {/* Product Images and Video Carousel */}
            {allImages.length > 0 || videoData ? (
              <ProductImageCarousel
                images={allImages}
                productName={product.name}
                selectedIndex={selectedImage}
                onImageSelect={(index) => {
                  setSelectedImage(index)
                }}
                defaultImage={defaultImageUrl}
                video={videoData}
              />
            ) : (
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center'>
                <img src={defaultImageUrl} alt={product.name} className='w-full h-full object-cover' />
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className='space-y-5'>
            {/* Product Title and Rating */}
            <div>
              <h1 className='text-2xl font-normal text-gray-900 mb-3'>{product.name}</h1>

              <div className='flex items-center gap-4 mb-3'>
                <div className='flex items-center gap-1'>
                  <span className='text-green-500 text-lg font-medium border-b border-green-500'>
                    {(product.rating ?? 0).toFixed(1)}
                  </span>
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(product.rating ?? 0) ? 'text-green-500' : 'text-gray-300'}`}
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                    </svg>
                  ))}
                </div>

                <span className='text-gray-400'>|</span>

                <div className='flex items-center gap-1'>
                  <span className='text-gray-600 border-b border-gray-600'>{product.reviewCount || 0}</span>
                  <span className='text-gray-500 text-sm'>Đánh Giá</span>
                </div>

                <span className='text-gray-400'>|</span>

                <div className='flex items-center gap-1'>
                  <span className='text-gray-900 font-medium'>{product.saleCount || 0}</span>
                  <span className='text-gray-500 text-sm'>Đã Bán</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className='bg-gray-50 px-5 py-4 rounded'>
              <div className='flex items-center gap-4'>
                {currentPrice === 0 && product.summaryPrice ? (
                  <div className='text-3xl font-medium text-green-600'>{product.summaryPrice}</div>
                ) : (
                  <>
                    {currentVariant?.basePrice && currentVariant.basePrice > currentPrice && (
                      <div className='text-gray-400 line-through text-base'>
                        {currentVariant.basePrice.toLocaleString('vi-VN')}đ
                      </div>
                    )}
                    <div className='text-3xl font-medium text-green-600'>{currentPrice.toLocaleString('vi-VN')}đ</div>
                    {currentVariant?.basePrice && currentVariant.basePrice > currentPrice && (
                      <div className='bg-green-600 text-white px-2 py-1 rounded text-xs font-medium'>
                        -{Math.round(((currentVariant.basePrice - currentPrice) / currentVariant.basePrice) * 100)}%
                        GIẢM
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Hashtags */}
            {hashtags.length > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Hash size={16} className='text-green-600 flex-shrink-0' />
                  <span className='text-sm text-gray-600 font-medium'>Thẻ bắt đầu bằng #</span>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {loadingHashtags ? (
                    <div className='flex items-center gap-2 text-sm text-gray-500'>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-green-600'></div>
                      <span>Đang tải hashtags...</span>
                    </div>
                  ) : (
                    hashtags.map((hashtag) => (
                      <Badge
                        key={hashtag.id}
                        variant='outline'
                        className='bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 hover:bg-green-100 text-xs'
                      >
                        <Hash size={12} className='mr-1' />
                        {hashtag.name}
                        {hashtag.usageCount !== undefined && (
                          <span className='ml-1 text-gray-500'>
                            (
                            {hashtag.usageCount >= 1000
                              ? `${(hashtag.usageCount / 1000).toFixed(1)}K`
                              : hashtag.usageCount}
                            )
                          </span>
                        )}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Variant Groups (Level 1) */}
            {product.variantGroups && product.variantGroups.length > 0 && (
              <div className='space-y-5'>
                {product.variantGroups.map((group, groupIndex) => (
                  <div key={groupIndex}>
                    {/* Group Label */}
                    <div className='flex items-center gap-5 mb-3'>
                      <span className='text-gray-600 w-[120px] flex-shrink-0'>{group.attributeType}</span>
                      <div className='flex flex-wrap gap-2'>
                        {group.options.map((option) => {
                          const isSelected = selectedVariants[group.attributeType] === option.id
                          // Variant cha: cho phép chọn kể cả khi chưa có quantity; chỉ khóa khi isActive=false
                          const isDisabled = option.isActive === false
                          const variantImage =
                            option.productImages && option.productImages.length > 0 ? option.productImages[0] : null

                          return (
                            <button
                              key={option.id}
                              onClick={() => handleVariantSelect(group.attributeType, option.id, option)}
                              disabled={isDisabled}
                              className={`flex items-center gap-2 px-3 py-2 border rounded text-sm transition-all ${isSelected
                                ? 'border-green-500 text-green-600 bg-green-50'
                                : 'border-gray-300 text-gray-700 hover:border-green-300'
                                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''} relative`}
                            >
                              {variantImage && (
                                <img
                                  src={variantImage}
                                  alt={option.name}
                                  className='w-8 h-8 object-cover rounded border border-gray-200'
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              )}
                              <span>{option.attributeName || option.name}</span>
                              {isSelected && (
                                <svg
                                  className='absolute bottom-0 right-0 w-4 h-4 text-green-600'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path d='M0 20 L20 20 L20 0 Z' />
                                  <path
                                    fill='white'
                                    d='M14.5 6.5 L8.5 12.5 L5.5 9.5'
                                    stroke='white'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                  />
                                </svg>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Child Variant Groups (Level 2) */}
                    {(() => {
                      const selectedParent = getSelectedParentOption(group)
                      if (selectedParent?.childVariantGroups && selectedParent.childVariantGroups.length > 0) {
                        return selectedParent.childVariantGroups.map((childGroup, childIndex) => (
                          <div key={childIndex} className='mt-10 mb-10'>
                            <div className='flex items-center gap-5 mb-3'>
                              <span className='text-gray-600 w-[120px] flex-shrink-0'>{childGroup.attributeType}</span>
                              <div className='flex flex-wrap gap-2'>
                                {childGroup.options.map((childOption) => {
                                  const isChildSelected = selectedVariants[childGroup.attributeType] === childOption.id
                                  const isChildDisabled = !childOption.isActive || (childOption.quantity || 0) === 0
                                  const childVariantImage =
                                    childOption.productImages && childOption.productImages.length > 0
                                      ? childOption.productImages[0]
                                      : null

                                  return (
                                    <button
                                      key={childOption.id}
                                      onClick={() => handleVariantSelect(childGroup.attributeType, childOption.id)}
                                      disabled={isChildDisabled}
                                      className={`flex items-center gap-2 px-3 py-2 border rounded text-sm transition-all ${isChildSelected
                                        ? 'border-green-500 text-green-600 bg-green-50'
                                        : 'border-gray-300 text-gray-700 hover:border-green-300'
                                        } ${isChildDisabled ? 'opacity-40 cursor-not-allowed' : ''} relative`}
                                    >
                                      {childVariantImage && (
                                        <img
                                          src={childVariantImage}
                                          alt={childOption.name}
                                          className='w-8 h-8 object-cover rounded border border-gray-200'
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                          }}
                                        />
                                      )}
                                      <span>{childOption.attributeName || childOption.name}</span>
                                      {isChildSelected && (
                                        <svg
                                          className='absolute bottom-0 right-0 w-4 h-4 text-green-600'
                                          fill='currentColor'
                                          viewBox='0 0 20 20'
                                        >
                                          <path d='M0 20 L20 20 L20 0 Z' />
                                          <path
                                            fill='white'
                                            d='M14.5 6.5 L8.5 12.5 L5.5 9.5'
                                            stroke='white'
                                            strokeWidth='1.5'
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                          />
                                        </svg>
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                      return null
                    })()}
                  </div>
                ))}
              </div>
            )}

            {/* Stock Info */}
            {currentStock > 0 && (
              <div className='text-sm text-gray-600'>
                <span className='font-medium'>Tồn kho:</span> <span>{currentStock} sản phẩm có sẵn</span>
              </div>
            )}

            {/* Product Description */}
            {product.description && (
              <div className='bg-gray-50 p-5 rounded mt-6'>
                <h3 className='text-base font-medium text-gray-900 mb-2'>Chi tiết sản phẩm</h3>
                <p className='text-gray-700 text-sm leading-relaxed whitespace-pre-wrap'>{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductLivePreview
