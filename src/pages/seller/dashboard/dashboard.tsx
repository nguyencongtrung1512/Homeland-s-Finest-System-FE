import StoreStatusNotice from '../../../components/Seller/StoreStatusNotice'
import { useStore } from '../../../contexts/store.context'

function Dashboard() {
  const { store, isStoreApproved } = useStore()

  // Nếu store chưa được duyệt, hiển thị thông báo thay vì dashboard thông thường
  if (store && !isStoreApproved) {
    return (
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Trang tổng quan</h1>
          <p className='text-gray-600 mt-2'>Chào mừng đến với Tinh Hoa Quê Nhà!</p>
        </div>
        <StoreStatusNotice />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Trang tổng quan</h1>
        <p className='text-gray-600 mt-2'>Chào mừng trở lại! Đây là tổng quan về cửa hàng của bạn.</p>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Total Revenue Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tổng doanh thu</p>
              <p className='text-2xl font-bold text-gray-900'>15.2M VNĐ</p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z' />
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 00-1.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tổng đơn hàng</p>
              <p className='text-2xl font-bold text-gray-900'>342</p>
            </div>
            <div className='w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-gray-600' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Successfully Delivered Orders Card */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-gray-600'>Đơn hàng giao thành công</p>
              <p className='text-2xl font-bold text-gray-900'>342</p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
              <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5zM8 15a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ... existing code ... */}

      {/* Statistics & Reports Section */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-lg font-semibold text-gray-900'>Thống kê & Báo cáo</h3>
          <select className='px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500'>
            <option value='2025'>2025</option>
            <option value='2024'>2024</option>
            <option value='2023'>2023</option>
          </select>
        </div>

        {/* Charts Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Orders Chart */}
          <div>
            <h4 className='text-md font-medium text-gray-700 mb-4'>Đơn hàng</h4>
            <div className='h-64 relative'>
              {/* Y-axis labels */}
              <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2'>
                <span>3500k</span>
                <span>3000k</span>
                <span>2500k</span>
                <span>2000k</span>
                <span>1500k</span>
              </div>

              {/* Chart area */}
              <div className='ml-8 h-full flex items-end justify-between'>
                {/* Chart bars */}
                <div className='w-8 bg-green-500 rounded-t' style={{ height: '60%' }}></div>
                <div className='w-8 bg-green-500 rounded-t' style={{ height: '80%' }}></div>
                <div className='w-8 bg-green-500 rounded-t' style={{ height: '45%' }}></div>
                <div className='w-8 bg-green-500 rounded-t' style={{ height: '90%' }}></div>
                <div className='w-8 bg-green-500 rounded-t' style={{ height: '70%' }}></div>
                <div className='w-8 bg-green-500 rounded-t' style={{ height: '85%' }}></div>

                {/* X-axis labels */}
                <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500'>
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                </div>
              </div>
            </div>
            <p className='text-xs text-gray-500 mt-2 ml-8'>Doanh thu (VND)</p>
          </div>

          {/* Revenue Chart */}
          <div>
            <h4 className='text-md font-medium text-gray-700 mb-4'>Doanh thu</h4>
            <div className='h-64 relative'>
              {/* Y-axis labels */}
              <div className='absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2'>
                <span>3500k</span>
                <span>3000k</span>
                <span>2500k</span>
                <span>2000k</span>
                <span>1500k</span>
              </div>

              {/* Chart area */}
              <div className='ml-8 h-full flex items-end justify-between'>
                {/* Chart bars and line */}
                <div className='absolute inset-0 ml-8 flex items-end justify-between'>
                  {/* Orange line representing the trend */}
                  <svg className='w-full h-full' viewBox='0 0 400 200'>
                    <polyline
                      points='20,110 80,100 140,130 200,90 260,60 320,50 380,80'
                      fill='none'
                      stroke='#f97316'
                      strokeWidth='3'
                    />
                    {/* Data points */}
                    <circle cx='20' cy='110' r='4' fill='#f97316' />
                    <circle cx='80' cy='100' r='4' fill='#f97316' />
                    <circle cx='140' cy='130' r='4' fill='#f97316' />
                    <circle cx='200' cy='90' r='4' fill='#f97316' />
                    <circle cx='260' cy='60' r='4' fill='#f97316' />
                    <circle cx='320' cy='50' r='4' fill='#f97316' />
                    <circle cx='380' cy='80' r='4' fill='#f97316' />
                  </svg>
                </div>

                {/* X-axis labels */}
                <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500'>
                  <span>T2</span>
                  <span>T3</span>
                  <span>T4</span>
                  <span>T5</span>
                  <span>T6</span>
                  <span>T7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Top Selling Products */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Top Sản phẩm Bán chạy</h3>
          <div className='space-y-4'>
            {/* Product 1 */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>Bánh tráng nướng</span>
              <div className='flex items-center gap-2'>
                <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div className='h-full bg-orange-500 rounded-full' style={{ width: '80%' }}></div>
                </div>
                <span className='text-sm font-medium text-gray-900'>3.2M</span>
              </div>
            </div>

            {/* Product 2 */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>Mắm ruốc</span>
              <div className='flex items-center gap-2'>
                <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div className='h-full bg-orange-500 rounded-full' style={{ width: '70%' }}></div>
                </div>
                <span className='text-sm font-medium text-gray-900'>2.8M</span>
              </div>
            </div>

            {/* Product 3 */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>Khô bò</span>
              <div className='flex items-center gap-2'>
                <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div className='h-full bg-orange-500 rounded-full' style={{ width: '62%' }}></div>
                </div>
                <span className='text-sm font-medium text-gray-900'>2.5M</span>
              </div>
            </div>

            {/* Product 4 */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>Chà bông</span>
              <div className='flex items-center gap-2'>
                <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div className='h-full bg-orange-500 rounded-full' style={{ width: '50%' }}></div>
                </div>
                <span className='text-sm font-medium text-gray-900'>2.0M</span>
              </div>
            </div>

            {/* Product 5 */}
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-700'>Bánh phồng tôm</span>
              <div className='flex items-center gap-2'>
                <div className='w-32 h-3 bg-gray-200 rounded-full overflow-hidden'>
                  <div className='h-full bg-orange-500 rounded-full' style={{ width: '45%' }}></div>
                </div>
                <span className='text-sm font-medium text-gray-900'>1.8M</span>
              </div>
            </div>
          </div>
          <p className='text-xs text-gray-500 mt-4'>Doanh thu (VND)</p>
        </div>

        {/* Low Stock Products */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>5 Sản phẩm tồn kho sắp hết</h3>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200'>
              <span className='text-sm text-gray-700'>Mắm tôm</span>
              <span className='text-sm font-medium text-red-600'>2 sản phẩm</span>
            </div>
            <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
              <span className='text-sm text-gray-700'>Tương ớt</span>
              <span className='text-sm font-medium text-yellow-600'>5 sản phẩm</span>
            </div>
            <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
              <span className='text-sm text-gray-700'>Bánh đa nem</span>
              <span className='text-sm font-medium text-yellow-600'>8 sản phẩm</span>
            </div>
            <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
              <span className='text-sm text-gray-700'>Nước mắm</span>
              <span className='text-sm font-medium text-yellow-600'>12 sản phẩm</span>
            </div>
            <div className='flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
              <span className='text-sm text-gray-700'>Mì Quảng</span>
              <span className='text-sm font-medium text-yellow-600'>15 sản phẩm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard