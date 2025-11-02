import { type ReactNode, createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Notification, { type NotificationType, type NotificationPosition } from '../components/ui/toast'

export interface ToastOptions {
  type?: NotificationType
  title: string
  message?: string
  showIcon?: boolean
  duration?: number
  position?: NotificationPosition
}

interface Toast extends Required<Pick<ToastOptions, 'type' | 'title' | 'duration' | 'position'>> {
  id: string
  message?: string
  showIcon?: boolean
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void
  success: (title: string, message?: string, duration?: number) => void
  error: (title: string, message?: string, duration?: number) => void
  warning: (title: string, message?: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Global toast instance reference
let globalToastInstance: ToastContextType | null = null

export const ToastProvider = ({
  children,
  defaultPosition = 'top-right'
}: {
  children: ReactNode
  defaultPosition?: NotificationPosition
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const instanceRef = useRef<ToastContextType | null>(null)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9)
      const toast: Toast = {
        type: options.type || 'success',
        title: options.title,
        message: options.message,
        showIcon: options.showIcon,
        position: options.position || defaultPosition,
        duration: options.duration || 3000,
        id
      }
      setToasts((prev) => [...prev, toast])
    },
    [defaultPosition]
  )

  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'success', title, message, duration })
    },
    [showToast]
  )

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'error', title, message, duration })
    },
    [showToast]
  )

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      showToast({ type: 'warning', title, message, duration })
    },
    [showToast]
  )

  // Set up global instance
  useEffect(() => {
    const instance: ToastContextType = { showToast, success, error, warning }
    instanceRef.current = instance
    globalToastInstance = instance
    return () => {
      globalToastInstance = null
    }
  }, [showToast, success, error, warning])

  // Group toasts by position
  const toastsByPosition = toasts.reduce(
    (acc, toast) => {
      const position = toast.position || defaultPosition
      if (!acc[position]) {
        acc[position] = []
      }
      acc[position].push(toast)
      return acc
    },
    {} as Record<NotificationPosition, Toast[]>
  )

  // Position styles
  const positionStyles: Record<NotificationPosition, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning }}>
      {children}
      {/* Render toasts by position */}
      {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
        <div
          key={position}
          className={`fixed z-[9999] ${positionStyles[position as NotificationPosition]} flex flex-col gap-2 max-w-sm w-full pointer-events-none`}
        >
          <AnimatePresence mode='popLayout'>
            {positionToasts.map((toast) => (
              <div key={toast.id} className='pointer-events-auto'>
                <Notification
                  type={toast.type}
                  title={toast.title}
                  message={toast.message}
                  showIcon={toast.showIcon}
                  duration={toast.duration}
                  onClose={() => removeToast(toast.id)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      ))}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Global toast export for backward compatibility with react-toastify
export const getToastInstance = () => {
  if (!globalToastInstance) {
    return {
      success: () => console.warn('Toast is not initialized'),
      error: () => console.warn('Toast is not initialized'),
      warning: () => console.warn('Toast is not initialized'),
      showToast: () => console.warn('Toast is not initialized')
    }
  }
  return globalToastInstance
}
