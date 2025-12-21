import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCart, type CartItem } from '../../contexts/cart.context'
import { useAuth } from '../../contexts/auth.context'
import { Button } from '../../components/ui/button'
import path from '../../constants/path'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { getComboById } from '../../apis/combo.api'

// Interface cho combo group
interface ComboGroup {
  id: string // comboId
  name: string // "Combo" hoặc combo name từ API
  image: string // từ item đầu tiên
  quantity: number // quantity của combo
  price: number // tổng giá của combo
  isCombo: true
  items: CartItem[] // các items trong combo
}

// Union type cho display item (có thể là CartItem hoặc ComboGroup)
type DisplayItem = CartItem | ComboGroup

function Header() {
  const navigate = useNavigate()

  // useCart hook - will throw error if CartProvider is not available
  // All routes should go through App.tsx which has CartProvider, so this should not happen
  const { cart, cartCount } = useCart()

  const { user, isAuthenticated, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [comboImages, setComboImages] = useState<Record<string, string>>({}) // Map comboId -> thumbnailUrl
  const fetchedComboIdsRef = useRef<Set<string>>(new Set()) // Track các comboId đã fetch
  const dropdownRef = useRef<HTMLDivElement>(null)
  const cartContainerRef = useRef<HTMLDivElement>(null)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const displayCount = cartCount || (cart.length > 0 ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0)

  // Xử lý đóng dropdown với animation
  const handleCloseDropdown = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setShowDropdown(false)
      setIsClosing(false)
    }, 300) // Thời gian animation slide-up
  }, [])

  // Xử lý mở dropdown khi click vào icon
  const handleCartClick = () => {
    if (showDropdown) {
      handleCloseDropdown()
    } else {
      setShowDropdown(true)
      setIsClosing(false)
    }
  }

  // Xử lý click outside để đóng dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartContainerRef.current && !cartContainerRef.current.contains(event.target as Node)) {
        // Kiểm tra nếu click vào backdrop
        const target = event.target as HTMLElement
        if (target.classList.contains('cart-backdrop')) {
          handleCloseDropdown()
        } else if (!dropdownRef.current?.contains(target)) {
          handleCloseDropdown()
        }
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    if (showDropdown || showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      // Ngăn scroll khi popup mở
      if (showDropdown) {
        document.body.style.overflow = 'hidden'
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [showDropdown, showUserDropdown, handleCloseDropdown])

  // Fetch combo images khi có combo mới
  useEffect(() => {
    const fetchComboImages = async () => {
      if (!cart || cart.length === 0) return

      // Lấy danh sách các comboId cần fetch
      const comboIds = new Set<string>()
      cart.forEach((item) => {
        if (item.isCombo && item.comboId) {
          comboIds.add(item.comboId)
        }
      })

      // Lọc các comboId chưa được fetch (sử dụng ref để tránh dependency loop)
      const comboIdsToFetch: string[] = []
      comboIds.forEach((comboId) => {
        if (!fetchedComboIdsRef.current.has(comboId)) {
          comboIdsToFetch.push(comboId)
          fetchedComboIdsRef.current.add(comboId)
        }
      })

      // Fetch images cho các combo chưa có
      if (comboIdsToFetch.length > 0) {
        const fetchPromises = comboIdsToFetch.map(async (comboId) => {
          try {
            const response = await getComboById(comboId)
            const comboData = response?.data?.data ?? response?.data
            const thumbnailUrl = comboData?.thumbnailUrl
            if (thumbnailUrl) {
              return { comboId, thumbnailUrl }
            }
          } catch (error) {
            console.error(`Error fetching combo image for ${comboId}:`, error)
            // Remove from ref nếu fetch thất bại để có thể retry sau
            fetchedComboIdsRef.current.delete(comboId)
          }
          return null
        })

        const results = await Promise.all(fetchPromises)
        const newComboImages: Record<string, string> = {}
        results.forEach((result) => {
          if (result) {
            newComboImages[result.comboId] = result.thumbnailUrl
          }
        })

        if (Object.keys(newComboImages).length > 0) {
          setComboImages((prev) => ({ ...prev, ...newComboImages }))
        }
      }
    }

    fetchComboImages()
  }, [cart])

  const handleLogout = async () => {
    await logout()
    setShowUserDropdown(false)
    navigate(path.home)
  }

  // Function để nhóm các items có cùng comboId thành combo
  const groupCartItems = useMemo((): DisplayItem[] => {
    if (!cart || cart.length === 0) return []

    const comboMap = new Map<string, CartItem[]>()
    const regularItems: CartItem[] = []

    // Phân loại items: combo items và regular items
    cart.forEach((item) => {
      if (item.isCombo && item.comboId) {
        // Item thuộc combo
        if (!comboMap.has(item.comboId)) {
          comboMap.set(item.comboId, [])
        }
        comboMap.get(item.comboId)!.push(item)
      } else {
        // Item thường
        regularItems.push(item)
      }
    })

    // Tạo combo groups từ comboMap
    const comboGroups: ComboGroup[] = Array.from(comboMap.entries()).map(([comboId, items]) => {
      // Tính tổng giá của combo (tổng price * quantity của tất cả items)
      const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Lấy quantity từ item đầu tiên (tất cả items trong combo có cùng quantity)
      const quantity = items[0]?.quantity || 1

      // Lấy hình ảnh từ comboImages (thumbnailUrl của combo) hoặc fallback về ảnh item đầu tiên
      const image = comboImages[comboId] || items[0]?.image || ''

      // Lấy comboName từ item đầu tiên (tất cả items trong combo có cùng comboName)
      const comboName = items[0]?.comboName || 'Combo'

      return {
        id: comboId,
        name: comboName,
        image,
        quantity,
        price: totalPrice,
        isCombo: true,
        items
      }
    })

    // Kết hợp combo groups và regular items
    return [...comboGroups, ...regularItems]
  }, [cart, comboImages])

  return (
    <div className='w-full fixed top-0 left-0 z-50 bg-[#ecf2ea] border-b border-gray-500'>
      <div className='mx-auto flex w-full max-w-8xl items-center justify-between px-4 py-3 gap-4 flex-nowrap'>
        {/* Logo + Tên */}
        <Link to={path.homePage} className='flex items-center gap-2 ml-20 flex-shrink-0'>
          <svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>
            <path d='M24 24H0V0H24V24Z' stroke='#ecf2ea' />
            <path
              d='M22 3.25C22 7.6875 18.6953 11.3555 14.4141 11.9219C14.1367 9.83594 13.2188 7.95312 11.8633 6.48047C13.3594 3.80859 16.2188 2 19.5 2H20.75C21.4414 2 22 2.55859 22 3.25ZM2 5.75C2 5.05859 2.55859 4.5 3.25 4.5H4.5C9.33203 4.5 13.25 8.41797 13.25 13.25V14.5V20.75C13.25 21.4414 12.6914 22 12 22C11.3086 22 10.75 21.4414 10.75 20.75V14.5C5.91797 14.5 2 10.582 2 5.75Z'
              fill='#F4A261'
            />
          </svg>
          <h3 className='text-xl font-bold text-[#2D5016] whitespace-nowrap'>Tinh Hoa Quê Nhà</h3>
        </Link>

        {/* Menu */}
        <nav className='hidden md:flex items-center gap-8 text-[#2D5016] font-medium'>
          <Link to={path.product} className='hover:text-green-700 transition whitespace-nowrap'>
            Sản phẩm
          </Link>
          <Link to={path.homepage3D} className='hover:text-green-700 transition whitespace-nowrap'>
            Về chúng tôi
          </Link>
          <Link to={path.discover} className='hover:text-green-700 transition whitespace-nowrap'>
            Khám phá đặc sản
          </Link>
          <Link to={path.blog} className='hover:text-green-700 transition whitespace-nowrap'>
            Blog
          </Link>
        </nav>

        {/* Right side actions + CTV link */}
        <div className='flex items-center gap-4 flex-nowrap'>
          {/* Cart */}
          <div
            ref={cartContainerRef}
            className='hidden md:inline text-sm text-[#2D5016] hover:text-orange-500 transition-colors font-medium whitespace-nowrap ml-2 relative'
          >
            <button
              type='button'
              className='relative focus:outline-none cursor-pointer'
              aria-label='Xem giỏ hàng'
              onClick={handleCartClick}
            >
              <ShoppingCart size={25} />
              {displayCount > 0 && (
                <span className='absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center pointer-events-auto'>
                  {displayCount}
                </span>
              )}
            </button>
            {/* Backdrop overlay */}
            {showDropdown && (
              <div
                className={`fixed inset-0 bg-black/30 z-[60] cart-backdrop ${isClosing ? 'animate-fade-out' : 'animate-fade-in'
                  }`}
                onClick={handleCloseDropdown}
              />
            )}
            {/* Dropdown hiển thị sản phẩm trong giỏ */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className={`fixed left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 w-[600px] max-w-[90vw] max-h-[80vh] bg-white shadow-2xl rounded-xl border border-gray-200 z-[70] flex flex-col ${isClosing ? 'animate-slide-up' : 'animate-slide-down'
                  }`}
              >
                <div className='p-4 border-b text-gray-500 text-base font-semibold flex-shrink-0'>
                  Sản phẩm mới thêm
                </div>
                <div className='flex-1 overflow-y-auto min-h-0'>
                  {cart.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-8 text-gray-400'>
                      <svg
                        xmlns='http://www.w3.org/2000/svg'
                        width='64'
                        height='64'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='#e5e7eb'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={1.5}
                          d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m13-9l2 9m-5-9V6a2 2 0 10-4 0v3'
                        />
                      </svg>
                      <div className='mt-3 text-lg font-semibold'>Chưa có sản phẩm nào trong giỏ</div>
                    </div>
                  ) : (
                    <ul className='divide-y'>
                      {[...groupCartItems]
                        .reverse()
                        .slice(0, 3)
                        .map((item, idx) => {
                          const isCombo = 'isCombo' in item && item.isCombo === true
                          return (
                            <li key={item.id + idx} className='flex items-center gap-3 px-4 py-3'>
                              <img
                                src={item.image}
                                alt={item.name}
                                className='w-16 h-16 object-cover rounded border'
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src =
                                    'https://i.pinimg.com/1200x/93/b6/9f/93b69fd5d973b3f2fbc325982eb8e658.jpg'
                                }}
                              />
                              <div className='flex-1 min-w-0'>
                                <div className='truncate font-medium text-gray-900 text-base flex items-center gap-2'>
                                  {item.name}
                                  {isCombo && (
                                    <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800'>
                                      Combo
                                    </span>
                                  )}
                                </div>
                                <div className='text-xs text-gray-500'>Số lượng: {item.quantity}</div>
                                {!isCombo && 'variant' in item && item.variant && (
                                  <div className='text-xs text-gray-500'>Phân loại: {item.variant}</div>
                                )}
                                {isCombo && 'items' in item && (
                                  <div className='text-xs text-gray-500'>Gồm {item.items.length} sản phẩm</div>
                                )}
                              </div>
                              <div className='text-orange-600 font-semibold text-base whitespace-nowrap'>
                                {item.price.toLocaleString('vi-VN')}₫
                              </div>
                            </li>
                          )
                        })}
                    </ul>
                  )}
                </div>
                <div className='flex items-center justify-between p-4 border-t flex-shrink-0'>
                  <span className='text-base text-gray-500'>
                    {displayCount > 0 ? `${displayCount} sản phẩm trong giỏ` : 'Chưa có sản phẩm'}
                  </span>
                  <button
                    className='bg-green-500 hover:bg-green-600 !text-white px-5 py-2 rounded font-semibold text-base transition-colors whitespace-nowrap'
                    onClick={() => {
                      handleCloseDropdown()
                      setTimeout(() => {
                        navigate(path.cart)
                      }, 300)
                    }}
                    tabIndex={0}
                  >
                    Xem giỏ hàng
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Section */}
          {isAuthenticated ? (
            <div ref={userDropdownRef} className='relative mb-2'>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className='flex items-center gap-2 text-[#2D5016] hover:text-[#F4A261] transition-colors p-2 rounded-lg hover:bg-green-50'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='23'
                  height='23'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
                  <circle cx='12' cy='7' r='4'></circle>
                </svg>
                <span className='text-sm font-medium max-w-35 truncate mt-1'>{user?.email}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>

              {showUserDropdown && (
                <div className='absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50'>
                  <div className='py-2'>
                    <div className='px-4 py-2 text-sm text-gray-500 border-b'>{user?.email}</div>
                    <Link
                      to={path.profileCustomer}
                      className='block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50'
                      onClick={() => setShowUserDropdown(false)}
                    >
                      Thông tin cá nhân
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to={path.loginCustomer}>
              <Button
                variant='green'
                className='rounded-full px-4 py-2 text-sm whitespace-nowrap transition-colors hover:bg-green-600 hover:text-white'
              >
                Đăng nhập
              </Button>
            </Link>
          )}
          {/* Cộng tác viên link - chỉ hiện trên md trở lên và khi chưa đăng nhập */}
          {!isAuthenticated && (
            <Link
              to={path.sellerPage}
              className='hidden md:inline text-sm text-[#2D5016] hover:text-orange-500 transition-colors font-medium whitespace-nowrap ml-2'
            >
              Bạn muốn làm cộng tác viên?
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
