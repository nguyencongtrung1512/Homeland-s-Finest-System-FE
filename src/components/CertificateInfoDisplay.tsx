import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Badge } from './ui/badge'
import type { ValidateCertificateResponse } from '../apis/n8n.api'
import {
  getCertificateTypeLabel,
  getLevelBadgeColor,
  getLevelLabel,
  formatCertificateData,
  getCategoryLabel
} from '../utils/certificateUtils'

interface CertificateInfoDisplayProps {
  validationResult: ValidateCertificateResponse
  className?: string
}

export default function CertificateInfoDisplay({ validationResult, className = '' }: CertificateInfoDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { type, data, level, category, IsExpired } = validationResult
  const categoryLower = category?.toLowerCase()
  const computedLevel = categoryLower === 'product' ? 'fair' : level
  const levelLower = computedLevel.toLowerCase()
  const isValid = levelLower === 'good'

  const typeLabel = getCertificateTypeLabel(type)
  const levelLabel = getLevelLabel(computedLevel)
  const badgeColor = getLevelBadgeColor(computedLevel)
  const formattedFields = formatCertificateData(data, type)
  const categoryLabel = getCategoryLabel(category)

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header - luôn hiển thị */}
      <div
        className={`p-4 cursor-pointer transition-colors ${isValid ? 'bg-emerald-50 border-emerald-200' : levelLower === 'fair' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
          }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-1'>
            {isValid ? (
              <CheckCircle2 className='w-5 h-5 text-emerald-600 flex-shrink-0' />
            ) : (
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${levelLower === 'fair' ? 'text-yellow-600' : 'text-red-600'}`} />
            )}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='font-semibold text-gray-900'>{typeLabel}</span>
                <Badge className={`${badgeColor} border text-xs`}>{levelLabel}</Badge>
                {IsExpired !== undefined && (
                  <Badge className={IsExpired ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300'}>
                    {IsExpired ? 'Đã hết hạn' : 'Còn hiệu lực'}
                  </Badge>
                )}
                {categoryLabel && (
                  <Badge className='bg-blue-100 text-blue-700 border-blue-300 text-xs'>{categoryLabel}</Badge>
                )}
              </div>
              {!isValid && validationResult.reason && (
                <p className='text-sm text-gray-600 mt-1'>{validationResult.reason}</p>
              )}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            {data && formattedFields.length > 0 && (
              <span className='text-xs text-gray-500 hidden sm:inline'>Nhấn để xem chi tiết</span>
            )}
            {data && formattedFields.length > 0 && (
              isExpanded ? (
                <ChevronUp className='w-5 h-5 text-gray-500' />
              ) : (
                <ChevronDown className='w-5 h-5 text-gray-500' />
              )
            )}
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && data && formattedFields.length > 0 && (
        <div className='p-4 bg-white border-t border-gray-200'>
          <div className='space-y-3'>
            <div className='flex items-center gap-2 mb-3'>
              <Info className='w-4 h-4 text-gray-500' />
              <span className='text-sm font-semibold text-gray-700'>Thông tin chi tiết</span>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              {formattedFields.map((field, index) => (
                <div key={index} className='space-y-1'>
                  <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>{field.label}</span>
                  <p className='text-sm text-gray-900 break-words'>{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trường hợp không có data (KHAC, KHONG_LIEN_QUAN) */}
      {!data && (
        <div className='p-4 bg-gray-50 border-t border-gray-200'>
          <p className='text-sm text-gray-600'>
            {type === 'KHAC' && 'Đây là văn bản hành chính/bằng cấp khác không thuộc các loại chứng chỉ được chấp nhận.'}
            {type === 'KHONG_LIEN_QUAN' && 'Ảnh này không phải là chứng chỉ hoặc văn bản liên quan.'}
          </p>
        </div>
      )}
    </div>
  )
}

