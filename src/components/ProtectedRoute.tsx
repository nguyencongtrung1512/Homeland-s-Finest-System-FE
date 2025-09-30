import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/auth.context'
import path from '../constants/path'

interface ProtectedRouteProps {
  requiredRole?: 'Customer' | 'Seller' | 'Staff' | 'Admin'
}

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={path.login} replace />
  }

  if (requiredRole && user?.roleName !== requiredRole) {
    // Redirect về trang phù hợp với role của user
    switch (user?.roleName) {
      case 'Customer':
        return <Navigate to={path.product} replace />
      case 'Seller':
        return <Navigate to={path.sellerPage} replace />
      case 'Staff':
        return <Navigate to={path.BASE_STAFF} replace />
      case 'Admin':
        return <Navigate to={path.BASE_ADMIN} replace />
      default:
        return <Navigate to={path.product} replace />
    }
  }

  return <Outlet />
}
