import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Badge } from '../../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Plus, Edit, Trash2, Package, Clock, CheckCircle, XCircle } from 'lucide-react'
import { toast } from '../../../utils/toast'
import { productApi } from '../../../apis/product.api'
import type { ComboItem, CreateComboItemRequest, UpdateComboItemRequest } from '../../../types/combo.type'
import type { ProductForCombo, ProductSku } from '../../../apis/product.api'

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
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ComboItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState<ProductForCombo[]>([])
  const [skus, setSkus] = useState<ProductSku[]>([])
  const [editSkus, setEditSkus] = useState<ProductSku[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSkus, setLoadingSkus] = useState(false)
  const [loadingEditSkus, setLoadingEditSkus] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedEditProductId, setSelectedEditProductId] = useState<string>('')

  // Form data for new item
  const [newItemData, setNewItemData] = useState<CreateComboItemRequest>({
    productVariantId: '',
    quantity: 1
  })

  // Form data for editing item
  const [editItemData, setEditItemData] = useState<UpdateComboItemRequest>({
    productVariantId: '',
    quantity: 1,
    isActive: true
  })

  // Load products when component mounts
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true)
      try {
        const response = await productApi.getForCombo()
        setProducts(response.data || [])
      } catch {
        toast.error('Không thể tải danh sách sản phẩm')
      } finally {
        setLoadingProducts(false)
      }
    }

    loadProducts()
  }, [])

  // Load SKUs when product is selected (for add dialog)
  useEffect(() => {
    const loadSkus = async () => {
      if (!selectedProductId || !showAddDialog) {
        if (!selectedProductId) {
          setSkus([])
        }
        return
      }

      setLoadingSkus(true)
      try {
        const response = await productApi.getSkus(selectedProductId)
        setSkus(response.data || [])
      } catch {
        toast.error('Không thể tải danh sách SKU')
        setSkus([])
      } finally {
        setLoadingSkus(false)
      }
    }

    loadSkus()
  }, [selectedProductId, showAddDialog])

  // Load SKUs when product is selected (for edit dialog)
  useEffect(() => {
    const loadSkusForEdit = async () => {
      if (!selectedEditProductId || !showEditDialog) {
        if (!selectedEditProductId) {
          setEditSkus([])
        }
        return
      }

      setLoadingEditSkus(true)
      try {
        const response = await productApi.getSkus(selectedEditProductId)
        setEditSkus(response.data || [])
      } catch {
        toast.error('Không thể tải danh sách SKU')
        setEditSkus([])
      } finally {
        setLoadingEditSkus(false)
      }
    }

    loadSkusForEdit()
  }, [selectedEditProductId, showEditDialog])

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewItemData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }))
  }

  const handleEditItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditItemData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value
    }))
  }

  const handleProductSelect = (productId: string, isEdit = false) => {
    if (isEdit) {
      setSelectedEditProductId(productId)
      setEditItemData((prev) => ({
        ...prev,
        productVariantId: '' // Reset variant when product changes
      }))
    } else {
      setSelectedProductId(productId)
      setNewItemData((prev) => ({
        ...prev,
        productVariantId: '' // Reset variant when product changes
      }))
    }
  }

  const handleSkuSelect = (skuId: string, isEdit = false) => {
    if (isEdit) {
      setEditItemData((prev) => ({
        ...prev,
        productVariantId: skuId
      }))
    } else {
      setNewItemData((prev) => ({
        ...prev,
        productVariantId: skuId
      }))
    }
  }

  const handleAddItem = async () => {
    if (!selectedProductId) {
      toast.error('Vui lòng chọn sản phẩm')
      return
    }

    if (!newItemData.productVariantId) {
      toast.error('Vui lòng chọn SKU')
      return
    }

    if (newItemData.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0')
      return
    }

    setSaving(true)
    try {
      await onAddItem(newItemData)
      toast.success('Thêm sản phẩm vào combo thành công')
      setNewItemData({
        productVariantId: '',
        quantity: 1
      })
      setSelectedProductId('')
      setSkus([])
      setShowAddDialog(false)
    } catch {
      toast.error('Có lỗi xảy ra khi thêm sản phẩm')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateItem = async () => {
    if (!editingItem) return

    if (!selectedEditProductId) {
      toast.error('Vui lòng chọn sản phẩm')
      return
    }

    if (!editItemData.productVariantId) {
      toast.error('Vui lòng chọn SKU')
      return
    }

    if (editItemData.quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0')
      return
    }

    setSaving(true)
    try {
      await onUpdateItem(editingItem.id, editItemData)
      setShowEditDialog(false)
      setEditingItem(null)
      setSelectedEditProductId('')
      setSkus([])
      // Không hiển thị toast ở đây vì updateCombo sẽ hiển thị
    } catch (error) {
      console.error('Error updating item:', error)
      // Không hiển thị toast error ở đây vì updateCombo sẽ hiển thị
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItemClick = (itemId: string) => {
    setItemToDelete(itemId)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return

    setSaving(true)
    try {
      await onRemoveItem(itemToDelete)
      setShowDeleteDialog(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error removing item:', error)
      // Không hiển thị toast error ở đây vì updateCombo sẽ hiển thị
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = async (item: ComboItem) => {
    setEditingItem(item)

    // Reset product selection - user will need to select product again
    // This is because we don't have productId in ComboItem
    setSelectedEditProductId('')
    setEditItemData({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      isActive: item.isActive
    })
    setEditSkus([])

    setShowEditDialog(true)
  }

  // Reset states when dialogs close
  useEffect(() => {
    if (!showAddDialog) {
      setSelectedProductId('')
      setNewItemData({
        productVariantId: '',
        quantity: 1
      })
      setSkus([])
    }
  }, [showAddDialog])

  useEffect(() => {
    if (!showEditDialog) {
      setSelectedEditProductId('')
      setEditingItem(null)
      setEditItemData({
        productVariantId: '',
        quantity: 1,
        isActive: true
      })
      setEditSkus([])
    }
  }, [showEditDialog])

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
            className={`mb-4 p-3 rounded-lg ${statusInfo.type === 'warning'
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
                    <Label htmlFor='productId'>Chọn sản phẩm *</Label>
                    <Select
                      value={selectedProductId}
                      onValueChange={(value) => handleProductSelect(value, false)}
                      disabled={loadingProducts}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingProducts ? 'Đang tải...' : 'Chọn sản phẩm'} />
                      </SelectTrigger>
                      <SelectContent>
                        {!products || products.length === 0 ? (
                          <div className='p-4 text-center text-gray-500'>
                            {loadingProducts ? 'Đang tải sản phẩm...' : 'Không có sản phẩm nào'}
                          </div>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              <div className='flex items-center gap-2'>
                                {product.thumbnailUrl && (
                                  <img
                                    src={product.thumbnailUrl}
                                    alt={product.name}
                                    className='w-8 h-8 object-cover rounded'
                                  />
                                )}
                                <div>
                                  <div className='font-medium'>{product.name}</div>
                                  <div className='text-sm text-gray-500'>{product.categoryName}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedProductId && (
                    <div className='space-y-2'>
                      <Label htmlFor='skuId'>Chọn SKU *</Label>
                      <Select
                        value={newItemData.productVariantId}
                        onValueChange={(value) => handleSkuSelect(value, false)}
                        disabled={loadingSkus || !selectedProductId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={loadingSkus ? 'Đang tải SKU...' : 'Chọn SKU'} />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingSkus ? (
                            <div className='p-4 text-center text-gray-500'>Đang tải SKU...</div>
                          ) : !skus || skus.length === 0 ? (
                            <div className='p-4 text-center text-gray-500'>Không có SKU nào</div>
                          ) : (
                            skus
                              .filter((sku) => sku.isActive)
                              .map((sku) => (
                                <SelectItem key={sku.id} value={sku.id}>
                                  <div className='flex items-center justify-between'>
                                    <div>
                                      <div className='font-medium'>{sku.name}</div>
                                      <div className='text-sm text-gray-500'>
                                        Tồn kho: {sku.quantity} | Giá: {sku.finalPrice.toLocaleString()}₫
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                        className='text-red-600 hover:text-red-700'
                        onClick={() => handleRemoveItemClick(item.id)}
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
                <Label htmlFor='edit-productId'>Chọn sản phẩm *</Label>
                <Select
                  value={selectedEditProductId}
                  onValueChange={(value) => handleProductSelect(value, true)}
                  disabled={loadingProducts}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProducts ? 'Đang tải...' : 'Chọn sản phẩm'} />
                  </SelectTrigger>
                  <SelectContent>
                    {!products || products.length === 0 ? (
                      <div className='p-4 text-center text-gray-500'>
                        {loadingProducts ? 'Đang tải sản phẩm...' : 'Không có sản phẩm nào'}
                      </div>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className='flex items-center gap-2'>
                            {product.thumbnailUrl && (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className='w-8 h-8 object-cover rounded'
                              />
                            )}
                            <div>
                              <div className='font-medium'>{product.name}</div>
                              <div className='text-sm text-gray-500'>{product.categoryName}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedEditProductId && (
                <div className='space-y-2'>
                  <Label htmlFor='edit-skuId'>Chọn SKU *</Label>
                  <Select
                    value={editItemData.productVariantId}
                    onValueChange={(value) => handleSkuSelect(value, true)}
                    disabled={loadingEditSkus || !selectedEditProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingEditSkus ? 'Đang tải SKU...' : 'Chọn SKU'} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEditSkus ? (
                        <div className='p-4 text-center text-gray-500'>Đang tải SKU...</div>
                      ) : !editSkus || editSkus.length === 0 ? (
                        <div className='p-4 text-center text-gray-500'>Không có SKU nào</div>
                      ) : (
                        editSkus
                          .filter((sku) => sku.isActive)
                          .map((sku) => (
                            <SelectItem key={sku.id} value={sku.id}>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <div className='font-medium'>{sku.name}</div>
                                  <div className='text-sm text-gray-500'>
                                    Tồn kho: {sku.quantity} | Giá: {sku.finalPrice.toLocaleString()}₫
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa sản phẩm này khỏi combo? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)} disabled={saving}>
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={saving}
                className='bg-red-600 hover:bg-red-700 text-white'
              >
                {saving ? 'Đang xóa...' : 'Xóa'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

export default ComboItemsManager
