import { useEffect } from 'react'
import { Button } from './button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog'
import { AlertCircle } from 'lucide-react'

interface SessionExpiredModalProps {
  isOpen: boolean
  onConfirm: () => void
}

export const SessionExpiredModal = ({ isOpen, onConfirm }: SessionExpiredModalProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md border-0 shadow-2xl overflow-hidden p-0 gap-0 animate-in fade-in-0 zoom-in-95 duration-300"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header với gradient background */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 pt-8 pb-6 px-6">
          <DialogHeader className="space-y-4">
            {/* Icon với animation */}
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              Phiên đăng nhập đã hết hạn
            </DialogTitle>
            
            <DialogDescription className="text-center text-gray-600 text-base leading-relaxed">
              Vui lòng đăng nhập lại để tiếp tục sử dụng ứng dụng.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Footer */}
        <DialogFooter className="p-6 bg-white">
          <Button 
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Đăng nhập lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Thêm custom styles vào global CSS nếu cần
// const styles = `
// @keyframes pulse {
//   0%, 100% {
//     opacity: 1;
//   }
//   50% {
//     opacity: 0.7;
//   }
// }

// @keyframes fade-in {
//   from {
//     opacity: 0;
//   }
//   to {
//     opacity: 1;
//   }
// }

// @keyframes zoom-in {
//   from {
//     transform: scale(0.95);
//   }
//   to {
//     transform: scale(1);
//   }
// }
// `