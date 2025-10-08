import { type ReactNode, createContext, useContext, useState } from 'react'
import { logout as logoutAPI } from '../apis/auth.api'
import { toast } from 'react-toastify'

interface User {
  roleName: string
  token: string
  expiresAt: string
  userId: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  logout: () => Promise<void>
  login: (userData: User) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  logout: async () => {},
  login: () => {},
  clearAuth: () => {}
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })

  const isAuthenticated = !!user

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', userData.token)
  }

  const clearAuth = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Xóa tất cả dữ liệu liên quan đến auth
    localStorage.removeItem('chatbot_msg')
  }

  const logout = async () => {
    // Xóa dữ liệu local trước khi gọi API
    clearAuth()

    // Gọi API logout để thông báo server
    await logoutAPI()

    // Hiển thị thông báo thành công
    toast.success('Đăng xuất thành công!', {
      position: 'top-right',
      autoClose: 2000
    })
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, clearAuth }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
