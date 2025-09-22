import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'react-toastify'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { Checkbox } from '../../../../components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { addressApi, type GHNProvince, type GHNDistrict, type GHNWard } from '../../../../apis/address.api'
import type { Address, AddressCreateInput } from '../../../../types/addressType'

interface AddressModalProps {
  isOpen: boolean
  onClose: () => void
  address?: Address | null
  onSave: (formData: AddressCreateInput) => void
  existingAddresses?: Address[]
  userId?: string
}

interface AddressFormData {
  userId: string
  province: string
  district: string
  ward: string
  provinceId: number
  districtId: number
  wardId: number
  streetAddress: string
  isDefault: boolean
}

export default function AddressModal({
  isOpen,
  onClose,
  address,
  onSave,
  existingAddresses = [],
  userId
}: AddressModalProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    userId: userId || '',
    province: address?.province || '',
    district: address?.district || '',
    ward: address?.ward || '',
    provinceId: address?.provinceId || 0,
    districtId: address?.districtId || 0,
    wardId: address?.wardId || 0,
    streetAddress: address?.streetAddress || '',
    isDefault: address?.isDefault || false
  })

  const [provinces, setProvinces] = useState<GHNProvince[]>([])
  const [districts, setDistricts] = useState<GHNDistrict[]>([])
  const [wards, setWards] = useState<GHNWard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Memoized handlers để tránh re-render không cần thiết
  const handleStreetAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, streetAddress: e.target.value }))
  }, [])

  const handleDefaultChange = useCallback(
    (checked: boolean) => {
      if (checked) {
        const hasExistingDefault = existingAddresses.some((addr) => addr.isDefault && addr.id !== address?.id)
        if (hasExistingDefault) {
          console.log('Sẽ bỏ địa chỉ mặc định hiện tại và đặt địa chỉ này làm mặc định')
        }
      }
      setFormData((prev) => ({ ...prev, isDefault: checked }))
    },
    [existingAddresses, address?.id]
  )

  // Load provinces from GHN API
  const loadProvinces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await addressApi.getProvinces()
      console.log('Provinces response:', response)

      if (response && Array.isArray(response)) {
        setProvinces(response)
      } else if (response && response.data && Array.isArray(response.data)) {
        setProvinces(response.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error loading provinces:', err)
      setError('Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.')
      setProvinces([])

      // Hiển thị toast lỗi
      toast.error('Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại!', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load districts from GHN API
  const loadDistricts = useCallback(async (provinceId: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await addressApi.getDistricts(provinceId)
      console.log('Districts response:', response)

      let districtsData: any[] = []
      if (response && (response as any).data && Array.isArray((response as any).data)) {
        districtsData = (response as any).data
      } else if (Array.isArray(response)) {
        districtsData = response
      } else {
        console.warn('Unexpected response format:', response)
        if (response && typeof response === 'object') {
          const keys = Object.keys(response)
          console.log('Response keys:', keys)
          for (const key of keys) {
            if (Array.isArray((response as any)[key])) {
              districtsData = (response as any)[key]
              break
            }
          }
        }

        if (districtsData.length === 0) {
          throw new Error('Invalid response format')
        }
      }

      setDistricts(districtsData)
      setWards([])
    } catch (err) {
      console.error('Error loading districts:', err)
      setError('Không thể tải danh sách quận/huyện. Vui lòng thử lại.')
      setDistricts([])
      setWards([])

      // Hiển thị toast lỗi
      toast.error('Không thể tải danh sách quận/huyện. Vui lòng thử lại!', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load wards from GHN API
  const loadWards = useCallback(async (districtId: number) => {
    setLoading(true)
    setError(null)
    try {
      const response = await addressApi.getWards(districtId)
      console.log('Wards response:', response)

      let wardsData: any[] = []
      if (response && (response as any).data && Array.isArray((response as any).data)) {
        wardsData = (response as any).data
      } else if (Array.isArray(response)) {
        wardsData = response
      } else {
        console.warn('Unexpected response format:', response)
        throw new Error('Invalid response format')
      }

      setWards(wardsData)
    } catch (err) {
      console.error('Error loading wards:', err)
      setError('Không thể tải danh sách phường/xã. Vui lòng thử lại.')
      setWards([])

      // Hiển thị toast lỗi
      toast.error('Không thể tải danh sách phường/xã. Vui lòng thử lại!', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  // Load provinces when modal opens
  useEffect(() => {
    if (isOpen && provinces.length === 0) {
      loadProvinces()
    }
  }, [isOpen, provinces.length, loadProvinces])

  // Load districts when province changes
  useEffect(() => {
    if (formData.provinceId > 0) {
      loadDistricts(formData.provinceId)
    } else {
      setDistricts([])
      setWards([])
    }
  }, [formData.provinceId, loadDistricts])

  // Load wards when district changes
  useEffect(() => {
    if (formData.districtId > 0) {
      loadWards(formData.districtId)
    } else {
      setWards([])
    }
  }, [formData.districtId, loadWards])

  const handleProvinceChange = useCallback(
    (provinceId: string) => {
      const selectedProvince = provinces.find((p) => p.ProvinceID.toString() === provinceId)
      setFormData((prev) => ({
        ...prev,
        provinceId: selectedProvince?.ProvinceID || 0,
        province: selectedProvince?.ProvinceName || '',
        districtId: 0,
        district: '',
        wardId: 0,
        ward: ''
      }))
    },
    [provinces]
  )

  const handleDistrictChange = useCallback(
    (districtId: string) => {
      const selectedDistrict = districts.find((d) => d.DistrictID.toString() === districtId)
      setFormData((prev) => ({
        ...prev,
        districtId: selectedDistrict?.DistrictID || 0,
        district: selectedDistrict?.DistrictName || '',
        wardId: 0,
        ward: ''
      }))
    },
    [districts]
  )

  const handleWardChange = useCallback(
    (wardCode: string) => {
      const selectedWard = wards.find((w) => w.WardCode === wardCode)
      setFormData((prev) => ({
        ...prev,
        wardId: parseInt(selectedWard?.WardCode || '0'),
        ward: selectedWard?.WardName || ''
      }))
    },
    [wards]
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      // Hardcode userId
      const hardcodedUserId = 'de92782e-2cab-4dc4-ae34-60f078ac33b7'

      console.log('=== DEBUG ADDRESS MODAL ===')
      console.log('Form data:', formData)
      console.log('Hardcoded User ID:', hardcodedUserId)
      console.log('Province:', formData.province)
      console.log('District:', formData.district)
      console.log('Ward:', formData.ward)
      console.log('Street Address:', formData.streetAddress)
      console.log('Is Default:', formData.isDefault)

      if (!formData.province || !formData.district || !formData.ward || !formData.streetAddress) {
        console.log('❌ Validation failed - missing required fields')
        console.log('Missing province:', !formData.province)
        console.log('Missing district:', !formData.district)
        console.log('Missing ward:', !formData.ward)
        console.log('Missing streetAddress:', !formData.streetAddress)
        setError('Vui lòng điền đầy đủ thông tin bắt buộc')

        // Hiển thị toast lỗi
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc!', {
          position: 'top-right',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light'
        })
        return
      }

      const addressData: AddressCreateInput = {
        userId: hardcodedUserId, // Sử dụng hardcoded userId
        province: formData.province,
        district: formData.district,
        ward: formData.ward,
        provinceId: formData.provinceId,
        districtId: formData.districtId,
        wardId: formData.wardId,
        streetAddress: formData.streetAddress,
        isDefault: formData.isDefault
      }

      console.log('✅ Address data to be sent:', addressData)
      console.log('=== END DEBUG ===')

      onSave(addressData)

      // Hiển thị toast thành công
      toast.success(address ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ mới thành công!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light'
      })

      onClose()
    },
    [formData, onSave, onClose, address]
  )

  const retryHandler = useCallback(() => {
    if (provinces.length === 0) {
      loadProvinces()
    } else if (formData.provinceId > 0 && districts.length === 0) {
      loadDistricts(formData.provinceId)
    } else if (formData.districtId > 0 && wards.length === 0) {
      loadWards(formData.districtId)
    }
  }, [
    provinces.length,
    districts.length,
    wards.length,
    formData.provinceId,
    formData.districtId,
    loadProvinces,
    loadDistricts,
    loadWards
  ])

  // Reset form khi modal đóng/mở
  useEffect(() => {
    if (isOpen) {
      setFormData({
        userId: userId || '',
        province: address?.province || '',
        district: address?.district || '',
        ward: address?.ward || '',
        provinceId: address?.provinceId || 0,
        districtId: address?.districtId || 0,
        wardId: address?.wardId || 0,
        streetAddress: address?.streetAddress || '',
        isDefault: address?.isDefault || false
      })
      setError(null)
    }
  }, [isOpen, address, userId])

  // Memoized computed values
  const hasOtherDefault = useMemo(
    () => existingAddresses.some((addr) => addr.isDefault && addr.id !== address?.id),
    [existingAddresses, address?.id]
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{address ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
          <DialogDescription>
            {address ? 'Cập nhật thông tin địa chỉ của bạn' : 'Thêm địa chỉ giao hàng mới cho tài khoản của bạn'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Error Message */}
          {error && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-red-600 text-sm mb-2'>{error}</p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='text-red-600 border-red-300 hover:bg-red-50'
                onClick={retryHandler}
              >
                Thử lại
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className='flex justify-center items-center py-4'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-green-600'></div>
              <span className='ml-2 text-gray-600'>Đang tải...</span>
            </div>
          )}

          <div className='grid grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='province'>Tỉnh/thành *</Label>
              <Select
                value={formData.provinceId > 0 ? formData.provinceId.toString() : ''}
                onValueChange={handleProvinceChange}
                disabled={loading}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder='Chọn tỉnh/thành' />
                </SelectTrigger>
                <SelectContent>
                  {provinces?.map((province) => (
                    <SelectItem key={province.ProvinceID} value={province.ProvinceID.toString()}>
                      {province.ProvinceName}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='district'>Quận/huyện *</Label>
              <Select
                value={formData.districtId > 0 ? formData.districtId.toString() : ''}
                onValueChange={handleDistrictChange}
                disabled={!formData.provinceId || loading}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder='Chọn quận/huyện' />
                </SelectTrigger>
                <SelectContent>
                  {districts?.map((district) => (
                    <SelectItem key={district.DistrictID} value={district.DistrictID.toString()}>
                      {district.DistrictName}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor='ward'>Phường/xã *</Label>
              <Select
                value={formData.wardId > 0 ? formData.wardId.toString() : ''}
                onValueChange={handleWardChange}
                disabled={!formData.districtId || loading}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder='Chọn phường/xã' />
                </SelectTrigger>
                <SelectContent>
                  {wards?.map((ward) => (
                    <SelectItem key={ward.WardCode} value={ward.WardCode}>
                      {ward.WardName}
                    </SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor='streetAddress'>Địa chỉ cụ thể *</Label>
            <Input
              id='streetAddress'
              value={formData.streetAddress}
              onChange={handleStreetAddressChange}
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

            {formData.isDefault && hasOtherDefault && (
              <div className='text-xs text-amber-600 bg-amber-50 p-2 rounded'>
                ⚠️ Địa chỉ mặc định hiện tại sẽ được thay thế bởi địa chỉ này
              </div>
            )}
          </div>

          <DialogFooter className='flex gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} className='flex-1'>
              Hủy
            </Button>
            <Button type='submit' className='flex-1 bg-green-600 hover:bg-green-700 text-white' disabled={loading}>
              Lưu địa chỉ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
