import { useState } from 'react'
import { Search, Filter, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
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

interface Term {
  id: string
  title: string
  category: string
  createDate: string
  lastUpdatedBy: string
  status: 'applied' | 'draft'
}

function TermsManagement() {
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    status: true // true = applied, false = draft
  })

  // Mock data
  const terms: Term[] = [
    {
      id: '001',
      title: 'Chào mừng Quý khách đến với QuanLyShop',
      category: 'Điều khoản chung',
      createDate: '15/01/2024',
      lastUpdatedBy: 'Admin',
      status: 'applied'
    },
    {
      id: '002',
      title: 'Chính sách thanh toán',
      category: 'Đặt hàng & Thanh toán',
      createDate: '12/01/2024',
      lastUpdatedBy: 'Admin',
      status: 'draft'
    },
    {
      id: '003',
      title: 'Chính sách giao hàng',
      category: 'Giao hàng',
      createDate: '10/01/2024',
      lastUpdatedBy: 'Admin',
      status: 'applied'
    },
    {
      id: '004',
      title: 'Chính sách đổi trả',
      category: 'Đặt hàng & Thanh toán',
      createDate: '08/01/2024',
      lastUpdatedBy: 'Admin',
      status: 'applied'
    },
    {
      id: '005',
      title: 'Chính sách bảo mật thông tin',
      category: 'Điều khoản chung',
      createDate: '05/01/2024',
      lastUpdatedBy: 'Admin',
      status: 'draft'
    }
  ]

  const getStatusConfig = (status: string) => {
    const configs = {
      applied: {
        text: 'Đang áp dụng',
        bgColor: 'bg-green-100',
        textColor: 'text-green-600'
      },
      draft: {
        text: 'Lưu nháp',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-600'
      }
    }
    return configs[status as keyof typeof configs] || configs.draft
  }

  const filteredTerms = terms.filter((term) => {
    const matchesSearch =
      searchText === '' ||
      term.title.toLowerCase().includes(searchText.toLowerCase()) ||
      term.id.toLowerCase().includes(searchText.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || term.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || term.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleAdd = () => {
    setShowAddModal(true)
  }

  const handleEdit = (term: Term) => {
    console.log('Edit term:', term.id)
  }

  const handleDelete = (term: Term) => {
    console.log('Delete term:', term.id)
  }

  const handleFilter = () => {
    console.log('Filtering with:', { searchText, categoryFilter, statusFilter })
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    console.log('Saving term:', formData)
    // Here you would typically make an API call to save the term
    setShowAddModal(false)
    setFormData({
      category: '',
      title: '',
      content: '',
      status: true
    })
  }

  const handleCancel = () => {
    setShowAddModal(false)
    setFormData({
      category: '',
      title: '',
      content: '',
      status: true
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

            {/* Category Filter */}
            <div className='w-48'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Danh mục</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className='h-10'>
                  <SelectValue placeholder='Tất cả danh mục' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả danh mục</SelectItem>
                  <SelectItem value='Điều khoản chung'>Điều khoản chung</SelectItem>
                  <SelectItem value='Đặt hàng & Thanh toán'>Đặt hàng & Thanh toán</SelectItem>
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
                  <SelectItem value='applied'>Đang áp dụng</SelectItem>
                  <SelectItem value='draft'>Lưu nháp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Button */}
            <div>
              <Button
                onClick={handleFilter}
                className='bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 rounded-lg shadow-sm'
              >
                <Filter className='w-4 h-4 mr-2' />
                Lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms List Section */}
      <Card className='bg-white shadow-sm'>
        <CardHeader className='flex flex-row items-center justify-between p-6 border-b border-gray-200'>
          <div>
            <CardTitle className='text-lg font-semibold text-gray-900'>Danh sách điều khoản</CardTitle>
            <p className='text-sm text-gray-600 mt-1'>Hiển thị {filteredTerms.length} điều khoản</p>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='px-6 py-3'>ID</TableHead>
                <TableHead className='px-6 py-3'>Tiêu đề</TableHead>
                <TableHead className='px-6 py-3'>Danh mục</TableHead>
                <TableHead className='px-6 py-3'>Ngày tạo</TableHead>
                <TableHead className='px-6 py-3'>Người cập nhật</TableHead>
                <TableHead className='px-6 py-3'>Trạng thái</TableHead>
                <TableHead className='px-6 py-3'>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerms.map((term) => {
                const statusConfig = getStatusConfig(term.status)

                return (
                  <TableRow key={term.id}>
                    <TableCell className='px-6 py-3'>
                      <span className='text-blue-600 font-medium'>#{term.id}</span>
                    </TableCell>
                    <TableCell className='px-6 py-3'>
                      <p className='font-medium text-gray-900 text-sm'>{term.title}</p>
                    </TableCell>
                    <TableCell className='px-6 py-3'>
                      <span className='text-sm text-gray-700'>{term.category}</span>
                    </TableCell>
                    <TableCell className='px-6 py-3'>
                      <span className='text-sm text-gray-700'>{term.createDate}</span>
                    </TableCell>
                    <TableCell className='px-6 py-3'>
                      <span className='text-sm text-gray-700'>{term.lastUpdatedBy}</span>
                    </TableCell>
                    <TableCell className='px-6 py-3'>
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                      >
                        {statusConfig.text}
                      </div>
                    </TableCell>
                    <TableCell className='px-6 py-3'>
                      <div className='flex items-center gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEdit(term)}
                          className='h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full'
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleDelete(term)}
                          className='h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full'
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Term Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Thêm điều khoản mới</DialogTitle>
            <DialogDescription>Tạo điều khoản và chính sách dịch vụ mới</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Category Field */}
            <div className='space-y-2'>
              <Label htmlFor='category'>Danh mục</Label>
              <Input
                id='category'
                placeholder='Nhập tiêu đề danh mục'
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </div>

            {/* Title Field */}
            <div className='space-y-2'>
              <Label htmlFor='title'>Tiêu đề</Label>
              <Input
                id='title'
                placeholder='Nhập tiêu đề điều khoản'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
            </div>

            {/* Content Field */}
            <div className='space-y-2'>
              <Label htmlFor='content'>Nội dung</Label>
              <div>
                <ReactQuill
                  theme='snow'
                  value={formData.content}
                  onChange={(value: string) => handleInputChange('content', value)}
                  placeholder='Nhập nội dung điều khoản...'
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
            <div className='space-y-2 pt-10 '>
              <Label htmlFor='status'>Trạng thái</Label>
              <div className='flex items-center gap-3'>
                <Switch
                  id='status'
                  checked={formData.status}
                  onCheckedChange={(checked) => handleInputChange('status', checked)}
                />
                <span className='text-sm font-medium'>{formData.status ? 'Đang áp dụng' : 'Lưu nháp'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={handleCancel}>
              Hủy
            </Button>
            <Button onClick={handleSave} className='bg-blue-600 hover:bg-blue-700 text-white'>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TermsManagement
