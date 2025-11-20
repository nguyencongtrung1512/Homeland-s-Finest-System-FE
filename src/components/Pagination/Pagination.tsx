import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react' // Đã thêm ChevronsRight
import React from 'react'

/*
* Với range = 2 áp dụng chho khoảng cách dấu, cuối cùng và xung quanh curent_page

[1] 2 3 ... 19 20
1 [2] 3 4 ... 19 20                 TH1: current_page = 1 RANGE = 2, 2 số kế sau là pageNumber> page + Range , 19 20 pageNumber < pageSize - range + 1
1 2 [3] 4 5 ... 19 20                                                 thì hiện dấu ...
1 2 3 [4] 5 6 ... 19 20
1 2 3 4 [5] 6 7 ... 19 20

                                                TH2        page > RANGE * 2 + 1 && page < pageSize - RANGE * 2
1 2 ... 4 5 [6] 7 8 ... 19 20                ... dấu 3 chấm before, pageNumber < page - RANGE && pageNumber >  range
1 2 ... 13 14 [15] 16 17 ... 19 20            dấu 3 chấm after,pageNumber >page + Range && pageNumber < pageSize - RANGE + 1 ...


1 2 ... 14 15 [16] 17 18 19 20             TH3: current_page = 16 RANGE = 2, page > pageSize - RANGE * 2 && pageNumber > RANGE && pageNumber < page - RANGE 
1 2 ... 15 16 [17] 18 19 20                                                       hiện 17 18 19 20                                    hiện 14 15
1 2 ... 16 17 [18] 19 20                                                                                                                                          
1 2 ... 17 18 [19] 20
1 2 ... 18 19 [20]
*/

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number // Được hiểu là RANGE theo mô tả (mặc định 2)
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, maxVisiblePages = 2 }) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const range = Math.max(1, maxVisiblePages)
    const totalNumbers = range * 2 + 3 // 1 (current) + range hai bên + 2 đầu/cuối

    if (totalPages <= totalNumbers) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    const left = currentPage - range
    const right = currentPage + range

    pages.push(1)

    if (left <= 2) {
      for (let i = 2; i <= Math.min(totalPages - 1, 1 + range * 2); i++) {
        pages.push(i)
      }
      pages.push('...')
    } else if (right >= totalPages - 1) {
      pages.push('...')
      for (let i = Math.max(2, totalPages - range * 2); i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push('...')
      for (let i = left; i <= right; i++) {
        pages.push(i)
      }
      pages.push('...')
    }

    pages.push(totalPages)

    return pages
  }

  const pageNumbers = getPageNumbers()

  const buttonBaseClass =
    'px-3 py-2 border rounded-lg transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className='flex flex-wrap justify-center items-center gap-2 mt-6'>
      {/* Nút trang đầu tiên: <ChevronsLeft /> */}
      <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={buttonBaseClass}>
        <ChevronsLeft className='h-4 w-4' />
      </button>

      {/* Nút trang trước: <ChevronLeft /> (Đã sửa từ ChevronRight) */}
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={buttonBaseClass}>
        <ChevronLeft className='h-4 w-4' />
      </button>

      <div className='flex items-center gap-1'>
        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className='px-2 text-gray-500'>
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`${buttonBaseClass} ${currentPage === page ? 'bg-green-600 text-white border-green-600 hover:bg-green-600' : ''
                }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Nút trang kế tiếp: <ChevronRight /> (Đã sửa từ ChevronLeft) */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={buttonBaseClass}
      >
        <ChevronRight className='h-4 w-4' />
      </button>

      {/* Nút trang cuối cùng: <ChevronsRight /> (Đã sửa từ ChevronRight) */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={buttonBaseClass}
      >
        <ChevronsRight className='h-4 w-4' />
      </button>
    </div>
  )
}

export default Pagination
