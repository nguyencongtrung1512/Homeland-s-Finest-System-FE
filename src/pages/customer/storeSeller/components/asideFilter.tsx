import { useState } from 'react'
import { Gift, Package, Calendar, Utensils, Cookie, Trophy } from 'lucide-react'

interface AsideFilterProps {
  onCategoryChange?: (category: string) => void
  onSuggestionChange?: (suggestion: string) => void
}

function AsideFilter({ onCategoryChange, onSuggestionChange }: AsideFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)

  const categories = [
    {
      id: 'individual',
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

  const suggestions = [
    {
      id: 'tet-gifts',
      label: 'Quà tết',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      id: 'specialties',
      label: 'Đặc sản',
      icon: Utensils,
      color: 'text-green-600'
    },
    {
      id: 'snacks',
      label: 'Đồ ăn vặt',
      icon: Cookie,
      color: 'text-green-600'
    },
    {
      id: 'bestsellers',
      label: 'Bán chạy',
      icon: Trophy,
      color: 'text-green-600'
    }
  ]

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
    onCategoryChange?.(categoryId === selectedCategory ? '' : categoryId)
  }

  const handleSuggestionClick = (suggestionId: string) => {
    setSelectedSuggestion(suggestionId === selectedSuggestion ? null : suggestionId)
    onSuggestionChange?.(suggestionId === selectedSuggestion ? '' : suggestionId)
  }

  return (
    <aside className='w-full lg:w-64 bg-white rounded-lg shadow-sm p-6 space-y-6'>
      {/* Danh mục Sản phẩm */}
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Loại sản phẩm</h3>
        <div className='space-y-2'>
          {categories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id

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
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon
            const isSelected = selectedSuggestion === suggestion.id

            return (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${isSelected
                  ? 'bg-green-50 border-2 border-green-500 text-green-700 font-medium'
                  : 'bg-gray-50 hover:bg-green-50 border-2 border-transparent hover:border-green-200 text-gray-700'
                  }`}
              >
                <Icon className={`w-5 h-5 ${suggestion.color} flex-shrink-0`} />
                <span className='text-sm'>{suggestion.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default AsideFilter
