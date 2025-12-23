import { type ReactNode, createContext, useContext, useState } from 'react'
import { logout as logoutAPI } from '../apis/auth.api'

interface User {
  roleName: string
  token: string
  expiresAt: string
  userId: string
  email: string
  isActive: boolean
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
  logout: async () => { },
  login: () => { },
  clearAuth: () => { }
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
    localStorage.removeItem('chatbot_msg')
  }

  const logout = async () => {
    try {
      // Gọi API logout trước khi clear auth để request có token
      await logoutAPI()
      clearAuth()
    } catch {
      // Nếu API logout fail (có thể do token đã hết hạn), vẫn clear auth
      clearAuth()
      // Không hiển thị toast lỗi vì đã logout thành công về phía client
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        clearAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
