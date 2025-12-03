import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Tag, Clock, BookOpen, Loader2, Search } from 'lucide-react'
import { blogApi, type BlogItem } from '../../../apis/blog.api'
import { blogCategoryApi, type BlogCategoryItem } from '../../../apis/categoryBlog.api'
import { resolveImageUrl } from '../../../utils/image'
import path from '../../../constants/path'

interface CategoryWithCount extends BlogCategoryItem {
  count?: number
}

function BlogList() {
  const navigate = useNavigate()
  
  const [blogList, setBlogList] = useState<BlogItem[]>([])
  const [totalBlogs, setTotalBlogs] = useState<number>(0) // Total blogs count for "Tất cả"
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to extract data from API response
  const extractData = useCallback((response: any): any => {
    if (!response || typeof response !== 'object') return null
    
    if ('status' in response && response.status === 200 && response.data) {
      return response.data
    } else if (Array.isArray(response)) {
      return response
    } else if ('data' in response) {
      const data = response.data
      return Array.isArray(data) ? data : data?.data || data
    }
    return response
  }, [])

  // Format date helper - handles format: "HH:mm:ss DD/MM/YYYY"
  const formatDate = useCallback((dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return 'Chưa có ngày'
    }
    
    try {
      let date: Date
      
      // Check if format is "HH:mm:ss DD/MM/YYYY" (from BE)
      const vietnameseFormat = /^(\d{2}):(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})$/
      const match = dateString.match(vietnameseFormat)
      
      if (match) {
        // Parse Vietnamese format: "06:12:08 16/11/2025"
        const [, hours, minutes, seconds, day, month, year] = match
        date = new Date(
          parseInt(year),
          parseInt(month) - 1, // Month is 0-indexed
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds)
        )
      } else {
        // Try parsing as ISO string or other formats
        date = new Date(dateString)
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date string:', dateString)
        return 'Ngày không hợp lệ'
      }
      
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Ngày không hợp lệ'
    }
  }, [])

  // Calculate read time (estimate: 200 words per minute)
  const calculateReadTime = useCallback((content: string) => {
    const text = content.replace(/<[^>]*>/g, '') // Remove HTML tags
    const wordCount = text.split(/\s+/).length
    const minutes = Math.ceil(wordCount / 200)
    return `${minutes} phút đọc`
  }, [])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await blogCategoryApi.getAll({ pageSize: 0 })
        
        let categoriesData: BlogCategoryItem[] = []
        const extracted = extractData(categoriesResponse)
        if (Array.isArray(extracted)) {
          categoriesData = extracted
        }
        
        // Fetch blog count for each category using getBlogCategoryDetail
        const categoriesWithCount = await Promise.all(
          categoriesData.map(async (category) => {
            try {
              // Use getBlogCategoryDetail to get accurate blog count
              const categoryDetailResponse = await blogCategoryApi.getDetail(category.categoryId)
              console.log(`Category ${category.name} detail response:`, categoryDetailResponse)
              
              let count = 0
              const extracted = extractData(categoryDetailResponse)
              
              // Handle different response structures
              if (Array.isArray(extracted) && extracted.length > 0) {
                // Response is array, check first item for blogs
                const firstItem = extracted[0]
                if (firstItem && firstItem.blogs && Array.isArray(firstItem.blogs)) {
                  // Only count active blogs
                  count = firstItem.blogs.filter((blog: any) => blog.isActive !== false).length
                }
              } else if (extracted && extracted.blogs && Array.isArray(extracted.blogs)) {
                // Response is object with blogs array
                count = extracted.blogs.filter((blog: any) => blog.isActive !== false).length
              } else {
                // Fallback: use getAll API
                const blogsResponse = await blogApi.getAll({
                  categoryId: category.categoryId,
                  isActive: true,
                  pageSize: 0
                })
                const blogs = extractData(blogsResponse)
                count = Array.isArray(blogs) ? blogs.filter((b: BlogItem) => b.isActive && b.blogCategoryId === category.categoryId).length : 0
              }
              
              console.log(`Category ${category.name} has ${count} blogs`)
              return { ...category, count }
            } catch (err) {
              console.error(`Error fetching blog count for category ${category.name}:`, err)
              return { ...category, count: 0 }
            }
          })
        )
        setCategories(categoriesWithCount)
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }

    fetchCategories()
  }, [extractData])

  // Fetch total blogs count on mount (for "Tất cả" display)
  useEffect(() => {
    const fetchTotalBlogs = async () => {
      try {
        const blogListResponse = await blogApi.getAll({
          isActive: true,
          pageSize: 0
        })
        const blogs = extractData(blogListResponse)
        const blogsArray = Array.isArray(blogs) ? blogs : []
        setTotalBlogs(blogsArray.length)
        console.log(`Total blogs count: ${blogsArray.length}`)
      } catch (err) {
        console.error('Error fetching total blogs:', err)
      }
    }

    fetchTotalBlogs()
  }, [extractData])

  // Fetch all blogs
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        setError(null)

        if (selectedCategoryId) {
          // Use getBlogCategoryDetail to get accurate blogs in category
          const categoryDetailResponse = await blogCategoryApi.getDetail(selectedCategoryId)
          console.log('Category detail response (raw):', categoryDetailResponse)
          
          let blogs: any[] = []
          
          // Handle response structure - similar to admin page
          if (categoryDetailResponse && typeof categoryDetailResponse === 'object') {
            // Check if response has status and data (from axios interceptor)
            if ('status' in categoryDetailResponse && categoryDetailResponse.status === 200) {
              const responseData = categoryDetailResponse.data
              console.log('Response data:', responseData)
              
              // Response structure: responseData is array, first item has blogs
              if (Array.isArray(responseData) && responseData.length > 0) {
                const firstItem = responseData[0]
                if (firstItem && firstItem.blogs && Array.isArray(firstItem.blogs)) {
                  blogs = firstItem.blogs.filter((blog: any) => blog.isActive !== false)
                  console.log(`Found ${blogs.length} active blogs in category`)
                }
              }
            } else {
              // Response might already be extracted by interceptor
              const extracted = extractData(categoryDetailResponse)
              console.log('Extracted data:', extracted)
              
              if (Array.isArray(extracted) && extracted.length > 0) {
                const firstItem = extracted[0]
                if (firstItem && firstItem.blogs && Array.isArray(firstItem.blogs)) {
                  blogs = firstItem.blogs.filter((blog: any) => blog.isActive !== false)
                }
              } else if (extracted && extracted.blogs && Array.isArray(extracted.blogs)) {
                blogs = extracted.blogs.filter((blog: any) => blog.isActive !== false)
              }
            }
          }
          
          // Fallback: use getAll API if getDetail doesn't return blogs
          if (blogs.length === 0) {
            console.log('No blogs from getDetail, trying getAll API...')
            const blogsResponse = await blogApi.getAll({
              categoryId: selectedCategoryId,
              isActive: true,
              pageSize: 0
            })
            const blogsData = extractData(blogsResponse) as BlogItem[]
            blogs = Array.isArray(blogsData) ? blogsData.filter((b) => b.isActive && b.blogCategoryId === selectedCategoryId) : []
            console.log(`Found ${blogs.length} blogs from getAll API`)
          }
          
          // Map blogs to ensure correct structure
          const mappedBlogs = blogs.map((b: any) => ({
            ...b,
            blogId: b.blogId || b.id,
            image: typeof b.image === 'string' ? b.image : '',
            title: b.title || '',
            description: b.description || '',
            content: b.content || '',
            createdAt: b.createdAt || '',
            user: b.user || null
          }))
          
          console.log('Final blogs to display:', mappedBlogs)
          setBlogList(mappedBlogs)
        } else {
          // Fetch all blogs
          const blogListResponse = await blogApi.getAll({
            isActive: true,
            pageSize: 0,
            ...(searchQuery && { search: searchQuery })
          })
          
          const blogs = extractData(blogListResponse)
          const blogsArray = Array.isArray(blogs) ? blogs : []
          console.log('Blogs from API (all):', blogsArray)
          if (blogsArray.length > 0) {
            console.log('First blog:', blogsArray[0])
            console.log('First blog createdAt:', blogsArray[0].createdAt, 'Type:', typeof blogsArray[0].createdAt)
            console.log('First blog keys:', Object.keys(blogsArray[0]))
          }
          setBlogList(blogsArray)
        }
      } catch (err: any) {
        console.error('Error fetching blogs:', err)
        setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải danh sách blog')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [selectedCategoryId, searchQuery, extractData])

  // Handle category click
  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId)
  }

  // Filter blogs by search query
  const filteredBlogs = blogList.filter((blog) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      blog.title.toLowerCase().includes(query) ||
      blog.description.toLowerCase().includes(query) ||
      (blog.user && `${blog.user.firstName} ${blog.user.lastName}`.toLowerCase().includes(query))
    )
  })

  // Loading state
  if (loading && blogList.length === 0) {
    return (
      <div className='min-h-screen bg-[#F6FAF3] flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 text-[#2D5016] animate-spin mx-auto mb-4' />
          <p className='text-[#2D5016] font-semibold'>Đang tải danh sách blog...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-[#F6FAF3] relative overflow-hidden'>
      {/* Background Pattern */}
      <div className='absolute inset-0 opacity-30 pointer-events-none'>
        <div
          className='w-full h-full'
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(45, 80, 22, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(45, 80, 22, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        <div className='absolute top-20 right-10 w-32 h-32 bg-green-200/20 rounded-2xl rotate-12' />
        <div className='absolute bottom-40 left-5 w-24 h-24 bg-green-300/15 rounded-xl -rotate-12' />
      </div>

      <div className='max-w-[95%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12 relative z-10'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-4xl sm:text-5xl font-bold text-[#2D5016] mb-4'>Bài viết Blog</h1>
          <p className='text-gray-600 text-lg'>Khám phá những bài viết mới nhất về nông nghiệp hữu cơ và kỹ thuật canh tác</p>
        </div>

        {/* Search Bar */}
        <div className='mb-6'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              placeholder='Tìm kiếm bài viết...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white shadow-sm'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {/* Main content - Blog list */}
          <div className='lg:col-span-2'>
            {error && (
              <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-6'>
                <p className='text-red-600'>{error}</p>
              </div>
            )}

            {loading ? (
              <div className='flex items-center justify-center py-12'>
                <Loader2 className='w-8 h-8 text-[#2D5016] animate-spin' />
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className='bg-white rounded-3xl shadow-lg p-12 text-center'>
                <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>
                  {searchQuery || selectedCategoryId ? 'Không tìm thấy bài viết' : 'Chưa có bài viết'}
                </h3>
                <p className='text-gray-500'>
                  {searchQuery || selectedCategoryId
                    ? 'Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác'
                    : 'Hiện tại chưa có bài viết nào được đăng tải.'}
                </p>
                {(searchQuery || selectedCategoryId) && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCategoryId(null)
                    }}
                    className='mt-4 px-6 py-2 bg-[#2D5016] text-white rounded-lg font-semibold hover:bg-green-700 transition-colors'
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>  
            ) : (
              <div className='space-y-6'>
                {filteredBlogs.map((blog) => {
                  const authorName = blog.user 
                    ? `${blog.user.firstName} ${blog.user.lastName}`.trim() 
                    : 'Không xác định'
                  const categoryName = categories.find((cat) => cat.categoryId === blog.blogCategoryId)?.name || 'Chưa phân loại'
                  
                  return (
                    <article
                      key={blog.blogId}
                      className='bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 cursor-pointer group'
                      onClick={() => navigate(`${path.blogDetail.replace(':id', blog.blogId)}`)}
                    >
                      <div className='md:flex'>
                        <div className='md:w-1/3 relative aspect-video md:aspect-auto md:h-auto overflow-hidden'>
                          <img
                            src={resolveImageUrl(typeof blog.image === 'string' ? blog.image : null)}
                            alt={blog.title}
                            className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
                            }}
                          />
                          <div className='absolute top-4 left-4'>
                            <span className='inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-md text-[#2D5016] text-sm font-bold rounded-full shadow-xl'>
                              <Tag className='w-3 h-3' />
                              {categoryName}
                            </span>
                          </div>
                        </div>
                        <div className='md:w-2/3 p-6'>
                          <h2 className='text-2xl font-bold text-[#2D5016] mb-3 group-hover:text-green-700 transition-colors line-clamp-2'>
                            {blog.title}
                          </h2>
                          <p className='text-gray-600 mb-4 line-clamp-3'>{blog.description}</p>
                          <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                            <div className='flex items-center gap-2'>
                              <Calendar className='w-4 h-4' />
                              <span>{formatDate(blog.createdAt || blog.updatedAt || '')}</span>
                            </div>
                            <div className='flex items-center gap-2'>
                              <Clock className='w-4 h-4' />
                              <span>{calculateReadTime(blog.content)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}

            {/* Results count */}
            {!loading && filteredBlogs.length > 0 && (
              <div className='mt-6 text-center text-sm text-gray-600'>
                Hiển thị {filteredBlogs.length} {filteredBlogs.length === 1 ? 'bài viết' : 'bài viết'}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1'>
            <div className='sticky top-20 space-y-6'>
              {/* Categories */}
              <div className='bg-white rounded-3xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-100'>
                <div className='flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100'>
                  <div className='p-2 bg-gradient-to-br from-[#ecf2ea] to-green-50 rounded-xl'>
                    <BookOpen className='w-5 h-5 text-[#2D5016]' />
                  </div>
                  <h3 className='text-xl font-bold text-[#2D5016]'>Danh mục</h3>
                </div>
                <div className='space-y-2.5'>
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                      selectedCategoryId === null
                        ? 'bg-gradient-to-r from-[#ecf2ea] to-green-50 text-[#2D5016] border-2 border-green-400 shadow-md'
                        : 'hover:bg-[#ecf2ea] text-gray-700 border border-transparent hover:border-green-200 hover:shadow-sm'
                    }`}
                  >
                    <span className='font-semibold group-hover:text-[#2D5016] transition-colors'>Tất cả</span>
                    <span
                      className={`text-sm px-3 py-1 rounded-full font-bold transition-all ${
                        selectedCategoryId === null
                          ? 'bg-[#2D5016] text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 group-hover:bg-green-200 group-hover:text-[#2D5016]'
                      }`}
                    >
                      {totalBlogs}
                    </span>
                  </button>
                  {categories
                    .filter((cat) => cat.isActive)
                    .map((category) => (
                      <button
                        key={category.categoryId}
                        onClick={() => handleCategoryClick(category.categoryId)}
                        className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                          selectedCategoryId === category.categoryId
                            ? 'bg-gradient-to-r from-[#ecf2ea] to-green-50 text-[#2D5016] border-2 border-green-400 shadow-md'
                            : 'hover:bg-[#ecf2ea] text-gray-700 border border-transparent hover:border-green-200 hover:shadow-sm'
                        }`}
                      >
                        <span className='font-semibold group-hover:text-[#2D5016] transition-colors'>{category.name}</span>
                        <span
                          className={`text-sm px-3 py-1 rounded-full font-bold transition-all ${
                            selectedCategoryId === category.categoryId
                              ? 'bg-[#2D5016] text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 group-hover:bg-green-200 group-hover:text-[#2D5016]'
                          }`}
                        >
                          {category.count || 0}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BlogList

