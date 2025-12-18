import { useState, useEffect, useRef, useCallback } from 'react'
import searchApi, { type SearchSuggestRequest } from '../../apis/search.api'

interface SearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: (value: string) => void
  placeholder?: string
  className?: string
  userId?: string | null
  debounceDelay?: number
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = 'Tìm kiếm...',
  className = '',
  userId,
  debounceDelay = 300
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [autocompleteText, setAutocompleteText] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch suggestions với debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value.trim()) {
      setSuggestions([])
      setAutocompleteText('')
      setShowSuggestions(false)
      return
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsLoading(true)
        const request: SearchSuggestRequest = {
          prefix: value.trim(),
          userId: userId || null,
          limit: 5
        }
        const results = await searchApi.suggest(request)

        // API trả về string[] (mảng các từ khóa gợi ý như: ["khô", "kh", "kho"])
        const suggestionStrings: string[] = Array.isArray(results) ? results : []

        setSuggestions(suggestionStrings)

        // Tìm suggestion đầu tiên phù hợp để hiển thị autocomplete
        const firstMatch = suggestionStrings.find((s) => s.toLowerCase().startsWith(value.toLowerCase()))
        setAutocompleteText(firstMatch || '')

        setShowSuggestions(suggestionStrings.length > 0)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        setAutocompleteText('')
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
      }
    }, debounceDelay)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value, userId, debounceDelay])

  // Click outside để đóng suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Xử lý keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) {
        if (e.key === 'Enter' && onSubmit) {
          onSubmit(value)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            const selectedSuggestion = suggestions[selectedIndex]
            onChange(selectedSuggestion)
            setShowSuggestions(false)
            if (onSubmit) {
              onSubmit(selectedSuggestion)
            }
          } else if (autocompleteText) {
            onChange(autocompleteText)
            setShowSuggestions(false)
            if (onSubmit) {
              onSubmit(autocompleteText)
            }
          } else if (onSubmit) {
            onSubmit(value)
          }
          break
        case 'Escape':
          setShowSuggestions(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
        case 'Tab':
          if (autocompleteText && e.shiftKey === false) {
            e.preventDefault()
            onChange(autocompleteText)
            setShowSuggestions(false)
            if (onSubmit) {
              onSubmit(autocompleteText)
            }
          }
          break
      }
    },
    [showSuggestions, suggestions, selectedIndex, autocompleteText, value, onChange, onSubmit]
  )

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
    if (onSubmit) {
      onSubmit(suggestion)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setSelectedIndex(-1)
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  // Tính toán phần autocomplete text để hiển thị
  const getAutocompleteDisplay = () => {
    if (!autocompleteText || !value || selectedIndex >= 0) return ''
    if (autocompleteText.toLowerCase().startsWith(value.toLowerCase())) {
      return autocompleteText.slice(value.length)
    }
    return ''
  }

  const autocompleteDisplay = getAutocompleteDisplay()

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className='relative flex items-center'>
        {/* Search Icon */}
        <svg
          className='absolute left-3 h-5 w-5 text-gray-400 pointer-events-none'
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z'
          />
        </svg>

        {/* Input với autocomplete overlay */}
        <div className='relative w-full'>
          <input
            ref={inputRef}
            type='text'
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className='w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-300 bg-white text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all shadow-sm'
            autoComplete='off'
            spellCheck={false}
            autoCorrect='off'
            autoCapitalize='off'
          />

          {/* Autocomplete text overlay (mờ, phần còn lại sau khi người dùng đã gõ) */}
          {autocompleteDisplay && showSuggestions && (
            <div className='absolute left-10 top-2.5 pointer-events-none text-sm text-gray-400'>
              {/* Giữ chỗ bằng text vô hình để phần gợi ý căn đúng ngay sau con trỏ */}
              <span className='opacity-0'>{value}</span>
              <span className='text-gray-300'>{autocompleteDisplay}</span>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className='absolute right-3'>
            <svg
              className='animate-spin h-5 w-5 text-gray-400'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className='absolute z-50 w-full mt-1 bg-white rounded-lg border border-gray-200 shadow-lg max-h-60 overflow-y-auto'
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type='button'
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-gray-100' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}`}
            >
              <div className='flex items-center gap-2'>
                <svg
                  className='h-4 w-4 text-gray-400 flex-shrink-0'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z'
                  />
                </svg>
                <span className='text-gray-700'>{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
