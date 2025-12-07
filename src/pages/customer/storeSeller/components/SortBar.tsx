import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'

export type SortOption = 'popular' | 'newest' | 'bestseller' | 'price-low' | 'price-high'

interface SortBarProps {
  selectedSort: SortOption
  onSortChange: (sort: SortOption) => void
  onSearchChange?: (searchQuery: string) => void
  searchValue?: string
}

function SortBar({ selectedSort, onSortChange, onSearchChange, searchValue = '' }: SortBarProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)

  // Sync local state with prop when prop changes
  useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  const handleButtonClick = (sort: SortOption) => {
    onSortChange(sort)
  }

  const handlePriceSelect = (value: string) => {
    onSortChange(value as SortOption)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalSearchValue(value)
    onSearchChange?.(value)
  }

  return (
    <div className='bg-gray-100 rounded-lg px-4 py-3 flex flex-wrap items-center gap-3'>
      {/* Search Input */}
      <div className='relative flex-1 min-w-[200px]'>
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
        <Input
          type='text'
          placeholder='Tìm kiếm sản phẩm...'
          value={localSearchValue}
          onChange={handleSearchChange}
          className='pl-10 pr-4 py-2 w-full bg-white border-gray-200 focus:border-green-500 focus:ring-green-500'
        />
      </div>

      {/* Sort Options */}
      <div className='flex flex-wrap items-center gap-3'>
        <span className='text-sm font-medium text-gray-700 whitespace-nowrap'>Sắp xếp theo:</span>

        {/* Phổ Biến Button */}
        <button
          onClick={() => handleButtonClick('popular')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedSort === 'popular' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          Phổ Biến
        </button>

        {/* Mới Nhất Button */}
        <button
          onClick={() => handleButtonClick('newest')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedSort === 'newest' ? 'bg-green-600 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          Mới Nhất
        </button>

        {/* Bán Chạy Button */}
        <button
          onClick={() => handleButtonClick('bestseller')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${selectedSort === 'bestseller'
            ? 'bg-green-600 text-white shadow-sm'
            : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
        >
          Bán Chạy
        </button>

        {/* Giá Dropdown */}
        <Select
          value={selectedSort === 'price-low' || selectedSort === 'price-high' ? selectedSort : undefined}
          onValueChange={handlePriceSelect}
        >
          <SelectTrigger className='w-[120px] bg-white text-gray-700 hover:bg-gray-50 border-gray-200'>
            <SelectValue placeholder='Giá' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='price-low'>Giá thấp</SelectItem>
            <SelectItem value='price-high'>Giá cao</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export default SortBar

