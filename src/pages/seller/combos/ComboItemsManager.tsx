import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Plus, Edit, Trash2, Package, Eye, EyeOff, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-toastify'
import { getVariantsBySellerId } from '../../../apis/combo.api'
import { useAuth } from '../../../contexts/auth.context'
import type { ComboItem, CreateComboItemRequest, UpdateComboItemRequest } from '../../../types/combo.type'

// Interface cho variant response từ API
interface VariantResponse {
  productVariantId: string
  productName: string
  variantName: string
  quantity: number
  basePrice?: number
  finalPrice?: number
  isActive: boolean
  imageUrl?: string
  createdAt: string
  updatedAt: string
  availableQuantity?: number
  reservedCod?: number
  reservedCombo?: number
  length?: number
  width?: number
  height?: number
  weight?: number
}

interface ComboItemsManagerProps {
  items: ComboItem[]
  canEdit: boolean
  comboStatus?: 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Processing' | 'Cancelled'
  onAddItem: (itemData: CreateComboItemRequest) => Promise<void>
  onUpdateItem: (itemId: string, itemData: UpdateComboItemRequest) => Promise<void>
  onRemoveItem: (itemId: string) => Promise<void>
}

function ComboItemsManager({
  items,
  canEdit,
  comboStatus,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: ComboItemsManagerProps) {
  const { user } = useAuth()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ComboItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [variants, setVariants] = useState<VariantResponse[]>([])
  const [loadingVariants, setLoadingVariants] = useState(false)

  // Form data for new item
  const [newItemData, setNewItemData] = useState<CreateComboItemRequest>({
    productVariantId: '',
    comboItemName: '',
    price: 0,
    quantity: 1
  })

  // Form data for editing item
  const [editItemData, setEditItemData] = useState<UpdateComboItemRequest>({
    productVariantId: '',
    comboItemName: '',
    price: 0,
    quantity: 1,
    isActive: true
  })

  // Load variants when component mounts
  useEffect(() => {
    const loadVariants = async () => {
      if (!user?.userId) return

      setLoadingVariants(true)
      try {
        const variantsData = await getVariantsBySellerId(user.userId)
        setVariants(variantsData as unknown as VariantResponse[])
      } catch {
        toast.error('Không thể tải danh sách sản phẩm')
      } finally {
        setLoadingVariants(false)
      }
    }

    loadVariants()
  }, [user?.userId])

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewItemData((prev) => ({
      ...prev,
      [name]: name === 'basePrice' || name === 'finalPrice' || name === 'quantity' ? Number(value) : value
    }))
  }

  const handleEditItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditItemData((prev) => ({
      ...prev,
      [name]: name === 'basePrice' || name === 'finalPrice' || name === 'quantity' ? Number(value) : value
    }))
  }

  const handleVariantSelect = (variantId: string, isEdit = false) => {
    const selectedVariant = variants.find((v) => v.productVariantId === variantId)
    if (!selectedVariant) return

    const variantData = {
      productVariantId: variantId,
      comboItemName: `${selectedVariant.productName || 'Sản phẩm'} - ${selectedVariant.variantName}`,
      basePrice: selectedVariant.basePrice || 0,
      finalPrice: selectedVariant.finalPrice || selectedVariant.basePrice || 0,
      quantity: 1
    }

    if (isEdit) {
      setEditItemData((prev) => ({
        ...prev,
        ...variantData,
        isActive: prev.isActive
      }))
    } else {
      setNewItemData(variantData)
    }
  }

  const handleAddItem = async () => {
    if (!newItemData.productVariantId || !newItemData.comboItemName) {
      toast.error('Vui lòng điền đầy đủ thông tin sản phẩm')
      return
    }

    if (newItemData.price <= 0 || newItemData.quantity <= 0) {
      toast.error('Giá và số lượng phải lớn hơn 0')
      return
    }

    setSaving(true)
    try {
      await onAddItem(newItemData)
      setNewItemData({
        productVariantId: '',
        comboItemName: '',
        price: 0,
        quantity: 1
      })
      setShowAddDialog(false)
    } catch {
      toast.error('Có lỗi xảy ra khi thêm sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return

    if (!editItemData.productVariantId || !editItemData.comboItemName) {
      toast.error('Vui lòng điền đầy đủ thông tin sản phẩm')
      return
    }

    if (editItemData.price <= 0 || editItemData.quantity <= 0) {
      toast.error('Giá và số lượng phải lớn hơn 0')
      return
    }

    setSaving(true)
    try {
      await onUpdateItem(editingItem.id, editItemData)
      setShowEditDialog(false)
      setEditingItem(null)
      // Không hiển thị toast ở đây vì updateCombo sẽ hiển thị
    } catch (error) {
      console.error('Error updating item:', error)
      // Không hiển thị toast error ở đây vì updateCombo sẽ hiển thị
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi combo?')) {
      setSaving(true)
      try {
        await onRemoveItem(itemId)
      } catch (error) {
        console.error('Error removing item:', error)
        // Không hiển thị toast error ở đây vì updateCombo sẽ hiển thị
      } finally {
        setSaving(false)
      }
    }
  }

  const handleToggleItemVisibility = async (item: ComboItem) => {
    const newData: UpdateComboItemRequest = {
      productVariantId: item.productVariantId,
      comboItemName: item.comboItemName,
      price: item.price,
      quantity: item.quantity,
      isActive: !item.isActive
    }

    setSaving(true)
    try {
      await onUpdateItem(item.id, newData)
    } catch (error) {
      console.error('Error toggling item visibility:', error)
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (item: ComboItem) => {
    setEditingItem(item)
    setEditItemData({
      productVariantId: item.productVariantId,
      comboItemName: item.comboItemName,
      price: item.price,
      quantity: item.quantity,
      isActive: item.isActive
    })
    setShowEditDialog(true)
  }

  const activeItemsCount = items.filter((item) => item.isActive).length
  const totalItemsCount = items.length

  const isEditable = canEdit && comboStatus !== 'Approved' && comboStatus !== 'Processing'

  const getStatusMessage = () => {
    switch (comboStatus) {
      case 'Pending':
        return {
          message: 'Combo đang chờ duyệt, vẫn có thể chỉnh sửa',
          type: 'warning' as const
        }
      case 'Approved':
        return {
          message: 'Combo đã được duyệt, không thể chỉnh sửa',
          type: 'success' as const
        }
      case 'Rejected':
        return {
          message: 'Combo bị từ chối, có thể chỉnh sửa',
          type: 'error' as const
        }
      case 'Processing':
        return {
          message: 'Combo đang được xử lý, không thể chỉnh sửa',
          type: 'warning' as const
        }
      case 'Cancelled':
        return {
          message: 'Combo đã bị hủy, có thể chỉnh sửa',
          type: 'error' as const
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <Card>
      <CardHeader>
        {statusInfo && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              statusInfo.type === 'warning'
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : statusInfo.type === 'success'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            <div className='flex items-center gap-2'>
              {statusInfo.type === 'warning' && <Clock className='w-4 h-4' />}
              {statusInfo.type === 'success' && <CheckCircle className='w-4 h-4' />}
              {statusInfo.type === 'error' && <XCircle className='w-4 h-4' />}
              <span className='font-medium'>{statusInfo.message}</span>
            </div>
          </div>
        )}

        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Sản phẩm trong combo ({activeItemsCount}/{totalItemsCount} items)
          </CardTitle>
          {isEditable && (
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className='bg-green-600 hover:bg-green-700' size='sm'>
                  <Plus className='w-4 h-4 mr-2' />
                  Thêm sản phẩm
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-md'>
                <DialogHeader>
                  <DialogTitle>Thêm sản phẩm vào combo</DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='productVariantId'>Chọn sản phẩm *</Label>
                    <Select
                      value={newItemData.productVariantId}
                      onValueChange={(value) => handleVariantSelect(value, false)}
                      disabled={loadingVariants}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingVariants ? 'Đang tải...' : 'Chọn sản phẩm'} />
                      </SelectTrigger>
                      <SelectContent>
                        {!variants || variants.length === 0 ? (
                          <div className='p-4 text-center text-gray-500'>
                            {loadingVariants ? 'Đang tải sản phẩm...' : 'Không có sản phẩm nào'}
                          </div>
                        ) : (
                          (() => {
                            console.log('Rendering variants for dropdown:', variants)
                            const filteredVariants = variants.filter((variant) => variant && variant.productVariantId)
                            console.log('Filtered variants for dropdown:', filteredVariants)
                            return filteredVariants.map((variant) => (
                              <SelectItem key={variant.productVariantId} value={variant.productVariantId}>
                                <div className='flex items-center gap-2'>
                                  {variant.imageUrl && (
                                    <img
                                      src={variant.imageUrl}
                                      alt={variant.variantName}
                                      className='w-8 h-8 object-cover rounded'
                                    />
                                  )}
                                  <div>
                                    <div className='font-medium'>{variant.productName || 'Sản phẩm'}</div>
                                    <div className='text-sm text-gray-500'>{variant.variantName || 'Variant'}</div>
                                    <div className='text-sm text-green-600 font-semibold'>
                                      {(variant.finalPrice || variant.basePrice || 0).toLocaleString()}₫
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          })()
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='comboItemName'>Tên hiển thị *</Label>
                    <Input
                      id='comboItemName'
                      name='comboItemName'
                      value={newItemData.comboItemName}
                      onChange={handleNewItemChange}
                      placeholder='Tên sẽ tự động điền khi chọn sản phẩm'
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='price'>Giá *</Label>
                      <Input
                        id='price'
                        name='price'
                        type='number'
                        value={newItemData.price}
                        onChange={handleNewItemChange}
                        placeholder='0'
                        min='0'
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='quantity'>Số lượng *</Label>
                    <Input
                      id='quantity'
                      name='quantity'
                      type='number'
                      value={newItemData.quantity}
                      onChange={handleNewItemChange}
                      placeholder='1'
                      min='1'
                    />
                  </div>

                  <div className='flex gap-2 pt-4'>
                    <Button variant='outline' onClick={() => setShowAddDialog(false)} className='flex-1'>
                      Hủy
                    </Button>
                    <Button
                      onClick={handleAddItem}
                      disabled={saving}
                      className='flex-1 bg-green-600 hover:bg-green-700'
                    >
                      {saving ? 'Đang thêm...' : 'Thêm'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className='text-center py-8'>
            <Package className='w-12 h-12 mx-auto text-gray-400 mb-4' />
            <p className='text-gray-500 mb-4'>Chưa có sản phẩm nào trong combo</p>
            {isEditable && (
              <Button onClick={() => setShowAddDialog(true)} className='bg-green-600 hover:bg-green-700'>
                <Plus className='w-4 h-4 mr-2' />
                Thêm sản phẩm đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className='space-y-4'>
            {items.map((item) => (
              <div
                key={item.id}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${!item.isActive ? 'opacity-50' : ''}`}
              >
                <div className='flex gap-4'>
                  {item.comboItemImageUrl ? (
                    <img
                      src={item.comboItemImageUrl}
                      alt={item.comboItemName}
                      className='w-16 h-16 object-cover rounded-lg'
                    />
                  ) : (
                    <div className='w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center'>
                      <Package className='w-8 h-8 text-gray-400' />
                    </div>
                  )}
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>{item.comboItemName}</h4>
                    <p className='text-sm text-gray-600'>
                      {item.productName} - {item.variantName}
                    </p>
                    <p className='text-sm text-gray-500'>{item.storeName}</p>
                    <div className='flex justify-between items-center mt-2'>
                      <span className='text-sm text-gray-600'>Số lượng: {item.quantity}</span>
                      <div className='text-right'>
                        <div className='text-sm text-gray-500 line-through'>
                          {(item.basePrice * item.quantity).toLocaleString()}₫
                        </div>
                        <div className='font-semibold text-green-600'>
                          {(item.finalPrice * item.quantity).toLocaleString()}₫
                        </div>
                      </div>
                    </div>
                    {!item.isActive && (
                      <Badge variant='secondary' className='mt-2 bg-gray-100 text-gray-800'>
                        Đã ẩn
                      </Badge>
                    )}
                  </div>
                  {isEditable && (
                    <div className='flex flex-col gap-2'>
                      <Button variant='ghost' size='sm' onClick={() => openEditDialog(item)} disabled={saving}>
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleToggleItemVisibility(item)}
                        disabled={saving}
                        className={
                          item.isActive
                            ? 'text-yellow-600 hover:text-yellow-700'
                            : 'text-green-600 hover:text-green-700'
                        }
                      >
                        {item.isActive ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={saving}
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Item Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-productVariantId'>Chọn sản phẩm *</Label>
                <Select
                  value={editItemData.productVariantId}
                  onValueChange={(value) => handleVariantSelect(value, true)}
                  disabled={loadingVariants}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingVariants ? 'Đang tải...' : 'Chọn sản phẩm'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!variants || variants.length === 0 ? (
                      <div className='p-4 text-center text-gray-500'>
                        {loadingVariants ? 'Đang tải sản phẩm...' : 'Không có sản phẩm nào'}
                      </div>
                    ) : (
                      variants
                        .filter((variant) => variant && variant.productVariantId)
                        .map((variant) => (
                          <SelectItem key={variant.productVariantId} value={variant.productVariantId}>
                            <div className='flex items-center gap-2'>
                              {variant.imageUrl && (
                                <img
                                  src={variant.imageUrl}
                                  alt={variant.variantName}
                                  className='w-8 h-8 object-cover rounded'
                                />
                              )}
                              <div>
                                <div className='font-medium'>{variant.productName || 'Sản phẩm'}</div>
                                <div className='text-sm text-gray-500'>{variant.variantName || 'Variant'}</div>
                                <div className='text-sm text-green-600 font-semibold'>
                                  {(variant.finalPrice || variant.basePrice || 0).toLocaleString()}₫
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit-comboItemName'>Tên hiển thị *</Label>
                <Input
                  id='edit-comboItemName'
                  name='comboItemName'
                  value={editItemData.comboItemName}
                  onChange={handleEditItemChange}
                  placeholder='Tên sẽ tự động điền khi chọn sản phẩm'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='edit-price'>Giá *</Label>
                  <Input
                    id='edit-price'
                    name='price'
                    type='number'
                    value={editItemData.price}
                    onChange={handleEditItemChange}
                    placeholder='0'
                    min='0'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='edit-quantity'>Số lượng *</Label>
                <Input
                  id='edit-quantity'
                  name='quantity'
                  type='number'
                  value={editItemData.quantity}
                  onChange={handleEditItemChange}
                  placeholder='1'
                  min='1'
                />
              </div>

              <div className='flex gap-2 pt-4'>
                <Button variant='outline' onClick={() => setShowEditDialog(false)} className='flex-1'>
                  Hủy
                </Button>
                <Button onClick={handleUpdateItem} disabled={saving} className='flex-1 bg-green-600 hover:bg-green-700'>
                  {saving ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

export default ComboItemsManager
