import { useAuth } from '../contexts/auth.context'

/**
 * Helper hook: xác định trạng thái kích hoạt của user.
 * - isActiveUser: true nếu user chưa bị khóa (isActive !== false)
 * - isRestricted: true nếu user bị khóa (isActive === false)
 */
export const useActiveUserGuard = () => {
  const { user } = useAuth()
  const isActiveUser = user?.isActive !== false
  const isRestricted = !isActiveUser

  return { isActiveUser, isRestricted }
}


