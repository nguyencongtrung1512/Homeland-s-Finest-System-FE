import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Maximize2,
  Minimize2,
  Layers
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { Switch } from '../../../components/ui/switch'
import Loading from '../../../components/Loading/loading'
import {
  getAllProductCategory,
  createProductCategory,
  updateProductCategory,
  type ProductCategoryItem,
  type ProductCategoryCreateRequest
} from '../../../apis/productCategory.api'
import { toast } from '../../../utils/toast'
import { ShimmerBorder } from '../../../components/ui/shimmer'
import ComboBox from '../../../components/ui/combo-box'

// Extended interface for tree structure
interface CategoryTreeNode extends ProductCategoryItem {
  children?: CategoryTreeNode[]
  level?: number
}

function ListCategory() {
  // State management
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchText, setSearchText] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductCategoryItem | null>(null)
  const [viewingItem, setViewingItem] = useState<ProductCategoryItem | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    parentId: '' // Empty string means root category
  })
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')

  // Build tree structure from flat array
  const buildTree = useCallback((categories: ProductCategoryItem[]): CategoryTreeNode[] => {
    const categoryMap = new Map<string, CategoryTreeNode>()
    const rootNodes: CategoryTreeNode[] = []

    // First pass: create all nodes
    categories.forEach((category) => {
      categoryMap.set(category.id, {
        ...category,
        children: [],
        level: 0
      })
    })

    // Second pass: build tree structure
    categories.forEach((category) => {
      const node = categoryMap.get(category.id)!
      if (!category.parentId || category.parentId === '') {
        // Root node
        rootNodes.push(node)
      } else {
        // Child node
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          if (!parent.children) {
            parent.children = []
          }
          node.level = (parent.level || 0) + 1
          parent.children.push(node)
        }
      }
    })

    // Sort children alphabetically
    const sortChildren = (nodes: CategoryTreeNode[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name))
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children)
        }
      })
    }

    sortChildren(rootNodes)
    return rootNodes
  }, [])

  // Filter tree based on search
  const filterTree = useCallback((nodes: CategoryTreeNode[], search: string): CategoryTreeNode[] => {
    if (!search) return nodes

    const filtered: CategoryTreeNode[] = []
    nodes.forEach((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase())

      const filteredChildren = node.children ? filterTree(node.children, search) : []

      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children
        })
        // Auto-expand matching nodes
        if (matchesSearch || filteredChildren.length > 0) {
          setExpandedNodes((prev) => new Set(prev).add(node.id))
        }
      }
    })

    return filtered
  }, [])

  // Get all categories for ComboBox (flattened) with level info
  const allCategoriesFlat = useMemo(() => {
    const flatten = (nodes: CategoryTreeNode[]): (ProductCategoryItem & { level: number })[] => {
      const result: (ProductCategoryItem & { level: number })[] = []
      nodes.forEach((node) => {
        result.push({ ...node, level: node.level || 0 })
        if (node.children && node.children.length > 0) {
          result.push(...flatten(node.children))
        }
      })
      return result
    }
    return flatten(categoryTree)
  }, [categoryTree])

  // Fetch data function
  const fetchProductCategory = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await getAllProductCategory({ pageSize: 0 })
      console.log('response', response)

      if (response.status === 200) {
        const tree = buildTree(response.data)
        setCategoryTree(tree)
        // Auto-expand root nodes on initial load
        const rootIds = new Set(tree.map((node) => node.id))
        setExpandedNodes(rootIds)
      } else {
        setError('Có lỗi xảy ra khi tải dữ liệu')
      }
    }  catch (err: any) {  
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải dữ liệu'
      setError(errorMessage)
      toast.error(errorMessage) 
    } finally {
      setLoading(false)
    }
  }, [buildTree])

  // Load data on component mount
  useEffect(() => {
    fetchProductCategory()
  }, [fetchProductCategory])

  // Filtered tree for display
  const filteredTree = useMemo(() => {
    if (!searchText) return categoryTree
    return filterTree(categoryTree, searchText)
  }, [categoryTree, searchText, filterTree])

  // Toggle expand/collapse
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }

  // Expand all nodes recursively
  const expandAllNodes = useCallback((nodes: CategoryTreeNode[], nodeSet: Set<string>) => {
    nodes.forEach((node) => {
      nodeSet.add(node.id)
      if (node.children && node.children.length > 0) {
        expandAllNodes(node.children, nodeSet)
      }
    })
  }, [])

  // Collapse all nodes
  const collapseAllNodes = () => {
    setExpandedNodes(new Set())
  }

  // Expand all nodes
  const handleExpandAll = () => {
    const allNodeIds = new Set<string>()
    expandAllNodes(filteredTree, allNodeIds)
    setExpandedNodes(allNodeIds)
  }

  // Get all node IDs from tree
  const getAllNodeIds = useCallback((nodes: CategoryTreeNode[]): string[] => {
    const ids: string[] = []
    nodes.forEach((node) => {
      ids.push(node.id)
      if (node.children && node.children.length > 0) {
        ids.push(...getAllNodeIds(node.children))
      }
    })
    return ids
  }, [])

  const totalNodesCount = useMemo(() => getAllNodeIds(filteredTree).length, [filteredTree, getAllNodeIds])

  // Handle view details
  const handleViewDetails = (item: ProductCategoryItem) => {
    setViewingItem(item)
    setIsDetailModalOpen(true)
  }

  // Handle create new (root category)
  const handleCreateNew = () => {
    setEditingItem(null)
    setFormData({ name: '', description: '', isActive: true, parentId: '' })
    setNameError('')
    setDescriptionError('')
    setIsModalOpen(true)
  }

  // Handle create child category (with parent already set)
  const handleCreateChild = (parentCategory: CategoryTreeNode) => {
    const currentLevel = parentCategory.level || 0

    // Check if can create child (max 3 levels: 0, 1, 2)
    // Level 0 = root, Level 1 = first child, Level 2 = second child (max depth)
    if (currentLevel >= 2) {
      toast.error('Không thể tạo danh mục con. Chỉ được phép tối đa 3 cấp danh mục (0, 1, 2).')
      return
    }

    setEditingItem(null)
    setFormData({ name: '', description: '', isActive: true, parentId: parentCategory.id })
    setNameError('')
    setDescriptionError('')
    setIsModalOpen(true)
    // Auto-expand parent to show new category after creation
    setExpandedNodes((prev) => new Set(prev).add(parentCategory.id))
  }

  // Check if creating child (has parentId pre-set)
  const isCreatingChild = !editingItem && formData.parentId !== ''

  // Handle edit
  const handleEdit = (item: ProductCategoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      isActive: item.isActive,
      parentId: item.parentId || '' // Use empty string if no parent
    })
    setNameError('')
    setDescriptionError('')
    setIsModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async () => {
    // Reset errors
    setNameError('')
    setDescriptionError('')

    // Validate required fields
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      if (!formData.name.trim()) {
        setNameError('Tên danh mục là bắt buộc')
      }
      if (!formData.description.trim()) {
        setDescriptionError('Mô tả là bắt buộc')
      }
      return
    }

    // Validate max depth (3 levels: 0, 1, 2)
    if (formData.parentId) {
      const parentCategory = allCategoriesFlat.find((cat) => cat.id === formData.parentId)
      if (parentCategory && parentCategory.level !== undefined && parentCategory.level >= 2) {
        toast.error('Không thể tạo danh mục con. Chỉ được phép tối đa 3 cấp danh mục (0, 1, 2).')
        return
      }
    }

    try {
      setFormLoading(true)

      if (editingItem) {
        // Update existing item
        const updateData: ProductCategoryCreateRequest = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          parentId: formData.parentId ? formData.parentId : null // Empty string = null (root category)
        }
        await updateProductCategory(editingItem.id, updateData)
        toast.success('Cập nhật danh mục sản phẩm thành công')
      } else {
        // Create new item
        const createData: ProductCategoryCreateRequest = {
          name: formData.name,
          description: formData.description,
          isActive: formData.isActive,
          parentId: formData.parentId ? formData.parentId : null // Empty string = null (root category)
        }
        await createProductCategory(createData)
        toast.success('Tạo danh mục sản phẩm mới thành công')
      }

      setIsModalOpen(false)
      setFormData({ name: '', description: '', isActive: true, parentId: '' })
      setEditingItem(null)
      setNameError('')
      setDescriptionError('')
      fetchProductCategory() // Refresh data
    } catch (err: any) { 
      const errorMessage = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải dữ liệu'
      toast.error(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle modal close with form reset
  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) {
      setEditingItem(null)
      setFormData({ name: '', description: '', isActive: true, parentId: '' })
      setNameError('')
      setDescriptionError('')
    }
  }

  // Handle detail modal close
  const handleDetailModalClose = (open: boolean) => {
    setIsDetailModalOpen(open)
    if (!open) {
      setViewingItem(null)
    }
  }

  // Render tree node recursively
  const renderTreeNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const level = node.level || 0

    return (
      <div key={node.id} className='select-none'>
        <div
          className={`flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors ${
            level > 0 ? 'ml-6' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button onClick={() => toggleNode(node.id)} className='p-1 hover:bg-gray-200 rounded transition-colors'>
              {isExpanded ? (
                <ChevronDown className='w-4 h-4 text-gray-600' />
              ) : (
                <ChevronRight className='w-4 h-4 text-gray-600' />
              )}
            </button>
          ) : (
            <div className='w-6' /> // Spacer for alignment
          )}

          {/* Folder Icon */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className='w-4 h-4 text-blue-500' />
            ) : (
              <Folder className='w-4 h-4 text-blue-400' />
            )
          ) : (
            <div className='w-4 h-4 rounded-full bg-gray-300 ml-1' />
          )}

          {/* Category Info */}
          <div className='flex-1 flex items-center gap-3'>
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <span className='font-medium text-gray-900'>{node.name}</span>
                <Badge
                  variant='outline'
                  className={
                    node.isActive
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {node.isActive ? (
                    <div className='flex items-center gap-1'>
                      <CheckCircle className='w-3 h-3' />
                      <span>Hoạt động</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1'>
                      <XCircle className='w-3 h-3' />
                      <span>Không hoạt động</span>
                    </div>
                  )}
                </Badge>
                {hasChildren && (
                  <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
                    {node.children?.length} con
                  </Badge>
                )}
              </div>
              <p className='text-sm text-gray-500 mt-1 truncate max-w-md'>{node.description}</p>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2'>
              {/* Add Child Button - Only show if level < 2 (max 3 levels: 0, 1, 2) */}
              {level < 2 && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => handleCreateChild(node)}
                  className='text-cyan-600 hover:text-cyan-700 border-cyan-300 hover:bg-cyan-50'
                  title='Tạo danh mục con'
                >
                  <Plus className='w-4 h-4' />
                </Button>
              )}
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleViewDetails(node)}
                className='text-blue-600 hover:text-blue-700'
              >
                <Eye className='w-4 h-4' />
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleEdit(node)}
                className='text-green-600 hover:text-green-700'
              >
                <Edit className='w-4 h-4' />
              </Button>
            </div>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className='border-l-2 border-gray-200 ml-3'>{node.children!.map((child) => renderTreeNode(child))}</div>
        )}
      </div>
    )
  }

  // Count total categories
  const totalCategories = useMemo(() => {
    const countCategories = (nodes: CategoryTreeNode[]): number => {
      let count = nodes.length
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          count += countCategories(node.children)
        }
      })
      return count
    }
    return countCategories(categoryTree)
  }, [categoryTree])

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <Card className='bg-gradient-to-br from-cyan-500 to-cyan-600 border-0 shadow-lg'>
        <CardContent className='py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <h2 className='text-3xl font-bold text-white m-0'>Danh mục sản phẩm</h2>
            </div>
            <div className='flex items-center gap-3'>
              <Button onClick={handleCreateNew} className='bg-white/10 hover:bg-white/20 text-white border-white/20'>
                <Plus className='w-4 h-4 mr-2' />
                Thêm mới
              </Button>
            </div>
          </div>
          <p className='text-white/90 mt-2'>
            Quản lý và theo dõi tất cả danh mục sản phẩm ({totalCategories} danh mục)
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className='bg-white shadow-sm'>
        <CardContent className='p-6'>
          <div className='flex items-center gap-4'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Tìm kiếm theo tên hoặc mô tả danh mục...'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='pl-10'
              />
            </div>
            <ShimmerBorder
              className='cursor-pointer'
              color='#fff'
              animationDuration='3s'
              contentClassName='bg-white/10 rounded-lg'
            >
              <Button
                onClick={fetchProductCategory}
                disabled={loading}
                variant='outline'
                className='flex items-center gap-2 bg-transparent border-transparent text-white hover:bg-white/20 hover:text-white w-full'
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </Button>
            </ShimmerBorder>
          </div>
        </CardContent>
      </Card>

      {/* Tree View */}
      <Card className='bg-white shadow-sm'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-lg font-semibold text-gray-900'>
              <div className='flex items-center gap-2'>
                <Layers className='w-5 h-5 text-cyan-600' />
                <span>
                  Cây danh mục ({filteredTree.length} nhánh gốc, {totalNodesCount} danh mục)
                </span>
              </div>
            </CardTitle>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleExpandAll}
                className='flex items-center gap-2'
                disabled={loading || filteredTree.length === 0}
              >
                <Maximize2 className='w-4 h-4' />
                Mở tất cả
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={collapseAllNodes}
                className='flex items-center gap-2'
                disabled={loading || expandedNodes.size === 0}
              >
                <Minimize2 className='w-4 h-4' />
                Đóng tất cả
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-12'>
              <Loading size='md' text='Đang tải dữ liệu danh mục...' />
            </div>
          ) : error ? (
            <div className='text-center py-12'>
              <div className='bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto'>
                <XCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
                <p className='text-red-600 mb-4 font-medium'>{error}</p>
                <Button
                  onClick={fetchProductCategory}
                  variant='outline'
                  className='border-red-300 text-red-700 hover:bg-red-50'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Thử lại
                </Button>
              </div>
            </div>
          ) : filteredTree.length === 0 ? (
            <div className='text-center py-12'>
              <div className='bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto'>
                <Folder className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 font-medium text-lg mb-2'>
                  {searchText ? 'Không tìm thấy kết quả' : 'Chưa có danh mục nào'}
                </p>
                <p className='text-gray-500 text-sm mb-4'>
                  {searchText
                    ? 'Thử thay đổi từ khóa tìm kiếm hoặc tạo danh mục mới'
                    : 'Hãy tạo danh mục đầu tiên để bắt đầu'}
                </p>
                {!searchText && (
                  <Button onClick={handleCreateNew} className='bg-cyan-600 hover:bg-cyan-700 text-white'>
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo danh mục đầu tiên
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className='space-y-1'>{filteredTree.map((node) => renderTreeNode(node))}</div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-gray-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gray-100 rounded-lg'>
                {editingItem ? <Edit className='w-5 h-5 text-gray-600' /> : <Plus className='w-5 h-5 text-gray-600' />}
              </div>
              <DialogTitle className='text-xl font-bold text-gray-900'>
                {editingItem ? 'Chỉnh sửa danh mục sản phẩm' : 'Tạo danh mục sản phẩm mới'}
              </DialogTitle>
            </div>
            <DialogDescription className='text-gray-600'>
              {editingItem ? 'Cập nhật thông tin danh mục sản phẩm.' : 'Điền thông tin để tạo danh mục sản phẩm mới.'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            {/* Tên danh mục */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='name' className='text-sm font-semibold text-gray-900'>
                  Tên danh mục *
                </Label>
              </div>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  setNameError('')
                }}
                className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${
                  nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder='Nhập tên danh mục...'
              />
              {nameError && <p className='text-xs text-red-500 mt-1'>{nameError}</p>}
            </div>

            {/* Mô tả */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='description' className='text-sm font-semibold text-gray-900'>
                  Mô tả *
                </Label>
              </div>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  setDescriptionError('')
                }}
                className={`border-gray-300 focus:border-gray-500 focus:ring-gray-500 ${
                  descriptionError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                }`}
                placeholder='Nhập mô tả danh mục...'
                rows={3}
              />
              {descriptionError && <p className='text-xs text-red-500 mt-1'>{descriptionError}</p>}
            </div>

            {/* Parent Category */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='parentId' className='text-sm font-semibold text-gray-900'>
                  Danh mục cha
                  {isCreatingChild && <span className='text-green-600 ml-1'>(Tự động chọn)</span>}
                </Label>
              </div>
              <ComboBox<ProductCategoryItem>
                options={allCategoriesFlat.filter(
                  (category) => category.isActive && (!editingItem || category.id !== editingItem.id)
                )}
                placeholder={
                  isCreatingChild
                    ? 'Danh mục cha đã được chọn tự động'
                    : 'Chọn danh mục cha (để trống nếu là danh mục gốc)...'
                }
                value={formData.parentId || ''}
                disabled={formLoading || isCreatingChild}
                getOptionLabel={(category) => category.name}
                getOptionValue={(category) => category.id}
                onSelect={(category) => {
                  if (category) {
                    setFormData({ ...formData, parentId: category.id })
                  } else {
                    setFormData({ ...formData, parentId: '' })
                  }
                }}
                filterFunction={(category, searchValue) => {
                  const search = searchValue.toLowerCase()
                  return (
                    category.name.toLowerCase().includes(search) ||
                    category.description?.toLowerCase().includes(search) ||
                    false
                  )
                }}
                renderOption={(category) => (
                  <div className='flex flex-col'>
                    <span className='text-sm font-medium text-gray-900'>{category.name}</span>
                    {category.description && (
                      <span className='text-xs text-gray-500 mt-0.5'>{category.description}</span>
                    )}
                  </div>
                )}
              />
              <p className='text-xs text-gray-500 mt-1'>
                {isCreatingChild
                  ? 'Danh mục cha đã được chọn tự động từ nút "+". Bạn có thể tạo danh mục con cho danh mục này.'
                  : 'Để trống (xóa selection) nếu muốn tạo danh mục gốc. Chọn một danh mục để tạo danh mục con.'}
              </p>
            </div>

            {/* Trạng thái */}
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center gap-2 mb-3'>
                <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                <Label htmlFor='isActive' className='text-sm font-semibold text-gray-900'>
                  Trạng thái
                </Label>
              </div>
              <div className='flex items-center gap-3'>
                <Switch
                  id='isActive'
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor='isActive' className='text-sm font-medium text-gray-700'>
                  {formData.isActive ? 'Hoạt động' : 'Không hoạt động'}
                </Label>
                <Badge
                  variant='outline'
                  className={
                    formData.isActive
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-red-100 text-red-800 border-red-300'
                  }
                >
                  {formData.isActive ? 'Đang hoạt động' : 'Đã tắt'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter className='bg-gray-50 rounded-lg p-4 border-t border-gray-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={() => handleModalClose(false)}
                disabled={formLoading}
                className='flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                Hủy
              </Button>
              <Button
                onClick={handleFormSubmit}
                disabled={formLoading}
                className='flex-1 bg-green-600 hover:bg-green-700 text-white'
              >
                {formLoading ? (
                  <>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Đang xử lý...
                  </>
                ) : editingItem ? (
                  <>
                    <Edit className='w-4 h-4 mr-2' />
                    Cập nhật
                  </>
                ) : (
                  <>
                    <Plus className='w-4 h-4 mr-2' />
                    Tạo mới
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={handleDetailModalClose}>
        <DialogContent className='sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-gray-200'>
          <DialogHeader className='space-y-3'>
            <div className='flex items-center gap-3'>
              <DialogTitle className='text-xl font-bold text-gray-900'>Chi tiết danh mục sản phẩm</DialogTitle>
            </div>
          </DialogHeader>

          {viewingItem && (
            <div className='space-y-6 py-4'>
              {/* Tên danh mục */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-gray-900'>Tên danh mục</Label>
                </div>
                <p className='text-gray-900 font-medium text-lg'>{viewingItem.name}</p>
              </div>

              {/* Mô tả */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-gray-900'>Mô tả</Label>
                </div>
                <p className='text-gray-900 leading-relaxed'>{viewingItem.description}</p>
              </div>

              {/* Parent Category */}
              {viewingItem.parentId && (
                <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                  <div className='flex items-center gap-2 mb-2'>
                    <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                    <Label className='text-sm font-semibold text-gray-900'>Danh mục cha</Label>
                  </div>
                  <p className='text-gray-900'>
                    {allCategoriesFlat.find((cat) => cat.id === viewingItem.parentId)?.name || 'Không xác định'}
                  </p>
                </div>
              )}

              {/* Trạng thái */}
              <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                  <Label className='text-sm font-semibold text-gray-900'>Trạng thái</Label>
                </div>
                <Badge
                  variant='outline'
                  className={
                    viewingItem.isActive
                      ? 'bg-green-100 text-green-800 border-green-300 px-3 py-1'
                      : 'bg-red-100 text-red-800 border-red-300 px-3 py-1'
                  }
                >
                  <div className='flex items-center gap-2'>
                    {viewingItem.isActive ? <CheckCircle className='w-4 h-4' /> : <XCircle className='w-4 h-4' />}
                    {viewingItem.isActive ? 'Hoạt động' : 'Không hoạt động'}
                  </div>
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className='bg-gray-50 rounded-lg p-4 border-t border-gray-200'>
            <div className='flex gap-3 w-full'>
              <Button
                variant='outline'
                onClick={() => handleDetailModalClose(false)}
                className='flex-1 border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                Đóng
              </Button>
              <Button
                onClick={() => {
                  handleDetailModalClose(false)
                  handleEdit(viewingItem!)
                }}
                className='flex-1 bg-green-600 hover:bg-green-700 text-white'
              >
                <Edit className='w-4 h-4 mr-2' />
                Chỉnh sửa
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ListCategory
