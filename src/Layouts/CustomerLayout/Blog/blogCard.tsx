import { useNavigate } from 'react-router-dom'
import type { Blog } from '../../../apis/blog.api'

const BlogCard = ({ post }: { post: Blog }) => {
  const navigate = useNavigate()

  return (
    <div className='bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer' onClick={() => navigate(`/blog/${post.blogID}`)}>
      <div className='flex flex-col md:flex-row h-auto min-h-[300px]'>
        <div className='w-full md:w-1/2 h-64 md:h-auto relative overflow-hidden'>
          <img
            src={`data:image/webp;base64,${post.image}`}
            alt={post.title}
            className='w-full h-full object-cover absolute inset-0 transition-transform duration-500 hover:scale-110'
          />
        </div>
        <div className='w-full md:w-1/2 p-6 overflow-hidden'>
          <div className='bg-green-500 hover:bg-[#001a33] text-white inline-block px-4 py-1.5 rounded-md mb-4 text-sm font-medium transition-colors duration-200 cursor-pointer'>
            {post.categoryName}
          </div>
          <h2 className='text-lg md:text-2xl font-bold mb-3 text-gray-900 line-clamp-2'>{post.title}</h2>
          <p className='text-gray-600 mb-3 text-sm line-clamp-3'>{post.description}</p>
        </div>
      </div>
    </div>
  )
}

export default BlogCard