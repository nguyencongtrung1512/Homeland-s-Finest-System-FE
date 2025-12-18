import { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Plus, Edit, Eye, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu'
import { Switch } from '../../../components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import {
  getDocuments,
  createDocument,
  updateDocument,
  type DocumentType,
  type CreateDocumentData,
  type UpdateDocumentData
} from '../../../apis/document.api'
import { toast } from '../../../utils/toast'
import Pagination from '../../../components/Pagination/Pagination'
import Loading from '../../../components/Loading/loading'

// Remove old Term interface, using DocumentType from API

function TermsManagement() {
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null)
  const [documents, setDocuments] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [formData, setFormData] = useState<CreateDocumentData>({
    slug: '',
    title: '',
    content: '',
    version: '1.0',
    isPublished: false,
    type: 'Customer'
  })

  // Fetch documents from API với pagination
  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getDocuments({
        pageSize: pageSize,
        pageNumber: currentPage
      })

      if (response.data) {
        setDocuments(response.data)
        
        // Cập nhật pagination từ API response
        if (response.pagination) {
          const apiTotalItems = Number(response.pagination.totalItems) || 0
          const apiTotalPages = Number(response.pagination.totalPages) || Math.ceil(apiTotalItems / pageSize)
          
          // Đảm bảo totalPages là số nguyên dương
          const finalTotalPages = Math.max(1, Math.ceil(apiTotalPages))
          
          setTotalPages(finalTotalPages)
          setTotalItems(apiTotalItems)
        } else {
          // Fallback nếu không có pagination từ API
          setTotalPages(Math.ceil(response.data.length / pageSize))
          setTotalItems(response.data.length)
        }
      } else {
        setError('Không thể tải danh sách tài liệu')
        setDocuments([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi tải danh sách tài liệu'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
      setDocuments([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize])

  // Load data on component mount and when page/filters change
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchText, typeFilter, statusFilter])

  const getStatusConfig = (isPublished: boolean) => {
    return isPublished
      ? {
        text: 'Đã xuất bản',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      }
      : {
        text: 'Bản nháp',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      }
  }

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      Customer: 'Khách hàng',
      Seller: 'Người bán'
    }
    return typeMap[type] || type
  }

  // Helper function to safely search in text
  const safeSearch = (text: string | null | undefined, searchTerm: string): boolean => {
    if (!text || !searchTerm) return false
    return text.toLowerCase().includes(searchTerm.toLowerCase())
  }

  // Filter documents based on search text and other filters (Frontend filtering)
  // Lưu ý: Nếu muốn filter ở backend, cần thêm params vào API call
  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      // Search filter
      const matchesSearch =
        !searchText.trim() ||
        safeSearch(document.title, searchText) ||
        safeSearch(document.slug, searchText) ||
        safeSearch(document.content, searchText)

      // Type filter
      const matchesType = typeFilter === 'all' || document.type === typeFilter

      // Status filter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && document.isPublished) ||
        (statusFilter === 'draft' && !document.isPublished)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [documents, searchText, typeFilter, statusFilter])

  // Sử dụng filteredDocuments trực tiếp (không cần paginate ở frontend vì đã có từ API)
  const paginatedDocuments = filteredDocuments

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleAdd = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      version: '1.0',
      isPublished: false,
      type: 'Customer'
    })
    setShowAddModal(true)
  }

  const handleEdit = (document: DocumentType) => {
    setSelectedDocument(document)
    setFormData({
      slug: document.slug,
      title: document.title,
      content: document.content,
      version: document.version,
      isPublished: document.isPublished,
      type: document.type
    })
    setShowEditModal(true)
  }

  const handleView = (document: DocumentType) => {
    setSelectedDocument(document)
    setShowViewModal(true)
  }

  const handleInputChange = (field: keyof CreateDocumentData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    // Validation
    if (!formData.slug.trim()) {
      toast.error('Vui lòng nhập slug', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }
    if (!formData.type.trim()) {
      toast.error('Vui lòng chọn loại tài liệu', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    try {
      // Create document data matching backend DocumentCreateRequest (no effectiveDate)
      const documentData: CreateDocumentData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        version: formData.version.trim(),
        isPublished: formData.isPublished,
        type: formData.type.trim()
      }

      const response = await createDocument(documentData)

      if (response) {
        toast.success('Tạo tài liệu thành công!', {
          position: 'top-right',
          autoClose: 3000
        })
        setShowAddModal(false)
        await fetchDocuments()
      }
    } catch (err: unknown) {
      console.error('Create document error:', err)
      const error = err as { message?: string; response?: { data?: { message?: string; errors?: Record<string, string[]> } } }

      // Handle validation errors from API
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat()
        toast.error(errorMessages.join(', '), {
          position: 'top-right',
          autoClose: 5000
        })
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi tạo tài liệu'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      }
    }
  }

  const handleUpdate = async () => {
    if (!selectedDocument) return

    // Validation
    if (!formData.slug.trim()) {
      toast.error('Vui lòng nhập slug', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }
    if (!formData.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }
    if (!formData.content.trim()) {
      toast.error('Vui lòng nhập nội dung', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }
    if (!formData.type.trim()) {
      toast.error('Vui lòng chọn loại tài liệu', {
        position: 'top-right',
        autoClose: 3000
      })
      return
    }

    try {
      // Update document data matching backend DocumentUpdateRequest (only slug, title, content, isPublished)
      const documentData: UpdateDocumentData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        isPublished: formData.isPublished
      }

      const response = await updateDocument(selectedDocument.id, documentData)

      if (response) {
        toast.success('Cập nhật tài liệu thành công!', {
          position: 'top-right',
          autoClose: 3000
        })
        setShowEditModal(false)
        setSelectedDocument(null)
        await fetchDocuments()
      }
    } catch (err: unknown) {
      console.error('Update document error:', err)
      const error = err as { message?: string; response?: { data?: { message?: string; errors?: Record<string, string[]> } } }

      // Handle validation errors from API
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat()
        toast.error(errorMessages.join(', '), {
          position: 'top-right',
          autoClose: 5000
        })
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật tài liệu'
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000
        })
      }
    }
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setShowViewModal(false)
    setSelectedDocument(null)
    setFormData({
      slug: '',
      title: '',
      content: '',
      version: '1.0',
      isPublished: false,
      type: 'Customer'
    })
  }

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Điều khoản & Dịch vụ</h1>
          <p className='text-sm text-gray-600 mt-1'>Quản lý các điều khoản và chính sách dịch vụ</p>
        </div>
        <Button onClick={handleAdd} variant='blue'>
          <Plus className='w-4 h-4 mr-2' />
          Thêm điều khoản
        </Button>
      </div>

      {/* Search and Filter Section */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-end gap-4'>
            {/* Search Bar */}
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Tìm kiếm</label>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                <Input
                  placeholder='Tìm kiếm điều khoản...'
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className='pl-10 h-9'
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Loại tài liệu</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='h-10 w-full'>
                  <SelectValue placeholder='Tất cả loại' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả loại</SelectItem>
                  <SelectItem value='Customer'>Khách hàng</SelectItem>
                  <SelectItem value='Seller'>Người bán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='h-10 w-full'>
                  <SelectValue placeholder='Tất cả trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='published'>Đã xuất bản</SelectItem>
                  <SelectItem value='draft'>Bản nháp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Refresh Button */}
            <div>
              <Button
                onClick={fetchDocuments}
                disabled={loading}
                variant='blue'
                className='h-10 px-4 rounded-lg shadow-sm'
              >
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && <div className='bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>{error}</div>}

      {/* Documents List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách tài liệu</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          {loading && documents.length === 0 ? (
            <div className='py-12'>
              <Loading size='md' text='Đang tải dữ liệu...' />
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <p className='text-red-500'>{error}</p>
              <Button variant='outline' onClick={fetchDocuments} className='mt-4'>
                Thử lại
              </Button>
            </div>
          ) : paginatedDocuments.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-gray-500'>Không có dữ liệu</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='px-6 py-3'>Tiêu đề</TableHead>
                    <TableHead className='px-6 py-3'>Loại</TableHead>
                    <TableHead className='px-6 py-3'>Phiên bản</TableHead>
                    <TableHead className='px-6 py-3'>Trạng thái</TableHead>
                    <TableHead className='px-6 py-3'>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDocuments.map((document) => {
                    const statusConfig = getStatusConfig(document.isPublished)

                    return (
                      <TableRow key={document.id}>
                        <TableCell className='px-6 py-3'>
                          <div>
                            <p className='font-medium text-gray-900 text-sm'>{document.title}</p>
                            <p className='text-xs text-gray-500'>{document.slug}</p>
                          </div>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{getTypeLabel(document.type)}</span>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{document.version}</span>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                          >
                            {statusConfig.text}
                          </div>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='outline' size='sm' className='border-border hover:bg-accent'>
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => handleView(document)}>
                                <Eye className='mr-2 h-4 w-4' />
                                Xem chi tiết
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(document)}>
                                <Edit className='mr-2 h-4 w-4' />
                                Chỉnh sửa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {/* Pagination */}
              <div className='flex items-center justify-between px-6 pb-6 pt-4 border-t border-gray-200'>
                <div className='text-sm text-gray-600'>
                  Hiển thị {paginatedDocuments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} đến{' '}
                  {Math.min(currentPage * pageSize, totalItems)} trong {totalItems} kết quả
                </div>
                {totalPages > 1 ? (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                ) : (
                  <div className='text-xs text-gray-500'>
                    Trang {currentPage}/{totalPages}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Document Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Thêm tài liệu mới</DialogTitle>
            <DialogDescription>Tạo tài liệu và chính sách dịch vụ mới</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Slug Field */}
            <div className='space-y-2'>
              <Label htmlFor='slug'>Slug *</Label>
              <Input
                id='slug'
                placeholder='Nhập slug (ví dụ: terms-of-service)'
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
              />
            </div>

            {/* Title Field */}
            <div className='space-y-2'>
              <Label htmlFor='title'>Tiêu đề *</Label>
              <Input
                id='title'
                placeholder='Nhập tiêu đề tài liệu'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Type Field */}
            <div className='space-y-2'>
              <Label htmlFor='type'>Loại tài liệu *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger id='type'>
                  <SelectValue placeholder='Chọn loại tài liệu' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Customer'>Khách hàng</SelectItem>
                  <SelectItem value='Seller'>Người bán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Version Field */}
            <div className='space-y-2'>
              <Label htmlFor='version'>Phiên bản *</Label>
              <Input
                id='version'
                placeholder='Nhập phiên bản (ví dụ: 1.0)'
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
              />
            </div>

            {/* Content Field */}
            <div className='space-y-2'>
              <Label htmlFor='content'>Nội dung *</Label>

              <div>
                <ReactQuill
                  theme='snow'
                  value={formData.content}
                  onChange={(value: string) => handleInputChange('content', value)}
                  placeholder='Nhập nội dung tài liệu...'
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      [{ align: [] }],
                      ['link', 'blockquote', 'code-block'],
                      ['clean']
                    ]
                  }}
                  className='h-[400px] mb-16'
                  formats={[
                    'header',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'list',
                    'bullet',
                    'indent',
                    'link',
                    'blockquote',
                    'code-block',
                    'align'
                  ]}
                />
              </div>
            </div>

            {/* Status Field */}
            <div className='space-y-2 pt-12'>
              <Label htmlFor='isPublished'>Trạng thái</Label>
              <div className='flex items-center gap-3'>
                <Switch
                  id='isPublished'
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                />
                <span className='text-sm font-medium'>{formData.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleCancel}>
              Hủy
            </Button>
            <Button onClick={handleSave} variant='blue'>
              Tạo tài liệu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài liệu</DialogTitle>
            <DialogDescription>Cập nhật thông tin tài liệu</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Slug Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-slug'>Slug *</Label>
              <Input
                id='edit-slug'
                placeholder='Nhập slug (ví dụ: terms-of-service)'
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
              />
            </div>

            {/* Title Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-title'>Tiêu đề *</Label>
              <Input
                id='edit-title'
                placeholder='Nhập tiêu đề tài liệu'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Type Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-type'>Loại tài liệu *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger id='edit-type'>
                  <SelectValue placeholder='Chọn loại tài liệu' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Customer'>Khách hàng</SelectItem>
                  <SelectItem value='Seller'>Người bán</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Version Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-version'>Phiên bản *</Label>
              <Input
                id='edit-version'
                placeholder='Nhập phiên bản (ví dụ: 1.0)'
                value={formData.version}
                onChange={(e) => handleInputChange('version', e.target.value)}
              />
            </div>

            {/* Content Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-content'>Nội dung *</Label>
              <p className='text-xs text-gray-500 mb-2'>
                Sử dụng các heading levels (#, ##, ###, ####) để tạo cấu trúc rõ ràng cho tài liệu
              </p>
              <div>
                <ReactQuill
                  theme='snow'
                  value={formData.content}
                  onChange={(value: string) => handleInputChange('content', value)}
                  placeholder='Nhập nội dung tài liệu...'
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, 4, 5, 6, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      [{ indent: '-1' }, { indent: '+1' }],
                      [{ align: [] }],
                      ['link', 'blockquote', 'code-block'],
                      ['clean']
                    ]
                  }}
                  className='h-[400px] mb-16'
                  formats={[
                    'header',
                    'bold',
                    'italic',
                    'underline',
                    'strike',
                    'list',
                    'bullet',
                    'indent',
                    'link',
                    'blockquote',
                    'code-block',
                    'align'
                  ]}
                />
              </div>
            </div>

            {/* Status Field */}
            <div className='space-y-2 pt-12'>
              <Label htmlFor='edit-isPublished'>Trạng thái</Label>
              <div className='flex items-center gap-3'>
                <Switch
                  id='edit-isPublished'
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                />
                <span className='text-sm font-medium'>{formData.isPublished ? 'Đã xuất bản' : 'Bản nháp'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleCancel}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} variant='blue'>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className='sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0'>
          <div className='flex-1 overflow-y-auto'>
            <DialogHeader className='px-6 pt-6 pb-4 border-b border-gray-200'>
              <DialogTitle className='text-xl font-semibold text-gray-900'>Chi tiết tài liệu</DialogTitle>
              <DialogDescription className='text-sm text-gray-600 mt-1'>
                Thông tin chi tiết về tài liệu
              </DialogDescription>
            </DialogHeader>

            {selectedDocument && (
              <div className='space-y-6 p-6'>
                {/* Document Info */}
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-1 block'>Loại</Label>
                    <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>{getTypeLabel(selectedDocument.type)}</div>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-1 block'>Phiên bản</Label>
                    <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900'>
                      {selectedDocument.version}
                    </div>
                  </div>
                  <div>
                    <Label className='text-sm font-medium text-gray-700 mb-1 block'>Trạng thái</Label>
                    <div>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedDocument.isPublished ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}
                      >
                        {selectedDocument.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Content */}
                <div className='border-t border-gray-200 pt-6'>
                  <Label className='text-lg font-semibold text-gray-900 mb-4 block'>Nội dung</Label>
                  <div
                    className='prose prose-lg max-w-none 
                      prose-headings:font-semibold prose-headings:text-gray-900 
                      prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-6 prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3
                      prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6 prose-h2:text-green-700
                      prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-5 prose-h3:text-gray-800
                      prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-4 prose-h4:text-gray-800
                      prose-h5:text-base prose-h5:mb-2 prose-h5:mt-3 prose-h5:font-semibold
                      prose-h6:text-sm prose-h6:mb-2 prose-h6:mt-3 prose-h6:font-semibold prose-h6:text-gray-700
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:text-gray-700
                      prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:text-gray-700
                      prose-li:mb-1 prose-li:leading-relaxed
                      prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-600
                      prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                      prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline
                      prose-pre:bg-gray-900 prose-pre:text-gray-100
                      bg-white rounded-lg p-6 border border-gray-200'
                    dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className='px-6 py-4 border-t border-gray-200 bg-gray-50'>
            <Button variant='outline' onClick={handleCancel}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TermsManagement
