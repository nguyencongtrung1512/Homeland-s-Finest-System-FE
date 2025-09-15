import { useState, useEffect } from 'react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Checkbox } from '../../../../components/ui/checkbox'
// import { addressApiService, Province, District, Ward } from './services/addressApi'

interface Address {
  id?: number
  name: string
  phone: string
  province: string
  district: string
  ward: string
  address: string
  isDefault: boolean
  // Thêm các field để lưu code (cho tương lai)
  provinceCode?: string
  districtCode?: string
  wardCode?: string
}

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  address?: Address | null
  onSave: (formData: Address) => void
  existingAddresses?: Address[] // Danh sách địa chỉ hiện có để check default
}

// Dữ liệu cứng cho test
const mockProvinces = [
  { code: '79', name: 'Thành phố Hồ Chí Minh' },
  { code: '01', name: 'Thành phố Hà Nội' },
  { code: '48', name: 'Tỉnh Đà Nẵng' }
]

type District = { code: string; name: string }
const mockDistricts: { [key: string]: District[] } = {
  '79': [
    { code: '760', name: 'Quận 1' },
    { code: '769', name: 'Quận Bình Thạnh' },
    { code: '770', name: 'Quận Tân Bình' }
  ],
  '01': [
    { code: '001', name: 'Quận Ba Đình' },
    { code: '002', name: 'Quận Hoàn Kiếm' }
  ]
}
type Ward = { code: string; name: string }
const mockWards: { [key: string]: Ward[] } = {
  '760': [
    { code: '27004', name: 'Phường Bến Nghé' },
    { code: '27007', name: 'Phường Bến Thành' }
  ],
  '769': [
    { code: '27043', name: 'Phường 13' },
    { code: '27046', name: 'Phường 14' },
    { code: '27049', name: 'Phường 15' }
  ]
}

export default function AddressModal({ isOpen, onClose, address, onSave, existingAddresses = [] }: AddressModalProps) {
  const [formData, setFormData] = useState<Address>({
    name: address?.name || '',
    phone: address?.phone || '',
    province: address?.province || '',
    district: address?.district || '',
    ward: address?.ward || '',
    address: address?.address || '',
    isDefault: address?.isDefault || false,
    provinceCode: address?.provinceCode || '',
    districtCode: address?.districtCode || '',
    wardCode: address?.wardCode || ''
  })

  // State cho danh sách địa danh
  const [provinces] = useState(mockProvinces)
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])

  // Load quận/huyện khi chọn tỉnh/thành
  useEffect(() => {
    if (formData.provinceCode) {
      setDistricts(mockDistricts[formData.provinceCode] || [])
    } else {
      setDistricts([])
      setWards([])
    }
  }, [formData.provinceCode])

  // Load phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (formData.districtCode) {
      setWards(mockWards[formData.districtCode] || [])
    } else {
      setWards([])
    }
  }, [formData.districtCode])

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedProvince = provinces.find((p) => p.code === e.target.value)
    setFormData({
      ...formData,
      provinceCode: e.target.value,
      province: selectedProvince?.name || '',
      districtCode: '',
      district: '',
      wardCode: '',
      ward: ''
    })
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDistrict = districts.find((d) => d.code === e.target.value)
    setFormData({
      ...formData,
      districtCode: e.target.value,
      district: selectedDistrict?.name || '',
      wardCode: '',
      ward: ''
    })
  }

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWard = wards.find((w) => w.code === e.target.value)
    setFormData({
      ...formData,
      wardCode: e.target.value,
      ward: selectedWard?.name || ''
    })
  }

  const handleDefaultChange = (checked: boolean) => {
    // Nếu set làm default, cần thông báo sẽ bỏ default của địa chỉ khác
    if (checked) {
      const hasExistingDefault = existingAddresses.some((addr) => addr.isDefault && addr.id !== address?.id)

      if (hasExistingDefault) {
        // Có thể show confirm dialog ở đây
        console.log('Sẽ bỏ địa chỉ mặc định hiện tại và đặt địa chỉ này làm mặc định')
      }
    }

    setFormData({ ...formData, isDefault: checked })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Logic xử lý default: nếu set làm default, cần update các địa chỉ khác
    const finalFormData = { ...formData }

    if (formData.isDefault) {
      // Backend sẽ xử lý: set tất cả địa chỉ khác của user này thành isDefault = false
      // Trước khi save địa chỉ này với isDefault = true
    }

    onSave(finalFormData)
    onClose()
  }

  // Reset form khi modal đóng/mở
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: address?.name || '',
        phone: address?.phone || '',
        province: address?.province || '',
        district: address?.district || '',
        ward: address?.ward || '',
        address: address?.address || '',
        isDefault: address?.isDefault || false,
        provinceCode: address?.provinceCode || '',
        districtCode: address?.districtCode || '',
        wardCode: address?.wardCode || ''
      })
    }
  }, [isOpen, address])

  if (!isOpen) return null

  // Kiểm tra có địa chỉ mặc định khác không
  const hasOtherDefault = existingAddresses.some((addr) => addr.isDefault && addr.id !== address?.id)

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-semibold text-gray-900'>{address ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700 text-xl font-bold'>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <Label htmlFor='name'>Họ và tên *</Label>
              <Input
                id='name'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className='mt-1'
                required
              />
            </div>
            <div>
              <Label htmlFor='phone'>Số điện thoại *</Label>
              <Input
                id='phone'
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className='mt-1'
                required
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='province'>Tỉnh/thành *</Label>
              <select
                id='province'
                value={formData.provinceCode}
                onChange={handleProvinceChange}
                className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent'
                required
              >
                <option value=''>Chọn tỉnh/thành</option>
                {provinces.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor='district'>Quận/huyện *</Label>
              <select
                id='district'
                value={formData.districtCode}
                onChange={handleDistrictChange}
                className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent'
                required
                disabled={!formData.provinceCode}
              >
                <option value=''>Chọn quận/huyện</option>
                {districts.map((district) => (
                  <option key={district.code} value={district.code}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor='ward'>Phường/xã *</Label>
              <select
                id='ward'
                value={formData.wardCode}
                onChange={handleWardChange}
                className='mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent'
                required
                disabled={!formData.districtCode}
              >
                <option value=''>Chọn phường/xã</option>
                {wards.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor='address'>Địa chỉ cụ thể *</Label>
            <Input
              id='address'
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className='mt-1'
              placeholder='Số nhà, tên đường...'
              required
            />
          </div>

          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Checkbox id='isDefault' checked={formData.isDefault} onCheckedChange={handleDefaultChange} />
              <Label htmlFor='isDefault' className='text-sm'>
                Đặt làm địa chỉ mặc định
              </Label>
            </div>

            {/* Thông báo nếu sẽ thay đổi default */}
            {formData.isDefault && hasOtherDefault && (
              <div className='text-xs text-amber-600 bg-amber-50 p-2 rounded'>
                ⚠️ Địa chỉ mặc định hiện tại sẽ được thay thế bởi địa chỉ này
              </div>
            )}
          </div>

          <div className='flex gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} className='flex-1'>
              Hủy
            </Button>
            <Button type='submit' className='flex-1 bg-green-600 hover:bg-green-700 text-white'>
              Lưu địa chỉ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
