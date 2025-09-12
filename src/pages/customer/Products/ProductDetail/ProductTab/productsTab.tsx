import React, { useState } from 'react'

interface TabContent {
  id: string
  label: string
  content: React.ReactNode
}

export const ProductTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('description')

  const tabs: TabContent[] = [
    {
      id: 'description',
      label: 'Mô tả sản phẩm',
      content: (
        <div className='max-w-4xl mx-auto'>
          <h3 className='text-black text-xl font-bold mb-4'>Mật ong rừng nguyên chất U Minh Hạ</h3>
          <p className='text-gray-700 text-base leading-6 mb-8'>
            Mật ong rừng U Minh Hạ được khai thác từ những tổ ong hoang dã trong rừng tràm nguyên sinh. Sản phẩm hoàn
            toàn tự nhiên, không qua chế biến, giữ nguyên hương vị đặc trưng và giá trị dinh dưỡng cao.
          </p>

          <h4 className='text-black text-base font-bold mb-2'>Thành phần dinh dưỡng:</h4>
          <ul className='space-y-1 mb-8'>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Đường tự nhiên (fructose, glucose): 75-80%</span>
            </li>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Vitamin B1, B2, B6, C</span>
            </li>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Khoáng chất: Canxi, Sắt, Kali</span>
            </li>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Enzyme và acid amin tự nhiên</span>
            </li>
          </ul>

          <h4 className='text-black text-base font-bold mb-2'>Công dụng:</h4>
          <ul className='space-y-1'>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Tăng cường sức đề kháng</span>
            </li>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Hỗ trợ tiêu hóa</span>
            </li>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Làm đẹp da, chống lão hóa</span>
            </li>
            <li className='flex items-center'>
              <span className='text-gray-700 mr-2'>•</span>
              <span className='text-gray-700 text-base'>Cung cấp năng lượng tự nhiên</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'usage',
      label: 'Cách sử dụng',
      content: (
        <div className='max-w-4xl mx-auto'>
          <h3 className='text-black text-xl font-bold mb-4'>Cách sử dụng mật ong</h3>
          <p className='text-gray-700 text-base leading-6 mb-4'>
            Để có được hiệu quả tốt nhất từ mật ong rừng U Minh Hạ, bạn nên sử dụng theo hướng dẫn sau:
          </p>
          <ul className='space-y-2'>
            <li className='flex items-start gap-2'>
              <span className='text-gray-700'>•</span>
              <span className='text-gray-700'>Uống trực tiếp 1-2 thìa cà phê mỗi ngày vào buổi sáng</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-gray-700'>•</span>
              <span className='text-gray-700'>Pha với nước ấm (dưới 40°C) để giữ nguyên dinh dưỡng</span>
            </li>
            <li className='flex items-start gap-2'>
              <span className='text-gray-700'>•</span>
              <span className='text-gray-700'>Có thể dùng thay đường trong các món ăn, thức uống</span>
            </li>
          </ul>
        </div>
      )
    },

    {
      id: 'storage',
      label: 'Lưu ý & Bảo quản',
      content: (
        <div className='max-w-4xl mx-auto'>
          <h3 className='text-black text-xl font-bold mb-4'>Lưu ý và bảo quản</h3>
          <div className='space-y-4'>
            <div>
              <h4 className='text-black text-base font-bold mb-2'>Cách bảo quản:</h4>
              <ul className='space-y-2'>
                <li className='flex items-start gap-2'>
                  <span className='text-gray-700'>•</span>
                  <span className='text-gray-700'>Bảo quản ở nơi khô ráo, thoáng mát</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-gray-700'>•</span>
                  <span className='text-gray-700'>Tránh ánh nắng trực tiếp</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-gray-700'>•</span>
                  <span className='text-gray-700'>Đậy kín nắp sau khi sử dụng</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='text-black text-base font-bold mb-2'>Lưu ý:</h4>
              <ul className='space-y-2'>
                <li className='flex items-start gap-2'>
                  <span className='text-gray-700'>•</span>
                  <span className='text-gray-700'>Không dành cho trẻ em dưới 1 tuổi</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-gray-700'>•</span>
                  <span className='text-gray-700'>Người bị dị ứng mật ong nên tránh sử dụng</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <section className='max-w-6xl mx-auto px-6 py-8'>
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        <div className='border-b border-gray-200'>
          <nav className='flex'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-base font-medium border-b-2 transition-colors ${activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className='p-6'>{tabs.find((tab) => tab.id === activeTab)?.content}</div>
      </div>
    </section>
  )
}
