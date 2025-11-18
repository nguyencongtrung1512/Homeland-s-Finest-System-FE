import { useState, useEffect, useMemo } from 'react'
import { Button } from '../../../components/ui/button'
import { CheckCircle, Truck, ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../contexts/auth.context'
import { cancelOrder, getOrderDetail } from '../../../apis/order.api'
import { purchaseOrder } from '../../../apis/transaction.api'
import { getWalletBalance } from '../../../apis/wallet.api'
import type { Order, OrderItemWithCombo } from '../../../types/orderType'
import type { Transaction as TransactionResponse } from '../../../types/transactionType'
import type { WalletData } from '../../../types/walletType'
import { toast } from '../../../utils/toast'
import CancelOrderDialog from '../../../components/CancelOrderDialog/CancelOrderDialog'

interface CartItem {
  id: string
  productVariantId: string
  name: string
  desc: string
  price: number
  quantity: number
  image: string
  isCombo?: boolean
  comboId?: string
}

interface ComboDisplayGroup {
  comboId: string
  comboName: string
  items: OrderItemWithCombo[]
}

type OrderComboItem = OrderItemWithCombo & { comboId?: string; comboItemId?: string }

const buildComboGroups = (orderData?: Order | null): ComboDisplayGroup[] => {
  if (!orderData?.orderItemsWithCombo || orderData.orderItemsWithCombo.length === 0) {
    return []
  }

  const groups = orderData.orderItemsWithCombo.reduce(
    (acc, comboItem) => {
      const itemWithMeta = comboItem as OrderComboItem
      const comboIdentifier =
        ('comboId' in itemWithMeta ? itemWithMeta.comboId : undefined) || itemWithMeta.comboName || undefined
      const key = comboIdentifier || itemWithMeta.comboItemId || itemWithMeta.id

      if (!acc[key]) {
        acc[key] = {
          comboName: itemWithMeta.comboName || 'Combo đặc biệt',
          items: []
        }
      }

      acc[key].items.push(itemWithMeta)
      return acc
    },
    {} as Record<string, { comboName: string; items: OrderComboItem[] }>
  )

  return Object.entries(groups).map(([comboId, data]) => ({
    comboId,
    comboName: data.comboName,
    items: data.items
  }))
}

const ComboList = ({ combos, title = 'Combo đã áp dụng' }: { combos: ComboDisplayGroup[]; title?: string }) => {
  if (!combos.length) return null

  return (
    <div className='space-y-3'>
      <div className='text-xs font-semibold text-orange-700 uppercase'>{title}</div>
      <div className='space-y-4'>
        {combos.map((combo) => {
          const comboTotal = combo.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
          return (
            <div
              key={combo.comboId}
              className='bg-orange-50 rounded-xl border border-orange-100 p-4 space-y-3 shadow-sm'
            >
              <div className='flex items-center justify-between text-sm font-semibold text-orange-800'>
                <span title={combo.comboName}>{combo.comboName}</span>
                <span className='text-orange-700'>
                  Tổng tiền combo:{' '}
                  <span className='text-base font-semibold'>{comboTotal.toLocaleString('vi-VN')}₫</span>
                </span>
              </div>
              <div className='space-y-2'>
                {combo.items.map((comboItem) => (
                  <div
                    key={comboItem.id}
                    className='flex items-center gap-3 bg-white rounded-lg border border-orange-100 p-2'
                  >
                    <img
                      src={comboItem.orderItemImageUrl || '/api/placeholder/64/64'}
                      alt={comboItem.orderItemName}
                      className='w-12 h-12 rounded-lg object-cover border border-orange-200 flex-shrink-0'
                    />
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-800 truncate'>{comboItem.orderItemName}</p>
                      <p className='text-sm text-gray-500'>Số lượng: {comboItem.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrderCreate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [walletBalance, setWalletBalance] = useState<WalletData | null>(null)
  const [isLoadingWallet, setIsLoadingWallet] = useState(false)
  const buyNowProduct = location.state?.product
  const existingOrder: Order = location.state?.order
  const existingOrders: Order[] = useMemo(() => location.state?.orders || [], [location.state?.orders])
  const selectedAddress = location.state?.selectedAddress
  const paymentMethod = location.state?.paymentMethod || 'COD'

  const params = new URLSearchParams(location.search)
  const orderId = params.get('orderId')
  const [order, setOrder] = useState<Order | null>(existingOrder ?? null)
  const [createdOrders, setCreatedOrders] = useState<Order[]>([])
  const [hasRedirected, setHasRedirected] = useState(false)

  const ordersFromState = useMemo(() => {
    if (createdOrders.length > 0) {
      return createdOrders
    }
    if (existingOrders.length > 0) {
      return existingOrders
    }
    return []
  }, [createdOrders, existingOrders])

  // Update createdOrders when existingOrders change
  useEffect(() => {
    if (existingOrders.length > 0) {
      setCreatedOrders(existingOrders)
    }
  }, [existingOrders])

  useEffect(() => {
    if (!existingOrder && !existingOrders.length && orderId) {
      getOrderDetail(orderId)
        .then(setOrder)
        .catch((err) => {
          console.error('Error fetching order detail:', err)
          toast.error('Không thể tải thông tin đơn hàng')
        })
    }
  }, [existingOrder, existingOrders, orderId])

  // Load wallet balance when payment method is MyWallet
  useEffect(() => {
    const loadWalletBalance = async () => {
      if (paymentMethod === 'MyWallet') {
        setIsLoadingWallet(true)
        try {
          const walletData = await getWalletBalance()
          setWalletBalance(walletData)
        } catch (error) {
          console.error('Error loading wallet balance:', error)
          toast.error('Không thể tải số dư ví. Vui lòng thử lại.')
        } finally {
          setIsLoadingWallet(false)
        }
      } else {
        setWalletBalance(null)
      }
    }

    loadWalletBalance()
  }, [paymentMethod])

  const cartItems: CartItem[] = buyNowProduct
    ? [
      {
        id: buyNowProduct.id,
        productVariantId: buyNowProduct.productVariantId,
        name: buyNowProduct.name,
        desc: buyNowProduct.desc || buyNowProduct.description,
        price: buyNowProduct.price,
        quantity: buyNowProduct.quantity,
        image: buyNowProduct.image
      }
    ]
    : []

  // Get all items from all orders
  const getAllOrderItems = () => {
    // Priority: createdOrders (đã đồng bộ trạng thái) > existingOrders từ Cart > single order > cartItems
    const ordersToUse = ordersFromState

    if (ordersToUse.length > 0) {
      return ordersToUse.flatMap(
        (order) =>
          order.orderItems?.map((it) => ({
            id: it.id,
            productVariantId: it.productVariantId || it.id,
            name: it.orderItemName,
            desc: '',
            price: it.finalPrice || it.totalPrice || 0,
            quantity: it.quantity,
            image: it.orderItemImageUrl,
            storeName: order.fromName,
            orderId: order.id
          })) || []
      )
    }

    if (order && order.orderItems) {
      return order.orderItems.map((it) => ({
        id: it.id,
        productVariantId: it.productVariantId || it.id,
        name: it.orderItemName,
        desc: '',
        price: it.finalPrice || it.totalPrice || 0,
        quantity: it.quantity,
        image: it.orderItemImageUrl,
        storeName: order.fromName,
        orderId: order.id
      }))
    }

    return cartItems.map((item) => ({
      ...item,
      storeName: 'Cửa hàng',
      orderId: ''
    }))
  }

  const displayItems = getAllOrderItems()

  const calculateTotals = () => {
    const ordersToUse = ordersFromState

    if (ordersToUse.length > 0) {
      const totalShipping = ordersToUse.reduce((sum, order) => sum + (order.shipPrice || 0), 0)
      const totalSubtotal = ordersToUse.reduce((sum, order) => sum + (order.totalOrder || 0), 0)
      const totalDiscount = ordersToUse.reduce((sum, order) => sum + (order.totalDiscount || 0), 0)
      const totalInsurance = ordersToUse.reduce((sum, order) => sum + (order.insurance || 0), 0)
      const totalFinal = ordersToUse.reduce((sum, order) => sum + (order.finalPrice || 0), 0)

      return {
        shipping: totalShipping,
        subtotal: totalSubtotal,
        totalDiscount,
        insurance: totalInsurance,
        total: totalFinal
      }
    }

    if (order) {
      return {
        shipping: order.shipPrice || 0,
        subtotal: order.totalOrder || 0,
        totalDiscount: order.totalDiscount || 0,
        insurance: order.insurance || 0,
        total: order.finalPrice || 0
      }
    }

    const subtotal = displayItems.reduce((s, i) => s + i.price * i.quantity, 0)
    return {
      shipping: 0,
      subtotal,
      totalDiscount: 0,
      insurance: 0,
      total: subtotal
    }
  }

  const { shipping, subtotal, totalDiscount, insurance, total } = calculateTotals()

  const comboGroupsByOrder = useMemo(() => {
    if (!ordersFromState.length) return {}
    return ordersFromState.reduce(
      (acc, orderItem) => {
        acc[orderItem.id] = buildComboGroups(orderItem)
        return acc
      },
      {} as Record<string, ComboDisplayGroup[]>
    )
  }, [ordersFromState])

  const singleOrderComboGroups = useMemo(() => buildComboGroups(order), [order])

  const applyTransactionStatuses = (transactions: TransactionResponse[]) => {
    if (!transactions || transactions.length === 0) {
      return
    }

    const sourceOrders = ordersFromState.length > 0 ? ordersFromState : order ? [order] : []
    if (sourceOrders.length > 0) {
      const transactionStatusMap = new Map(transactions.map((tx) => [tx.orderId, tx.orderStatus]))
      const updatedOrders = sourceOrders.map((sourceOrder) => {
        const newStatus = transactionStatusMap.get(sourceOrder.id)
        return newStatus ? { ...sourceOrder, status: newStatus as Order['status'] } : sourceOrder
      })
      setCreatedOrders(updatedOrders)
    }

    setOrder((prevOrder) => {
      if (!prevOrder) {
        return prevOrder
      }
      const newStatus = transactions.find((tx) => tx.orderId === prevOrder.id)?.orderStatus
      return newStatus ? { ...prevOrder, status: newStatus as Order['status'] } : prevOrder
    })
  }

  const handlePayment = async () => {
    try {
      const ordersToProcess = ordersFromState.length > 0 ? ordersFromState : []

      if (ordersToProcess.length > 0) {
        // Có orders rồi, chỉ cần thanh toán
        await handlePurchasePayment()
      } else if (order) {
        // Có single order, thanh toán
        await handlePurchasePayment()
      } else {
        // Không có orders, không thể thanh toán
        toast.error('Không có đơn hàng để thanh toán. Vui lòng quay lại giỏ hàng.')
      }
    } catch (error: unknown) {
      console.error('Error in payment process:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi xử lý thanh toán'
      toast.error(errorMessage)
    }
  }

  const handlePurchasePayment = async () => {
    setIsSubmitting(true)

    try {
      // Lấy orders để thanh toán
      const ordersToProcess = ordersFromState.length > 0 ? ordersFromState : order ? [order] : []

      if (ordersToProcess.length === 0) {
        toast.error('Không tìm thấy đơn hàng để thanh toán')
        return
      }

      // Lấy orderIds để gửi API
      const orderIds = ordersToProcess.map((order) => order.id)

      if (paymentMethod === 'COD') {
        // COD: Call purchaseOrder API to create transaction
        const transactions = await purchaseOrder({ orderIds })
        applyTransactionStatuses(transactions)

        toast.success(`Đơn hàng COD đã được tạo! Chờ giao hàng ${ordersToProcess.length} đơn.`)

        // Join all orderIds with comma for multiple orders
        const orderIdsParam = orderIds.join(',')
        console.log('🔍 DEBUG OrderCreate: COD redirect with orderIds:', orderIdsParam)

        navigate(`/cart/invoice?orderId=${orderIdsParam}&status=success&type=cod&multiple=true`)
      } else if (paymentMethod === 'Banking') {
        // Banking: Cần xử lý thanh toán
        const transactions = await purchaseOrder({ orderIds })
        applyTransactionStatuses(transactions)
        const firstTransaction = transactions[0]

        toast.success('Đang chuyển đến trang thanh toán...')
        if (firstTransaction.checkoutUrl) {
          window.location.href = firstTransaction.checkoutUrl
        } else {
          // Join all orderIds with comma for multiple orders
          const orderIdsParam = orderIds.join(',')
          console.log('🔍 DEBUG OrderCreate: Banking redirect with orderIds:', orderIdsParam)

          navigate(`/cart/invoice?orderId=${orderIdsParam}&status=pending&type=banking&multiple=true`)
        }
      } else if (paymentMethod === 'MyWallet') {
        // MyWallet: Thanh toán bằng ví
        if (!walletBalance) {
          toast.error('Không thể tải thông tin ví. Vui lòng thử lại.')
          return
        }

        // Kiểm tra số dư
        if (walletBalance.availableBalance < total) {
          toast.error(
            `Số dư không đủ! Số dư hiện tại: ${walletBalance.availableBalance.toLocaleString('vi-VN')}₫. Tổng thanh toán: ${total.toLocaleString('vi-VN')}₫`
          )
          return
        }

        // Gọi API thanh toán bằng wallet
        const transactions = await purchaseOrder({ orderIds })
        applyTransactionStatuses(transactions)

        toast.success(`Thanh toán thành công từ ví! Đã thanh toán ${ordersToProcess.length} đơn hàng.`)

        // Join all orderIds with comma for multiple orders
        const orderIdsParam = orderIds.join(',')
        console.log('🔍 DEBUG OrderCreate: MyWallet redirect with orderIds:', orderIdsParam)

        navigate(`/cart/invoice?orderId=${orderIdsParam}&status=success&type=wallet&multiple=true`)
      }
    } catch (error: unknown) {
      console.error('Error processing payment:', error)
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi xử lý thanh toán'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (hasRedirected) {
      return
    }

    const relevantOrders = ordersFromState.length > 0 ? ordersFromState : order ? [order] : []
    if (relevantOrders.length === 0) {
      return
    }

    const hasPendingPayment = relevantOrders.some((item) => item.status === 'PendingPayment')
    const hasNotYetStatus = relevantOrders.some((item) => item.status === 'NotYet')

    if (hasPendingPayment && !hasNotYetStatus) {
      toast.info('Đơn hàng đang chờ thanh toán. Vui lòng tiếp tục trong mục Đơn hàng của tôi.')
      navigate('/profile/orders', {
        replace: true,
        state: { focusStatus: 'PendingPayment', from: 'order-create' }
      })
      setHasRedirected(true)
    }
  }, [hasRedirected, navigate, order, ordersFromState])

  const handleCancelOrder = () => {
    if (!order) {
      toast.error('Không tìm thấy thông tin đơn hàng để hủy')
      return
    }
    setShowCancelDialog(true)
  }

  const handleConfirmCancel = async (reason: string) => {
    if (!user?.userId) return

    setIsCancelling(true)
    try {
      const ordersToCancel = ordersFromState.length > 0 ? ordersFromState : []

      if (ordersToCancel.length > 0) {
        // Hủy nhiều orders
        let totalCancelled = 0
        for (const orderToCancel of ordersToCancel) {
          const cancelledOrders = await cancelOrder(orderToCancel.id, user.userId, reason)
          totalCancelled += cancelledOrders.length
        }
        toast.success(`Đã hủy ${totalCancelled} đơn hàng thành công!`)
      } else if (order) {
        // Hủy single order
        const cancelledOrders = await cancelOrder(order.id, user.userId, reason)
        toast.success(`Đã hủy ${cancelledOrders.length} đơn hàng thành công!`)
      }

      setShowCancelDialog(false)
      navigate('/products')
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error).message ||
        'Có lỗi xảy ra khi hủy đơn hàng'
      toast.error(errorMessage)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-6xl mx-auto px-4'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>Xác nhận đơn hàng</h1>
          <p className='text-gray-600'>Vui lòng kiểm tra lại thông tin đơn hàng trước khi thanh toán</p>

          {buyNowProduct && !existingOrder && (
            <div className='mt-2 p-2 bg-blue-100 rounded-lg'>
              <p className='text-sm text-blue-800'>Đơn hàng từ Mua ngay</p>
            </div>
          )}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-6'>
            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-xl font-semibold mb-6 flex items-center gap-2'>
                <CheckCircle className='w-5 h-5 text-green-600' />
                Sản phẩm trong đơn hàng
              </h2>

              <div className='space-y-6'>
                {ordersFromState.length > 0
                  ? ordersFromState.map((order, orderIndex) => (
                    <div key={order.id} className='space-y-4'>
                      <div className='flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                        <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                        <span className='font-semibold text-blue-800'>
                          Đơn hàng {orderIndex + 1}: {order.fromName}
                        </span>
                      </div>

                      <div className='space-y-3'>
                        {order.orderItems?.map((item) => (
                          <div
                            key={item.id}
                            className='flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors'
                          >
                            <img
                              src={item.orderItemImageUrl}
                              alt={item.orderItemName}
                              className='w-12 h-12 rounded-lg object-cover border flex-shrink-0'
                            />
                            <div className='flex-1 min-w-0'>
                              <h3 className='font-semibold text-gray-900 mb-1'>{item.orderItemName}</h3>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm text-gray-500'>Số lượng: {item.quantity}</span>
                                <span className='text-lg font-bold text-green-700'>
                                  {(item.finalPrice || 0).toLocaleString('vi-VN')}₫
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {comboGroupsByOrder[order.id]?.length > 0 && (
                        <div className='ml-4'>
                          <ComboList combos={comboGroupsByOrder[order.id]} title='Combo trong đơn' />
                        </div>
                      )}

                      <div className='ml-4 p-3 bg-gray-50 rounded-lg border border-gray-200'>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>Tạm tính:</span>
                          <span>{order.totalOrder.toLocaleString('vi-VN')}₫</span>
                        </div>
                        <div className='flex justify-between text-sm text-gray-600 mb-1'>
                          <span>Phí vận chuyển:</span>
                          <span>{order.shipPrice.toLocaleString('vi-VN')}₫</span>
                        </div>
                        {order.insurance && order.insurance > 0 && (
                          <div className='flex justify-between text-sm text-gray-600 mb-1'>
                            <span>Tiền bảo hiểm:</span>
                            <span>{order.insurance.toLocaleString('vi-VN')}₫</span>
                          </div>
                        )}
                        <div className='flex justify-between text-sm font-semibold text-gray-900 border-t pt-1'>
                          <span>Thành tiền:</span>
                          <span className='text-green-700'>{order.finalPrice.toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>
                    </div>
                  ))
                  : displayItems.map((item) => (
                    <div
                      key={item.id}
                      className='flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors'
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className='w-12 h-12 rounded-lg object-cover border flex-shrink-0'
                      />
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-gray-900 mb-1'>{item.name}</h3>
                        <p className='text-sm text-gray-600 whitespace-pre-line mb-2'>{item.desc}</p>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full'>
                            Số lượng: {item.quantity}
                          </span>
                          <span className='text-lg font-bold text-green-700'>
                            {item.price.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                {ordersFromState.length === 0 && singleOrderComboGroups.length > 0 && (
                  <ComboList combos={singleOrderComboGroups} title='Combo trong đơn' />
                )}
              </div>

              {ordersFromState.length === 0 && (
                <div className='mt-6 pt-4 border-t border-gray-200'>
                  <div className='flex items-center justify-between text-sm text-gray-600'>
                    <div className='flex items-center gap-2'>
                      <Truck className='w-4 h-4' />
                      <span>Phí vận chuyển</span>
                    </div>
                    <span className='font-medium'>
                      {order ? `${shipping.toLocaleString('vi-VN')}₫` : 'Sẽ được tính bởi hệ thống'}
                    </span>
                  </div>
                  {order && (
                    <div className='mt-2 text-xs text-gray-500'>
                      💡 Phí ship được tính tự động bởi GHN dựa trên địa chỉ giao hàng
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className='bg-white rounded-lg shadow-sm border p-6'>
              <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
                <Truck className='w-5 h-5 text-green-600' />
                Địa chỉ giao hàng
              </h2>
              <div className='flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <AlertCircle className='w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5' />
                <div className='flex-1'>
                  <p className='text-sm text-gray-700 font-medium mb-1'>Địa chỉ đã chọn</p>
                  {selectedAddress ? (
                    <div>
                      <p className='text-sm text-gray-600'>
                        {selectedAddress.streetAddress}, {selectedAddress.ward}, {selectedAddress.district},{' '}
                        {selectedAddress.province}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className='text-sm text-red-600 font-medium'>⚠️ Chưa chọn địa chỉ giao hàng</p>
                      <p className='text-xs text-gray-500 mt-1'>Vui lòng quay lại giỏ hàng để chọn địa chỉ</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className='lg:col-span-1'>
            <div className='sticky top-4 space-y-4'>
              <div className='bg-white rounded-lg shadow-sm border p-6'>
                <h3 className='font-semibold text-lg mb-4'>Tổng kết đơn hàng</h3>

                <div className='space-y-3 mb-4'>
                  {ordersFromState.length > 0 ? (
                    <>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Tạm tính ({displayItems.length} sản phẩm)</span>
                        <span className='font-medium'>{subtotal.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className='flex justify-between text-sm text-green-600'>
                          <span>Giảm giá</span>
                          <span className='font-medium'>-{totalDiscount.toLocaleString('vi-VN')}₫</span>
                        </div>
                      )}
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Tổng phí vận chuyển ({ordersFromState.length} đơn)</span>
                        <span className='font-medium'>{shipping.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {insurance > 0 && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-600'>Tiền bảo hiểm</span>
                          <span className='font-medium'>{insurance.toLocaleString('vi-VN')}₫</span>
                        </div>
                      )}

                      {/* Breakdown of shipping fees by store */}
                      <div className='ml-4 space-y-1'>
                        {ordersFromState.map((order, index) => (
                          <div key={order.id} className='flex justify-between text-xs text-gray-500'>
                            <span>
                              Đơn {index + 1} ({order.fromName}):
                            </span>
                            <span>{order.shipPrice.toLocaleString('vi-VN')}₫</span>
                          </div>
                        ))}
                      </div>
                      <div className='border-t pt-3 mt-3'>
                        <div className='flex justify-between text-lg font-bold'>
                          <span>Tổng cộng</span>
                          <span className='text-green-700'>{total.toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Tạm tính ({displayItems.length} sản phẩm)</span>
                        <span className='font-medium'>{subtotal.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {totalDiscount > 0 && (
                        <div className='flex justify-between text-sm text-green-600'>
                          <span>Giảm giá</span>
                          <span className='font-medium'>-{totalDiscount.toLocaleString('vi-VN')}₫</span>
                        </div>
                      )}
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Phí vận chuyển</span>
                        <span className='font-medium'>{shipping.toLocaleString('vi-VN')}₫</span>
                      </div>
                      {insurance > 0 && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-600'>Tiền bảo hiểm</span>
                          <span className='font-medium'>{insurance.toLocaleString('vi-VN')}₫</span>
                        </div>
                      )}
                      <div className='border-t pt-3 mt-3'>
                        <div className='flex justify-between text-lg font-bold'>
                          <span>Tổng cộng</span>
                          <span className='text-green-700'>{total.toLocaleString('vi-VN')}₫</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className='mb-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200'>
                  <p className='text-xs text-gray-600 mb-1'>Phương thức thanh toán:</p>
                  <p className='text-sm font-semibold text-gray-900'>
                    {paymentMethod === 'COD'
                      ? '💵 Thanh toán khi nhận hàng (COD)'
                      : paymentMethod === 'Banking'
                        ? '💳 Chuyển khoản ngân hàng'
                        : '💼 Thanh toán bằng ví của tôi'}
                  </p>
                  {paymentMethod === 'MyWallet' && (
                    <div className='mt-2 pt-2 border-t border-blue-200'>
                      {isLoadingWallet ? (
                        <div className='flex items-center gap-2 text-xs text-gray-600'>
                          <Loader2 className='w-3 h-3 animate-spin' />
                          <span>Đang tải số dư...</span>
                        </div>
                      ) : walletBalance ? (
                        <div className='space-y-1'>
                          <div className='flex justify-between text-xs'>
                            <span className='text-gray-600'>Số dư khả dụng:</span>
                            <span
                              className={`font-semibold ${walletBalance.availableBalance >= total ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                              {walletBalance.availableBalance.toLocaleString('vi-VN')}₫
                            </span>
                          </div>
                          {walletBalance.availableBalance < total && (
                            <p className='text-xs text-red-600'>⚠️ Số dư không đủ để thanh toán</p>
                          )}
                        </div>
                      ) : (
                        <p className='text-xs text-red-600'>Không thể tải số dư ví</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className='space-y-3'>
                  <Button
                    onClick={handlePayment}
                    disabled={
                      isSubmitting ||
                      isLoadingWallet ||
                      (ordersFromState.length === 0 && !order && !existingOrder) ||
                      (paymentMethod === 'MyWallet' && walletBalance !== null && walletBalance.availableBalance < total)
                    }
                    className='w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all disabled:bg-gray-400 disabled:cursor-not-allowed'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className='w-4 h-4 mr-2 py-5' />
                        {ordersFromState.length > 0
                          ? paymentMethod === 'COD'
                            ? 'Đặt hàng'
                            : paymentMethod === 'MyWallet'
                              ? 'Thanh toán bằng ví'
                              : 'Thanh toán'
                          : order || existingOrder
                            ? paymentMethod === 'COD'
                              ? 'Đặt hàng'
                              : paymentMethod === 'MyWallet'
                                ? 'Thanh toán bằng ví'
                                : 'Thanh toán'
                            : paymentMethod === 'COD'
                              ? 'Đặt hàng ngay'
                              : paymentMethod === 'MyWallet'
                                ? 'Thanh toán bằng ví'
                                : 'Thanh toán ngay'}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelOrder}
                    variant='outline'
                    disabled={isSubmitting || isCancelling}
                    className='w-full border-red-600 text-red-600 hover:bg-red-50 transition-all'
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Đang hủy...
                      </>
                    ) : (
                      'Hủy đặt hàng'
                    )}
                  </Button>
                </div>
              </div>

              {/* Security features */}
              <div className='bg-white rounded-lg shadow-sm border p-4'>
                <h4 className='font-semibold text-sm mb-3 text-gray-700'>Cam kết của chúng tôi</h4>
                <div className='space-y-3 text-sm'>
                  <div className='flex items-center gap-3'>
                    <ShieldCheck className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Thanh toán an toàn & bảo mật</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Truck className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Giao hàng toàn quốc</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
                    <span className='text-gray-700'>Hỗ trợ 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        isOpen={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
        orderInfo={order ? { orderId: order.id, userId: user?.userId || '', totalAmount: order.finalPrice } : undefined}
        isLoading={isCancelling}
      />
    </div>
  )
}

export default OrderCreate
