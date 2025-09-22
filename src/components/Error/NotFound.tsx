import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Button } from '../ui/button'

const NotFound = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
      <div className='text-center max-w-md mx-auto px-6'>
        {/* 404 Icon/Illustration */}
        <div className='mb-8'>
          <div className='text-8xl font-bold text-gray-300 mb-4'>404</div>
          <div className='w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 mx-auto rounded-full'></div>
        </div>

        {/* Error Message */}
        <h1 className='text-3xl font-bold text-gray-800 mb-4'>Trang không tìm thấy</h1>
        <p className='text-lg text-gray-600 mb-2'>Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>
        <p className='text-sm text-gray-500 mb-8'>
          Đường dẫn: <code className='bg-gray-200 px-2 py-1 rounded text-xs'>{location.pathname}</code>
        </p>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Button onClick={handleGoHome} className='bg-green-500 hover:bg-green-600 text-white px-6 py-2'>
            🏠 Về trang chủ
          </Button>
          <Button onClick={handleGoBack} variant='outline' className='border-gray-300 hover:bg-gray-50 px-6 py-2'>
            ← Quay lại
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
