import { type FC } from 'react'

interface Certificate {
  id?: string
  name: string
  description: string
  image: string
  issuedBy?: string
  issueDate?: string
}

interface CertificatesSectionProps {
  storeId: string
  certificates: Certificate[]
}

const CertificatesSection: FC<CertificatesSectionProps> = ({ storeId, certificates }) => {
  // TODO: Replace with actual API call
  // const { data: certificatesData, isLoading } = useQuery(['store-certificates', storeId], () => fetchStoreCertificates(storeId))

  return (
    <div className='bg-white rounded-lg p-6 shadow-sm'>
      <h3 className='text-lg font-semibold mb-4 text-gray-900'>Giấy chứng nhận</h3>

      {certificates.length > 0 ? (
        <div className='grid md:grid-cols-2 gap-4'>
          {certificates.map((cert, index) => (
            <div key={cert.id || index} className='border rounded-lg p-4 text-center hover:shadow-md transition-shadow'>
              <img src={cert.image} alt={cert.name} className='w-full h-32 object-cover rounded mb-3' />
              <h4 className='font-medium text-gray-900 mb-2'>{cert.name}</h4>
              <p className='text-sm text-gray-600 mb-2'>{cert.description}</p>

              {cert.issuedBy && <p className='text-xs text-gray-500'>Cấp bởi: {cert.issuedBy}</p>}
              {cert.issueDate && <p className='text-xs text-gray-500'>Ngày cấp: {cert.issueDate}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-8'>
          <div className='w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <h4 className='text-lg font-semibold text-gray-900 mb-2'>Chưa có giấy chứng nhận</h4>
          <p className='text-gray-600'>Cửa hàng chưa cập nhật giấy chứng nhận</p>
        </div>
      )}
    </div>
  )
}

export default CertificatesSection
