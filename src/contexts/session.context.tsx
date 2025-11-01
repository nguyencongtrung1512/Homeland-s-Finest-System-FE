import { type ReactNode, createContext, useContext, useState, useEffect } from 'react'
import { SessionExpiredModal } from '../components/ui/session-expired-modal'
import { useAuth } from './auth.context'
import { useNavigate } from 'react-router-dom'
import { resetSessionExpiredFlag } from '../service/axiosInstance'

interface SessionContextType {
  showSessionExpired: () => void
}

const SessionContext = createContext<SessionContextType>({
  showSessionExpired: () => {}
})

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const { clearAuth } = useAuth()
  const navigate = useNavigate()

  const showSessionExpired = () => {
    setIsSessionExpired(true)
  }

  const handleConfirm = () => {
    // Xóa tất cả dữ liệu auth
    clearAuth()
    setIsSessionExpired(false)
    // Reset session expired flag
    resetSessionExpiredFlag()
    // Redirect về trang login
    navigate('/login')
  }

  // Lắng nghe custom event từ axiosInstance
  useEffect(() => {
    const handleSessionExpired = () => {
      setIsSessionExpired(true)
    }

    window.addEventListener('session-expired', handleSessionExpired)

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired)
    }
  }, [])

  return (
    <SessionContext.Provider value={{ showSessionExpired }}>
      {children}
      <SessionExpiredModal isOpen={isSessionExpired} onConfirm={handleConfirm} />
    </SessionContext.Provider>
  )
}

export const useSession = () => useContext(SessionContext)
