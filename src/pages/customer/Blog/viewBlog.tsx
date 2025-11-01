import { Calendar, User, Eye, Tag } from 'lucide-react'


// Fake blog data
const fakeBlogData = {
  title: 'Cách Trồng Lúa Hữu Cơ Hiệu Quả - Bí Quyết Từ Nông Dân Chuyên Nghiệp',
  description:
    'Khám phá những phương pháp trồng lúa hữu cơ hiện đại, giúp tăng năng suất và chất lượng gạo mà vẫn đảm bảo an toàn cho môi trường.',
  content: `
    <p>Trồng lúa hữu cơ không chỉ là xu hướng mà còn là giải pháp bền vững cho tương lai nông nghiệp Việt Nam. Với những lợi ích vượt trội về sức khỏe và môi trường, phương pháp này đang được nhiều nông dân áp dụng.</p>
    
    <h3>1. Chuẩn bị đất trồng</h3>
    <p>Đất trồng lúa hữu cơ cần được chuẩn bị kỹ lưỡng. Đầu tiên, bạn cần kiểm tra độ pH của đất, đảm bảo nằm trong khoảng 6.0-7.0. Sau đó, bón phân hữu cơ như phân chuồng hoai mục, phân xanh để cải thiện cấu trúc đất.</p>
    
    <h3>2. Chọn giống lúa phù hợp</h3>
    <p>Việc chọn giống lúa phù hợp với điều kiện khí hậu và đất đai địa phương là yếu tố quan trọng. Các giống lúa như ST25, OM18, Jasmine đều có khả năng thích nghi tốt với phương pháp canh tác hữu cơ.</p>
    
    <h3>3. Quản lý nước thông minh</h3>
    <p>Hệ thống tưới tiêu hợp lý giúp tiết kiệm nước và tăng hiệu quả sử dụng. Áp dụng phương pháp tưới ngập khô xen kẽ (AWD) giúp giảm 30% lượng nước sử dụng mà vẫn đảm bảo năng suất.</p>
    
    <h3>4. Kiểm soát sâu bệnh tự nhiên</h3>
    <p>Sử dụng các biện pháp sinh học như thả cá, vịt vào ruộng để diệt sâu bệnh. Trồng các loại cây có tác dụng xua đuổi côn trùng như sả, húng quế quanh bờ ruộng.</p>
    
    <h3>5. Thu hoạch và bảo quản</h3>
    <p>Thời điểm thu hoạch lúa hữu cơ cần được tính toán chính xác để đảm bảo chất lượng gạo tốt nhất. Sau khi thu hoạch, cần phơi khô và bảo quản trong điều kiện thích hợp.</p>
    
    <p>Với những phương pháp trên, bạn có thể bắt đầu hành trình trồng lúa hữu cơ của mình. Hãy nhớ rằng, thành công trong nông nghiệp hữu cơ đòi hỏi sự kiên nhẫn và học hỏi liên tục.</p>
  `,
  image:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
  author: 'Nguyễn Văn Minh',
  publishDate: '2024-01-15',
  readTime: '8 phút đọc',
  views: 1250,
  category: 'Nông nghiệp hữu cơ'
}

// Fake categories data
const fakeCategories = [
  { id: 1, name: 'Nông nghiệp hữu cơ', count: 15 },
  { id: 2, name: 'Kỹ thuật trồng trọt', count: 23 },
  { id: 3, name: 'Chăn nuôi', count: 12 },
  { id: 4, name: 'Thủy sản', count: 8 },
  { id: 5, name: 'Công nghệ nông nghiệp', count: 19 },
  { id: 6, name: 'Thị trường nông sản', count: 31 },
  { id: 7, name: 'Chính sách nông nghiệp', count: 7 },
  { id: 8, name: 'Khởi nghiệp nông nghiệp', count: 14 },
  { id: 9, name: 'Xuất khẩu nông sản', count: 11 },
  { id: 10, name: 'Bảo vệ môi trường', count: 18 }
]

function ViewBlog() {

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8 px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main content */}
          <div className='lg:col-span-2'>
            <article className='bg-white rounded-xl shadow-sm overflow-hidden'>
              {/* Blog image */}
              <div className='aspect-video overflow-hidden'>
                <img src={fakeBlogData.image} alt={fakeBlogData.title} className='w-full h-full object-cover' />
              </div>

              {/* Blog content */}
              <div className='p-8'>
                {/* Category badge */}
                <div className='mb-4'>
                  <span className='inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full'>
                    <Tag className='w-4 h-4' />
                    {fakeBlogData.category}
                  </span>
                </div>

                {/* Title */}
                <h1 className='text-3xl font-bold text-gray-900 mb-4 leading-tight'>{fakeBlogData.title}</h1>

                {/* Description */}
                <p className='text-lg text-gray-600 mb-6 leading-relaxed'>{fakeBlogData.description}</p>

                {/* Meta information */}
                <div className='flex flex-wrap items-center gap-6 mb-8 pb-6 border-b border-gray-200'>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <User className='w-5 h-5' />
                    <span className='font-medium'>{fakeBlogData.author}</span>
                  </div>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <Calendar className='w-5 h-5' />
                    <span>{fakeBlogData.publishDate}</span>
                  </div>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <Eye className='w-5 h-5' />
                    <span>{fakeBlogData.views.toLocaleString()} lượt xem</span>
                  </div>
                  <div className='text-gray-500'>{fakeBlogData.readTime}</div>
                </div>

                {/* Content */}
                <div
                  className='prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-4'
                  dangerouslySetInnerHTML={{ __html: fakeBlogData.content }}
                />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <div className='sticky top-8 space-y-6'>
              {/* Categories */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h3 className='text-xl font-bold text-gray-900 mb-4'>Danh mục</h3>
                <div className='space-y-2'>
                  {fakeCategories.map((category) => (
                    <button
                      key={category.id}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center justify-between ${
                        category.name === fakeBlogData.category
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className='font-medium'>{category.name}</span>
                      <span className='text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>{category.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Related articles */}
              <div className='bg-white rounded-xl shadow-sm p-6'>
                <h3 className='text-xl font-bold text-gray-900 mb-4'>Bài viết liên quan</h3>
                <div className='space-y-4'>
                  {[1, 2, 3].map((item) => (
                    <div key={item} className='flex gap-3'>
                      <div className='w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0'></div>
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-medium text-gray-900 text-sm line-clamp-2 mb-1'>
                          Cách chọn giống lúa phù hợp với từng vùng miền
                        </h4>
                        <p className='text-xs text-gray-500'>2 ngày trước</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Newsletter */}
              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6'>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>Đăng ký nhận tin</h3>
                <p className='text-gray-600 text-sm mb-4'>Nhận những bài viết mới nhất về nông nghiệp hữu cơ</p>
                <div className='space-y-3'>
                  <input
                    type='email'
                    placeholder='Nhập email của bạn'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm'
                  />
                  <button className='w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors text-sm'>
                    Đăng ký
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewBlog
