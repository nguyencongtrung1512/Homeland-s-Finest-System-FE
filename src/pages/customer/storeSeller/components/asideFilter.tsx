import { memo } from 'react'
import { Gift, Package, Calendar, Utensils, Cookie, Trophy, Tag, Grid3x3 } from 'lucide-react'
import type { HashtagItem } from '../../../../apis/hashtag.api'

interface AsideFilterProps {
  onCategoryChange?: (category: string) => void
  onSuggestionChange?: (hashtagIds: string[]) => void
  hashtags?: HashtagItem[]
  hashtagsLoading?: boolean
  selectedCategory?: string // Prop để sync selected category từ parent
  selectedHashtagIds?: string[] // Prop để sync selected hashtag IDs từ parent
}

function AsideFilter({
  onCategoryChange,
  onSuggestionChange,
  hashtags = [],
  hashtagsLoading = false,
  selectedCategory: selectedCategoryProp = '', // Nhận từ parent, empty string = "Tất cả"
  selectedHashtagIds: selectedHashtagIdsProp = [] // Nhận từ parent, empty array = "Tất cả"
}: AsideFilterProps) {
  // Map selectedCategoryProp từ parent: empty string = 'all', 'Product' = 'Product', 'combo' = 'combo'
  const selectedCategoryId = selectedCategoryProp === '' ? 'all' : selectedCategoryProp

  // Map selectedHashtagIdsProp: empty array = "Tất cả" được chọn, có ID = hashtag đó được chọn
  const selectedHashtagId = selectedHashtagIdsProp.length > 0 ? selectedHashtagIdsProp[0] : 'all'

  const categories = [
    {
      id: 'all',
      label: 'Tất cả',
      icon: Grid3x3,
      color: 'text-green-600'
    },
    {
      id: 'Product',
      label: 'sản phẩm lẻ',
      icon: Gift,
      color: 'text-green-600'
    },
    {
      id: 'combo',
      label: 'sản phẩm combo',
      icon: Package,
      color: 'text-green-600'
    }
  ]

  // Helper function to get icon based on hashtag name
  const getHashtagIcon = (hashtagName: string) => {
    const nameLower = hashtagName.toLowerCase()
    if (nameLower.includes('tết') || nameLower.includes('tet')) return Calendar
    if (nameLower.includes('đặc sản') || nameLower.includes('specialty') || nameLower.includes('đặc biệt'))
      return Utensils
    if (nameLower.includes('ăn vặt') || nameLower.includes('snack')) return Cookie
    if (nameLower.includes('bán chạy') || nameLower.includes('bestseller') || nameLower.includes('hot')) return Trophy
    return Tag // Default icon
  }

  const handleCategoryClick = (categoryId: string) => {
    // Nếu click vào option đang được chọn, thì không làm gì (giữ nguyên selection)
    if (categoryId === selectedCategoryId) {
      return
    }

    // Chọn option mới
    // Nếu là "Tất cả" thì gửi empty string, nếu không thì gửi categoryId
    onCategoryChange?.(categoryId === 'all' ? '' : categoryId)
  }

  const handleHashtagClick = (hashtagId: string) => {
    // Nếu click vào "Tất cả" hoặc hashtag đang được chọn
    if (hashtagId === 'all') {
      // Click "Tất cả" → gửi empty array
      onSuggestionChange?.([])
    } else {
      // Nếu click vào hashtag đang được chọn, thì deselect (chọn "Tất cả")
      if (selectedHashtagId === hashtagId) {
        onSuggestionChange?.([])
      } else {
        // Chọn hashtag mới
        onSuggestionChange?.([hashtagId])
      }
    }
  }

  return (
    <aside className='w-full lg:w-64 bg-white rounded-lg shadow-sm p-6 space-y-6'>
      {/* Danh mục Sản phẩm */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Loại sản phẩm</h3>
        <div className='space-y-2'>
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategoryId === category.id

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${isSelected
                  ? 'bg-green-50 border-2 border-green-500 text-green-700 font-medium'
                  : 'bg-gray-50 hover:bg-green-50 border-2 border-transparent hover:border-green-200 text-gray-700'
                  }`}
              >
                <Icon className={`w-5 h-5 ${category.color} flex-shrink-0`} />
                <span className='text-sm'>{category.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Gợi ý Đặc biệt */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Gợi ý Đặc biệt</h3>
        <div className='space-y-2'>
          {hashtagsLoading ? (
            <div className='text-center py-4'>
              <span className='text-sm text-gray-500'>Đang tải...</span>
            </div>
          ) : (
            <>
              {/* Option "Tất cả" - luôn hiển thị đầu tiên */}
              <button
                onClick={() => handleHashtagClick('all')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${selectedHashtagId === 'all'
                  ? 'bg-green-50 border-2 border-green-500 text-green-700 font-medium'
                  : 'bg-gray-50 hover:bg-green-50 border-2 border-transparent hover:border-green-200 text-gray-700'
                  }`}
              >
                <Grid3x3 className='w-5 h-5 text-green-600 flex-shrink-0' />
                <span className='text-sm'>Tất cả</span>
              </button>

              {/* Danh sách hashtags từ API */}
              {hashtags.length > 0 ? (
                hashtags.map((hashtag) => {
                  const Icon = getHashtagIcon(hashtag.name)
                  const isSelected = selectedHashtagId === hashtag.id

                  return (
                    <button
                      key={hashtag.id}
                      onClick={() => handleHashtagClick(hashtag.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${isSelected
                        ? 'bg-green-50 border-2 border-green-500 text-green-700 font-medium'
                        : 'bg-gray-50 hover:bg-green-50 border-2 border-transparent hover:border-green-200 text-gray-700'
                        }`}
                    >
                      <Icon className='w-5 h-5 text-green-600 flex-shrink-0' />
                      <span className='text-sm'>{hashtag.name}</span>
                    </button>
                  )
                })
              ) : (
                <div className='text-center py-4'>
                  <span className='text-sm text-gray-500'>Chưa có gợi ý đặc biệt</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  )
}

// Memoize để tránh re-render không cần thiết khi products loading
export default memo(AsideFilter)
