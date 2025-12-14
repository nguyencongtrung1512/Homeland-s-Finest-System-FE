import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import {
  Upload,
  Video,
  Image as ImageIcon,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Search,
  Hash,
  AtSign
} from 'lucide-react'
import { productApi } from '../../../apis/product.api'
import { getAllProductCategory, type ProductCategoryItem } from '../../../apis/productCategory.api'
import { createHashtag, getHashtagsByStoreId, getHashtagById, type HashtagItem } from '../../../apis/hashtag.api'
import { toast } from '../../../utils/toast'
import type { Product } from '../../../types/productType'
import { storeApi } from '../../../apis/store.api'
import { useAuth } from '../../../contexts/auth.context'

// Extended interface for tree structure
interface CategoryTreeNode extends ProductCategoryItem {
  children?: CategoryTreeNode[]
  level?: number
}

interface ModalUpdateProductProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSuccess: () => void
}

export default function ModalUpdateProduct({ open, onOpenChange, product, onSuccess }: ModalUpdateProductProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingProductDetail, setLoadingProductDetail] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [provinceId, setProvinceId] = useState<number | null>(null)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedCategoryPath, setSelectedCategoryPath] = useState<ProductCategoryItem[]>([])
  const [categorySearchText, setCategorySearchText] = useState('')
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null)

  // Hashtag states
  const [newHashtagName, setNewHashtagName] = useState('')
  const [creatingHashtag, setCreatingHashtag] = useState(false)
  const [selectedHashtags, setSelectedHashtags] = useState<HashtagItem[]>([])
  const [suggestedHashtags, setSuggestedHashtags] = useState<HashtagItem[]>([])
  const [mentionSearchKeyword, setMentionSearchKeyword] = useState('')
  const [mentionSearchLoading, setMentionSearchLoading] = useState(false)
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const mentionRef = useRef<HTMLDivElement>(null)

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    categoryId: null as string | null,
    material: '',
    isActive: true
  })

  const [mediaData, setMediaData] = useState({
    newProductImages: [] as File[],
    newProductVideo: null as File | null,
    removeExistingVideo: false
  })

  // Validation errors
  const [nameError, setNameError] = useState<string>('')
  const [materialError, setMaterialError] = useState<string>('')
  const [descriptionError, setDescriptionError] = useState<string>('')
  const [categoryError, setCategoryError] = useState<string>('')
  const [imagesError, setImagesError] = useState<string>('')

  // Constants for validation
  const MAX_NAME_WORDS = 20
  const MAX_MATERIAL_WORDS = 10
  const MAX_DESCRIPTION_WORDS = 500
  const MAX_IMAGES = 10

  // Helper function to count words
  const countWords = (text: string): number => {
    if (!text || text.trim().length === 0) return 0
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  // Fetch store ID and province ID
  useEffect(() => {
    const fetchStoreId = async () => {
      if (!user?.userId) return

      try {
        const response = await storeApi.getStoreBySellerId(user.userId)
        if (response.status === 200 && response.data) {
          setStoreId(response.data.id)
          setProvinceId(response.data.provinceId)
        }
      } catch (error) {
        console.error('Error fetching store ID:', error)
      }
    }

    if (open && user?.userId) {
      fetchStoreId()
    }
  }, [open, user?.userId])

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

  // Filter tree based on search
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

  // Auto-expand nodes when searching
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

  // Check if a category matches search
  const categoryMatchesSearch = (category: CategoryTreeNode): boolean => {
    if (!categorySearchText.trim()) return false
    const searchLower = categorySearchText.toLowerCase()
    return (
      category.name.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    )
  }

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      const fetchCategories = async () => {
        try {
          setCategoriesLoading(true)
          const response = await getAllProductCategory({ pageSize: 100, pageNumber: 1 })
          if (response.status === 200 && response.data) {
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
      fetchCategories()
    }
  }, [open, buildTree])

  // Lấy thông tin sản phẩm khi dialog mở
  useEffect(() => {
    const fetchProductDetail = async () => {
      if (open && product?.id) {
        try {
          setLoadingProductDetail(true)
          const response = await productApi.getById(product.id)

          if (response.status === 200 && response.data) {
            setFetchedProduct(response.data)
            const categoryId = response.data.productCategories?.id || null
            // Load product data from fetched detail
            setProductData({
              name: response.data.name || '',
              description: response.data.description || '',
              categoryId: categoryId,
              material: response.data.material || '',
              isActive: response.data.isActive
            })
            setExistingImageUrls(response.data.productImages || [])
            setCategorySearchText('')
            setMentionSearchKeyword('')
            setShowMentionSuggestions(false)

            // Update category path if category is selected
            if (categoryId && categoryTree.length > 0) {
              const path = getCategoryPath(categoryId)
              setSelectedCategoryPath(path)
            } else {
              setSelectedCategoryPath([])
            }
          } else {
            toast.error('Không thể tải thông tin sản phẩm')
          }
        } catch (error) {
          console.error('Error fetching product:', error)
          toast.error('Có lỗi xảy ra khi tải thông tin sản phẩm')
        } finally {
          setLoadingProductDetail(false)
        }
      }
    }

    fetchProductDetail()
  }, [open, product?.id, categoryTree, getCategoryPath])

  // Fetch hashtags when dialog opens
  useEffect(() => {
    const fetchHashtags = async () => {
      if (!open || !fetchedProduct) return

      const productWithHashtags = fetchedProduct as Product & { hashtagIds?: string[] }
      if (!productWithHashtags?.hashtagIds || productWithHashtags.hashtagIds.length === 0) {
        setSelectedHashtags([])
        return
      }

      try {
        const hashtagPromises = productWithHashtags.hashtagIds.map((hashtagId) => getHashtagById(hashtagId))
        const responses = await Promise.all(hashtagPromises)

        const fetchedHashtags: HashtagItem[] = []
        responses.forEach((response) => {
          if (response.status === 200 && response.data) {
            fetchedHashtags.push(response.data)
          }
        })

        setSelectedHashtags(fetchedHashtags)
      } catch (error) {
        console.error('Error fetching hashtags:', error)
        setSelectedHashtags([])
      }
    }

    fetchHashtags()
  }, [open, fetchedProduct])

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

  // Helper functions
  const createPreviewUrl = (file: File): string => {
    return URL.createObjectURL(file)
  }

  const removeExistingImage = (indexToRemove: number) => {
    setExistingImageUrls((prev) => prev.filter((_, index) => index !== indexToRemove))
  }

  const removeNewImage = (indexToRemove: number) => {
    setMediaData((prev) => ({
      ...prev,
      newProductImages: prev.newProductImages.filter((_, index) => index !== indexToRemove)
    }))
  }

  const addNewImages = (newFiles: File[]) => {
    const currentCount = existingImageUrls.length + mediaData.newProductImages.length
    const availableSlots = MAX_IMAGES - currentCount

    if (availableSlots <= 0) {
      toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
      return
    }

    // Limit number of files that can be added
    const filesToAdd = newFiles.slice(0, availableSlots)

    if (filesToAdd.length < newFiles.length) {
      toast.error(`Chỉ có thể thêm tối đa ${availableSlots} ảnh nữa.`)
    }

    // Validate file types and sizes
    const validFiles: File[] = []
    filesToAdd.forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} không phải là hình ảnh.`)
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn. Tối đa 5MB.`)
        return
      }

      validFiles.push(file)
    })

    if (validFiles.length > 0) {
      setMediaData((prev) => ({
        ...prev,
        newProductImages: [...prev.newProductImages, ...validFiles]
      }))
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    // Clear errors when user starts typing
    if (field === 'name') {
      setNameError('')
      const stringValue = value as string
      const wordCount = countWords(stringValue)
      if (wordCount > MAX_NAME_WORDS) {
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_WORDS} từ.`)
        return
      }
    }

    if (field === 'material') {
      setMaterialError('')
      const stringValue = value as string
      const wordCount = countWords(stringValue)
      if (wordCount > MAX_MATERIAL_WORDS) {
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_WORDS} từ.`)
        return
      }
    }

    if (field === 'description') {
      setDescriptionError('')
      const stringValue = value as string
      const wordCount = countWords(stringValue)
      if (wordCount > MAX_DESCRIPTION_WORDS) {
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
      }
    }

    setProductData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCategorySelect = (categoryId: string | null) => {
    setCategoryError('')
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

  // Hashtag handlers
  const handleAddHashtag = async () => {
    if (!storeId || !newHashtagName.trim()) {
      toast.error('Vui lòng nhập tên nhãn dán')
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
      let hashtagToAdd: HashtagItem | null = null

      // Check if hashtag already exists in store
      const storeHashtagsResponse = await getHashtagsByStoreId(storeId, 0, 1)

      if (storeHashtagsResponse.status === 200 && storeHashtagsResponse.data) {
        const existingHashtag = storeHashtagsResponse.data.find(
          (tag) => tag.name.toLowerCase() === hashtagName && tag.isActive
        )

        if (existingHashtag) {
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

  const handleMentionSearch = useCallback(
    async (keyword: string) => {
      if (!storeId) {
        setSuggestedHashtags([])
        setShowMentionSuggestions(false)
        return
      }

      setMentionSearchLoading(true)
      try {
        const response = await getHashtagsByStoreId(storeId, 0, 1)

        if (response.status === 200 && response.data) {
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

  const handleMentionInputChange = (value: string) => {
    setMentionSearchKeyword(value)
    if (value.trim()) {
      handleMentionSearch(value)
    } else {
      handleMentionSearch('')
    }
  }

  const handleUpdateProduct = async () => {
    if (!product?.id) return

    try {
      setIsSubmitting(true)

      // Validate name
      if (!productData.name.trim()) {
        toast.error('Vui lòng nhập tên sản phẩm')
        setNameError('Vui lòng nhập tên sản phẩm')
        return
      }

      const nameWordCount = countWords(productData.name)
      if (nameWordCount === 0) {
        toast.error('Tên sản phẩm phải có ít nhất 1 từ')
        setNameError('Tên sản phẩm phải có ít nhất 1 từ')
        return
      }

      if (nameWordCount > MAX_NAME_WORDS) {
        toast.error(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_WORDS} từ`)
        setNameError(`Tên sản phẩm chỉ được tối đa ${MAX_NAME_WORDS} từ`)
        return
      }

      // Validate description - required
      if (!productData.description.trim()) {
        toast.error('Vui lòng nhập mô tả sản phẩm')
        setDescriptionError('Vui lòng nhập mô tả sản phẩm')
        return
      }

      const descriptionWordCount = countWords(productData.description)
      if (descriptionWordCount > MAX_DESCRIPTION_WORDS) {
        toast.error(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        setDescriptionError(`Mô tả chỉ được tối đa ${MAX_DESCRIPTION_WORDS} từ.`)
        return
      }

      // Validate material - required
      if (!productData.material.trim()) {
        toast.error('Vui lòng nhập Nguyên liệu ')
        setMaterialError('Vui lòng nhập Nguyên liệu')
        return
      }

      const materialWordCount = countWords(productData.material)
      if (materialWordCount > MAX_MATERIAL_WORDS) {
        toast.error(`Material chỉ được tối đa ${MAX_MATERIAL_WORDS} từ`)
        setMaterialError(`Material chỉ được tối đa ${MAX_MATERIAL_WORDS} từ`)
        return
      }

      // Validate category - required
      if (!productData.categoryId) {
        toast.error('Vui lòng chọn loại sản phẩm')
        setCategoryError('Vui lòng chọn loại sản phẩm')
        return
      }

      // Validate images - at least 1 image required
      const totalImages = existingImageUrls.length + mediaData.newProductImages.length
      if (totalImages === 0) {
        toast.error('Vui lòng thêm ít nhất 1 hình ảnh sản phẩm')
        setImagesError('Vui lòng thêm ít nhất 1 hình ảnh sản phẩm')
        return
      }

      if (totalImages > MAX_IMAGES) {
        toast.error(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        setImagesError(`Chỉ được tối đa ${MAX_IMAGES} hình ảnh.`)
        return
      }

      // Validate video (only one video allowed)
      if (mediaData.newProductVideo && fetchedProduct?.productVideo && !mediaData.removeExistingVideo) {
        toast.error('Chỉ được tối đa 1 video. Vui lòng xóa video cũ trước khi thêm video mới.')
        return
      }

      if (!storeId || !provinceId) {
        toast.error('Không tìm thấy thông tin cửa hàng')
        return
      }

      // Prepare FormData according to the curl request
      const formData = new FormData()

      // Required and basic fields
      formData.append('Name', productData.name)
      formData.append('ProvinceId', provinceId.toString())
      formData.append('IsActive', productData.isActive.toString())
      formData.append('RemoveExistingVideo', mediaData.removeExistingVideo.toString())

      // Optional fields
      if (productData.description) {
        formData.append('Description', productData.description)
      }

      if (productData.material) {
        formData.append('Material', productData.material)
      }

      if (productData.categoryId) {
        formData.append('CategoryId', productData.categoryId)
      }

      // Existing image URLs
      if (existingImageUrls.length > 0) {
        existingImageUrls.forEach((url) => {
          formData.append('ExistingImageUrls', url)
        })
      }

      // New product images
      if (mediaData.newProductImages.length > 0) {
        mediaData.newProductImages.forEach((file) => {
          formData.append('NewProductImages', file)
        })
      }

      // New product video (can be empty)
      if (mediaData.newProductVideo) {
        formData.append('ProductVideo', mediaData.newProductVideo)
      } else if (mediaData.removeExistingVideo) {
        formData.append('ProductVideo', '')
      }

      // Add hashtag IDs if provided
      if (selectedHashtags.length > 0) {
        selectedHashtags.forEach((tag, index) => {
          formData.append(`HashtagIds[${index}]`, tag.id)
        })
      }

      // Call API
      const response = await productApi.updateWithFormData(product.id, formData)

      if (response.status === 202) {
        toast.success('Cập nhật sản phẩm thành công!')
        onSuccess()
        onOpenChange(false)
      }
    } catch (error: unknown) {
      console.error('Error updating product:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi cập nhật sản phẩm'

      if (error && typeof error === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const err = error as any

        // Check for errors object (validation errors)
        if (err.errors && typeof err.errors === 'object') {
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

  // Reset form when dialog closes
  const handleDialogClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setProductData({
        name: '',
        description: '',
        categoryId: null,
        material: '',
        isActive: true
      })
      setExistingImageUrls([])
      setMediaData({
        newProductImages: [],
        newProductVideo: null,
        removeExistingVideo: false
      })
      setNameError('')
      setMaterialError('')
      setDescriptionError('')
      setCategoryError('')
      setImagesError('')
      setSelectedHashtags([])
      setNewHashtagName('')
      setMentionSearchKeyword('')
      setCategorySearchText('')
      setSelectedCategoryPath([])
      setExpandedNodes(new Set())
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

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Cập nhật sản phẩm</DialogTitle>
        </DialogHeader>

        {loadingProductDetail ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-8 h-8 animate-spin text-green-600' />
            <span className='ml-2 text-gray-600'>Đang tải thông tin sản phẩm...</span>
          </div>
        ) : (
          <div className='space-y-6 mt-4'>
            {/* Product Name */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-name' className='text-sm font-medium'>
                  Tên sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.name) > MAX_NAME_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.name)} / {MAX_NAME_WORDS} từ
                </span>
              </div>
              <Input
                id='update-name'
                placeholder='Nhập tên sản phẩm'
                value={productData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`mt-1 ${nameError ? 'border-red-500' : ''}`}
              />
              {nameError && <p className='mt-1 text-sm text-red-500'>{nameError}</p>}
            </div>

            {/* Material */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-material' className='text-sm font-medium'>
                  Nguyên liệu  <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.material) > MAX_MATERIAL_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.material)} / {MAX_MATERIAL_WORDS} từ
                </span>
              </div>
              <Input
                id='update-material'
                placeholder='Nhập material (ví dụ: string)'
                value={productData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                className={`mt-1 ${materialError ? 'border-red-500' : ''}`}
              />
              {materialError && <p className='mt-1 text-sm text-red-500'>{materialError}</p>}
            </div>

            {/* Category Selection */}
            <div>
              <Label className='text-sm font-medium'>
                Loại sản phẩm <span className='text-red-500'>*</span>
              </Label>
              {categoryError && <p className='mt-1 text-sm text-red-500'>{categoryError}</p>}
              <div className={`mt-2 ${categoryError ? 'border border-red-500 rounded-lg p-2' : ''}`}>
                {categoriesLoading ? (
                  <div className='text-center py-4 text-gray-500 border rounded-lg'>Đang tải danh mục...</div>
                ) : categoryTree.length === 0 ? (
                  <div className='text-center py-4 text-gray-500 border rounded-lg'>Không có danh mục nào</div>
                ) : (
                  <div>
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
                    <div className='border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto bg-white shadow-inner'>
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
            </div>

            {/* Hashtag Section */}
            <div>
              <Label className='text-sm font-medium'>Nhãn dán</Label>
              <div className='mt-2 space-y-3'>
                {/* Thêm Hashtag */}
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

            {/* Description */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label htmlFor='update-description' className='text-sm font-medium'>
                  Mô tả sản phẩm <span className='text-red-500'>*</span>
                </Label>
                <span
                  className={`text-xs ${countWords(productData.description) > MAX_DESCRIPTION_WORDS ? 'text-red-500' : 'text-gray-500'}`}
                >
                  {countWords(productData.description)} / {MAX_DESCRIPTION_WORDS} từ
                </span>
              </div>
              <Textarea
                id='update-description'
                placeholder='Nhập mô tả sản phẩm'
                value={productData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`mt-1 ${descriptionError ? 'border-red-500' : ''}`}
                rows={4}
              />
              {descriptionError && <p className='mt-1 text-sm text-red-500'>{descriptionError}</p>}
            </div>

            {/* Active Status */}
            <div>
              <Label className='text-sm font-medium'>Trạng thái hoạt động</Label>
              <div className='mt-2 flex items-center space-x-4'>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='isActive'
                    checked={productData.isActive === true}
                    onChange={() => handleInputChange('isActive', true)}
                    className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                  />
                  <span className='text-sm text-gray-900'>Hoạt động</span>
                </label>
                <label className='flex items-center space-x-2 cursor-pointer'>
                  <input
                    type='radio'
                    name='isActive'
                    checked={productData.isActive === false}
                    onChange={() => handleInputChange('isActive', false)}
                    className='h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300'
                  />
                  <span className='text-sm text-gray-900'>Tạm dừng</span>
                </label>
              </div>
            </div>

            {/* Existing Images */}
            {existingImageUrls.length > 0 && (
              <div>
                <div className='flex items-center justify-between mb-1'>
                  <Label className='text-sm font-medium'>
                    Ảnh hiện có <span className='text-red-500'>*</span>
                  </Label>
                  <span className='text-xs text-gray-500'>
                    {existingImageUrls.length + mediaData.newProductImages.length} / {MAX_IMAGES} ảnh
                  </span>
                </div>
                <div className='mt-2 grid grid-cols-4 gap-2'>
                  {existingImageUrls.map((imageUrl, index) => (
                    <div key={index} className='relative group'>
                      <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200'>
                        <img
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          className='w-full h-full object-cover'
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-image.png'
                          }}
                        />
                      </div>
                      <button
                        type='button'
                        onClick={() => removeExistingImage(index)}
                        className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Product Images */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-sm font-medium'>
                  Ảnh sản phẩm {existingImageUrls.length === 0 && <span className='text-red-500'>*</span>}
                </Label>
                <span className='text-xs text-gray-500'>
                  {existingImageUrls.length + mediaData.newProductImages.length} / {MAX_IMAGES} ảnh
                </span>
              </div>
              {imagesError && <p className='mb-2 text-sm text-red-500'>{imagesError}</p>}
              {existingImageUrls.length + mediaData.newProductImages.length < MAX_IMAGES ? (
                <div
                  className={`mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer ${imagesError ? 'border-red-500' : ''}`}
                  onClick={() => document.getElementById('new-product-images')?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50')
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50')
                    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
                    if (files.length > 0) {
                      addNewImages(files)
                    }
                  }}
                >
                  <ImageIcon className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                  <p className='text-gray-600 mb-2'>
                    {mediaData.newProductImages.length > 0 ? 'Thêm ảnh khác' : 'Kéo thả hoặc click để tải ảnh lên'}
                  </p>
                  <input
                    type='file'
                    multiple
                    accept='image/*'
                    className='hidden'
                    id='new-product-images'
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        addNewImages(files)
                      }
                      e.target.value = ''
                    }}
                  />
                  <Button type='button' variant='outline' size='sm' className='mt-3'>
                    <Upload className='w-4 h-4 mr-2' />
                    {mediaData.newProductImages.length > 0 ? 'Thêm ảnh' : 'Chọn ảnh'}
                  </Button>
                </div>
              ) : (
                <div className='mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                  <p className='text-sm text-amber-600'>
                    Đã đạt giới hạn tối đa {MAX_IMAGES} hình ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.
                  </p>
                </div>
              )}

              {mediaData.newProductImages.length > 0 && (
                <div className='mt-4 grid grid-cols-4 gap-2'>
                  {mediaData.newProductImages.map((file, index) => (
                    <div key={`${file.name}-${index}`} className='relative group'>
                      <div className='aspect-square rounded-lg overflow-hidden border-2 border-gray-200'>
                        <img
                          src={createPreviewUrl(file)}
                          alt={`New ${index + 1}`}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <button
                        type='button'
                        onClick={() => removeNewImage(index)}
                        className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Video */}
            <div>
              <div className='flex items-center justify-between mb-1'>
                <Label className='text-sm font-medium'>Video sản phẩm</Label>
                <span className='text-xs text-gray-500'>
                  {(fetchedProduct?.productVideo && !mediaData.removeExistingVideo) || mediaData.newProductVideo
                    ? '1 / 1 video'
                    : '0 / 1 video'}
                </span>
              </div>
              <div className='mt-2 space-y-2'>
                {fetchedProduct?.productVideo && !mediaData.removeExistingVideo && (
                  <div className='space-y-2'>
                    <div className='relative group'>
                      <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                        <video
                          src={fetchedProduct.productVideo}
                          controls
                          className='w-full h-full'
                          onError={(e) => {
                            console.error('Error loading video:', e)
                          }}
                        >
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                      <button
                        type='button'
                        onClick={() => setMediaData((prev) => ({ ...prev, removeExistingVideo: true }))}
                        className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    </div>
                    <div className='flex items-center justify-between p-2 bg-gray-50 rounded-lg border'>
                      <div className='flex items-center gap-2'>
                        <Video className='w-4 h-4 text-gray-500' />
                        <span className='text-xs text-gray-600 truncate max-w-md'>{fetchedProduct.productVideo}</span>
                      </div>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setMediaData((prev) => ({ ...prev, removeExistingVideo: true }))}
                      >
                        Xóa video
                      </Button>
                    </div>
                  </div>
                )}

                {(!fetchedProduct?.productVideo || mediaData.removeExistingVideo) && (
                  <div
                    className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer'
                    onClick={() => document.getElementById('product-video')?.click()}
                  >
                    <Video className='w-10 h-10 text-gray-400 mx-auto mb-3' />
                    <p className='text-gray-600 mb-2'>
                      {mediaData.newProductVideo ? 'Thay đổi video' : 'Kéo thả hoặc click để tải video lên'}
                    </p>
                    <input
                      type='file'
                      accept='video/*'
                      className='hidden'
                      id='product-video'
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Validate video file size (50MB max)
                          if (file.size > 50 * 1024 * 1024) {
                            toast.error('Video quá lớn. Tối đa 50MB.')
                            return
                          }
                          setMediaData((prev) => ({
                            ...prev,
                            newProductVideo: file,
                            removeExistingVideo: false
                          }))
                        }
                        e.target.value = ''
                      }}
                    />
                    <Button type='button' variant='outline' size='sm' className='mt-3'>
                      <Upload className='w-4 h-4 mr-2' />
                      {mediaData.newProductVideo ? 'Thay đổi video' : 'Chọn video'}
                    </Button>
                  </div>
                )}

                {mediaData.newProductVideo && (
                  <div className='relative group'>
                    <div className='aspect-video rounded-lg overflow-hidden border-2 border-gray-200'>
                      <video src={createPreviewUrl(mediaData.newProductVideo)} controls className='w-full h-full' />
                    </div>
                    <button
                      type='button'
                      onClick={() => {
                        setMediaData((prev) => ({
                          ...prev,
                          newProductVideo: null,
                          removeExistingVideo: true
                        }))
                      }}
                      className='absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all'
                    >
                      <X className='w-3 h-3' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className='mt-6'>
          <Button variant='outline' onClick={() => handleDialogClose(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleUpdateProduct} disabled={isSubmitting} className='bg-green-600 hover:bg-green-700'>
            {isSubmitting ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                Đang cập nhật...
              </>
            ) : (
              'Cập nhật sản phẩm'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
