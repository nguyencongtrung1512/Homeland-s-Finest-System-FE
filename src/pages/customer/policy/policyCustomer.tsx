import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, FileText } from 'lucide-react'
import { getDocumentsCustomer, type DocumentType } from '../../../apis/document.api'
import Loading from '../../../components/Loading/loading'
import { toast } from '../../../utils/toast'
import { Link } from 'react-router-dom'
import path from '../../../constants/path'
import Footer from '../../../Layouts/CustomerLayout/Footer/Footer'

// Map type names to Vietnamese labels
const TYPE_LABELS: Record<string, string> = {
  Policy: 'Chính sách',
  Guide: 'Hướng dẫn',
  PaymentGuide: 'Hướng dẫn thanh toán',
  ShippingPolicy: 'Chính sách vận chuyển',
  Legal: 'Pháp lý'
}

// Get label for type or return the type itself
const getTypeLabel = (type: string): string => {
  return TYPE_LABELS[type] || type
}

function PolicyCustomer() {
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())

  // Fetch all documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const response = await getDocumentsCustomer({
          pageSize: 0,
          pageNumber: 1
        })

        // Filter only documents with type = "Seller" and isPublished = true
        const documentsArray: DocumentType[] = (response.data || []).filter(
          (doc: DocumentType) => doc.type === 'Seller' && doc.isPublished === true
        )

        setDocuments(documentsArray)

        // Auto select first document if available
        if (documentsArray.length > 0) {
          setSelectedDocument(documentsArray[0])
          // Auto expand the type of first document
          setExpandedTypes(new Set([documentsArray[0].type]))
        }
      } catch (error) {
        console.error('Error fetching documents:', error)
        toast.error('Có lỗi xảy ra khi tải tài liệu', {
          position: 'top-right',
          autoClose: 5000
        })
        setDocuments([])
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  // Group documents by type
  const documentsByType = useMemo(() => {
    const grouped: Record<string, DocumentType[]> = {}
    documents.forEach((doc) => {
      if (!grouped[doc.type]) {
        grouped[doc.type] = []
      }
      grouped[doc.type].push(doc)
    })
    return grouped
  }, [documents])

  // Get sorted type keys
  const typeKeys = useMemo(() => {
    return Object.keys(documentsByType).sort()
  }, [documentsByType])

  // Toggle expand/collapse for a type
  const toggleType = (type: string) => {
    setExpandedTypes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(type)) {
        newSet.delete(type)
      } else {
        newSet.add(type)
      }
      return newSet
    })
  }

  // Handle document selection
  const handleSelectDocument = (document: DocumentType) => {
    setSelectedDocument(document)
    // Auto expand the type if collapsed
    if (!expandedTypes.has(document.type)) {
      setExpandedTypes((prev) => new Set(prev).add(document.type))
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Loading size='lg' text='Đang tải tài liệu...' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='w-full fixed top-0 left-0 z-50 bg-[#ecf2ea] flex justify-center items-center border-b border-gray-500'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3 flex-nowrap'>
          {/* Logo + Tên */}
          <Link to={path.home} className='flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer'>
            <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
              <path
                d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
                fill='#F4A261'
              />
            </svg>
            <h3 className='text-xl font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h3>
          </Link>
          <span className='text-[#2D5016] text-sm'>| Cổng thông tin</span>

        </div>
      </div>

      <div className='pt-16 pb-8'>
        <div className='max-w-7xl mx-auto px-6'>
          <div className='flex min-h-[calc(100vh-4rem)]'>
            {/* Sidebar */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className='w-80 bg-white border-r border-gray-200 flex-shrink-0 rounded-tl-lg'
            >
              <div className='p-6'>
                <nav className='space-y-1'>
                  {typeKeys.map((type, typeIndex) => {
                    const isExpanded = expandedTypes.has(type)
                    const typeDocuments = documentsByType[type] || []
                    const typeLabel = getTypeLabel(type)

                    return (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 + typeIndex * 0.1 }}
                      >
                        {/* Type Header - Collapsible */}
                        <button
                          onClick={() => toggleType(type)}
                          className='w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors group'
                        >
                          <span className='font-semibold text-gray-900 text-sm'>{typeLabel}</span>
                          <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
                            <ChevronDown className='w-4 h-4 text-gray-500' />
                          </motion.div>
                        </button>

                        {/* Type Items */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className='overflow-hidden'
                            >
                              <div className='pl-4 space-y-1 mt-1'>
                                {typeDocuments.map((doc, docIndex) => {
                                  const isSelected = selectedDocument?.id === doc.id
                                  return (
                                    <motion.button
                                      key={doc.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2, delay: docIndex * 0.05 }}
                                      whileHover={{ x: 4 }}
                                      onClick={() => handleSelectDocument(doc)}
                                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-sm ${isSelected
                                        ? 'bg-green-50 text-green-600 font-medium border-l-4 border-green-600'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <FileText className='w-4 h-4 flex-shrink-0' />
                                        <span className='truncate'>{doc.title}</span>
                                      </div>
                                    </motion.button>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </nav>
              </div>
            </motion.div>

            {/* Main Content Area */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
              className='flex-1 bg-white rounded-tr-lg'
            >
              <div className='max-w-4xl mx-auto p-8'>
                <AnimatePresence mode='wait'>
                  {selectedDocument ? (
                    <motion.div
                      key={selectedDocument.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Document Header */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className='mb-6 pb-4 border-b border-gray-200'
                      >
                        <div className='grid grid-cols-3 gap-4 text-sm text-gray-600 mb-4'>
                          <div>
                            <span className='font-medium text-gray-700'>Loại:</span>{' '}
                            <span>{getTypeLabel(selectedDocument.type)}</span>
                          </div>
                          <div>
                            <span className='font-medium text-gray-700'>Phiên bản:</span>{' '}
                            <span>{selectedDocument.version}</span>
                          </div>
                        </div>
                      </motion.div>

                      {/* Document Title */}
                      <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className='text-4xl font-bold text-gray-900 mb-8 uppercase tracking-tight'
                      >
                        {selectedDocument.title}
                      </motion.h1>

                      {/* Document Content */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className='prose prose-lg max-w-none 
                          prose-headings:font-semibold prose-headings:text-gray-900 
                          prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-4
                          prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-green-700
                          prose-h3:text-xl prose-h3:mb-3 prose-h3:mt-6 prose-h3:text-gray-800
                          prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-4 prose-h4:text-gray-800
                          prose-h5:text-base prose-h5:mb-2 prose-h5:mt-3 prose-h5:font-semibold
                          prose-h6:text-sm prose-h6:mb-2 prose-h6:mt-3 prose-h6:font-semibold prose-h6:text-gray-700
                          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-justify
                          prose-strong:text-gray-900 prose-strong:font-semibold
                          prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:text-gray-700
                          prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:text-gray-700
                          prose-li:mb-2 prose-li:leading-relaxed
                          prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                          prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                          prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
                          prose-pre:bg-gray-900 prose-pre:text-gray-100'
                        dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className='flex flex-col items-center justify-center h-full min-h-[60vh] text-center'
                    >
                      <FileText className='w-16 h-16 text-gray-300 mb-4' />
                      <p className='text-gray-500 text-lg'>Vui lòng chọn một tài liệu để xem nội dung</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default PolicyCustomer
