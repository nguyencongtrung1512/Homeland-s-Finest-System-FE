import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Tag, Clock, BookOpen, Loader2, ArrowLeft } from 'lucide-react'
import { blogApi, type BlogItem } from '../../../apis/blog.api'
import { blogCategoryApi, type BlogCategoryItem } from '../../../apis/categoryBlog.api'
import { resolveImageUrl } from '../../../utils/image'

interface CategoryWithCount extends BlogCategoryItem {
  count?: number
}

interface RelatedArticle {
  id: string
  title: string
  description: string
  image: string
  date: string
}

function ViewBlog() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [blogData, setBlogData] = useState<BlogItem | null>(null)
  const [blogList, setBlogList] = useState<BlogItem[]>([])
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Format date helper for display - handles format: "HH:mm:ss DD/MM/YYYY"
  const formatDateDisplay = useCallback((dateString: string) => {
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

  // Format date helper for relative time (used in related articles) - handles format: "HH:mm:ss DD/MM/YYYY"
  const formatDate = useCallback((dateString: string) => {
    if (!dateString || dateString.trim() === '') return 'Chưa có ngày'
    
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
      
      if (isNaN(date.getTime())) {
        return 'Chưa có ngày'
      }
      
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Hôm nay'
      if (diffDays === 1) return 'Hôm qua'
      if (diffDays < 7) return `${diffDays} ngày trước`
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
      return `${Math.floor(diffDays / 365)} năm trước`
    } catch (error) {
      console.error('Error formatting date:', error, dateString)
      return 'Chưa có ngày'
    }
  }, [])

  // Calculate read time (estimate: 200 words per minute)
  const calculateReadTime = useCallback((content: string) => {
    const text = content.replace(/<[^>]*>/g, '') // Remove HTML tags
    const wordCount = text.split(/\s+/).length
    const minutes = Math.ceil(wordCount / 200)
    return `${minutes} phút đọc`
  }, [])

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

  // Fetch categories (always fetch)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await blogCategoryApi.getAll({ pageSize: 0 })
        console.log('Categories response:', categoriesResponse)
        
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

  // Fetch blog data - either list or detail
  useEffect(() => {
    const fetchBlogData = async () => {
      try {
        setLoading(true)
        setError(null)

        if (id) {
          // Fetch blog detail by ID
          const blogResponse = await blogApi.getById(id)
          console.log('Blog detail response:', blogResponse)
          
          const blog = extractData(blogResponse) as BlogItem
          console.log('Blog data from API:', blog)
          console.log('Blog createdAt:', blog?.createdAt, 'Type:', typeof blog?.createdAt)
          console.log('Blog object keys:', blog ? Object.keys(blog) : [])
          
          if (!blog || !blog.blogId) {
            setError('Không tìm thấy blog')
            setLoading(false)
            return
          }

          setBlogData(blog)

          // Fetch related articles (blogs from same category, excluding current blog)
          if (blog.blogCategoryId) {
            try {
              // Use getBlogCategoryDetail to get accurate blogs in category
              const categoryDetailResponse = await blogCategoryApi.getDetail(blog.blogCategoryId)
              console.log('Related articles - Category detail response:', categoryDetailResponse)
              
              let relatedBlogs: any[] = []
              const extracted = extractData(categoryDetailResponse)
              
              // Handle different response structures
              if (Array.isArray(extracted) && extracted.length > 0) {
                // Response is array, check first item for blogs
                const firstItem = extracted[0]
                if (firstItem && firstItem.blogs && Array.isArray(firstItem.blogs)) {
                  relatedBlogs = firstItem.blogs.filter((b: any) => b.isActive !== false)
                }
              } else if (extracted && extracted.blogs && Array.isArray(extracted.blogs)) {
                // Response is object with blogs array
                relatedBlogs = extracted.blogs.filter((b: any) => b.isActive !== false)
              }
              
              // If no blogs from getDetail, fallback to getAll
              if (relatedBlogs.length === 0) {
                console.log('No blogs from getDetail, trying getAll API for related articles...')
                const relatedResponse = await blogApi.getAll({
                  categoryId: blog.blogCategoryId,
                  isActive: true,
                  pageSize: 0
                })
                const blogsData = extractData(relatedResponse) as BlogItem[]
                relatedBlogs = Array.isArray(blogsData) 
                  ? blogsData.filter((b) => b.isActive && b.blogCategoryId === blog.blogCategoryId)
                  : []
              }
              
              console.log('All related blogs from category:', relatedBlogs)
              
              // Filter out current blog and map to RelatedArticle format
              const related = relatedBlogs
                .filter((b: any) => {
                  const blogId = b.blogId || b.id
                  return blogId && blogId !== blog.blogId
                })
                .slice(0, 3)
                .map((b: any) => ({
                  id: b.blogId || b.id,
                  title: b.title || '',
                  description: b.description || '',
                  image: typeof b.image === 'string' ? b.image : '',
                  date: formatDate(b.createdAt || b.updatedAt || '')
                }))
              
              console.log('Final related articles:', related)
              setRelatedArticles(related)
            } catch (err) {
              console.error('Error fetching related articles:', err)
            }
          }
        } else {
          // Fetch blog list
          const blogListResponse = await blogApi.getAll({
            isActive: true,
            pageSize: 0
          })
          console.log('Blog list response:', blogListResponse)
          
          const blogs = extractData(blogListResponse) as BlogItem[]
          setBlogList(Array.isArray(blogs) ? blogs : [])
        }
      } catch (err: any) {
        console.error('Error fetching blog data:', err)
        setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tải dữ liệu blog')
      } finally {
        setLoading(false)
      }
    }

    fetchBlogData()
  }, [id, formatDate, formatDateDisplay, extractData])

  // Handle category click - fetch blogs by category
  const handleCategoryClick = async (categoryId: string) => {
    if (id) return // Don't filter when viewing blog detail
    
    try {
      setLoading(true)
      setSelectedCategoryId(categoryId)
      
      // Use getBlogCategoryDetail to get accurate blogs in category
      const categoryDetailResponse = await blogCategoryApi.getDetail(categoryId)
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
          categoryId,
          isActive: true,
          pageSize: 0
        })
        const blogsData = extractData(blogsResponse) as BlogItem[]
        blogs = Array.isArray(blogsData) ? blogsData.filter((b) => b.isActive && b.blogCategoryId === categoryId) : []
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
    } catch (err) {
      console.error('Error fetching category blogs:', err)
      setError('Không thể tải danh sách blog của danh mục này')
    } finally {
      setLoading(false)
    }
  }

  // Handle "All" category click - fetch all blogs
  const handleAllCategoriesClick = async () => {
    if (id) return
    
    try {
      setLoading(true)
      setSelectedCategoryId(null)
      
      const blogListResponse = await blogApi.getAll({
        isActive: true,
        pageSize: 0
      })
      
      const blogs = extractData(blogListResponse) as BlogItem[]
      setBlogList(Array.isArray(blogs) ? blogs : [])
    } catch (err) {
      console.error('Error fetching all blogs:', err)
      setError('Không thể tải danh sách blog')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-[#F6FAF3] flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-12 h-12 text-[#2D5016] animate-spin mx-auto mb-4' />
          <p className='text-[#2D5016] font-semibold'>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  // Error state (only show if viewing detail and error)
  if (id && (error || !blogData)) {
    return (
      <div className='min-h-screen bg-[#F6FAF3] flex items-center justify-center'>
        <div className='text-center bg-white rounded-3xl shadow-lg p-8 max-w-md'>
          <p className='text-red-600 font-semibold text-lg mb-4'>{error || 'Không tìm thấy blog'}</p>
          <button
            onClick={() => navigate('/view-blog')}
            className='px-6 py-3 bg-[#2D5016] text-white rounded-xl font-semibold hover:bg-green-700 transition-colors'
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  // If viewing blog detail
  if (id && blogData) {
    const categoryName = categories.find((cat) => cat.categoryId === blogData.blogCategoryId)?.name || 'Chưa phân loại'
    
  return (
    <div className='min-h-screen bg-[#F6FAF3] relative overflow-hidden'>
      {/* Background Pattern - Grid style như template Wrisx */}
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
        {/* Decorative squares */}
        <div className='absolute top-20 right-10 w-32 h-32 bg-green-200/20 rounded-2xl rotate-12' />
        <div className='absolute bottom-40 left-5 w-24 h-24 bg-green-300/15 rounded-xl -rotate-12' />
        <div className='absolute top-1/2 right-1/4 w-16 h-16 bg-green-200/25 rounded-lg rotate-45' />
      </div>

      <div className='max-w-[95%] xl:max-w-[90%] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12 relative z-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {/* Main content */}
          <div className='lg:col-span-2'>
            <article className='bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100'>
              {/* Blog image with modern overlay */}
              <div className='relative aspect-video overflow-hidden group'>
                <img
                  src={resolveImageUrl(typeof blogData.image === 'string' ? blogData.image : null)}
                  alt={blogData.title}
                  className='w-full h-full object-cover transition-transform duration-700 group-hover:scale-110'
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
                  }}
                />
                <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent' />
                
                {/* Back Button on image - Top left */}
                <div className='absolute top-6 left-6 z-10'>
                  <button
                    onClick={() => navigate('/view-blog')}
                    className='inline-flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md text-[#2D5016] font-bold rounded-full shadow-xl border border-white/50 hover:bg-white hover:shadow-2xl transition-all duration-200 group'
                  >
                    <ArrowLeft className='w-5 h-5 group-hover:-translate-x-1 transition-transform' />
                    <span>Quay lại</span>
                  </button>
                </div>
                
                {/* Category badge on image - Modern style */}
                <div className='absolute top-6 right-6'>
                  <span className='inline-flex items-center gap-2 px-5 py-2 bg-white/95 backdrop-blur-md text-[#2D5016] text-sm font-bold rounded-full shadow-xl border border-white/50'>
                    <Tag className='w-4 h-4' />
                    {categoryName}
                  </span>
                </div>

                {/* Decorative element */}
                <div className='absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent' />
              </div>

              {/* Blog content */}
              <div className='p-6 sm:p-8 lg:p-10'>
                {/* Title with decorative line */}
                <div className='mb-6'>
                  <div className='w-16 h-1 bg-gradient-to-r from-green-500 to-green-300 rounded-full mb-4' />
                  <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2D5016] mb-4 leading-tight'>
                    {blogData.title}
                  </h1>
                </div>

                {/* Description */}
                <p className='text-lg sm:text-xl text-gray-700 mb-8 leading-relaxed font-medium border-l-4 border-green-400 pl-4'>
                  {blogData.description}
                </p>

                {/* Meta information - Enhanced design */}
                <div className='flex flex-wrap items-center gap-4 sm:gap-6 mb-8 pb-8 border-b-2 border-gray-100'>
                  <div className='flex items-center gap-2.5 text-gray-600'>
                    <div className='p-2 bg-gradient-to-br from-[#ecf2ea] to-green-50 rounded-xl shadow-sm'>
                      <Calendar className='w-4 h-4 text-[#2D5016]' />
                    </div>
                    <span>{formatDateDisplay(blogData.createdAt)}</span>
                  </div>
                  <div className='flex items-center gap-2.5 text-gray-600'>
                    <div className='p-2 bg-gradient-to-br from-[#ecf2ea] to-green-50 rounded-xl shadow-sm'>
                      <Clock className='w-4 h-4 text-[#2D5016]' />
                    </div>
                    <span className='font-medium'>{calculateReadTime(blogData.content)}</span>
                  </div>
                </div>

                {/* Content with enhanced styling */}
                <div
                  className='prose prose-lg max-w-none 
                    prose-headings:font-bold prose-headings:text-[#2D5016]
                    prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-8 prose-h1:border-b-2 prose-h1:border-gray-200 prose-h1:pb-4
                    prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:text-green-700 prose-h2:font-bold
                    prose-h3:text-xl prose-h3:mb-4 prose-h3:mt-8 prose-h3:font-semibold prose-h3:text-[#2D5016] prose-h3:flex prose-h3:items-center prose-h3:gap-2
                    prose-h3:before:content-[""] prose-h3:before:w-1 prose-h3:before:h-6 prose-h3:before:bg-green-500 prose-h3:before:rounded-full
                    prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-p:text-justify prose-p:text-base sm:prose-p:text-lg
                    prose-strong:text-[#2D5016] prose-strong:font-bold
                    prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-6 prose-ul:text-gray-700
                    prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-6 prose-ol:text-gray-700
                    prose-li:mb-3 prose-li:leading-relaxed
                    prose-blockquote:border-l-4 prose-blockquote:border-green-600 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600 prose-blockquote:bg-green-50 prose-blockquote:py-4 prose-blockquote:rounded-r-xl
                    prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono
                    prose-a:text-green-600 prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
                    prose-img:rounded-xl prose-img:shadow-lg'
                  dangerouslySetInnerHTML={{ __html: blogData.content }}
                />
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <div className='lg:col-span-1' style={{ height: 'fit-content' }}>
            <div className='sticky top-20 space-y-6'>
              {/* Related articles - Enhanced */}
              <div className='bg-white rounded-3xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl border border-gray-100'>
                <div className='flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100'>
                  <div className='p-2 bg-gradient-to-br from-[#ecf2ea] to-green-50 rounded-xl'>
                    <BookOpen className='w-5 h-5 text-[#2D5016]' />
                  </div>
                  <h3 className='text-xl font-bold text-[#2D5016]'>Bài viết liên quan</h3>
                </div>
                <div className='space-y-4'>
                  {relatedArticles.length > 0 ? (
                    relatedArticles.map((article) => (
                    <button
                      key={article.id}
                        onClick={() => navigate(`/view-blog/${article.id}`)}
                      className='w-full flex gap-4 group hover:bg-gradient-to-r hover:from-[#ecf2ea] hover:to-green-50 p-3 rounded-xl transition-all duration-200 border border-transparent hover:border-green-200 hover:shadow-md'
                    >
                      <div className='w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow'>
                        <img
                            src={resolveImageUrl(article.image)}
                          alt={article.title}
                          className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=200&fit=crop'
                            }}
                        />
                      </div>
                      <div className='flex-1 min-w-0 text-left'>
                        <h4 className='font-bold text-[#2D5016] text-sm line-clamp-2 group-hover:text-green-700 transition-colors leading-snug mb-1.5'>
                          {article.title}
                        </h4>
                        {article.description && (
                          <p className='text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2'>
                            {article.description}
                          </p>
                        )}
                        <div className='flex items-center gap-2 mt-2'>
                          <Calendar className='w-3 h-3 text-gray-400' />
                          <span className='text-xs font-medium text-gray-500'>{article.date}</span>
                        </div>
                      </div>
                    </button>
                    ))
                  ) : (
                    <p className='text-gray-500 text-sm text-center py-4'>Chưa có bài viết liên quan</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    )
  }

  // Blog list view (when no id)
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
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {/* Main content - Blog list */}
          <div className='lg:col-span-2'>
            <div className='mb-8'>
              <h1 className='text-4xl font-bold text-[#2D5016] mb-4'>Bài viết Blog</h1>
              <p className='text-gray-600 text-lg'>Khám phá những bài viết mới nhất về nông nghiệp</p>
            </div>

            {error && (
              <div className='bg-red-50 border border-red-200 rounded-xl p-4 mb-6'>
                <p className='text-red-600'>{error}</p>
              </div>
            )}

            {blogList.length === 0 ? (
              <div className='bg-white rounded-3xl shadow-lg p-12 text-center'>
                <BookOpen className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                <h3 className='text-xl font-semibold text-gray-700 mb-2'>Chưa có bài viết</h3>
                <p className='text-gray-500'>Hiện tại chưa có bài viết nào được đăng tải.</p>
              </div>
            ) : (
              <div className='space-y-6'>
                {blogList.map((blog) => {
                  const categoryName = categories.find((cat) => cat.categoryId === blog.blogCategoryId)?.name || 'Chưa phân loại'
                  
                  return (
                    <article
                      key={blog.blogId}
                      className='bg-white rounded-3xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl border border-gray-100 cursor-pointer group'
                      onClick={() => navigate(`/view-blog/${blog.blogId}`)}
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
                          <p className='text-gray-600 mb-4 line-clamp-2'>{blog.description}</p>
                          <div className='flex flex-wrap items-center gap-4 text-sm text-gray-500'>
                            <div className='flex items-center gap-2'>
                              <Calendar className='w-4 h-4' />
                              <span>{formatDateDisplay(blog.createdAt)}</span>
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
                    onClick={handleAllCategoriesClick}
                    className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                      selectedCategoryId === null
                        ? 'bg-gradient-to-r from-[#ecf2ea] to-green-50 text-[#2D5016] border-2 border-green-400 shadow-md'
                        : 'hover:bg-[#ecf2ea] text-gray-700 border border-transparent hover:border-green-200 hover:shadow-sm'
                    }`}
                  >
                    <span className='font-semibold group-hover:text-[#2D5016] transition-colors'>Tất cả</span>
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

              {/* Newsletter */}
              <div className='relative bg-gradient-to-br from-[#ecf2ea] via-green-50 to-[#ecf2ea] rounded-3xl p-6 shadow-lg border-2 border-green-200 overflow-hidden'>
                <div className='absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -mr-16 -mt-16' />
                <div className='absolute bottom-0 left-0 w-24 h-24 bg-green-300/15 rounded-full -ml-12 -mb-12' />
                
                <div className='relative z-10 text-center mb-5'>
                  <div className='inline-flex items-center justify-center w-14 h-14 bg-[#2D5016] rounded-2xl mb-4 shadow-lg'>
                    <BookOpen className='w-7 h-7 text-white' />
                  </div>
                  <h3 className='text-xl font-bold text-[#2D5016] mb-2'>Đăng ký nhận tin</h3>
                  <p className='text-gray-700 text-sm leading-relaxed font-medium'>
                    Nhận những bài viết mới nhất về nông nghiệp hữu cơ và kỹ thuật canh tác
                  </p>
                </div>
                <div className='relative z-10 space-y-3'>
                  <input
                    type='email'
                    placeholder='Nhập email của bạn'
                    className='w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-all bg-white shadow-sm'
                  />
                  <button className='w-full bg-[#2D5016] hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1'>
                    Đăng ký ngay
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
