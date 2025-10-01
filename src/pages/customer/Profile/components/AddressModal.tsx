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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import MapBoxGetLocation from '../../../../components/Mapbox/mapBoxGetLocation'

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
  const [activeTab, setActiveTab] = useState<string>('manual')

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

  // Xử lý khi chọn tỉnh/thành phố
  const handleProvinceChange = useCallback(
    (value: string) => {
      const provinceId = parseInt(value)
      const selectedProvince = provinces.find((p) => p.ProvinceID === provinceId)

      if (selectedProvince) {
        setFormData((prev) => ({
          ...prev,
          province: selectedProvince.ProvinceName,
          provinceId,
          district: '',
          districtId: 0,
          ward: '',
          wardId: 0
        }))

        // Load districts for selected province
        loadDistricts(provinceId)
      }
    },
    [provinces, loadDistricts]
  )

  // Xử lý khi chọn quận/huyện
  const handleDistrictChange = useCallback(
    (value: string) => {
      const districtId = parseInt(value)
      const selectedDistrict = districts.find((d) => d.DistrictID === districtId)

      if (selectedDistrict) {
        setFormData((prev) => ({
          ...prev,
          district: selectedDistrict.DistrictName,
          districtId,
          ward: '',
          wardId: 0
        }))

        // Load wards for selected district
        loadWards(districtId)
      }
    },
    [districts, loadWards]
  )

  // Xử lý khi chọn phường/xã
  const handleWardChange = useCallback(
    (value: string) => {
      const wardCode = value
      const selectedWard = wards.find((w) => w.WardCode === wardCode)

      if (selectedWard) {
        setFormData((prev) => ({
          ...prev,
          ward: selectedWard.WardName,
          wardId: parseInt(wardCode)
        }))
      }
    },
    [wards]
  )

  // Xử lý khi xác nhận vị trí từ bản đồ
  const handleLocationConfirm = useCallback((locationData: {
    coordinates: [number, number]
    province: string
    provinceId: number
    district: string
    districtId: number
    ward: string
    wardId: number
    streetAddress: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      province: locationData.province,
      provinceId: locationData.provinceId,
      district: locationData.district,
      districtId: locationData.districtId,
      ward: locationData.ward,
      wardId: locationData.wardId,
      streetAddress: locationData.streetAddress
    }))
    
    // Chuyển sang tab nhập tay để người dùng có thể chỉnh sửa thêm nếu cần
    setActiveTab('manual')
    
    // Hiển thị thông báo thành công
    toast.success('Đã lấy thông tin địa chỉ từ bản đồ thành công!', {
      position: 'top-right',
      autoClose: 2000
    })
  }, [])

  // Retry handler
  const retryHandler = useCallback(() => {
    setError(null)
    loadProvinces()
  }, [loadProvinces])

  // Load provinces on mount
  useEffect(() => {
    if (isOpen) {
      loadProvinces()
    }
  }, [isOpen, loadProvinces])

  // Load districts if province is already selected (for editing)
  useEffect(() => {
    if (isOpen && formData.provinceId > 0) {
      loadDistricts(formData.provinceId)
    }
  }, [isOpen, formData.provinceId, loadDistricts])

  // Load wards if district is already selected (for editing)
  useEffect(() => {
    if (isOpen && formData.districtId > 0) {
      loadWards(formData.districtId)
    }
  }, [isOpen, formData.districtId, loadWards])

  // Check if there's another default address
  const hasOtherDefault = useMemo(() => {
    return existingAddresses.some((addr) => addr.isDefault && addr.id !== address?.id)
  }, [existingAddresses, address])

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{address ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
          <DialogDescription>
            {address ? 'Cập nhật thông tin địa chỉ của bạn' : 'Thêm địa chỉ giao hàng mới cho tài khoản của bạn'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Nhập thủ công</TabsTrigger>
            <TabsTrigger value="map">Chọn trên bản đồ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
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
          </TabsContent>
          
          <TabsContent value="map">
            <div className='space-y-4'>
              <p className='text-sm text-gray-600'>
                Sử dụng bản đồ để chọn vị trí chính xác của bạn. Bạn có thể kéo thả marker để điều chỉnh vị trí.
              </p>
              
              <MapBoxGetLocation onLocationConfirm={handleLocationConfirm} />
              
              <div className='text-xs text-blue-600 bg-blue-50 p-2 rounded'>
                ℹ️ Sau khi xác nhận vị trí, bạn sẽ được chuyển sang tab nhập thủ công để kiểm tra và điều chỉnh thông tin nếu cần.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
