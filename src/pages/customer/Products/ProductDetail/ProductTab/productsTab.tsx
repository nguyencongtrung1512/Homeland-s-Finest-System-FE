import React, { useState, useEffect } from 'react'
import { useProductDetailContext } from '../productsDetail'
import { productCertificateApi } from '../../../../../apis/productCertificate.api'
import { productStoryApi } from '../../../../../apis/productStory.api'
import type { ProductCertificateType } from '../../../../../types/productCertificateType'
import type { ProductStory } from '../../../../../types/productStoryType'
import Loading from '../../../../../components/Loading/loading'

interface TabContent {
  id: string
  label: string
  content: React.ReactNode
}

export const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('description')
  const { product } = useProductDetailContext()
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [story, setStory] = useState<ProductStory | null>(null)
  const [certificatesLoading, setCertificatesLoading] = useState(false)
  const [storyLoading, setStoryLoading] = useState(false)
  const [certificatesError, setCertificatesError] = useState<string | null>(null)
  const [storyError, setStoryError] = useState<string | null>(null)

  // Fetch certificates
  useEffect(() => {
    if (product?.id) {
      setCertificatesLoading(true)
      setCertificatesError(null)
      productCertificateApi
        .getByProductId(product.id)
        .then((response: any) => {
          console.log('response certificates', response.data)
          if (response.status === 200 && response.data) {
            console.log('response certificatesádfsdf', response.data)
            setCertificates(response.data)
          } else {
            setCertificates([])
          }
        })
        .catch((error: any) => {
          console.error('Error fetching certificates:', error)
          setCertificatesError('Không thể tải chứng chỉ sản phẩm')
          setCertificates([])
        })
        .finally(() => {
          setCertificatesLoading(false)
        })
    }
  }, [product?.id])

  // Fetch story
  useEffect(() => {
    if (product?.id) {
      setStoryLoading(true)
      setStoryError(null)
      productStoryApi
        .getByProductId(product.id)
        .then((response: any) => {
          if (response.status === 200 && response.data) {
            setStory(response.data)
          } else {
            setStory(null)
          }
        })
        .catch((error: any) => {
          console.error('Error fetching story:', error)
          setStoryError('Không thể tải câu chuyện sản phẩm')
          setStory(null)
        })
        .finally(() => {
          setStoryLoading(false)
        })
    }
  }, [product?.id])

  const tabs: TabContent[] = [
    {
      id: 'description',
      label: 'Mô tả sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          {product?.description ? (
            <div className='text-gray-700 text-base leading-6 whitespace-pre-wrap'>{product.description}</div>
          ) : (
            <p className='text-gray-500 text-base'>Chưa có mô tả cho sản phẩm này.</p>
          )}
        </div>
      )
    },
    {
      id: 'usage',
      label: 'Chứng chỉ sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          {certificatesLoading ? (
            <div className='flex justify-center py-8'>
              <Loading />
            </div>
          ) : certificatesError ? (
            <div className='text-center py-8'>
              <p className='text-red-500'>{certificatesError}</p>
            </div>
          ) : !certificates || certificates.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-base'>Chưa có chứng chỉ sản phẩm.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {certificates
                ?.filter((cert) => cert.status === 'Active')
                .map((certificate) => (
                  <div key={certificate.id} className='border border-gray-200 rounded-lg overflow-hidden'>
                    <img
                      src={certificate.imageUrl}
                      alt={`Chứng chỉ ${certificate.id}`}
                      className='w-full h-auto object-contain'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = 'https://via.placeholder.com/400x300?text=No+Image'
                      }}
                    />
                    {certificate.staffNotes && (
                      <div className='p-4 bg-gray-50'>
                        <p className='text-sm text-gray-600'>{certificate.staffNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: 'store story',
      label: 'Câu chuyện sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          {storyLoading ? (
            <div className='flex justify-center py-8'>
              <Loading />
            </div>
          ) : storyError ? (
            <div className='text-center py-8'>
              <p className='text-red-500'>{storyError}</p>
            </div>
          ) : !story ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 text-base'>Chưa có câu chuyện sản phẩm.</p>
            </div>
          ) : (
            <div>
              {story.thumbnailUrl && (
                <div className='mb-6'>
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title}
                    className='w-full h-auto rounded-lg object-cover'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                    }}
                  />
                </div>
              )}
              <h3 className='text-black text-xl font-bold mb-4'>{story.title}</h3>
              {story.contents && story.contents.length > 0 ? (
                <div className='space-y-4'>
                  {story.contents
                    .sort((a: any, b: any) => a.order - b.order)
                    .map((content: any) => {
                      if (content.contentType === 'text') {
                        return (
                          <p key={content.id} className='text-gray-700 text-base leading-6 whitespace-pre-wrap'>
                            {content.contentData}
                          </p>
                        )
                      } else if (content.contentType === 'image') {
                        return (
                          <div key={content.id} className='my-4'>
                            <img
                              src={content.contentData}
                              alt='Story content'
                              className='w-full h-auto rounded-lg object-cover'
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                              }}
                            />
                          </div>
                        )
                      } else if (content.contentType === 'video') {
                        return (
                          <div key={content.id} className='my-4'>
                            <video controls className='w-full rounded-lg'>
                              <source src={content.contentData} type='video/mp4' />
                              Trình duyệt của bạn không hỗ trợ video.
                            </video>
                          </div>
                        )
                      } else if (content.contentType === 'media') {
                        // Handle media type - can be video URL or JSON array of images
                        try {
                          // Try to parse as JSON array (for images)
                          const parsed = JSON.parse(content.contentData)
                          if (Array.isArray(parsed)) {
                            // It's an array of image URLs
                            return (
                              <div key={content.id} className='my-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {parsed.map((imageUrl: string, index: number) => (
                                  <img
                                    key={index}
                                    src={imageUrl}
                                    alt={`Story image ${index + 1}`}
                                    className='w-full h-auto rounded-lg object-cover'
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                                    }}
                                  />
                                ))}
                              </div>
                            )
                          }
                        } catch {
                          // Not JSON, check if it's a video URL
                          const contentData = content.contentData
                          if (
                            contentData &&
                            (contentData.includes('.mp4') ||
                              contentData.includes('.webm') ||
                              contentData.includes('.ogg') ||
                              contentData.includes('/videos/'))
                          ) {
                            // It's a video URL
                            return (
                              <div key={content.id} className='my-4'>
                                <video controls className='w-full rounded-lg'>
                                  <source src={contentData} type='video/mp4' />
                                  Trình duyệt của bạn không hỗ trợ video.
                                </video>
                              </div>
                            )
                          } else if (
                            contentData &&
                            (contentData.includes('.jpg') ||
                              contentData.includes('.jpeg') ||
                              contentData.includes('.png') ||
                              contentData.includes('/images/'))
                          ) {
                            // It's a single image URL
                            return (
                              <div key={content.id} className='my-4'>
                                <img
                                  src={contentData}
                                  alt='Story content'
                                  className='w-full h-auto rounded-lg object-cover'
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = 'https://via.placeholder.com/800x400?text=No+Image'
                                  }}
                                />
                              </div>
                            )
                          }
                        }
                      }
                      return null
                    })}
                </div>
              ) : (
                <p className='text-gray-500 text-base'>Chưa có nội dung câu chuyện.</p>
              )}
            </div>
          )}
        </div>
      )
    }
  ]

  return (
    <section className='max-w-6xl mx-auto px-6 py-8'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='border-b border-gray-200'>
          <nav className='flex'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-base font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className='p-6'>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
      </div>
    </section>
  )
}
