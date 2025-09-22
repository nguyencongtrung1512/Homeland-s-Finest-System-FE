import React from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' // Kích thước (nhỏ, vừa, lớn)
  text?: string // Dòng chữ hiển thị kèm theo (mặc định: "Đang tải...")
  fullScreen?: boolean // Hiển thị loading full màn hình hay chỉ inline
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', text = 'Đang tải...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const LoadingContent = () => (
    <div className='flex flex-col items-center justify-center space-y-4'>
      {/* Main Loading Animation - Rice Field Theme */}
      <div className='relative'>
        {/* Background circle with gradient */}
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-lg`}>
          {/* Animated rice grains */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='relative w-8 h-8'>
              {/* Rice grain 1 */}
              <div
                className='absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-full animate-bounce'
                style={{ animationDelay: '0s', animationDuration: '1.5s' }}
              ></div>
              {/* Rice grain 2 */}
              <div
                className='absolute top-3 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-full animate-bounce'
                style={{ animationDelay: '0.3s', animationDuration: '1.5s' }}
              ></div>
              {/* Rice grain 3 */}
              <div
                className='absolute top-5 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-full animate-bounce'
                style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}
              ></div>
            </div>
          </div>

          {/* Rotating border with gradient */}
          <div
            className='absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-green-400 via-yellow-400 to-green-500 animate-spin'
            style={{ animationDuration: '2s' }}
          >
            <div className='absolute inset-0.5 rounded-full bg-gradient-to-br from-green-100 to-green-200'></div>
          </div>
        </div>

        {/* Floating particles around the main circle */}
        <div
          className='absolute -top-2 -right-2 w-2 h-2 bg-yellow-300 rounded-full animate-ping'
          style={{ animationDelay: '0.5s' }}
        ></div>
        <div
          className='absolute -bottom-2 -left-2 w-2 h-2 bg-green-300 rounded-full animate-ping'
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className='absolute top-1/2 -left-3 w-1.5 h-1.5 bg-amber-300 rounded-full animate-ping'
          style={{ animationDelay: '1.5s' }}
        ></div>
        <div
          className='absolute top-1/2 -right-3 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping'
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      {/* Loading text with Vietnamese theme */}
      <div className='text-center'>
        <p className={`${textSizeClasses[size]} font-medium text-green-700 animate-pulse`}>{text}</p>
        <div className='flex items-center justify-center space-x-1 mt-2'>
          <div className='w-1 h-1 bg-green-500 rounded-full animate-bounce' style={{ animationDelay: '0s' }}></div>
          <div className='w-1 h-1 bg-yellow-500 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
          <div className='w-1 h-1 bg-green-500 rounded-full animate-bounce' style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className='fixed inset-0 bg-gradient-to-br from-green-50 via-yellow-50 to-green-100 flex items-center justify-center z-50'>
        <div className='bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-green-200'>
          <LoadingContent />
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-center justify-center p-4'>
      <LoadingContent />
    </div>
  )
}

export default Loading
