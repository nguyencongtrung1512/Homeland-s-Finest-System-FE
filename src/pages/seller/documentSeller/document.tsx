import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { RefreshCw, Search, FileText, Eye } from 'lucide-react'
import { getDocumentsSeller, type DocumentType } from '../../../apis/document.api'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'

function DocumentSeller() {
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [searchTerm, setSearchTerm] = useState('')
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getDocumentsSeller({
        pageSize: 0, // Get all for client-side filtering
        pageNumber: 1
      })

      if (response.data) {
        // Filter only Seller documents that are published
        const sellerDocuments = response.data.filter(
          (doc: DocumentType) => doc.type === 'Seller' && doc.isPublished === true
        )
        setDocuments(sellerDocuments)
      } else {
        setError('Không thể tải danh sách tài liệu')
      }
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Filtered documents (only search, already filtered by type and published status)
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = !searchTerm.trim() || doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })
  }, [documents, searchTerm])

  const paginatedDocuments = useMemo(() => {
    return filteredDocuments.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredDocuments, currentPage, pageSize])

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize))

  // Handle view
  const handleViewClick = (document: DocumentType) => {
    setSelectedDocument(document)
    setShowViewModal(true)
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-blue-700 flex items-center gap-2'>
            <FileText className='w-8 h-8' />
            Tài liệu và chính sách
          </h1>
          <p className='text-gray-600 mt-2'>Xem các tài liệu và chính sách dành cho người bán</p>
        </div>
      </div>

      {/* Filters */}
      <Card className='shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex flex-col md:flex-row gap-4 md:gap-6 items-end'>
            {/* Search Input */}
            <div className='space-y-2 flex-1 w-full md:w-auto'>
              <Label htmlFor='search' className='text-sm font-semibold text-gray-700'>
                Tìm kiếm
              </Label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10' />
                <Input
                  id='search'
                  placeholder='Tìm kiếm theo tiêu đề...'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className='pl-10 h-9 border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full'
                />
              </div>
            </div>

            {/* Refresh Button */}
            <div className='flex items-end w-full md:w-auto'>
              <Button
                variant='outline'
                onClick={fetchDocuments}
                disabled={loading}
                className='w-full md:w-auto h-10 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors'
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-blue-700 py-2'>Danh sách tài liệu ({filteredDocuments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && documents.length === 0 ? (
            <Loading size='md' text='Đang tải dữ liệu...' />
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-500'>{error}</p>
              <Button variant='outline' onClick={fetchDocuments} className='mt-4'>
                Thử lại
              </Button>
            </div>
          ) : paginatedDocuments.length === 0 ? (
            <div className='text-center py-12'>
              <FileText className='w-12 h-12 mx-auto text-gray-400' />
              <p className='text-gray-500 mt-4'>Chưa có tài liệu nào</p>
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Tiêu đề</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Phiên bản</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Ngày cập nhật</th>
                      <th className='text-left py-3 px-4 font-medium text-gray-700'>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDocuments.map((doc) => (
                      <tr key={doc.id} className='border-b hover:bg-gray-50'>
                        <td className='py-3 px-4'>
                          <div className='font-medium text-gray-900'>{doc.title}</div>
                        </td>
                        <td className='py-3 px-4 text-gray-600'>{doc.version || 'N/A'}</td>
                        <td className='py-3 px-4 text-gray-600'>
                          {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </td>
                        <td className='py-3 px-4'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleViewClick(doc)}
                            className='text-blue-600 hover:text-blue-700'
                          >
                            <Eye className='w-4 h-4 mr-2' />
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className='mt-4'>
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            <DialogDescription>
              <div className='flex gap-4 mt-2'>
                <span>
                  <strong>Phiên bản:</strong> {selectedDocument?.version || 'N/A'}
                </span>
                <span>
                  <strong>Ngày cập nhật:</strong>{' '}
                  {selectedDocument?.updatedAt
                    ? new Date(selectedDocument.updatedAt).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div
            className='prose prose-lg max-w-none mt-4 
              prose-headings:font-semibold prose-headings:text-gray-900 
              prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
              prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-green-700
              prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-5 prose-h3:text-gray-800
              prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-4 prose-h4:text-gray-800
              prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:text-gray-700
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:text-gray-700
              prose-li:mb-1 prose-li:leading-relaxed
              prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
              prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
              prose-pre:bg-gray-900 prose-pre:text-gray-100'
            dangerouslySetInnerHTML={{ __html: selectedDocument?.content || '' }}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowViewModal(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DocumentSeller
