import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  Star,
  Eye,
  MapPin,
  Tag,
  FileText,
  Award,
  Play,
  Image as ImageIcon,
  Archive,
  DollarSign,
  Layers,
  Plus,
  Edit,
  CircleFadingArrowUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { message } from 'antd'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent } from '../../../components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../../components/ui/dialog'
import type { Product, VariantGroup, VariantOption } from '../../../types/productType'
import type { ProductCertificateType } from '../../../types/productCertificateType'
import type { ProductStory } from '../../../types/productStoryType'
import { productApi } from '../../../apis/product.api'
import { productCertificateApi } from '../../../apis/productCertificate.api'
import { productStoryApi } from '../../../apis/productStory.api'
import ModalProductDetail from './modalProductDetail'
import ModalVariantProduct from './modalVariantProduct'
import ModalEditVariant from './modalEditVariant'
import ModalEditProduct from './modalEditProduct'
import ProductCertificate from './productCertificate'
import ProductStoryComponent from './productStory'
import { toast } from '../../../utils/toast'
import ProductImageCarousel from '../../../components/ui/product-image-carousel'
import { motion, AnimatePresence } from 'motion/react'

function DetailProductSeller() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  // States for Dialogs
  const [showCreateDetailDialog, setShowCreateDetailDialog] = useState(false)
  const [showCreateVariantDialog, setShowCreateVariantDialog] = useState(false)
  const [variantParentId, setVariantParentId] = useState<string | undefined>(undefined)
  const [selectedParentVariant, setSelectedParentVariant] = useState<VariantOption | null>(null)

  // States for Edit Dialogs
  const [showEditProductDialog, setShowEditProductDialog] = useState(false)
  const [showEditVariantDialog, setShowEditVariantDialog] = useState(false)
  const [editingVariant, setEditingVariant] = useState<VariantOption | null>(null)
  const [editingParentVariant, setEditingParentVariant] = useState<VariantOption | null>(null)

  // States for Edit Modes (for ProductCertificate and ProductStory)
  const [editModes, setEditModes] = useState({
    certificates: false,
    story: false
  })

  // States for validation
  const [certificates, setCertificates] = useState<ProductCertificateType[]>([])
  const [stories, setStories] = useState<ProductStory[]>([])
  const [checkingValidation, setCheckingValidation] = useState(false)

  // State for parent product
  const [parentProduct, setParentProduct] = useState<Product | null>(null)
  const [loadingParent, setLoadingParent] = useState(false)

  // States for confirmation dialogs
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false)
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [showActivateDialog, setShowActivateDialog] = useState(false)

  // States for expanded variants (collapse/expand)
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set())

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('info')
  const [showPopover, setShowPopover] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    const fetchProductDetail = async () => {
      if (!id) {
        message.error('Không tìm thấy ID sản phẩm')
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        const response = await productApi.getById(id)

        if (response.status === 200 && response.data) {
          setProduct(response.data)
        } else {
          message.error('Không thể tải thông tin sản phẩm')
        }
      } catch (error) {
        console.error('Error fetching product detail:', error)
        message.error('Có lỗi xảy ra khi tải thông tin sản phẩm')
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetail()
  }, [id, navigate])

  // Function to refresh validation data (certificates and stories)
  const refreshValidationData = async (skipDelay = false) => {
    if (!id) return

    // Only add delay when adding new data, not when reloading
    if (!skipDelay) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Fetch certificates separately - don't let story errors affect certificates
    try {
      const certResponse = await productCertificateApi.getByProductId(id)
      // Parse giống hệt như trong ProductCertificate component: response.data.data || response.data || []
      const certificatesData = certResponse.data?.data || certResponse.data || []
      const finalCertificates = Array.isArray(certificatesData) ? certificatesData : []
      setCertificates(finalCertificates)
    } catch (error) {
      console.error('Error fetching certificates:', error)
      // Only reset certificates if there's an actual error
      setCertificates([])
    }

    // Fetch stories separately - handle 400 as "no story found" (normal case)
    try {
      const storyResponse = await productStoryApi.getByProductId(id)
      if (storyResponse.status === 200 && storyResponse.data) {
        // Response có thể là single story object hoặc array
        const storyData = storyResponse.data
        if (Array.isArray(storyData)) {
          setStories(storyData)
        } else {
          setStories([storyData])
        }
      } else {
        // No story found - this is normal, not an error
        setStories([])
      }
    } catch (error: unknown) {
      // Handle 400 as "no story found" - this is a normal case, not an error
      const axiosError = error as { response?: { status?: number } }
      if (axiosError?.response?.status === 400) {
        // No story found - this is normal, not an error
        setStories([])
      } else {
        console.error('Error fetching stories:', error)
        setStories([])
      }
    }
  }

  // Fetch certificates and stories for validation - chỉ chạy khi mount hoặc id thay đổi
  useEffect(() => {
    const fetchValidationData = async () => {
      if (!id) return

      try {
        setCheckingValidation(true)
        // Skip delay when initial load/reload
        await refreshValidationData(true)
      } finally {
        setCheckingValidation(false)
      }
    }

    if (id) {
      fetchValidationData()
    }
    // Chỉ chạy khi id thay đổi, không chạy khi product thay đổi để tránh override state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Close popovers when tab changes
  useEffect(() => {
    setShowPopover({})
  }, [activeTab])

  // Fetch parent product if product has parentId
  useEffect(() => {
    const fetchParentProduct = async () => {
      // Check if product has parentId (it might be in the response but not in the type)
      const productWithParent = product as Product & { parentId?: string | null }
      if (!productWithParent?.parentId) {
        setParentProduct(null)
        return
      }

      try {
        setLoadingParent(true)
        const response = await productApi.getById(productWithParent.parentId)
        if (response.status === 200 && response.data) {
          setParentProduct(response.data)
        } else {
          setParentProduct(null)
        }
      } catch (error) {
        console.error('Error fetching parent product:', error)
        setParentProduct(null)
      } finally {
        setLoadingParent(false)
      }
    }

    if (product) {
      fetchParentProduct()
    }
  }, [product])

  const handleBack = () => {
    navigate(-1)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  // Lấy tất cả nhóm tùy chọn để hiển thị
  const getParentVariants = (variantGroups: VariantGroup[]): VariantOption[] => {
    const result: VariantOption[] = []
    variantGroups.forEach((group) => {
      result.push(...group.options)
    })
    return result
  }

  // Kiểm tra variant có phải là nhóm tùy chọn có con không
  const hasChildVariants = (variant: VariantOption): boolean => {
    return Array.isArray(variant.childVariantGroups) && variant.childVariantGroups.length > 0
  }

  // Lấy tất cả phiên bản bán được từ một nhóm tùy chọn
  const getChildVariants = (variant: VariantOption): VariantOption[] => {
    if (!hasChildVariants(variant)) return []
    const result: VariantOption[] = []
    variant.childVariantGroups?.forEach((childGroup) => {
      result.push(...childGroup.options)
    })
    return result
  }

  const hasNumericValue = (value: number | null | undefined): value is number => value !== null && value !== undefined

  // Helper function để kiểm tra có thể chỉnh sửa product info không (trừ variant)
  // Chỉ cho phép chỉnh sửa khi: Draft, Cancelled, Denied (không bao gồm Approved)
  const canEditProductInfo = (): boolean => {
    if (!product) return false
    const status = product.status?.toLowerCase()
    // Có thể chỉnh sửa khi: Draft, Cancelled, Denied
    // Approved không cho phép chỉnh sửa và gửi lại
    return status === 'draft' || status === 'cancelled' || status === 'denied'
  }

  // Helper function để kiểm tra có thể submit không
  // Chỉ cho phép submit khi: Draft, Cancelled, Denied (không bao gồm Approved)
  const canSubmitProduct = (): boolean => {
    if (!product) return false
    const status = product.status?.toLowerCase()
    // Có thể submit khi: Draft, Cancelled, Denied
    // Approved không cho phép gửi duyệt lại
    return status === 'draft' || status === 'cancelled' || status === 'denied'
  }

  // Helper function để kiểm tra có đang ở trạng thái không cho phép chỉnh sửa không
  // Processing, Confirmed, Approved, Rejected: không cho phép chỉnh sửa (trừ variant)
  const isInReadOnlyStatus = (): boolean => {
    if (!product) return false
    const status = product.status?.toLowerCase()
    // Processing, Confirmed, Approved, Rejected: không cho phép chỉnh sửa (trừ variant)
    return status === 'processing' || status === 'confirmed' || status === 'approved' || status === 'rejected'
  }

  const getStatusBadge = (status: string, isActive: boolean) => {
    // Ưu tiên hiển thị status trước, đặc biệt là các trạng thái đặc biệt
    switch (status) {
      case 'Draft':
        return <Badge className='bg-gray-100 text-gray-800'>Nháp</Badge>
      case 'Pending':
        return <Badge className='bg-yellow-100 text-yellow-800'>Chờ duyệt</Badge>
      case 'Processing':
        return <Badge className='bg-yellow-100 text-yellow-800'>Đang xử lý</Badge>
      case 'Confirmed':
        return <Badge className='bg-yellow-100 text-yellow-800'>Đang xử lý</Badge>
      case 'Approved':
        // Nếu Approved nhưng isActive = false thì hiển thị "Dừng hoạt động"
        if (!isActive) {
          return <Badge className='bg-red-100 text-red-800'>Dừng hoạt động</Badge>
        }
        return <Badge className='bg-green-100 text-green-800'>Hoạt động</Badge>
      case 'Rejected':
        return <Badge className='bg-orange-100 text-orange-800'>Đang xử lý</Badge>
      case 'Denied':
        return <Badge className='bg-red-100 text-red-800'>Bị từ chối</Badge>
      case 'Cancelled':
        return <Badge className='bg-gray-100 text-gray-800'>Đã hủy</Badge>
      default:
        // Chỉ kiểm tra isActive khi status không phải là các trạng thái đặc biệt
        if (!isActive) {
          return <Badge className='bg-red-100 text-red-800'>Tạm dừng</Badge>
        }
        return <Badge className='bg-gray-100 text-gray-800'>{status || 'Không xác định'}</Badge>
    }
  }

  const getCertificateStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className='bg-green-100 text-green-800'>Đã duyệt</Badge>
      case 'Pending':
        return <Badge className='bg-yellow-100 text-yellow-800'>Chờ duyệt</Badge>
      case 'Rejected':
        return <Badge className='bg-red-100 text-red-800'>Từ chối</Badge>
      default:
        return <Badge className='bg-gray-100 text-gray-800'>{status}</Badge>
    }
  }

  const handleRefreshProduct = async () => {
    if (!id) return
    try {
      const refreshResponse = await productApi.getById(id)
      if (refreshResponse.status === 200 && refreshResponse.data) {
        setProduct(refreshResponse.data)
      }
      // Refresh validation data (certificates, stories) để cập nhật progress bar
      // Skip delay vì đây là refresh sau khi update product
      await refreshValidationData(true)
    } catch (error) {
      console.error('Error refreshing product:', error)
    }
  }

  // Kiểm tra từng bước chi tiết
  const getSubmitChecklist = () => {
    if (!product) {
      return {
        productName: false,
        productDescription: false,
        productImages: false,
        productCategory: false,
        productMaterial: false,
        productVariant: false,
        certificates: false,
        story: false
      }
    }

    // Kiểm tra có ít nhất 1 product variant
    const parentVariants = product.variantGroups ? getParentVariants(product.variantGroups) : []
    const hasVariant = parentVariants.length > 0

    return {
      productName: !!(product.name && product.name.trim() !== ''),
      productDescription: !!(product.description && product.description.trim() !== ''),
      productImages: !!(product.productImages && product.productImages.length > 0),
      productCategory: !!(product.productCategories && product.productCategories.id),
      productMaterial: !!(product.material && product.material.trim() !== ''),
      productVariant: hasVariant,
      certificates: certificates.length > 0,
      story: stories.some(
        (story) => story.title && story.title.trim() !== '' && story.contents && story.contents.length > 0
      )
    }
  }

  // Kiểm tra trạng thái từng tab
  const getTabStatus = () => {
    const checklist = getSubmitChecklist()
    return {
      info: {
        completed:
          checklist.productName &&
          checklist.productDescription &&
          checklist.productImages &&
          checklist.productCategory &&
          checklist.productMaterial &&
          checklist.productVariant,
        missingItems: [
          !checklist.productName && 'Tên sản phẩm',
          !checklist.productDescription && 'Mô tả sản phẩm',
          !checklist.productImages && 'Hình ảnh sản phẩm (ít nhất 1 ảnh)',
          !checklist.productCategory && 'Danh mục sản phẩm',
          !checklist.productMaterial && 'Xuất xứ (Material)',
          !checklist.productVariant && 'Ít nhất 1 product variant'
        ].filter(Boolean) as string[]
      },
      certificates: {
        completed: checklist.certificates,
        missingItems: !checklist.certificates ? ['Ít nhất 1 chứng nhận'] : []
      },
      story: {
        completed: checklist.story,
        missingItems: !checklist.story ? ['Tiêu đề và nội dung câu chuyện'] : []
      }
    }
  }

  // Kiểm tra điều kiện submit
  const canSubmit = (): boolean => {
    if (!product) return false

    const checklist = getSubmitChecklist()
    return (
      checklist.productName &&
      checklist.productDescription &&
      checklist.productImages &&
      checklist.productCategory &&
      checklist.productMaterial &&
      checklist.productVariant &&
      checklist.certificates &&
      checklist.story
    )
  }

  // Handler mở modal xác nhận submit
  const handleOpenSubmitConfirm = () => {
    if (!canSubmit()) {
      toast.warning('Vui lòng điền đầy đủ thông tin sản phẩm, chứng nhận và câu chuyện trước khi gửi')
      return
    }
    setShowSubmitConfirmDialog(true)
  }

  // Handler submit product (sau khi xác nhận)
  const handleSubmit = async () => {
    if (!id) return

    try {
      setCheckingValidation(true)
      setShowSubmitConfirmDialog(false)
      const response = await productApi.submit(id)
      if (response && response.status === 202) {
        toast.success(response?.message || 'Gửi sản phẩm thành công')
        // Wait a bit for backend to process
        await new Promise((resolve) => setTimeout(resolve, 500))
        // Refresh all data: product, certificates, and stories
        await handleRefreshProduct()
        // Also refresh validation data to update progress bar
        await refreshValidationData(true)
      } else {
        toast.error(response?.message || 'Không thể gửi sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error submitting product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi gửi sản phẩm'
      toast.error(errorMessage)
    } finally {
      setCheckingValidation(false)
    }
  }

  // Handler mở modal xác nhận cancel
  const handleOpenCancelConfirm = () => {
    setShowCancelConfirmDialog(true)
  }

  // Handler cancel product (sau khi xác nhận)
  const handleCancel = async () => {
    if (!id) return

    try {
      setCheckingValidation(true)
      setShowCancelConfirmDialog(false)
      const response = await productApi.cancel(id)
      if (response && response.status === 202) {
        toast.success(response?.message || 'Hủy sản phẩm thành công')
        // Wait a bit for backend to process
        await new Promise((resolve) => setTimeout(resolve, 500))
        // Refresh all data: product, certificates, and stories
        await handleRefreshProduct()
        // Also refresh validation data to update progress bar
        await refreshValidationData(true)
      } else {
        toast.error(response?.message || 'Không thể hủy sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error canceling product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi hủy sản phẩm'
      toast.error(errorMessage)
    } finally {
      setCheckingValidation(false)
    }
  }

  // Handler mở modal xác nhận dừng/kích hoạt
  const handleToggleActiveClick = () => {
    if (product?.isActive) {
      // Nếu đang active thì dừng sản phẩm
      setShowDeleteConfirmDialog(true)
    } else {
      // Nếu đang inactive thì kích hoạt lại
      setShowActivateDialog(true)
    }
  }

  // Handler dừng sản phẩm (sau khi xác nhận)
  const handleDelete = async () => {
    if (!id || !product) return

    try {
      setCheckingValidation(true)
      setShowDeleteConfirmDialog(false)

      // Fetch chi tiết sản phẩm để lấy đầy đủ thông tin
      const productDetail = await productApi.getById(id)
      if (productDetail.status !== 200 || !productDetail.data) {
        toast.error('Không thể tải thông tin sản phẩm')
        return
      }

      const productData = productDetail.data

      // Tạo FormData với tất cả các field
      const formData = new FormData()
      formData.append('Name', productData.name || '')
      formData.append('ProvinceId', productData.provinceId?.toString() || '')
      formData.append('IsActive', 'false') // Thay đổi isActive thành false
      formData.append('RemoveExistingVideo', 'false')

      // Optional fields
      if (productData.description) {
        formData.append('Description', productData.description)
      }

      if (productData.material) {
        formData.append('Material', productData.material)
      }

      if (productData.productCategories?.id) {
        formData.append('CategoryId', productData.productCategories.id)
      }

      // Existing image URLs
      if (productData.productImages && productData.productImages.length > 0) {
        productData.productImages.forEach((url: string) => {
          formData.append('ExistingImageUrls', url)
        })
      }

      const response = await productApi.updateWithFormData(id, formData)

      if (response && (response.status === 200 || response.status === 202)) {
        toast.success('Tạm dừng sản phẩm thành công')
        // Refresh product data
        await handleRefreshProduct()
      } else {
        toast.error(response?.message || 'Không thể tạm dừng sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error deactivating product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi tạm dừng sản phẩm'
      toast.error(errorMessage)
    } finally {
      setCheckingValidation(false)
    }
  }

  // Handler kích hoạt lại sản phẩm (sau khi xác nhận)
  const handleActivateConfirm = async () => {
    if (!id || !product) return

    try {
      setCheckingValidation(true)
      setShowActivateDialog(false)

      // Fetch chi tiết sản phẩm để lấy đầy đủ thông tin
      const productDetail = await productApi.getById(id)
      if (productDetail.status !== 200 || !productDetail.data) {
        toast.error('Không thể tải thông tin sản phẩm')
        return
      }

      const productData = productDetail.data

      // Tạo FormData với tất cả các field
      const formData = new FormData()
      formData.append('Name', productData.name || '')
      formData.append('ProvinceId', productData.provinceId?.toString() || '')
      formData.append('IsActive', 'true') // Thay đổi isActive thành true
      formData.append('RemoveExistingVideo', 'false')

      // Optional fields
      if (productData.description) {
        formData.append('Description', productData.description)
      }

      if (productData.material) {
        formData.append('Material', productData.material)
      }

      if (productData.productCategories?.id) {
        formData.append('CategoryId', productData.productCategories.id)
      }

      // Existing image URLs
      if (productData.productImages && productData.productImages.length > 0) {
        productData.productImages.forEach((url: string) => {
          formData.append('ExistingImageUrls', url)
        })
      }

      const response = await productApi.updateWithFormData(id, formData)

      if (response && (response.status === 200 || response.status === 202)) {
        toast.success('Kích hoạt sản phẩm thành công')
        // Refresh product data
        await handleRefreshProduct()
      } else {
        toast.error(response?.message || 'Không thể kích hoạt sản phẩm')
      }
    } catch (error: unknown) {
      console.error('Error activating product:', error)
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Có lỗi xảy ra khi kích hoạt sản phẩm'
      toast.error(errorMessage)
    } finally {
      setCheckingValidation(false)
    }
  }

  // Handler toggle expanded variant
  const toggleVariantExpanded = (variantId: string) => {
    setExpandedVariants((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(variantId)) {
        newSet.delete(variantId)
      } else {
        newSet.add(variantId)
      }
      return newSet
    })
  }

  // Handlers for edit modes
  const handleToggleEditMode = (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => {
    // Chỉ cho phép toggle edit mode khi có thể chỉnh sửa product info
    if (!canEditProductInfo()) {
      toast.warning('Không thể chỉnh sửa trong trạng thái hiện tại')
      return
    }
    if (section === 'certificates') {
      setEditModes((prev) => ({ ...prev, certificates: !prev.certificates }))
    } else if (section === 'story') {
      setEditModes((prev) => ({ ...prev, story: !prev.story }))
    }
  }

  const handleCancelEdit = (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => {
    if (section === 'certificates') {
      setEditModes((prev) => ({ ...prev, certificates: false }))
    } else if (section === 'story') {
      setEditModes((prev) => ({ ...prev, story: false }))
    }
  }

  const handleSaveSection = async (section: 'basicInfo' | 'variants' | 'story' | 'certificates') => {
    // ProductCertificate và ProductStory tự xử lý save, chỉ cần tắt edit mode
    if (section === 'certificates') {
      setEditModes((prev) => ({ ...prev, certificates: false }))
    } else if (section === 'story') {
      setEditModes((prev) => ({ ...prev, story: false }))
    }
  }

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600'></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='text-gray-600'>Không tìm thấy thông tin sản phẩm</div>
        </div>
      </div>
    )
  }

  // Lấy tất cả nhóm tùy chọn để hiển thị
  const parentVariants = product?.variantGroups ? getParentVariants(product.variantGroups) : []

  // Helper để lấy attributeType từ variantGroup dựa vào variant option
  const getAttributeTypeForVariant = (variant: VariantOption): string | null => {
    if (!product?.variantGroups) return null
    for (const group of product.variantGroups) {
      const found = group.options.find((opt) => opt.id === variant.id)
      if (found) return group.attributeType
    }
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className='p-6 space-y-6'
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className='flex items-center justify-between'
      >
        <div className='flex items-center gap-3'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleBack}
            className='flex items-center gap-2 text-gray-600 hover:text-gray-900'
          >
            <ArrowLeft size={16} />
            Quay lại
          </Button>
          <div className='h-6 w-px bg-gray-300'></div>
          <h1 className='text-2xl font-bold text-gray-900'>Chi tiết sản phẩm</h1>
        </div>
        <div className='flex items-center gap-2'>
          {canEditProductInfo() && (
            <Button
              onClick={() => setShowEditProductDialog(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white'
              variant='outline'
              size='sm'
            >
              <Edit className='w-4 h-4 mr-2' />
              Chỉnh sửa sản phẩm
            </Button>
          )}
          {product?.isActive ? (
            <Button
              onClick={handleToggleActiveClick}
              className='bg-red-600 hover:bg-red-700 text-white'
              variant='outline'
              size='sm'
              disabled={checkingValidation}
            >
              <Archive className='w-4 h-4 mr-2' />
              Dừng sản phẩm
            </Button>
          ) : (
            <Button
              onClick={handleToggleActiveClick}
              className='bg-green-600 hover:bg-green-700 text-white'
              variant='outline'
              size='sm'
              disabled={checkingValidation}
            >
              <Play className='w-4 h-4 mr-2' />
              Kích hoạt lại
            </Button>
          )}
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CircleFadingArrowUp size={20} className='text-green-600' />
              Xác nhận xử lý sản phẩm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-gray-700'>Trạng thái:</span>
                {product && getStatusBadge(product.status, product.isActive)}
              </div>
              <div className='flex items-center gap-2'>
                {/* Hiển thị button Submit khi có thể submit (Draft, Cancelled, Denied) */}
                {canSubmitProduct() && (
                  <Button
                    onClick={handleOpenSubmitConfirm}
                    disabled={!canSubmit() || checkingValidation}
                    className='bg-green-600 hover:bg-green-700 text-white'
                  >
                    <CircleFadingArrowUp size={16} className='mr-2' />
                    Gửi sản phẩm
                  </Button>
                )}
                {/* Hiển thị button Cancel khi status là Pending, Processing hoặc Confirmed */}
                {(product?.status?.toLowerCase() === 'pending' ||
                  product?.status?.toLowerCase() === 'processing' ||
                  product?.status?.toLowerCase() === 'confirmed') && (
                    <Button
                      onClick={handleOpenCancelConfirm}
                      disabled={checkingValidation}
                      variant='destructive'
                      className='bg-red-600 hover:bg-red-700 text-white'
                    >
                      Hủy sản phẩm
                    </Button>
                  )}
              </div>
            </div>
            {/* Hiển thị thông báo khi đang ở trạng thái Processing, Confirmed, Approved, Rejected (không cho phép chỉnh sửa) */}
            {isInReadOnlyStatus() && (
              <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-yellow-800 mb-1'>
                      {product?.status?.toLowerCase() === 'processing'
                        ? 'Đang gửi duyệt, không được chỉnh sửa'
                        : product?.status?.toLowerCase() === 'confirmed'
                          ? 'Sản phẩm đã được xác nhận, không được chỉnh sửa'
                          : product?.status?.toLowerCase() === 'approved'
                            ? 'Sản phẩm đã được duyệt, không được chỉnh sửa'
                            : product?.status?.toLowerCase() === 'rejected'
                              ? 'Đang xử lý, không thể chỉnh sửa'
                              : 'Sản phẩm đã được duyệt, không được chỉnh sửa'}
                    </p>
                    <p className='text-xs text-yellow-700'>
                      {product?.status?.toLowerCase() === 'processing'
                        ? 'Sản phẩm đang được xử lý bởi hệ thống. Bạn có thể hủy để chỉnh sửa hoặc chờ kết quả duyệt.'
                        : product?.status?.toLowerCase() === 'approved'
                          ? 'Sản phẩm đã được duyệt và đang hoạt động. Bạn chỉ có thể chỉnh sửa thông tin biến thể sản phẩm (Product Variant).'
                          : product?.status?.toLowerCase() === 'rejected'
                            ? 'Sản phẩm đang được admin và staff xử lý, chưa đưa ra quyết định cuối cùng. Vui lòng chờ kết quả duyệt.'
                            : 'Bạn chỉ có thể chỉnh sửa thông tin biến thể sản phẩm (Product Variant).'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Hiển thị thông báo hướng dẫn cho trạng thái Denied - có thể chỉnh sửa và gửi lại */}
            {product?.status?.toLowerCase() === 'denied' && (
              <div className='mt-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <div className='flex items-start gap-3'>
                  <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-red-800 mb-1'>Sản phẩm đã bị từ chối</p>
                    <p className='text-xs text-red-700'>
                      Sản phẩm của bạn đã bị từ chối bởi nhân viên. Vui lòng chỉnh sửa thông tin sản phẩm theo ghi chú
                      từ nhân (nếu có) và gửi duyệt lại.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Hiển thị checklist các bước cần hoàn thành - chỉ hiển thị khi có thể submit (Draft, Cancelled, Denied) */}
            {canSubmitProduct() && (
              <div className='mt-4 space-y-3'>
                <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-sm font-semibold text-gray-900'>Hoàn thành các bước khi gửi:</h4>
                    {(() => {
                      const checklist = getSubmitChecklist()
                      const totalSteps = 8
                      const completedSteps = Object.values(checklist).filter((v) => v).length
                      return (
                        <span
                          className={`text-sm font-medium ${completedSteps === totalSteps ? 'text-green-600' : 'text-yellow-600'
                            }`}
                        >
                          {completedSteps}/{totalSteps} bước đã hoàn thành
                        </span>
                      )
                    })()}
                  </div>
                  <div className='space-y-2'>
                    {(() => {
                      const checklist = getSubmitChecklist()
                      const steps = [
                        {
                          key: 'productName',
                          label: 'Tên sản phẩm',
                          completed: checklist.productName
                        },
                        {
                          key: 'productDescription',
                          label: 'Mô tả sản phẩm',
                          completed: checklist.productDescription
                        },
                        {
                          key: 'productImages',
                          label: 'Hình ảnh sản phẩm (ít nhất 1 ảnh)',
                          completed: checklist.productImages
                        },
                        {
                          key: 'productCategory',
                          label: 'Danh mục sản phẩm',
                          completed: checklist.productCategory
                        },
                        {
                          key: 'productMaterial',
                          label: 'Xuất xứ (Material)',
                          completed: checklist.productMaterial
                        },
                        {
                          key: 'productVariant',
                          label: 'Tùy chọn sản phẩm (ít nhất 1 tùy chọn)',
                          completed: checklist.productVariant
                        },
                        {
                          key: 'certificates',
                          label: 'Chứng nhận sản phẩm (ít nhất 1 chứng nhận)',
                          completed: checklist.certificates
                        },
                        {
                          key: 'story',
                          label: 'Câu chuyện sản phẩm (có tiêu đề và nội dung)',
                          completed: checklist.story
                        }
                      ]

                      return steps.map((step) => (
                        <div
                          key={step.key}
                          className={`flex items-center gap-2 p-2 rounded-md transition-colors ${step.completed ? 'bg-green-50' : 'bg-red-50'
                            }`}
                        >
                          {step.completed ? (
                            <CheckCircle2 className='w-5 h-5 text-green-600 flex-shrink-0' />
                          ) : (
                            <XCircle className='w-5 h-5 text-red-500 flex-shrink-0' />
                          )}
                          <span className={`text-sm ${step.completed ? 'text-green-800' : 'text-red-800 font-medium'}`}>
                            {step.label}
                          </span>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
                {!canSubmit() && (
                  <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                    <p className='text-sm text-yellow-800'>
                      <strong>Lưu ý:</strong> Vui lòng hoàn thành tất cả các bước trên để có thể gửi sản phẩm.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Stepper - Hiển thị cho Draft, Pending, Processing, Confirmed, Cancelled, Denied và Approved */}
      {(product?.status?.toLowerCase() === 'draft' ||
        product?.status?.toLowerCase() === 'pending' ||
        product?.status?.toLowerCase() === 'processing' ||
        product?.status?.toLowerCase() === 'confirmed' ||
        product?.status?.toLowerCase() === 'cancelled' ||
        product?.status?.toLowerCase() === 'denied' ||
        product?.status?.toLowerCase() === 'approved') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <Card className='mb-6 overflow-visible'>
              <CardContent className='p-6 overflow-visible'>
                <div className='relative overflow-visible'>
                  {/* Progress Line */}
                  <div className='absolute top-6 left-0 right-0 h-0.5 bg-gray-200'>
                    <div
                      className='h-full bg-green-500 transition-all duration-300'
                      style={{
                        width: `${(() => {
                          const tabStatus = getTabStatus()
                          const completedTabs = [
                            tabStatus.info.completed,
                            tabStatus.certificates.completed,
                            tabStatus.story.completed
                          ].filter(Boolean).length
                          return (completedTabs / 3) * 100
                        })()}%`
                      }}
                    />
                  </div>

                  {/* Progress Nodes */}
                  <div className='relative flex justify-between items-center overflow-visible'>
                    {[
                      { key: 'info', label: 'Thông tin sản phẩm', tab: 'info' },
                      { key: 'certificates', label: 'Chứng nhận', tab: 'certificates' },
                      { key: 'story', label: 'Câu chuyện', tab: 'story' }
                    ].map((step) => {
                      const tabStatus = getTabStatus()
                      const stepStatus = tabStatus[step.key as keyof typeof tabStatus]
                      const isActive = activeTab === step.tab
                      const isCompleted = stepStatus.completed
                      const hasError = !isCompleted && stepStatus.missingItems.length > 0

                      return (
                        <div key={step.key} className='flex flex-col items-center flex-1 relative z-10 overflow-visible'>
                          <button
                            type='button'
                            onClick={() => {
                              setActiveTab(step.tab)
                              // Scroll to tabs if needed
                              setTimeout(() => {
                                document
                                  .getElementById('product-tabs')
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }, 100)
                              // Show popover if there are missing items
                              if (hasError) {
                                setShowPopover((prev) => ({ ...prev, [step.key]: !prev[step.key] }))
                              } else {
                                setShowPopover((prev) => ({ ...prev, [step.key]: false }))
                              }
                            }}
                            className={`relative flex flex-col items-center group overflow-visible ${isActive ? 'scale-110' : ''
                              } transition-transform duration-200`}
                          >
                            {/* Node Circle */}
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isCompleted
                                ? 'bg-green-500 border-green-500 text-white'
                                : hasError
                                  ? 'bg-red-100 border-red-500 text-red-600'
                                  : isActive
                                    ? 'bg-blue-100 border-blue-500 text-blue-600'
                                    : 'bg-gray-100 border-gray-300 text-gray-400'
                                }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className='w-6 h-6' />
                              ) : hasError ? (
                                <AlertCircle className='w-6 h-6' />
                              ) : (
                                <div className='w-4 h-4 rounded-full bg-current' />
                              )}
                            </div>

                            {/* Label */}
                            <span
                              className={`mt-2 text-xs font-medium text-center max-w-[120px] ${isActive
                                ? 'text-blue-600 font-semibold'
                                : isCompleted
                                  ? 'text-green-600'
                                  : hasError
                                    ? 'text-red-600'
                                    : 'text-gray-500'
                                }`}
                            >
                              {step.label}
                            </span>

                            {/* Popover for missing items - chỉ hiển thị khi có thể chỉnh sửa (Draft, Cancelled, Denied) */}
                            {hasError && canSubmitProduct() && (
                              <div
                                className={`absolute bottom-full left-1/2 transform -translate-x-1/2 z-50 mb-2 transition-all duration-200 ${showPopover[step.key]
                                  ? 'opacity-100 pointer-events-auto'
                                  : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto'
                                  }`}
                              >
                                <div className='bg-white border-2 border-red-200 rounded-lg shadow-xl p-3 min-w-[200px] max-w-[250px] relative'>
                                  <div className='text-xs font-semibold text-red-800 mb-2'>Còn thiếu:</div>
                                  <ul className='text-xs text-red-700 space-y-1'>
                                    {stepStatus.missingItems.map((item, idx) => (
                                      <li key={idx} className='flex items-start gap-1'>
                                        <span className='text-red-500 mt-0.5 flex-shrink-0'>•</span>
                                        <span className='break-words'>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                  {/* Arrow pointing down */}
                                  <div className='absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-200'></div>
                                  <div className='absolute -bottom-[1px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-white'></div>
                                </div>
                              </div>
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full' id='product-tabs'>
          {/* Tab 1: Thông tin sản phẩm */}
          <TabsContent value='info' className='space-y-6'>
            {/* Product Information - Horizontal Layout */}
            <div className='space-y-6'>
              {/* Basic Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Package size={20} className='text-green-600' />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                      {/* Left Column */}
                      <div className='space-y-4'>
                        <div>
                          <h2 className='text-2xl font-bold text-gray-900 mb-3'>{product?.name}</h2>
                          <div className='flex flex-wrap items-center gap-4 mb-4'>
                            {product && getStatusBadge(product.status, product.isActive)}
                            <div className='flex items-center gap-1'>
                              <Star className='text-yellow-500 fill-current' size={16} />
                              <span className='font-medium'>{product?.rating?.toFixed(1) || '0.0'}</span>
                              <span className='text-gray-600'>({product?.reviewCount || 0} đánh giá)</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Eye size={16} className='text-gray-500' />
                              <span className='text-gray-600'>{product?.saleCount || 0} lượt bán</span>
                            </div>
                          </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                          <div className='flex items-center gap-2'>
                            <Tag size={16} className='text-green-600 flex-shrink-0' />
                            <div>
                              <span className='text-sm text-gray-600 block'>Loại sản phẩm</span>
                              <span className='text-sm font-medium text-gray-900'>{product?.typeProduct}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <MapPin size={16} className='text-green-600 flex-shrink-0' />
                            <div>
                              <span className='text-sm text-gray-600 block'>Xuất xứ</span>
                              <span className='text-sm font-medium text-gray-900'>{product?.material}</span>
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <FileText size={16} className='text-green-600 flex-shrink-0' />
                            <div>
                              <span className='text-sm text-gray-600 block'>Mã tỉnh</span>
                              <span className='text-sm font-medium text-gray-900'>{product?.provinceId}</span>
                            </div>
                          </div>
                          {product?.productCategories && (
                            <div className='flex items-center gap-2'>
                              <Layers size={16} className='text-green-600 flex-shrink-0' />
                              <div>
                                <span className='text-sm text-gray-600 block'>Danh mục</span>
                                <Badge
                                  variant='outline'
                                  className='bg-green-50 text-green-700 border-green-200 hover:bg-green-100 text-xs'
                                >
                                  {product.productCategories.name}
                                </Badge>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Summary Price */}
                        {product?.summaryPrice && (
                          <div className='pt-4 border-t'>
                            <span className='text-sm text-gray-600 block mb-1'>Tóm tắt giá</span>
                            <p className='text-2xl font-bold text-green-600'>{product.summaryPrice}</p>
                          </div>
                        )}
                      </div>

                      {/* Right Column */}
                      <div className='space-y-4'>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900 mb-2'>Mô tả sản phẩm</h3>
                          <p className='text-gray-700 leading-relaxed'>{product?.description}</p>
                        </div>

                        {product?.staffNote && (
                          <div>
                            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Ghi chú từ staff</h3>
                            <p className='text-gray-700 leading-relaxed'>{product.staffNote}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              {/* Parent Product Information */}
              {parentProduct && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                >
                  <Card className='shadow-lg border-green-200'>
                    <CardHeader className='bg-gradient-to-r from-green-100 to-emerald-100 border-b border-green-200'>
                      <CardTitle className='flex items-center gap-2 text-green-700'>
                        <Package size={20} className='text-green-600' />
                        Sản phẩm liên quan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='pt-6'>
                      {loadingParent ? (
                        <div className='flex items-center justify-center py-8'>
                          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-green-600'></div>
                          <span className='ml-3 text-gray-600'>Đang tải thông tin sản phẩm liên quan...</span>
                        </div>
                      ) : (
                        <div className='space-y-4'>
                          <div className='flex items-start gap-4'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center gap-2 mb-2'>
                                <Package size={16} className='text-green-600 flex-shrink-0' />
                                <h3 className='text-lg font-semibold text-gray-900'>{parentProduct.name}</h3>
                                <Badge
                                  variant='outline'
                                  className='bg-green-50 text-green-700 border-green-200 text-xs'
                                >
                                  {parentProduct.typeProduct || 'Product'}
                                </Badge>
                              </div>
                              {parentProduct.description && (
                                <p className='text-sm text-gray-600 mb-3 line-clamp-2'>{parentProduct.description}</p>
                              )}

                              <div className='mt-3'>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() =>
                                    navigate(`/seller/product-management/detail-product/${parentProduct.id}`)
                                  }
                                  className='text-green-600 border-green-300 hover:bg-green-50'
                                >
                                  <Eye size={14} className='mr-2' />
                                  Xem chi tiết
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Certificates */}
              {product?.productCertificateDTOs && product.productCertificateDTOs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: parentProduct ? 0.55 : 0.5 }}
                >
                  <Card className='shadow-lg'>
                    <CardHeader>
                      <CardTitle className='flex items-center gap-2'>
                        <Award size={20} className='text-green-600' />
                        Chứng nhận sản phẩm
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className='space-y-4'>
                        {product.productCertificateDTOs.map((certificate) => (
                          <div key={certificate.id} className='border border-gray-200 rounded-lg p-4'>
                            <div className='flex items-start justify-between mb-3'>
                              <div className='flex items-center gap-2'>
                                <Award size={16} className='text-green-600' />
                                <span className='font-medium text-gray-900'>
                                  Chứng nhận #{certificate.id.slice(0, 8)}
                                </span>
                              </div>
                              {getCertificateStatusBadge(certificate.status)}
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-3'>
                              <div>
                                <span className='text-sm text-gray-600'>Ngày nộp:</span>
                                <p className='font-medium'>{formatDate(certificate.submittedDate)}</p>
                              </div>
                              <div>
                                <span className='text-sm text-gray-600'>Ngày quyết định:</span>
                                <p className='font-medium'>{formatDate(certificate.decisionDate)}</p>
                              </div>
                            </div>

                            {certificate.staffNotes && (
                              <div className='mb-3'>
                                <span className='text-sm text-gray-600'>Ghi chú từ staff:</span>
                                <p className='text-gray-900'>{certificate.staffNotes}</p>
                              </div>
                            )}

                            {certificate.imageUrl && (
                              <div>
                                <span className='text-sm text-gray-600 block mb-2'>Hình ảnh chứng nhận:</span>
                                <div className='w-32 h-32 bg-gray-100 rounded-lg overflow-hidden'>
                                  <img
                                    src={certificate.imageUrl}
                                    alt='Chứng nhận'
                                    className='w-full h-full object-cover'
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.src = '/placeholder-image.png'
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Statistics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: parentProduct ? 0.65 : 0.6 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Star size={20} className='text-green-600' />
                      Thống kê
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='text-center p-4 bg-green-50 rounded-lg'>
                        <div className='text-2xl font-bold text-green-600'>{product?.saleCount || 0}</div>
                        <div className='text-sm text-gray-600'>Lượt bán</div>
                      </div>
                      <div className='text-center p-4 bg-yellow-50 rounded-lg'>
                        <div className='text-2xl font-bold text-yellow-600'>{product?.rating?.toFixed(1) || '0.0'}</div>
                        <div className='text-sm text-gray-600'>Đánh giá trung bình</div>
                      </div>
                      <div className='text-center p-4 bg-blue-50 rounded-lg'>
                        <div className='text-2xl font-bold text-blue-600'>{product?.reviewCount || 0}</div>
                        <div className='text-sm text-gray-600'>Số lượt đánh giá</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            {/* Product Images - Full Width Horizontal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: parentProduct ? 0.75 : 0.7 }}
            >
              <Card className='shadow-lg'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <ImageIcon size={20} className='text-green-600' />
                    Hình ảnh sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Product Image Carousel */}
                  {product?.productImages && product.productImages.length > 0 ? (
                    <ProductImageCarousel images={product.productImages} productName={product.name} height='320px' />
                  ) : (
                    <div className='w-full h-[350px] flex items-center justify-center bg-gray-100 rounded-lg'>
                      <ImageIcon size={48} className='text-gray-400' />
                    </div>
                  )}

                  {/* Product Video */}
                  {product?.productVideo && (
                    <div className='mt-6'>
                      <div className='flex items-center gap-2 mb-2'>
                        <Play size={16} className='text-green-600' />
                        <span className='text-sm font-medium text-gray-700'>Video sản phẩm</span>
                      </div>
                      <div className='h-[350px] bg-gray-100 rounded-lg overflow-hidden'>
                        <video controls className='w-full h-full' poster={product.productImages?.[0]}>
                          <source src={product.productVideo} type='video/mp4' />
                          Trình duyệt của bạn không hỗ trợ video.
                        </video>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Create Product Detail Button - Show if no variants */}
            {parentVariants.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: parentProduct ? 0.85 : 0.8 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='flex items-center gap-2 text-green-700'>
                        <Archive size={20} />
                        Loại sản phẩm
                      </CardTitle>
                      <Button
                        onClick={() => {
                          setSelectedParentVariant(null)
                          setShowCreateVariantDialog(true)
                        }}
                        className='bg-green-600 hover:bg-green-700 text-white'
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Thêm Tùy chọn sản phẩm
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='text-center py-8 text-gray-500'>
                      <Archive size={48} className='mx-auto mb-4 text-gray-400' />
                      <p>Chưa có tùy chọn sản phẩm. Hãy thêm tùy chọn mới.</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Variants Display */}
            {parentVariants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: parentProduct ? 0.85 : 0.8 }}
              >
                <Card className='shadow-lg'>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='flex items-center gap-2 text-green-700'>
                        <Archive size={20} />
                        Loại sản phẩm
                      </CardTitle>
                      <Button
                        onClick={() => {
                          setSelectedParentVariant(null)
                          setShowCreateVariantDialog(true)
                        }}
                        className='bg-green-600 hover:bg-green-700 text-white'
                        variant='outline'
                        size='sm'
                      >
                        <Plus className='w-4 h-4 mr-2' />
                        Thêm tùy chọn sản phẩm
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-6'>
                      {parentVariants.map((parentVariant, index) => {
                        const attributeType = getAttributeTypeForVariant(parentVariant)
                        const hasChildren = hasChildVariants(parentVariant)
                        const childVariants = getChildVariants(parentVariant)

                        return (
                          <motion.div
                            key={parentVariant.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                            className='border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white'
                          >
                            {/* Nhóm Tùy chọn Header */}
                            <div className='mb-4 pb-4 border-b border-gray-200'>
                              <div className='flex items-center justify-between mb-4'>
                                <h3 className='text-lg font-semibold text-gray-900'>Nhóm tùy chọn</h3>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingVariant(parentVariant)
                                    setEditingParentVariant(null)
                                    setShowEditVariantDialog(true)
                                  }}
                                  variant='outline'
                                  size='sm'
                                  className='flex items-center gap-2'
                                >
                                  <Edit size={14} />
                                  Chỉnh sửa
                                </Button>
                              </div>
                              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                {/* Attribute Type */}
                                {attributeType && (
                                  <div className='space-y-2'>
                                    <label className='text-sm font-medium text-gray-700'>Loại thuộc tính</label>
                                    <div className='p-3 bg-gray-50 rounded-lg border'>
                                      <span className='text-gray-900 font-medium'>{attributeType}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Attribute Name */}
                                {parentVariant.attributeName && (
                                  <div className='space-y-2'>
                                    <label className='text-sm font-medium text-gray-700'>Tên thuộc tính</label>
                                    <div className='p-3 bg-gray-50 rounded-lg border'>
                                      <span className='text-gray-900 font-medium'>{parentVariant.attributeName}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Variant Name */}
                                <div className='space-y-2'>
                                  <label className='text-sm font-medium text-gray-700'>Tên nhóm tùy chọn</label>
                                  <div className='p-3 bg-gray-50 rounded-lg border'>
                                    <span className='text-gray-900 font-medium'>{parentVariant.name}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              {parentVariant.description && (
                                <div className='mt-4 space-y-2'>
                                  <label className='text-sm font-medium text-gray-700'>Mô tả</label>
                                  <div className='p-3 bg-gray-50 rounded-lg border'>
                                    <span className='text-gray-700'>{parentVariant.description}</span>
                                  </div>
                                </div>
                              )}

                              {/* Images */}
                              {parentVariant.productImages && parentVariant.productImages.length > 0 && (
                                <div className='mt-4 space-y-2'>
                                  <label className='text-sm font-medium text-gray-700'>Hình ảnh</label>
                                  <div className='flex gap-2 flex-wrap'>
                                    {parentVariant.productImages.map((image, idx) => (
                                      <div
                                        key={idx}
                                        className='w-20 h-20 rounded-lg overflow-hidden border border-gray-200'
                                      >
                                        <img
                                          src={image}
                                          alt={`${parentVariant.name} ${idx + 1}`}
                                          className='w-full h-full object-cover'
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.src = '/placeholder-image.png'
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Thông tin Phiên bản bán được - Chỉ hiển thị nếu KHÔNG có phiên bản con */}
                              {!hasChildren && (
                                <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                  {/* Price */}
                                  {parentVariant.finalPrice !== null && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                        <DollarSign size={14} />
                                        Giá bán (VNĐ)
                                      </label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-green-600 font-bold'>
                                          {parentVariant.finalPrice.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                        {parentVariant.basePrice !== null &&
                                          parentVariant.basePrice !== parentVariant.finalPrice && (
                                            <span className='ml-2 text-sm text-gray-500 line-through'>
                                              {parentVariant.basePrice.toLocaleString('vi-VN')} VNĐ
                                            </span>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Stock */}
                                  {parentVariant.quantity !== null && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                        <Package size={14} />
                                        Số lượng tồn kho
                                      </label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span
                                          className={`font-medium ${parentVariant.quantity > 20 ? 'text-green-600' : parentVariant.quantity > 10 ? 'text-yellow-600' : 'text-red-600'}`}
                                        >
                                          {parentVariant.quantity} sản phẩm
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Reserved COD */}
                                  {hasNumericValue(parentVariant.reservedCOD) && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700'>Giữ hàng COD</label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-gray-900'>
                                          {parentVariant.reservedCOD.toLocaleString('vi-VN')} sản phẩm
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Reserved Combo */}
                                  {hasNumericValue(parentVariant.reservedCombo) && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700'>Giữ hàng combo</label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-gray-900'>
                                          {parentVariant.reservedCombo.toLocaleString('vi-VN')} sản phẩm
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Weight */}
                                  {parentVariant.weight !== null && (
                                    <div className='space-y-2'>
                                      <label className='text-sm font-medium text-gray-700'>Trọng lượng (g)</label>
                                      <div className='p-3 bg-gray-50 rounded-lg border'>
                                        <span className='text-gray-900'>{parentVariant.weight}g</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Dimensions */}
                                  {parentVariant.length !== null &&
                                    parentVariant.width !== null &&
                                    parentVariant.height !== null && (
                                      <div className='space-y-2'>
                                        <label className='text-sm font-medium text-gray-700'>Kích thước (cm)</label>
                                        <div className='p-3 bg-gray-50 rounded-lg border'>
                                          <span className='text-gray-900'>
                                            {parentVariant.length}x{parentVariant.width}x{parentVariant.height} cm
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                </div>
                              )}

                              {/* Trạng thái Kho - Chỉ hiển thị nếu KHÔNG có phiên bản con */}
                              {!hasChildren && parentVariant.quantity !== null && (
                                <div className='mt-4 pt-4 border-t border-gray-200'>
                                  <div className='flex items-center justify-between'>
                                    <span className='text-sm text-gray-600'>Trạng thái kho:</span>
                                    <Badge
                                      className={
                                        parentVariant.quantity > 20
                                          ? 'bg-green-100 text-green-800'
                                          : parentVariant.quantity > 10
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                      }
                                    >
                                      {parentVariant.quantity > 20
                                        ? 'Còn nhiều'
                                        : parentVariant.quantity > 10
                                          ? 'Sắp hết'
                                          : 'Ít hàng'}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Nút để mở/đóng phiên bản bán được */}
                            {hasChildren && childVariants.length > 0 && (
                              <div className='mt-4 pt-4 border-t border-gray-200'>
                                <button
                                  onClick={() => toggleVariantExpanded(parentVariant.id)}
                                  className='w-full flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-green-600 transition-colors cursor-pointer'
                                >
                                  <span className='text-sm font-medium'>
                                    {expandedVariants.has(parentVariant.id) ? 'Phiên bản bán được' : 'Phiên bản bán được'} (
                                    {childVariants.length})
                                  </span>
                                  <motion.div
                                    animate={{ rotate: expandedVariants.has(parentVariant.id) ? 180 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronDown size={20} className='text-gray-500' />
                                  </motion.div>
                                </button>
                              </div>
                            )}

                            {/* Phiên bản Bán được - Hiển thị nếu có và đã mở */}
                            <AnimatePresence>
                              {hasChildren && childVariants.length > 0 && expandedVariants.has(parentVariant.id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                                  className='mt-4 space-y-4 overflow-hidden'
                                >
                                  <div className='flex items-center gap-2 mb-3'>
                                    <div className='h-px flex-1 bg-gray-200'></div>
                                  </div>
                                  <div className='space-y-3 pl-4 border-l-2 border-green-200'>
                                    {childVariants.map((childVariant) => (
                                      <div
                                        key={childVariant.id}
                                        className='border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors'
                                      >
                                        <div className='flex items-center justify-between mb-3'>
                                          <h4 className='text-sm font-semibold text-gray-700'>Phiên bản bán được</h4>
                                          <Button
                                            onClick={() => {
                                              setEditingVariant(childVariant)
                                              setEditingParentVariant(parentVariant)
                                              setShowEditVariantDialog(true)
                                            }}
                                            variant='outline'
                                            size='sm'
                                            className='flex items-center gap-2'
                                          >
                                            <Edit size={12} />
                                            Chỉnh sửa
                                          </Button>
                                        </div>
                                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                                          {/* Child Variant Name */}
                                          <div className='space-y-2'>
                                            <label className='text-sm font-medium text-gray-700'>Tên phiên bản</label>
                                            <div className='p-2 bg-white rounded border'>
                                              <span className='text-gray-900 text-sm'>{childVariant.name}</span>
                                            </div>
                                          </div>

                                          {/* Child Attribute Name */}
                                          {childVariant.attributeName && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>
                                                Tên thuộc tính
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-gray-900 text-sm'>
                                                  {childVariant.attributeName}
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Price */}
                                          {childVariant.finalPrice !== null && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                                <DollarSign size={14} />
                                                Giá bán (VNĐ)
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-green-600 font-bold text-sm'>
                                                  {childVariant.finalPrice.toLocaleString('vi-VN')} VNĐ
                                                </span>
                                                {childVariant.basePrice !== null &&
                                                  childVariant.basePrice !== childVariant.finalPrice && (
                                                    <span className='ml-2 text-xs text-gray-500 line-through'>
                                                      {childVariant.basePrice.toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                  )}
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Stock */}
                                          {childVariant.quantity !== null && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700 flex items-center gap-1'>
                                                <Package size={14} />
                                                Số lượng tồn kho
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span
                                                  className={`text-sm font-medium ${childVariant.quantity > 20 ? 'text-green-600' : childVariant.quantity > 10 ? 'text-yellow-600' : 'text-red-600'}`}
                                                >
                                                  {childVariant.quantity} sản phẩm
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Reserved COD */}
                                          {hasNumericValue(childVariant.reservedCOD) && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>Giữ hàng COD</label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-gray-900 text-sm'>
                                                  {childVariant.reservedCOD.toLocaleString('vi-VN')} sản phẩm
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Reserved Combo */}
                                          {hasNumericValue(childVariant.reservedCombo) && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>
                                                Giữ hàng combo
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-gray-900 text-sm'>
                                                  {childVariant.reservedCombo.toLocaleString('vi-VN')} sản phẩm
                                                </span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Weight */}
                                          {childVariant.weight !== null && (
                                            <div className='space-y-2'>
                                              <label className='text-sm font-medium text-gray-700'>
                                                Trọng lượng (g)
                                              </label>
                                              <div className='p-2 bg-white rounded border'>
                                                <span className='text-gray-900 text-sm'>{childVariant.weight}g</span>
                                              </div>
                                            </div>
                                          )}

                                          {/* Child Dimensions */}
                                          {childVariant.length !== null &&
                                            childVariant.width !== null &&
                                            childVariant.height !== null && (
                                              <div className='space-y-2'>
                                                <label className='text-sm font-medium text-gray-700'>
                                                  Kích thước (cm)
                                                </label>
                                                <div className='p-2 bg-white rounded border'>
                                                  <span className='text-gray-900 text-sm'>
                                                    {childVariant.length}x{childVariant.width}x{childVariant.height} cm
                                                  </span>
                                                </div>
                                              </div>
                                            )}

                                          {/* Child Images */}
                                          {childVariant.productImages && childVariant.productImages.length > 0 && (
                                            <div className='space-y-2 md:col-span-2 lg:col-span-3'>
                                              <label className='text-sm font-medium text-gray-700'>Hình ảnh</label>
                                              <div className='flex gap-2 flex-wrap'>
                                                {childVariant.productImages.map((image, idx) => (
                                                  <div
                                                    key={idx}
                                                    className='w-16 h-16 rounded-lg overflow-hidden border border-gray-200'
                                                  >
                                                    <img
                                                      src={image}
                                                      alt={`${childVariant.name} ${idx + 1}`}
                                                      className='w-full h-full object-cover'
                                                      onError={(e) => {
                                                        const target = e.target as HTMLImageElement
                                                        target.src = '/placeholder-image.png'
                                                      }}
                                                    />
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Child Stock Status */}
                                        {childVariant.quantity !== null && (
                                          <div className='mt-3 pt-3 border-t border-gray-200'>
                                            <div className='flex items-center justify-between'>
                                              <span className='text-xs text-gray-600'>Trạng thái kho:</span>
                                              <Badge
                                                className={
                                                  childVariant.quantity > 20
                                                    ? 'bg-green-100 text-green-800 text-xs'
                                                    : childVariant.quantity > 10
                                                      ? 'bg-yellow-100 text-yellow-800 text-xs'
                                                      : 'bg-red-100 text-red-800 text-xs'
                                                }
                                              >
                                                {childVariant.quantity > 20
                                                  ? 'Còn nhiều'
                                                  : childVariant.quantity > 10
                                                    ? 'Sắp hết'
                                                    : 'Ít hàng'}
                                              </Badge>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Add Child Variant Button */}
                            <div className='mt-4 pt-4 border-t border-gray-200'>
                              <Button
                                onClick={() => {
                                  setVariantParentId(parentVariant.id)
                                  setSelectedParentVariant(parentVariant)
                                  setShowCreateVariantDialog(true)
                                }}
                                variant='outline'
                                size='sm'
                                className='w-full'
                              >
                                <Plus className='w-4 h-4 mr-2' />
                                {hasChildren ? 'Thêm phiên bản bán được' : 'Tạo phiên bản bán được'}
                              </Button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Summary */}
                    {parentVariants.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 1.0 + parentVariants.length * 0.1 }}
                        className='mt-6 p-4 bg-green-50 rounded-lg border border-green-200'
                      >
                        <h3 className='text-lg font-semibold text-green-800 mb-2'>Tổng quan</h3>
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                          <div>
                            <span className='text-green-700 font-medium'>Tổng số biến thể:</span>
                            <span className='ml-2 text-green-900'>{parentVariants.length} loại</span>
                          </div>
                          <div>
                            <span className='text-green-700 font-medium'>Tổng tồn kho:</span>
                            <span className='ml-2 text-green-900'>
                              {(() => {
                                let total = 0
                                parentVariants.forEach((pv) => {
                                  if (hasChildVariants(pv)) {
                                    const children = getChildVariants(pv)
                                    total += children.reduce((sum, cv) => sum + (cv.quantity || 0), 0)
                                  } else {
                                    total += pv.quantity || 0
                                  }
                                })
                                return `${total} sản phẩm`
                              })()}
                            </span>
                          </div>
                          <div>
                            <span className='text-green-700 font-medium'>Giá từ:</span>
                            <span className='ml-2 text-green-900'>
                              {(() => {
                                const prices: number[] = []
                                parentVariants.forEach((pv) => {
                                  if (hasChildVariants(pv)) {
                                    const children = getChildVariants(pv)
                                    children.forEach((cv) => {
                                      if (cv.finalPrice !== null) prices.push(cv.finalPrice)
                                    })
                                  } else {
                                    if (pv.finalPrice !== null) prices.push(pv.finalPrice)
                                  }
                                })
                                return prices.length > 0
                                  ? `${Math.min(...prices).toLocaleString('vi-VN')} - ${Math.max(...prices).toLocaleString('vi-VN')} VNĐ`
                                  : 'Chưa có giá'
                              })()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Tab 2: Chứng nhận */}
          <TabsContent value='certificates' className='space-y-6'>
            {id && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <ProductCertificate
                  productId={id}
                  editModes={editModes}
                  onToggleEditMode={handleToggleEditMode}
                  onCancelEdit={handleCancelEdit}
                  onSaveSection={handleSaveSection}
                  onRefresh={refreshValidationData}
                  canEdit={canEditProductInfo()}
                />
              </motion.div>
            )}
          </TabsContent>

          {/* Tab 3: Câu chuyện */}
          <TabsContent value='story' className='space-y-6'>
            {id && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <ProductStoryComponent
                  productId={id}
                  isEditMode={editModes.story}
                  onToggleEditMode={handleToggleEditMode}
                  onCancelEdit={handleCancelEdit}
                  onSaveSection={handleSaveSection}
                  onRefresh={refreshValidationData}
                  canEdit={canEditProductInfo()}
                />
              </motion.div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modal Tạo Sản phẩm chính - Chỉ mở khi có thể chỉnh sửa */}
      {canEditProductInfo() && (
        <ModalProductDetail
          open={showCreateDetailDialog}
          onOpenChange={setShowCreateDetailDialog}
          product={product}
          parentId={id}
          onSuccess={handleRefreshProduct}
        />
      )}

      {/* Modal Tạo Tùy chọn Sản phẩm */}
      <ModalVariantProduct
        open={showCreateVariantDialog}
        onOpenChange={(open) => {
          setShowCreateVariantDialog(open)
          if (!open) {
            setVariantParentId(undefined) // Reset parentId when dialog closes
            setSelectedParentVariant(null)
          }
        }}
        product={product}
        parentId={variantParentId || id}
        selectedParentVariant={selectedParentVariant}
        onSuccess={handleRefreshProduct}
      />

      {/* Modal Edit Variant */}
      <ModalEditVariant
        open={showEditVariantDialog}
        onOpenChange={(open) => {
          setShowEditVariantDialog(open)
          if (!open) {
            setEditingVariant(null)
            setEditingParentVariant(null)
          }
        }}
        product={product}
        variant={editingVariant}
        parentVariant={editingParentVariant}
        onSuccess={handleRefreshProduct}
      />

      {/* Modal Edit Product - Chỉ mở khi có thể chỉnh sửa */}
      {canEditProductInfo() && (
        <ModalEditProduct
          open={showEditProductDialog}
          onOpenChange={setShowEditProductDialog}
          product={product}
          onSuccess={handleRefreshProduct}
        />
      )}

      {/* Modal xác nhận gửi sản phẩm */}
      <Dialog open={showSubmitConfirmDialog} onOpenChange={setShowSubmitConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gửi sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gửi sản phẩm <strong>{product?.name}</strong> để duyệt không? Sản phẩm sẽ không được
              chỉnh sửa sau khi gửi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowSubmitConfirmDialog(false)} disabled={checkingValidation}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={checkingValidation}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {checkingValidation ? 'Đang xử lý...' : 'Xác nhận gửi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận hủy sản phẩm */}
      <Dialog open={showCancelConfirmDialog} onOpenChange={setShowCancelConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy sản phẩm <strong>{product?.name}</strong> không? Hành động này sẽ chuyển sản
              phẩm sang trạng thái "Đã hủy".
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowCancelConfirmDialog(false)} disabled={checkingValidation}>
              Không
            </Button>
            <Button
              onClick={handleCancel}
              disabled={checkingValidation}
              variant='destructive'
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {checkingValidation ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận tạm dừng sản phẩm */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận tạm dừng sản phẩm</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tạm dừng sản phẩm <strong>{product?.name}</strong> không?
              <br />
              <span className='text-sm text-gray-500 mt-2 block'>
                Sản phẩm sẽ bị vô hiệu hóa và không còn hiển thị trên hệ thống. Hành động này có thể ảnh hưởng đến các
                đơn hàng liên quan.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDeleteConfirmDialog(false)} disabled={checkingValidation}>
              Hủy
            </Button>
            <Button
              onClick={handleDelete}
              disabled={checkingValidation}
              variant='destructive'
              className='bg-red-600 hover:bg-red-700 text-white'
            >
              {checkingValidation ? 'Đang xử lý...' : 'Xác nhận tạm dừng'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận kích hoạt lại sản phẩm */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-yellow-600'>⚠️ Cảnh báo: Kích hoạt lại sản phẩm</DialogTitle>
            <DialogDescription>
              <div className='space-y-2'>
                <p>
                  Bạn có chắc chắn muốn kích hoạt lại sản phẩm <strong>{product?.name}</strong> không?
                </p>
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3'>
                  <p className='text-sm text-yellow-800 font-medium mb-1'>⚠️ Lưu ý quan trọng:</p>
                  <ul className='text-sm text-yellow-700 list-disc list-inside space-y-1'>
                    <li>Sản phẩm sẽ được hiển thị lại trên hệ thống</li>
                    <li>Khách hàng có thể xem và mua sản phẩm này</li>
                    <li>Hãy đảm bảo sản phẩm vẫn còn tồn kho và thông tin còn chính xác</li>
                    <li>Kiểm tra lại giá cả và thông tin sản phẩm trước khi kích hoạt</li>
                  </ul>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowActivateDialog(false)} disabled={checkingValidation}>
              Hủy
            </Button>
            <Button
              onClick={handleActivateConfirm}
              disabled={checkingValidation}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              {checkingValidation ? 'Đang xử lý...' : 'Xác nhận kích hoạt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default DetailProductSeller
