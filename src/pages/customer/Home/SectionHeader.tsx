import { Button } from '../../../components/ui/button'
import { ChevronRight } from 'lucide-react'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  viewAllLink?: string
}

export default function SectionHeader({ title, subtitle, viewAllLink }: SectionHeaderProps) {
  return (
    <div className='flex justify-between items-center mb-6'>
      <div>
        <h2 className='text-2xl md:text-3xl font-serif font-bold text-green-800'>{title}</h2>
        {subtitle && <p className='text-gray-500 text-sm mt-1'>{subtitle}</p>}
      </div>
      {viewAllLink && (
        <Button
          variant='outline'
          className='rounded-full px-4 py-2 border-green-600 text-green-700 hover:bg-green-50 transition-colors'
          onClick={() => {
            window.location.href = viewAllLink
          }}
        >
          Xem tất cả
          <ChevronRight className='ml-1 h-4 w-4' />
        </Button>
      )}
    </div>
  )
}

