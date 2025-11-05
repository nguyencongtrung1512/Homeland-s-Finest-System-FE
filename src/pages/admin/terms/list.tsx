import { useState, useEffect } from 'react'
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
  type CreateDocumentData
} from '../../../apis/document.api'
import { toast } from '../../../utils/toast'

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
  const [formData, setFormData] = useState<CreateDocumentData>({
    slug: '',
    title: '',
    content: '',
    version: '1.0',
    isPublished: false,
    type: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  })

  // Fetch documents from API
  const fetchDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDocuments({
        pageSize: 100,
        pageNumber: 1,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        isPublished: statusFilter !== 'all' ? statusFilter === 'published' : undefined
      })
      // Ensure data is an array
      let documentsArray: DocumentType[] = []

      if (Array.isArray(data)) {
        documentsArray = data
      } else if (data && Array.isArray((data as any).data)) {
        documentsArray = (data as any).data
      } else if (data && (data as any).data && Array.isArray((data as any).data.data)) {
        documentsArray = (data as any).data.data
      }

      setDocuments(documentsArray)
    } catch (err: unknown) {
      const error = err as { message?: string }
      const errorMessage = error.message || 'Có lỗi xảy ra khi tải danh sách tài liệu'
      setError(errorMessage)
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000
      })
      // Set empty array on error
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount and when filters change (not search text)
  useEffect(() => {
    fetchDocuments()
  }, [typeFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Helper function to safely search in text
  const safeSearch = (text: string | null | undefined, searchTerm: string): boolean => {
    if (!text || !searchTerm) return false
    return text.toLowerCase().includes(searchTerm.toLowerCase())
  }

  // Filter documents based on search text and other filters
  const filteredDocuments = Array.isArray(documents)
    ? documents.filter((document) => {
      // Search filter with safe null checks
      const matchesSearch =
        !searchText.trim() ||
        safeSearch(document.title, searchText) ||
        safeSearch(document.slug, searchText) ||
        safeSearch(document.content, searchText)

      return matchesSearch
    })
    : []

  const handleAdd = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      version: '1.0',
      isPublished: false,
      type: '',
      effectiveDate: new Date().toISOString().split('T')[0]
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
      type: document.type,
      effectiveDate: document.effectiveDate
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
      // Ensure all required fields are present and not empty
      const documentData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        version: formData.version.trim(),
        isPublished: formData.isPublished,
        type: formData.type.trim(),
        effectiveDate: formData.effectiveDate
      }

      console.log('Sending data:', documentData) // Debug log
      console.log('Data validation:', {
        slug: !!documentData.slug,
        title: !!documentData.title,
        content: !!documentData.content,
        type: !!documentData.type
      })

      await createDocument(documentData)
      toast.success('Tạo tài liệu thành công!', {
        position: 'top-right',
        autoClose: 3000
      })
      setShowAddModal(false)
      await fetchDocuments()
    } catch (err: unknown) {
      console.error('Create document error:', err) // Debug log
      const error = err as { message?: string; response?: { data?: { errors?: Record<string, string[]> } } }
      // Handle validation errors from API
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat()
        toast.error(errorMessages.join(', '), {
          position: 'top-right',
          autoClose: 5000
        })
      } else {
        const errorMessage = error.message || 'Có lỗi xảy ra khi tạo tài liệu'
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
      // Ensure all required fields are present and not empty
      const documentData = {
        slug: formData.slug.trim(),
        title: formData.title.trim(),
        content: formData.content.trim(),
        version: formData.version.trim(),
        isPublished: formData.isPublished,
        type: formData.type.trim(),
        effectiveDate: formData.effectiveDate
      }

      console.log('Updating document with data:', documentData) // Debug log
      console.log('Data validation:', {
        slug: !!documentData.slug,
        title: !!documentData.title,
        content: !!documentData.content,
        type: !!documentData.type
      })

      await updateDocument(selectedDocument.id, documentData)
      toast.success('Cập nhật tài liệu thành công!', {
        position: 'top-right',
        autoClose: 3000
      })
      setShowEditModal(false)
      setSelectedDocument(null)
      await fetchDocuments()
    } catch (err: unknown) {
      console.error('Update document error:', err) // Debug log
      const error = err as { message?: string; response?: { data?: { errors?: Record<string, string[]> } } }
      // Handle validation errors from API
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat()
        toast.error(errorMessages.join(', '), {
          position: 'top-right',
          autoClose: 5000
        })
      } else {
        const errorMessage = error.message || 'Có lỗi xảy ra khi cập nhật tài liệu'
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
      type: '',
      effectiveDate: new Date().toISOString().split('T')[0]
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
        <Button onClick={handleAdd} className='bg-blue-600 hover:bg-blue-700 text-white'>
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
                  className='pl-10 h-10'
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Loại tài liệu</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Tất cả loại' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả loại</SelectItem>
                  <SelectItem value='Điều khoản'>Điều khoản</SelectItem>
                  <SelectItem value='Chính sách'>Chính sách</SelectItem>
                  <SelectItem value='Bảo mật'>Bảo mật</SelectItem>
                  <SelectItem value='Giao hàng'>Giao hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='h-10'>
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
                className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg shadow-sm'
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
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách tài liệu</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>Hiển thị {filteredDocuments.length} tài liệu</p>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <p className='text-gray-600'>Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='px-6 py-3'>Tiêu đề</TableHead>
                  <TableHead className='px-6 py-3'>Loại</TableHead>
                  <TableHead className='px-6 py-3'>Phiên bản</TableHead>
                  <TableHead className='px-6 py-3'>Ngày hiệu lực</TableHead>
                  <TableHead className='px-6 py-3'>Trạng thái</TableHead>
                  <TableHead className='px-6 py-3'>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12 text-gray-500'>
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((document) => {
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
                          <span className='text-sm text-gray-700'>{document.type}</span>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>{document.version}</span>
                        </TableCell>
                        <TableCell className='px-6 py-3'>
                          <span className='text-sm text-gray-700'>
                            {new Date(document.effectiveDate).toLocaleDateString('vi-VN')}
                          </span>
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
                  })
                )}
              </TableBody>
            </Table>
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
              <Input
                id='type'
                placeholder='Nhập loại tài liệu (ví dụ: Điều khoản, Chính sách, Bảo mật, Giao hàng)'
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              />
              <p className='text-xs text-gray-500'>Ví dụ: Điều khoản, Chính sách, Bảo mật, Giao hàng…</p>
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

            {/* Effective Date Field */}
            <div className='space-y-2'>
              <Label htmlFor='effectiveDate'>Ngày hiệu lực *</Label>
              <Input
                id='effectiveDate'
                type='date'
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
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
                      [{ header: [1, 2, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  className='h-[200px]'
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
            <Button onClick={handleSave} className='bg-blue-600 hover:bg-blue-700 text-white'>
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
              <Input
                id='edit-type'
                placeholder='Nhập loại tài liệu (ví dụ: Điều khoản, Chính sách, Bảo mật, Giao hàng)'
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              />
              <p className='text-xs text-gray-500'>Ví dụ: Điều khoản, Chính sách, Bảo mật, Giao hàng…</p>
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

            {/* Effective Date Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-effectiveDate'>Ngày hiệu lực *</Label>
              <Input
                id='edit-effectiveDate'
                type='date'
                value={formData.effectiveDate}
                onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              />
            </div>

            {/* Content Field */}
            <div className='space-y-2'>
              <Label htmlFor='edit-content'>Nội dung *</Label>
              <div>
                <ReactQuill
                  theme='snow'
                  value={formData.content}
                  onChange={(value: string) => handleInputChange('content', value)}
                  placeholder='Nhập nội dung tài liệu...'
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  className='h-[200px]'
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
            <Button onClick={handleUpdate} className='bg-blue-600 hover:bg-blue-700 text-white'>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Chi tiết tài liệu</DialogTitle>
            <DialogDescription>Thông tin chi tiết về tài liệu</DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Tiêu đề</Label>
                  <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 mt-1'>
                    {selectedDocument.title}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Slug</Label>
                  <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 mt-1'>
                    {selectedDocument.slug}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Loại</Label>
                  <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 mt-1'>
                    {selectedDocument.type}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Phiên bản</Label>
                  <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 mt-1'>
                    {selectedDocument.version}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Ngày hiệu lực</Label>
                  <div className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 mt-1'>
                    {new Date(selectedDocument.effectiveDate).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div>
                  <Label className='text-sm font-medium text-gray-700'>Trạng thái</Label>
                  <div className='mt-1'>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${selectedDocument.isPublished ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}
                    >
                      {selectedDocument.isPublished ? 'Đã xuất bản' : 'Bản nháp'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className='text-sm font-medium text-gray-700'>Nội dung</Label>
                <div
                  className='bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-900 mt-1 max-h-96 overflow-y-auto'
                  dangerouslySetInnerHTML={{ __html: selectedDocument.content }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
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
