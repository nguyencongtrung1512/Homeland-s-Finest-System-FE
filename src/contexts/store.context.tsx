import { type ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { storeApi, type StoreResponse } from '../apis/store.api'
import { useAuth } from './auth.context'

interface StoreContextType {
  store: StoreResponse | null
  loading: boolean
  error: string | null
  isStoreApproved: boolean
  refreshStore: () => Promise<void>
}

const StoreContext = createContext<StoreContextType>({
  store: null,
  loading: false,
  error: null,
  isStoreApproved: false,
  refreshStore: async () => { }
})

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [store, setStore] = useState<StoreResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kiểm tra xem store đã được duyệt chưa
  // Chỉ khi status là 'Approved' hoặc 'Active' thì store mới được coi là đã duyệt
  // Các status trung gian như 'ApprovedByStaff', 'ReviewedByStaff', 'Processing', 'Pending' đều chưa được duyệt hoàn toàn
  const isStoreApproved = store?.status === 'Approved'

  const fetchStore = async () => {
    if (!user?.userId) return

    try {
      setLoading(true)
      setError(null)

      const response = await storeApi.getStoreBySellerId(user.userId)

      if (response.status === 200 && response.data) {
        setStore(response.data)
      } else {
        setError('Không tìm thấy thông tin cửa hàng')
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin cửa hàng'
      setError(errorMessage)
      console.error('Error fetching store:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshStore = async () => {
    await fetchStore()
  }

  useEffect(() => {
    if (user?.userId && user?.roleName === 'Seller') {
      fetchStore()
    }
  }, [user])

  return (
    <StoreContext.Provider
      value={{
        store,
        loading,
        error,
        isStoreApproved,
        refreshStore
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)