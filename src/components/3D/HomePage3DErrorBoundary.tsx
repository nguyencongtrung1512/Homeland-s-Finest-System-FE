import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

class HomePage3DErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center h-screen bg-gray-100'>
          <div className='text-center'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>Không thể tải trang</h2>
            <p className='text-gray-600 mb-4'>Vui lòng thử lại sau hoặc liên hệ hỗ trợ</p>
            <button
              onClick={() => window.location.reload()}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )
    }

    return <>{this.props.children}</>
  }
}

export default HomePage3DErrorBoundary
