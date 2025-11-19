import { useState, useRef, useEffect } from 'react'
import { Search, Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
}

interface ProductComboBoxProps {
  products: Product[]
  placeholder?: string
  onSelect?: (product: Product | null) => void
  value?: string | null
  disabled?: boolean
}

const ProductComboBox = ({
  products = [],
  placeholder = 'Chọn sản phẩm cha...',
  onSelect,
  value,
  disabled = false
}: ProductComboBoxProps) => {
  const [inputValue, setInputValue] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  const comboBoxRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Update input value when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== null) {
      const product = products.find((p) => p.id === value)
      if (product) {
        setSelectedProduct(product)
        setInputValue(product.name)
      }
    } else {
      setSelectedProduct(null)
      setInputValue('')
    }
  }, [value, products])

  // Close dropdown when disabled
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false)
    }
  }, [disabled, isOpen])

  useEffect(() => {
    if (inputValue === '') {
      setFilteredProducts(products)
    } else {
      const searchTerm = inputValue.toLowerCase()
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm)
        )
      )
    }
    setHighlightedIndex(-1)
    optionRefs.current = []
  }, [inputValue, products])

  // Scroll to highlighted option
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [highlightedIndex])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboBoxRef.current && !comboBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    setInputValue(e.target.value)
    setIsOpen(true)
    setSelectedProduct(null)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      if (filteredProducts.length > 0) {
        setHighlightedIndex(e.key === 'ArrowDown' ? 0 : filteredProducts.length - 1)
      }
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (filteredProducts.length > 0) {
          setHighlightedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : 0))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (filteredProducts.length > 0) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredProducts.length - 1))
        }
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
          handleProductSelect(filteredProducts[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setInputValue(product.name)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onSelect?.(product)
  }

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleClearSelection = () => {
    setInputValue('')
    setSelectedProduct(null)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onSelect?.(null)
  }

  return (
    <div className='relative w-full' ref={comboBoxRef}>
      <div className='relative'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
          <input
            type='text'
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-500 transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-white hover:border-gray-400'
              }`}
            role='combobox'
            aria-expanded={isOpen}
            aria-haspopup='listbox'
            aria-controls='product-combobox-options'
            aria-autocomplete='list'
            aria-activedescendant={highlightedIndex >= 0 ? `product-option-${highlightedIndex}` : undefined}
          />
          {selectedProduct && (
            <button
              type='button'
              onClick={handleClearSelection}
              className='absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
              aria-label='Clear selection'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          )}
          <button
            type='button'
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-gray-600'
              }`}
            aria-label='Toggle dropdown'
          >
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          id='product-combobox-options'
          className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto'
          role='listbox'
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <button
                key={product.id}
                ref={(el) => {
                  optionRefs.current[index] = el
                }}
                id={`product-option-${index}`}
                onClick={() => handleProductSelect(product)}
                className={`w-full px-4 py-3 text-left focus:outline-none transition-colors border-b border-gray-100 last:border-b-0 ${index === highlightedIndex
                  ? 'bg-green-50 text-green-900 border-l-4 border-l-green-500'
                  : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                  }`}
                role='option'
                aria-selected={selectedProduct?.id === product.id}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className='flex items-start gap-3'>
                  <div className='flex-shrink-0 mt-1'>
                    <Package className='w-5 h-5 text-green-600' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-900 truncate'>{product.name}</p>
                    {product.description && (
                      <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{product.description}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className='px-4 py-8 text-center text-gray-500' role='status'>
              <Package className='w-8 h-8 mx-auto mb-2 text-gray-400' />
              <p>Không tìm thấy sản phẩm nào</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductComboBox

