import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { productApi, type ProductCreateFormData } from '../../../apis/product.api'
import { storeApi, type StoreResponse } from '../../../apis/store.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { useAuth } from '../../../contexts/auth.context'
import {
  Upload,
  ChevronRight,
  ChevronDown,
  Trash2,
  Video,
  Image as ImageIcon,
  Package,
  FileImage,
  Loader2,
  X,
  Hash,
  AtSign,
  Folder,
  FolderOpen,
  Search,
  MapPinIcon
} from 'lucide-react'
import { toast } from '../../../utils/toast'
import ProductComboBox from '../../../components/ui/product-combo-box'
// Type for ProductComboBox (simplified Product interface)
interface ProductForCombo {
  id: string
  name: string
  description: string
}

// Extended interface for tree structure
interface CategoryTreeNode extends ProductCategoryItem {
  children?: CategoryTreeNode[]
  level?: number
}

import Loading from '../../../components/Loading/loading'
import { createHashtag, getHashtagsByStoreId, type HashtagItem } from '../../../apis/hashtag.api'

function CreateProduct() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [storeData, setStoreData] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<ProductCategoryItem[]>([])
  const [categorySearchText, setCategorySearchText] = useState('')
  const [products, setProducts] = useState<ProductForCombo[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [selectedParentProduct, setSelectedParentProduct] = useState<{ id: string; name: string } | null>(null)

  // Hashtag states - Seller tự tạo hashtag mới
  const [newHashtagName, setNewHashtagName] = useState('')
  const [creatingHashtag, setCreatingHashtag] = useState(false)

  // Mention states - Tìm và chọn hashtag có sẵn
  const [selectedHashtags, setSelectedHashtags] = useState<HashtagItem[]>([])
  const [suggestedHashtags, setSuggestedHashtags] = useState<HashtagItem[]>([])
  const [mentionSearchKeyword, setMentionSearchKeyword] = useState('')
  const [mentionSearchLoading, setMentionSearchLoading] = useState(false)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const mentionRef = useRef<HTMLDivElement>(null)

  // Validation constants
  const MAX_NAME_WORDS = 20
  const MAX_DESCRIPTION_WORDS = 500
  const MAX_MATERIAL_WORDS = 10
  const MAX_PRODUCT_IMAGES = 5

  // Error states
  const [nameError, setNameError] = useState('')
  const [descriptionError, setDescriptionError] = useState('')
  const [materialError, setMaterialError] = useState('')

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    categoryId: null as string | null,
    material: ''
  })

  const [mediaData, setMediaData] = useState({
    productImages: [] as File[],
    productVideo: null as File | null,
    certificateImages: [] as File[]
  })
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [isDraggingVideo, setIsDraggingVideo] = useState(false)
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const countWords = (text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }
  // Helper function to validate image file
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type - only allow image types
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validImageTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `File "${file.name}" không phải là file ảnh hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, WEBP, GIF.`
      }
    }

    const maxSizeInBytes = 5 * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        valid: false,
        error: `File "${file.name}" có kích thước ${fileSizeInMB}MB, vượt quá giới hạn 5MB.`
      }
    }

    return { valid: true }
  }

  // Helper function to validate video file
  const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type - only allow video types
    const validVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!validVideoTypes.includes(file.type.toLowerCase())) {
      return {
        valid: false,
        error: `File "${file.name}" không phải là file video hợp lệ. Chỉ chấp nhận MP4, MOV, AVI, WEBM.`
      }
    }

    // Check file size - max 50MB
    const maxSizeInBytes = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSizeInBytes) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2)
      return {
        valid: false,
        error: `File "${file.name}" có kích thước ${fileSizeInMB}MB, vượt quá giới hạn 50MB.`
      }
    }

    return { valid: true }
  }

  // Helper function to remove image from array
  const removeProductImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      productImages: prev.productImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  // Hashtag handler - Thêm hashtag (tạo mới nếu chưa có, thêm vào nếu đã có)
  const handleAddHashtag = async () => {
    if (!storeId || !newHashtagName.trim()) {
      toast.error('Vui lòng nhập tên nhãn dãn')
      return
    }

    const hashtagName = newHashtagName.trim().toLowerCase()

    // Check if hashtag already exists in selected list
    const existingInSelected = selectedHashtags.find((tag) => tag.name.toLowerCase() === hashtagName)
    if (existingInSelected) {
      toast.error('Nhãn dán này đã được thêm')
      setNewHashtagName('')
      return
    }

    setCreatingHashtag(true)
    try {
      // First, try to search if hashtag already exists in store
      let hashtagToAdd: HashtagItem | null = null

      // Lấy tất cả hashtags của store và tìm exact match
      const storeHashtagsResponse = await getHashtagsByStoreId(storeId, 0, 1)

      if (storeHashtagsResponse.status === 200 && storeHashtagsResponse.data) {
        // Find exact match (case insensitive) trong hashtags của store
        const existingHashtag = storeHashtagsResponse.data.find(
          (tag) => tag.name.toLowerCase() === hashtagName && tag.isActive
        )

        if (existingHashtag) {
          // Hashtag already exists in store, use it
          hashtagToAdd = existingHashtag
        }
      }

      // If hashtag doesn't exist, create new one
      if (!hashtagToAdd) {
        const createResponse = await createHashtag({
          name: newHashtagName.trim(),
          storeId: storeId,
          isActive: true
        })

        if (createResponse.status === 200 || createResponse.status === 201) {
          hashtagToAdd = createResponse.data
        } else {
          toast.error('Không thể tạo nhãn dán mới')
          return
        }
      }

      // Add to selected list
      if (hashtagToAdd) {
        setSelectedHashtags((prev) => [...prev, hashtagToAdd!])
        setNewHashtagName('')
      }
    } catch (error: unknown) {
      console.error('Error adding nhãn dán:', error)
      let errorMessage = 'Có lỗi xảy ra khi thêm nhãn dán'
      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
      }
      toast.error(errorMessage)
    } finally {
      setCreatingHashtag(false)
    }
  }

  // Mention handlers - Tìm và chọn hashtag có sẵn (chỉ lấy hashtags của store hiện tại)
  const handleMentionSearch = useCallback(
    async (keyword: string) => {
      if (!storeId) {
        setSuggestedHashtags([])
        setShowMentionSuggestions(false)
        return
      }

      setMentionSearchLoading(true)
      try {
        // Lấy tất cả nhãn dán của store
        const response = await getHashtagsByStoreId(storeId, 0, 1)

        if (response.status === 200 && response.data) {
          // Filter theo keyword (nếu có), chỉ active nhãn dán và exclude already selected ones
          const filteredHashtags = response.data.filter((tag) => {
            const matchesKeyword =
              !keyword || keyword.trim() === '' || tag.name.toLowerCase().includes(keyword.trim().toLowerCase())
            const isActive = tag.isActive
            const notSelected = !selectedHashtags.some((selected) => selected.id === tag.id)
            return matchesKeyword && isActive && notSelected
          })
          setSuggestedHashtags(filteredHashtags)
          setShowMentionSuggestions(filteredHashtags.length > 0)
        } else {
          setSuggestedHashtags([])
          setShowMentionSuggestions(false)
        }
      } catch (error) {
        console.error('Error searching nhãn dán:', error)
        setSuggestedHashtags([])
        setShowMentionSuggestions(false)
      } finally {
        setMentionSearchLoading(false)
      }
    },
    [selectedHashtags, storeId]
  )

  const handleSelectMention = (hashtag: HashtagItem) => {
    // Check if already selected
    if (selectedHashtags.some((tag) => tag.id === hashtag.id)) {
      return
    }

    setSelectedHashtags((prev) => [...prev, hashtag])
    setShowMentionSuggestions(false)
    setMentionSearchKeyword('')
  }

  const handleRemoveHashtag = (hashtagId: string) => {
    setSelectedHashtags((prev) => prev.filter((tag) => tag.id !== hashtagId))
  }


  // Handle mention search input change
  const handleMentionInputChange = (value: string) => {
    setMentionSearchKeyword(value)
    if (value.trim()) {
      handleMentionSearch(value)
    } else {
      // If empty, show all hashtags
      handleMentionSearch('')
    }
  }

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))

    // Real-time validation
    if (typeof value === 'string') {
      if (field === 'name') {
        const wordCount = countWords(value)
        if (wordCount > MAX_NAME_WORDS) {
          setNameError(`Tên sản phẩm không được vượt quá ${MAX_NAME_WORDS} từ (hiện tại: ${wordCount} từ)`)
        } else {
          setNameError('')
        }
      } else if (field === 'description') {
        const wordCount = countWords(value)
        if (wordCount > MAX_DESCRIPTION_WORDS) {
          setDescriptionError(`Mô tả không được vượt quá ${MAX_DESCRIPTION_WORDS} từ (hiện tại: ${wordCount} từ)`)
        } else {
          setDescriptionError('')
        }
      } else if (field === 'material') {
        const wordCount = countWords(value)
        if (wordCount > MAX_MATERIAL_WORDS) {
          setMaterialError(`Nguyên liệu không được vượt quá ${MAX_MATERIAL_WORDS} từ (hiện tại: ${wordCount} từ)`)
        } else {
          setMaterialError('')
        }
      }
    }
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setProductData((prev) => ({
      ...prev,
      categoryId: categoryId
    }))

    // Update selected category path
    if (categoryId) {
      const path = getCategoryPath(categoryId)
      setSelectedCategoryPath(path)
    } else {
      setSelectedCategoryPath([])
    }
  }

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

  // Get category path from root to selected category
  const getCategoryPath = useCallback((categoryId: string): ProductCategoryItem[] => {
    const path: ProductCategoryItem[] = []
    const findPath = (nodes: CategoryTreeNode[], targetId: string, currentPath: ProductCategoryItem[]): boolean => {
      for (const node of nodes) {
        const newPath = [...currentPath, node]
        if (node.id === targetId) {
          path.push(...newPath)
          return true
        }
        if (node.children && node.children.length > 0) {
          if (findPath(node.children, targetId, newPath)) {
            return true
          }
        }
      }
      return false
    }
    findPath(categoryTree, categoryId, [])
    return path
  }, [categoryTree])

  // Toggle expand/collapse node
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

  // Filter tree based on search and auto-expand matching nodes
  const filterTree = useCallback((nodes: CategoryTreeNode[], search: string): { filtered: CategoryTreeNode[]; nodesToExpand: Set<string> } => {
    if (!search) return { filtered: nodes, nodesToExpand: new Set() }

    const nodesToExpand = new Set<string>()
    const searchLower = search.toLowerCase()

    const filterRecursive = (nodeList: CategoryTreeNode[]): CategoryTreeNode[] => {
      const result: CategoryTreeNode[] = []

      nodeList.forEach((node) => {
        const matchesSearch =
          node.name.toLowerCase().includes(searchLower) ||
          node.description?.toLowerCase().includes(searchLower)

        const filteredChildren = node.children ? filterRecursive(node.children) : []

        // If node matches or has matching children, include it
        if (matchesSearch || filteredChildren.length > 0) {
          // If children match, expand this node
          if (filteredChildren.length > 0) {
            nodesToExpand.add(node.id)
          }

          result.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children
          })
        }
      })

      return result
    }

    return {
      filtered: filterRecursive(nodes),
      nodesToExpand
    }
  }, [])

  // Get filtered tree based on search
  const filteredCategoryTree = useMemo(() => {
    if (!categorySearchText.trim()) {
      return categoryTree
    }
    const { filtered } = filterTree(categoryTree, categorySearchText)
    return filtered
  }, [categoryTree, categorySearchText, filterTree])

  // Auto-expand nodes when searching (to show matching children)
  useEffect(() => {
    if (categorySearchText.trim()) {
      const { nodesToExpand } = filterTree(categoryTree, categorySearchText)
      if (nodesToExpand.size > 0) {
        setExpandedNodes((prev) => {
          const newSet = new Set(prev)
          nodesToExpand.forEach((id) => newSet.add(id))
          return newSet
        })
      }
    }
  }, [categorySearchText, categoryTree, filterTree])

  // Check if a category matches search (for highlighting)
  const categoryMatchesSearch = (category: CategoryTreeNode): boolean => {
    if (!categorySearchText.trim()) return false
    const searchLower = categorySearchText.toLowerCase()
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    )
  }

  // Helper function to add more images to existing array with validation
  const addProductImages = (newFiles: File[]) => {
    // Check current image count
    const currentCount = mediaData.productImages.length
    if (currentCount >= MAX_PRODUCT_IMAGES) {
      toast.error(`Chỉ được tải tối đa ${MAX_PRODUCT_IMAGES} hình ảnh. Vui lòng xóa một số ảnh trước khi thêm mới.`)
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    // Calculate how many images can still be added
    const remainingSlots = MAX_PRODUCT_IMAGES - currentCount

    newFiles.forEach((file) => {
      // Check if we've reached the limit
      if (validFiles.length >= remainingSlots) {
        errors.push(`Chỉ có thể thêm tối đa ${remainingSlots} ảnh nữa (tổng cộng ${MAX_PRODUCT_IMAGES} ảnh).`)
        return
      }

      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(validation.error || 'File không hợp lệ')
      }
    })

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
    }

    // Only add valid files
    if (validFiles.length > 0) {
      setMediaData((prev) => ({
        ...prev,
        productImages: [...prev.productImages, ...validFiles]
      }))
      if (validFiles.length < newFiles.length) {
        toast.warning(`Đã thêm ${validFiles.length}/${newFiles.length} ảnh hợp lệ.`)
      } else if (validFiles.length + currentCount >= MAX_PRODUCT_IMAGES) {
        toast.info(`Đã đạt giới hạn tối đa ${MAX_PRODUCT_IMAGES} hình ảnh.`)
      }
    }
  }

  // Helper function to add more certificate images with validation
  const addCertificateImages = (newFiles: File[]) => {
    const validFiles: File[] = []
    const errors: string[] = []

    newFiles.forEach((file) => {
      const validation = validateImageFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        errors.push(validation.error || 'File không hợp lệ')
      }
    })

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error))
    }

    // Only add valid files
    if (validFiles.length > 0) {
      setMediaData((prev) => ({
        ...prev,
        certificateImages: [...prev.certificateImages, ...validFiles]
      }))
      if (validFiles.length < newFiles.length) {
        toast.warning(`Đã thêm ${validFiles.length}/${newFiles.length} ảnh hợp lệ.`)
      }
    }
  }

  const handleMediaChange = (field: string, value: File | File[] | null) => {
    if (field === 'productImages' && Array.isArray(value)) {
      // Add new images to existing array instead of replacing
      addProductImages(value)
    } else if (field === 'certificateImages' && Array.isArray(value)) {
      // Add new certificate images to existing array
      addCertificateImages(value)
    } else if (field === 'productVideo' && value instanceof File) {
      // Validate video file before setting
      const validation = validateVideoFile(value)
      if (validation.valid) {
        setMediaData((prev) => ({
          ...prev,
          [field]: value
        }))
      } else {
        toast.error(validation.error || 'Video không hợp lệ')
      }
    } else {
      setMediaData((prev) => ({
        ...prev,
        [field]: value
      }))
    }
  }
  const handleCancel = () => {
    navigate('../product-management')
  }

  // Fetch store ID from authenticated user
  const fetchStoreId = useCallback(async () => {
    try {
      if (!user?.userId) {
        setError('Không tìm thấy thông tin người dùng')
        return null
      }

      const response = await storeApi.getStoreBySellerId(user.userId)
      console.log('response getStoreBySellerId', response)
      if (response.status === 200 && response.data) {
        setStoreId(response.data.id)
        setStoreData(response.data)
        return response.data.id
      } else {
        setError('Không tìm thấy thông tin cửa hàng')
        return null
      }
    } catch (err) {
      console.error('Error fetching store ID:', err)
      setError('Có lỗi xảy ra khi tải thông tin cửa hàng')
      return null
    }
  }, [user?.userId])

  // Fetch product categories
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)

      const response = await getAllProductCategory({ pageSize: 100, pageNumber: 1 })
      if (response.status === 200 && response.data) {
        // Filter only active categories
        const activeCategories = response.data.filter((category: ProductCategoryItem) => category.isActive)

        // Build tree structure
        const tree = buildTree(activeCategories)
        setCategoryTree(tree)

        // Keep all folders closed on initial load
        setExpandedNodes(new Set())
      } else {
        setCategoryTree([])
      }
    } catch {
      setCategoryTree([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Fetch products for combo (sản phẩm liên quan)
  const fetchProducts = async () => {
    try {
      setProductsLoading(true)
      const response = await productApi.getForCombo()
      if (response && response.status === 200 && response.data) {
        // Map ProductForCombo to ProductForCombo format for ProductComboBox
        const productsList: ProductForCombo[] = response.data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.categoryName || ''
        }))
        setProducts(productsList)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products for combo:', error)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  // Load store ID, categories and products on component mount
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true)

      // Fetch store ID, categories and products in parallel
      const [fetchedStoreId] = await Promise.all([fetchStoreId(), fetchCategories(), fetchProducts()])

      if (fetchedStoreId) {
        setError(null)
      }
      setLoading(false)
    }

    initializeData()
  }, [user?.userId, fetchStoreId])

  // Handle click outside to close mention suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mentionRef.current && !mentionRef.current.contains(event.target as Node)) {
        setShowMentionSuggestions(false)
      }
    }

    if (showMentionSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMentionSuggestions])

  const handleCreateProduct = async () => {
    setIsSubmitting(true)

    // Validation before submit
    let hasError = false

    // Validate name
    if (!productData.name.trim()) {
      setNameError('Tên sản phẩm không được để trống')
      hasError = true
    } else {
      const nameWordCount = countWords(productData.name)
      if (nameWordCount > MAX_NAME_WORDS) {
        setNameError(`Tên sản phẩm không được vượt quá ${MAX_NAME_WORDS} từ (hiện tại: ${nameWordCount} từ)`)
        hasError = true
      } else if (nameWordCount < 1) {
        setNameError('Tên sản phẩm phải có ít nhất 1 từ')
        hasError = true
      }
    }

    // Validate description
    if (productData.description.trim()) {
      const descriptionWordCount = countWords(productData.description)
      if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
        setDescriptionError(
          `Mô tả không được vượt quá ${MAX_DESCRIPTION_WORDS} từ (hiện tại: ${descriptionWordCount} từ)`
        )
        hasError = true
      }
    }

    // Validate material
    if (!productData.material.trim()) {
      setMaterialError('Nguyên liệu không được để trống')
      hasError = true
    } else {
      const materialWordCount = countWords(productData.material)
      if (materialWordCount > MAX_MATERIAL_WORDS) {
        setMaterialError(`Nguyên liệu không được vượt quá ${MAX_MATERIAL_WORDS} từ (hiện tại: ${materialWordCount} từ)`)
        hasError = true
      } else if (materialWordCount < 1) {
        setMaterialError('Nguyên liệu phải có ít nhất 1 từ')
        hasError = true
      }
    }

    if (hasError) {
      setIsSubmitting(false)
      toast.error('Vui lòng kiểm tra lại thông tin')
      return
    }

    try {
      // Check if storeId is available
      if (!storeId) {
        toast.error('Không tìm thấy thông tin cửa hàng. Vui lòng thử lại.')
        return
      }

      // Validate required fields
      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        return
      }

      if (!productData.description.trim()) {
        toast.error('Vui lòng nhập mô tả chi tiết')
        return
      }

      if (!productData.material.trim()) {
        toast.error('Vui lòng nhập Nguyên liệu / material')
        return
      }

      // Validate product images - required and at least 1 image
      if (!mediaData.productImages || mediaData.productImages.length === 0) {
        toast.error('Vui lòng thêm ít nhất một hình ảnh sản phẩm')
        return
      }

      // Validate maximum number of images
      if (mediaData.productImages.length > MAX_PRODUCT_IMAGES) {
        toast.error(`Chỉ được tải tối đa ${MAX_PRODUCT_IMAGES} hình ảnh. Vui lòng xóa bớt ảnh.`)
        return
      }

      // Validate each image file before submit (double check)
      const imageValidationErrors: string[] = []
      mediaData.productImages.forEach((file) => {
        const validation = validateImageFile(file)
        if (!validation.valid && validation.error) {
          imageValidationErrors.push(validation.error)
        }
      })

      if (imageValidationErrors.length > 0) {
        imageValidationErrors.forEach((error) => toast.error(error))
        return
      }

      // Validate video if provided
      if (mediaData.productVideo) {
        const videoValidation = validateVideoFile(mediaData.productVideo)
        if (!videoValidation.valid) {
          toast.error(videoValidation.error || 'Video không hợp lệ')
          return
        }
      }

      const formData: ProductCreateFormData = {
        storeId: storeId,
        // If parent product is selected, use its ID, otherwise undefined (không gửi parentId)
        parentId: selectedParentProduct?.id || undefined,
        name: productData.name,
        categoryId: productData.categoryId || undefined, // Chỉ gửi nếu có chọn category
        description: productData.description || undefined, // Không bắt buộc
        material: productData.material.trim(), // Luôn gửi material (đã validate không rỗng ở trên)
        productImages: mediaData.productImages.length > 0 ? mediaData.productImages : undefined, // Không bắt buộc
        productVideo: mediaData.productVideo || undefined, // Không bắt buộc
        hashtagIds: selectedHashtags.length > 0 ? selectedHashtags.map((tag) => tag.id) : undefined
      }
      // Call API với FormData
      const response = await productApi.createMaster(formData)

      // Hiển thị thông tin response theo format mẫu
      if (response.data) {
        console.log('Product Response Data:', response.data)
      }

      // Show success message
      toast.success('Tạo sản phẩm thành công!')

      // Navigate back to product management
      navigate('../product-management')
    } catch (error: unknown) {
      console.error('Error creating product:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tạo sản phẩm'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for axios error response structure (error.response.data)
        if (err.response?.data) {
          const responseData = err.response.data

          // Priority 1: Check for message in response.data
          if (responseData.message) {
            errorMessage = responseData.message
          }
          // Priority 2: Check for errors object (validation errors)
          else if (responseData.errors && typeof responseData.errors === 'object') {
            const errorMessages: string[] = []
            Object.keys(responseData.errors).forEach((field) => {
              const fieldErrors = responseData.errors[field]
              if (Array.isArray(fieldErrors)) {
                errorMessages.push(...fieldErrors)
              } else if (typeof fieldErrors === 'string') {
                errorMessages.push(fieldErrors)
              }
            })
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join(', ')
            }
          }
          // Priority 3: Check for title field
          else if (responseData.title) {
            errorMessage = responseData.title
          }
          // Priority 4: Check for errors array
          else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.join(', ')
          }
          // Priority 5: Check for error string
          else if (responseData.error && typeof responseData.error === 'string') {
            errorMessage = responseData.error
          }
        }
        // Check for direct errors object (validation errors)
        else if (err.errors && typeof err.errors === 'object') {
          const errorMessages: string[] = []
          Object.keys(err.errors).forEach((field) => {
            const fieldErrors = err.errors[field]
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors)
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors)
            }
          })
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join(', ')
          }
        }
        // Check for title field
        else if (err.title) {
          errorMessage = err.title
        }
        // Check for message field
        else if (err.message) {
          errorMessage = err.message
        }
        // Check for errors array
        else if (err.errors && Array.isArray(err.errors)) {
          errorMessage = err.errors.join(', ')
        }
        // Check for error string
        else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render category tree node recursively
  const renderCategoryNode = (node: CategoryTreeNode) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const level = node.level || 0
    const isSelected = productData.categoryId === node.id
    const matchesSearch = categoryMatchesSearch(node)

    return (
      <div key={node.id} className='select-none'>
        <div
          className={`flex items-center gap-2 p-2.5 hover:bg-gray-50 rounded-lg transition-all duration-200 cursor-pointer group ${isSelected
            ? 'bg-green-50 border border-green-200 shadow-sm'
            : matchesSearch
              ? 'bg-yellow-50 border border-yellow-200'
              : 'border border-transparent'
            }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => {
            handleCategorySelect(node.id)
            // Auto-expand when selecting a parent node
            if (hasChildren && !isExpanded) {
              toggleNode(node.id)
            }
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
              className='p-1 hover:bg-gray-200 rounded transition-colors flex-shrink-0 group-hover:bg-gray-100'
              title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
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
              <FolderOpen className='w-4 h-4 text-blue-500 flex-shrink-0' />
            ) : (
              <Folder className='w-4 h-4 text-blue-400 flex-shrink-0' />
            )
          ) : (
            <div className='w-4 h-4 rounded-full bg-gray-300 ml-1 flex-shrink-0' />
          )}

          {/* Radio Button */}
          <input
            type='radio'
            name='category'
            checked={isSelected}
            onChange={() => handleCategorySelect(node.id)}
            onClick={(e) => e.stopPropagation()}
            className='w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 focus:ring-2 flex-shrink-0 cursor-pointer'
          />

          {/* Category Info */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2'>
              <span
                className={`font-medium text-sm ${isSelected
                  ? 'text-green-900'
                  : matchesSearch
                    ? 'text-yellow-900 font-semibold'
                    : 'text-gray-900'
                  }`}
              >
                {node.name}
              </span>
              {hasChildren && (
                <span className='text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded'>
                  {node.children?.length} con
                </span>
              )}
            </div>
            {node.description && (
              <p
                className={`text-xs mt-0.5 truncate ${matchesSearch ? 'text-yellow-700' : 'text-gray-500'
                  }`}
                title={node.description}
              >
                {node.description}
              </p>
            )}
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className='border-l-2 border-gray-200 ml-3 mt-1'>{node.children!.map((child) => renderCategoryNode(child))}</div>
        )}
      </div>
    )
  }

  if (loading) {
    return <Loading fullScreen={true} text='Đang tải thông tin cửa hàng...' size='lg' />
  }
  if (error) {
    return (
      <div className='p-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-red-600'>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Breadcrumb */}
      <div className='flex items-center space-x-2 text-sm text-gray-600 mb-4'>
        <span
          className='text-gray-600 hover:text-gray-900 cursor-pointer'
          onClick={() => navigate('../product-management')}
        >
          Quản lý sản phẩm
        </span>
        <ChevronRight className='w-4 h-4' />
        <span className='text-gray-900 font-medium'>Tạo sản phẩm mới nha</span>
      </div>

      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Tạo sản phẩm mới</h1>
        <p className='text-gray-600 mt-1'>Thêm sản phẩm mới vào cửa hàng của bạn</p>
      </div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left Column - Main Content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Basic Information */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <Label htmlFor='name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='name'
                  placeholder='Nhập tên sản phẩm...'
                  value={productData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`mt-1 transition-all duration-200 ${nameError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                <div className='flex justify-between items-center mt-1'>
                  {nameError && <p className='text-red-500 text-xs'>{nameError}</p>}
                  <p
                    className={`text-xs ${countWords(productData.name) > MAX_NAME_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(productData.name)}/{MAX_NAME_WORDS} từ
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor='description' className='text-sm font-medium'>
                  Mô tả chi tiết <span className='text-red-500'>*</span>
                </Label>
                <Textarea
                  id='description'
                  placeholder='Mô tả chi tiết về sản phẩm của bạn...'
                  value={productData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`mt-1 min-h-[120px] transition-all duration-200 ${descriptionError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                <div className='flex justify-between items-center mt-1'>
                  {descriptionError && <p className='text-red-500 text-xs'>{descriptionError}</p>}
                  <p
                    className={`text-xs ${countWords(productData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {productData.description.length}/4000 ký tự
                  </p>
                </div>
              </div>

              {/* Hashtag Section - Tách riêng không liên quan đến description */}
              <div>
                <Label className='text-sm font-medium'>Nhãn dán</Label>
                <div className='mt-2 space-y-3'>
                  {/* Thêm Hashtag - Tạo mới hoặc thêm hashtag có sẵn */}
                  <div className='p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg'>
                    <p className='text-xs font-medium text-gray-700 mb-2 flex items-center gap-1'>
                      <Hash className='w-3 h-3 text-green-600' />
                      Thêm nhãn dán
                    </p>
                    <div className='flex gap-2'>
                      <Input
                        placeholder='Nhập tên nhãn dán...'
                        value={newHashtagName}
                        onChange={(e) => setNewHashtagName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddHashtag()
                          }
                        }}
                        className='flex-1 text-sm'
                      />
                      <Button
                        type='button'
                        onClick={handleAddHashtag}
                        disabled={!newHashtagName.trim() || creatingHashtag}
                        size='sm'
                        className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                      >
                        {creatingHashtag ? (
                          <>
                            <Loader2 className='w-3 h-3 mr-1 animate-spin' />
                            Đang thêm...
                          </>
                        ) : (
                          'Thêm'
                        )}
                      </Button>
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>
                      Nhập tên nhãn dán để tạo mới hoặc thêm nhãn dán đã có sẵn
                    </p>
                  </div>

                  {/* Mention - Tìm và chọn hashtag có sẵn */}
                  <div
                    ref={mentionRef}
                    className='relative p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg'
                  >
                    <p className='text-xs font-medium text-gray-700 mb-2 flex items-center gap-1'>
                      <AtSign className='w-3 h-3 text-blue-600' />
                      Tìm nhãn dán có sẵn để thêm vào sản phẩm
                    </p>
                    <Input
                      placeholder='Tìm kiếm nhãn dán...'
                      value={mentionSearchKeyword}
                      onChange={(e) => handleMentionInputChange(e.target.value)}
                      onFocus={() => {
                        if (!mentionSearchKeyword) {
                          handleMentionSearch('')
                        }
                      }}
                      className='text-sm'
                    />
                    <p className='text-xs text-gray-500 mt-1'>Tìm và chọn nhãn dán đã có sẵn trong hệ thống</p>

                    {/* Mention Suggestions Dropdown */}
                    {showMentionSuggestions && (
                      <div className='absolute z-50 mt-2 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                        {mentionSearchLoading ? (
                          <div className='p-4 text-center'>
                            <Loader2 className='w-4 h-4 animate-spin mx-auto text-gray-400' />
                            <p className='text-xs text-gray-500 mt-2'>Đang tìm kiếm...</p>
                          </div>
                        ) : suggestedHashtags.length > 0 ? (
                          <div className='p-2'>
                            {suggestedHashtags.map((hashtag) => (
                              <button
                                key={hashtag.id}
                                type='button'
                                onClick={() => handleSelectMention(hashtag)}
                                className='w-full text-left px-3 py-2 hover:bg-blue-50 rounded-md transition-colors flex items-center justify-between group'
                              >
                                <div className='flex items-center gap-2'>
                                  <Hash className='w-4 h-4 text-blue-600' />
                                  <span className='text-sm font-medium text-gray-900'>#{hashtag.name}</span>
                                </div>
                                <span className='text-xs text-gray-500'>
                                  {hashtag.usageCount >= 1000
                                    ? `${(hashtag.usageCount / 1000).toFixed(1)}K`
                                    : hashtag.usageCount}{' '}
                                  bài viết
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className='p-4 text-center text-sm text-gray-500'>
                            {mentionSearchKeyword ? (
                              <p>Không tìm thấy nhãn dán "{mentionSearchKeyword}"</p>
                            ) : (
                              <p>Gõ để tìm kiếm nhãn dán...</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Hashtags Display */}
                  {selectedHashtags.length > 0 && (
                    <div>
                      <p className='text-xs text-gray-600 mb-2 font-medium'>Nhãn dán đã chọn:</p>
                      <div className='flex flex-wrap gap-2'>
                        {selectedHashtags.map((hashtag) => (
                          <div
                            key={hashtag.id}
                            className='flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-3 py-1 group'
                          >
                            <Hash className='w-3 h-3 text-green-600' />
                            <span className='text-sm font-medium text-green-800'>#{hashtag.name}</span>
                            <span className='text-xs text-gray-500'>
                              (
                              {hashtag.usageCount >= 1000
                                ? `${(hashtag.usageCount / 1000).toFixed(1)}K`
                                : hashtag.usageCount}
                              )
                            </span>
                            <div className='flex items-center gap-1 ml-1'>
                              <button
                                type='button'
                                onClick={() => handleRemoveHashtag(hashtag.id)}
                                className='text-green-600 hover:text-orange-600 transition-colors'
                                title='Xóa khỏi danh sách'
                              >
                                <X className='w-3 h-3' />
                              </button>

                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor='material' className='text-sm font-medium'>
                  Nguyên liệu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='material'
                  placeholder='Nhập Nguyên liệu hoặc nguyên liệu sản phẩm...'
                  value={productData.material}
                  onChange={(e) => handleInputChange('material', e.target.value)}
                  className={`mt-1 transition-all duration-200 ${materialError ? 'border-red-500 focus:ring-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                />
                <div className='flex justify-between items-center mt-1'>
                  {materialError && <p className='text-red-500 text-xs'>{materialError}</p>}
                  <p
                    className={`text-xs ${countWords(productData.material) > MAX_MATERIAL_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {countWords(productData.material)}/{MAX_MATERIAL_WORDS} từ
                  </p>
                </div>
              </div>

              {/* Tỉnh xuất xứ */}
              {storeData?.province && (
                <div>
                  <Label className='text-sm font-medium'>
                    Tỉnh xuất xứ
                  </Label>
                  <div className='mt-1 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <MapPinIcon className='w-4 h-4 text-green-600' />
                      <span className='text-sm font-medium text-gray-900'>{storeData.targetProvinceName}</span>
                    </div>
                    <p className='text-xs text-gray-500 mt-1'>Tỉnh xuất xứ được lấy từ thông tin cửa hàng của bạn</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Section */}
          <Card className='border-green-100 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <FileImage className='w-5 h-5' />
                Hình ảnh & Video
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Product Images */}
              <div>
                <div className='flex items-center justify-between mb-1'>
                  <Label className='text-sm font-medium'>
                    Hình ảnh sản phẩm <span className='text-red-500'>*</span>
                  </Label>
                  <p className='text-xs text-gray-500'>
                    {mediaData.productImages.length}/{MAX_PRODUCT_IMAGES} ảnh
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 bg-gradient-to-br ${mediaData.productImages.length >= MAX_PRODUCT_IMAGES
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : isDraggingImages
                      ? 'border-green-500 bg-green-100 shadow-lg scale-[1.02]'
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50 cursor-pointer from-white to-gray-50'
                    }`}
                  onClick={() => {
                    if (mediaData.productImages.length < MAX_PRODUCT_IMAGES) {
                      document.getElementById('product-images')?.click()
                    }
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (mediaData.productImages.length < MAX_PRODUCT_IMAGES) {
                      setIsDraggingImages(true)
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (mediaData.productImages.length < MAX_PRODUCT_IMAGES) {
                      setIsDraggingImages(true)
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDraggingImages(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDraggingImages(false)

                    if (mediaData.productImages.length >= MAX_PRODUCT_IMAGES) {
                      toast.error(`Chỉ được tải tối đa ${MAX_PRODUCT_IMAGES} hình ảnh.`)
                      return
                    }

                    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
                    if (files.length > 0) {
                      addProductImages(files)
                    } else {
                      toast.error('Vui lòng kéo thả file ảnh hợp lệ.')
                    }
                  }}
                >
                  <ImageIcon
                    className={`w-10 h-10 mx-auto mb-3 ${isDraggingImages ? 'text-green-600' : 'text-gray-400'
                      } transition-colors duration-200`}
                  />
                  <p
                    className={`mb-2 font-medium ${isDraggingImages ? 'text-green-700' : 'text-gray-600'
                      } transition-colors duration-200`}
                  >
                    {mediaData.productImages.length >= MAX_PRODUCT_IMAGES
                      ? `Đã đạt giới hạn ${MAX_PRODUCT_IMAGES} ảnh`
                      : isDraggingImages
                        ? 'Thả ảnh vào đây để tải lên'
                        : mediaData.productImages.length > 0
                          ? 'Kéo thả hoặc click để thêm ảnh khác'
                          : 'Kéo thả hoặc click để tải ảnh lên'}
                  </p>
                  <p className='text-sm text-gray-500'>
                    PNG, JPG tối đa 5MB mỗi ảnh • Tối đa {MAX_PRODUCT_IMAGES} ảnh
                  </p>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    className='hidden'
                    id='product-images'
                    disabled={mediaData.productImages.length >= MAX_PRODUCT_IMAGES}
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        addProductImages(files)
                      }
                      // Reset input value to allow selecting same files again
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={mediaData.productImages.length >= MAX_PRODUCT_IMAGES}
                    className={`mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-300 hover:from-green-100 hover:to-emerald-100 text-green-700 hover:text-green-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md ${mediaData.productImages.length >= MAX_PRODUCT_IMAGES
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                      }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (mediaData.productImages.length < MAX_PRODUCT_IMAGES) {
                        document.getElementById('product-images')?.click()
                      }
                    }}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    {mediaData.productImages.length >= MAX_PRODUCT_IMAGES
                      ? 'Đã đạt giới hạn'
                      : mediaData.productImages.length > 0
                        ? 'Thêm ảnh'
                        : 'Chọn ảnh'}
                  </Button>
                </div>

                {/* Image Preview Grid */}
                {mediaData.productImages.length > 0 && (
                  <div className='mt-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <p className='text-sm font-medium text-gray-700'>
                        Đã chọn {mediaData.productImages.length}/{MAX_PRODUCT_IMAGES} ảnh
                        {mediaData.productImages.length >= MAX_PRODUCT_IMAGES && (
                          <span className='ml-2 text-xs text-orange-600 font-semibold'>(Đã đạt giới hạn)</span>
                        )}
                      </p>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setMediaData((prev) => ({ ...prev, productImages: [] }))}
                        className='text-red-600 hover:text-red-700 hover:bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Xóa tất cả
                      </Button>
                    </div>

                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
                      {mediaData.productImages.map((file, index) => (
                        <div key={`${file.name}-${index}`} className='relative group'>
                          <div className='aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md group'>
                            <img
                              src={createPreviewUrl(file)}
                              alt={`Product ${index + 1}`}
                              className='w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-300 group-hover:brightness-105'
                              onClick={() => {
                                const newWindow = window.open()
                                if (newWindow) {
                                  newWindow.document.write(`
                                        <html>
                                          <head><title>${file.name}</title></head>
                                          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#000;">
                                            <img src="${createPreviewUrl(file)}" style="max-width:100%;max-height:100vh;object-fit:contain;" />
                                          </body>
                                        </html>
                                      `)
                                }
                              }}
                            />
                          </div>

                          {/* Remove button */}
                          <button
                            type='button'
                            onClick={() => removeProductImage(index)}
                            className='absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110'
                            title='Xóa ảnh này'
                          >
                            <X className='w-4 h-4' />
                          </button>

                          {/* Image index */}
                          <div className='absolute top-2 left-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md'>
                            #{index + 1}
                          </div>

                          {/* File info */}
                          <div className='mt-2 p-2 bg-gray-50 rounded-lg'>
                            {/* File name */}
                            <p className='text-xs text-gray-600 font-medium truncate' title={file.name}>
                              {file.name}
                            </p>
                            {/* File size */}
                            <p className='text-xs text-gray-500 mt-1'> {(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Video */}
              <div>
                <Label className='text-sm font-medium'>Video sản phẩm</Label>
                <div
                  className={`mt-2 border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer bg-gradient-to-br ${isDraggingVideo
                    ? 'border-blue-500 bg-blue-100 shadow-lg scale-[1.02]'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 from-white to-gray-50'
                    }`}
                  onClick={() => document.getElementById('product-video')?.click()}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDraggingVideo(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDraggingVideo(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDraggingVideo(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDraggingVideo(false)

                    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('video/'))
                    if (files.length > 0) {
                      handleMediaChange('productVideo', files[0])
                    } else {
                      toast.error('Vui lòng kéo thả file video hợp lệ.')
                    }
                  }}
                >
                  <Video
                    className={`w-10 h-10 mx-auto mb-3 ${isDraggingVideo ? 'text-blue-600' : 'text-gray-400'
                      } transition-colors duration-200`}
                  />
                  <p
                    className={`mb-2 font-medium ${isDraggingVideo ? 'text-blue-700' : 'text-gray-600'
                      } transition-colors duration-200`}
                  >
                    {isDraggingVideo
                      ? 'Thả video vào đây để tải lên'
                      : mediaData.productVideo
                        ? 'Kéo thả hoặc click để thay đổi video'
                        : 'Kéo thả hoặc click để tải video lên'}
                  </p>
                  <p className='text-sm text-gray-500'>MP4, MOV tối đa 50MB</p>
                  <input
                    type='file'
                    accept='video/*'
                    className='hidden'
                    id='product-video'
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      if (file) {
                        handleMediaChange('productVideo', file)
                      }
                      e.target.value = ''
                    }}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById('product-video')?.click()
                    }}
                  >
                    <Upload className='w-4 h-4 mr-2' />
                    {mediaData.productVideo ? 'Thay đổi video' : 'Chọn video'}
                  </Button>
                </div>

                {mediaData.productVideo && (
                  <div className='mt-6'>
                    <div className='flex items-center justify-between mb-4'>
                      <p className='text-sm font-medium text-gray-700'>Video đã chọn:</p>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => handleMediaChange('productVideo', null)}
                        className='text-red-600 hover:text-red-700 hover:bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 hover:border-red-300 font-medium transition-all duration-200 shadow-sm hover:shadow-md'
                      >
                        <Trash2 className='w-4 h-4 mr-1' />
                        Xóa video
                      </Button>
                    </div>

                    <div className='relative group max-w-2xl'>
                      <div className='aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-black shadow-lg group-hover:shadow-xl transition-all duration-300'>
                        <video
                          src={createPreviewUrl(mediaData.productVideo)}
                          controls
                          className='w-full h-full object-contain group-hover:brightness-105 transition-all duration-300'
                          preload='metadata'
                        />
                      </div>

                      <div className='mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm'>
                        <p
                          className='text-sm font-semibold text-gray-800 truncate mb-2'
                          title={mediaData.productVideo.name}
                        >
                          {mediaData.productVideo.name}
                        </p>
                        <div className='flex items-center gap-4 text-xs text-gray-600'>
                          <span className='flex items-center gap-1'>
                            Kích thước: {(mediaData.productVideo.size / (1024 * 1024)).toFixed(1)} MB
                          </span>
                          <span className='flex items-center gap-1'> Thời lượng: Video</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className='space-y-6'>
          {/* Category */}
          <Card className='border-green-100 shadow-sm min-h-[400px] hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700 pt-4'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Phân loại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor='category' className='text-sm font-medium'>
                  Danh mục sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>
                  Chọn danh mục sản phẩm chi tiết sẽ tiếp cận khách hàng dễ hơn nhé.
                </p>

                {categoriesLoading ? (
                  <div className='py-4 mt-1 border rounded-md'>
                    <Loading size='sm' text='Đang tải danh mục...' />
                  </div>
                ) : categoryTree.length === 0 ? (
                  <div className='flex items-center justify-center py-4 mt-1 border rounded-md'>
                    <span className='text-sm text-gray-500'>Không có danh mục nào</span>
                  </div>
                ) : (
                  <div className='mt-1'>
                    {/* Search Input */}
                    <div className='mb-3 relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                      <Input
                        type='text'
                        placeholder='Tìm kiếm danh mục...'
                        value={categorySearchText}
                        onChange={(e) => setCategorySearchText(e.target.value)}
                        className='pl-10 pr-4 border-gray-300 focus:ring-green-500 focus:border-green-500'
                      />
                      {categorySearchText && (
                        <button
                          type='button'
                          onClick={() => setCategorySearchText('')}
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                        >
                          <X className='w-4 h-4' />
                        </button>
                      )}
                    </div>

                    {/* Breadcrumb Path */}
                    {selectedCategoryPath.length > 0 && (
                      <div className='mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm'>
                        <div className='flex items-center gap-1.5 flex-wrap'>
                          <span className='text-xs font-semibold text-gray-700'>Đã chọn:</span>
                          {selectedCategoryPath.map((cat, index) => (
                            <div key={cat.id} className='flex items-center gap-1.5'>
                              <span className='text-xs font-medium text-green-800 bg-white px-2 py-0.5 rounded border border-green-200'>
                                {cat.name}
                              </span>
                              {index < selectedCategoryPath.length - 1 && (
                                <ChevronRight className='w-3 h-3 text-gray-400' />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Category Tree */}
                    <div className='border border-gray-200 rounded-lg p-3 max-h-96 overflow-y-auto bg-white shadow-inner'>
                      {filteredCategoryTree.length === 0 ? (
                        <div className='text-center py-8 text-gray-500'>
                          <Search className='w-8 h-8 mx-auto mb-2 text-gray-400' />
                          <p className='text-sm'>Không tìm thấy danh mục nào phù hợp với "{categorySearchText}"</p>
                        </div>
                      ) : (
                        <div className='space-y-0.5'>
                          {filteredCategoryTree.map((node) => renderCategoryNode(node))}
                        </div>
                      )}
                    </div>

                    {/* Clear Selection Button */}
                    {productData.categoryId && (
                      <div className='mt-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => handleCategorySelect(null)}
                          className='w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300'
                        >
                          <X className='w-4 h-4 mr-1' />
                          Xóa lựa chọn
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parent Product Selection */}
          <Card className='border-green-100 min-h-[400px] flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200'>
            <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-t-2 border-b border-green-100 text-green-700'>
              <CardTitle className='text-green-700 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Sản phẩm liên quan (Tùy chọn)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor='parent-product' className='text-sm font-medium'>
                  Chọn sản phẩm liên quan
                </Label>
                <p className='text-xs text-gray-500 mt-1 mb-2'>Chọn một sản phẩm liên quan.</p>

                {productsLoading ? (
                  <div className='py-4 mt-1 border rounded-md'>
                    <Loading size='sm' text='Đang tải sản phẩm...' />
                  </div>
                ) : (
                  <div className='mt-1'>
                    <ProductComboBox
                      products={products}
                      placeholder='Tìm kiếm sản phẩm liên quan...'
                      onSelect={(product) => {
                        if (product) {
                          // Store only id and name for parent product
                          setSelectedParentProduct({ id: product.id, name: product.name })
                        } else {
                          setSelectedParentProduct(null)
                        }
                      }}
                      value={selectedParentProduct?.id || null}
                    />
                  </div>
                )}

                {/* Show selected parent product */}
                {selectedParentProduct && (
                  <div className='mt-4 p-4  bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Package className='w-4 h-4 text-green-600 flex-shrink-0' />
                          <p className='text-sm font-semibold text-green-800'>Sản phẩm liên quan đã chọn:</p>
                        </div>
                        <p className='font-medium text-gray-900 mb-1'>
                          Sản phẩm liên quan: {selectedParentProduct.name}
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => setSelectedParentProduct(null)}
                        className='ml-2 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full p-1 transition-all duration-150 flex-shrink-0'
                        title='Xóa lựa chọn'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-start gap-4 mt-8'>
        <Button
          variant='outline'
          onClick={handleCancel}
          className='px-6 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200'
          disabled={isSubmitting}
        >
          Hủy bỏ
        </Button>
        <Button
          className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105'
          onClick={handleCreateProduct}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              Đang tạo...
            </>
          ) : (
            'Tạo sản phẩm'
          )}
        </Button>
      </div>
    </div>
  )
}

export default CreateProduct
