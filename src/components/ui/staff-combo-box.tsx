import { useState, useRef, useEffect } from 'react'
import type { Staff } from '../../apis/admin.api'

interface StaffComboBoxProps {
  options: Staff[]
  placeholder?: string
  onSelect?: (staffId: string | null, staff?: Staff | null) => void
  value?: string
  disabled?: boolean
}

const StaffComboBox = ({
  options = [],
  placeholder = 'Chọn nhân viên...',
  onSelect,
  value,
  disabled = false
}: StaffComboBoxProps) => {
  const [inputValue, setInputValue] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [filteredOptions, setFilteredOptions] = useState<Staff[]>(options)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  const comboBoxRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Update when value prop changes
  useEffect(() => {
    if (value !== undefined && value !== '') {
      const staff = options.find((s) => s.staffId === value)
      setSelectedStaff(staff || null)
      setInputValue(staff ? staff.staffName : '')
    } else {
      setSelectedStaff(null)
      setInputValue('')
    }
  }, [value, options])

  // Close dropdown when disabled
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false)
    }
  }, [disabled, isOpen])

  // Filter options based on input
  useEffect(() => {
    if (inputValue === '') {
      setFilteredOptions(options)
    } else {
      const searchLower = inputValue.toLowerCase()
      setFilteredOptions(
        options.filter(
          (staff) =>
            staff.staffName.toLowerCase().includes(searchLower) || staff.email.toLowerCase().includes(searchLower)
        )
      )
    }
    setHighlightedIndex(-1)
    optionRefs.current = []
  }, [inputValue, options])

  // Scroll to highlighted option
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, [highlightedIndex])

  // Close on outside click
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
    setSelectedStaff(null)
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true)
      if (filteredOptions.length > 0) {
        setHighlightedIndex(e.key === 'ArrowDown' ? 0 : filteredOptions.length - 1)
      }
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (filteredOptions.length > 0) {
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (filteredOptions.length > 0) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        }
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionSelect(filteredOptions[highlightedIndex])
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

  const handleOptionSelect = (staff: Staff) => {
    setSelectedStaff(staff)
    setInputValue(staff.staffName)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onSelect?.(staff.staffId, staff)
  }

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleClearSelection = () => {
    setInputValue('')
    setSelectedStaff(null)
    setIsOpen(false)
    setHighlightedIndex(-1)
    onSelect?.(null, null)
  }

  return (
    <div className='relative w-full' ref={comboBoxRef}>
      <div className='relative'>
        <input
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 pr-20 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          role='combobox'
          aria-expanded={isOpen}
          aria-haspopup='listbox'
          aria-controls='staff-combobox-options'
          aria-autocomplete='list'
          aria-activedescendant={highlightedIndex >= 0 ? `staff-option-${highlightedIndex}` : undefined}
        />
        {selectedStaff && (
          <button
            type='button'
            onClick={handleClearSelection}
            className='absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
            aria-label='Xóa lựa chọn'
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
          aria-label='Mở/đóng danh sách'
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </button>
      </div>

      {isOpen && !disabled && (
        <div
          id='staff-combobox-options'
          className='absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto'
          role='listbox'
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((staff, index) => (
              <button
                key={staff.staffId}
                ref={(el) => {
                  optionRefs.current[index] = el
                }}
                id={`staff-option-${index}`}
                onClick={() => handleOptionSelect(staff)}
                className={`w-full px-4 py-3 text-left focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors flex items-center gap-3 ${index === highlightedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50'
                  }`}
                role='option'
                aria-selected={selectedStaff?.staffId === staff.staffId}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0'>
                  <span className='text-sm font-semibold text-blue-600'>{staff.staffName.charAt(0).toUpperCase()}</span>
                </div>
                <div className='flex flex-col flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>{staff.staffName}</p>
                  <p className='text-xs text-gray-500 truncate'>{staff.email}</p>
                </div>
              </button>
            ))
          ) : (
            <div className='px-4 py-3 text-gray-500 text-center' role='status'>
              Không tìm thấy nhân viên
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default StaffComboBox
