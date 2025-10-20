import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Label } from '../../../../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Loader2, UserPlus, Users } from 'lucide-react'
import { formApi } from '../../../../apis/form.api'
import { staffApi, type StaffInfo } from '../../../../apis/staff.api'
import { toast } from 'react-toastify'

interface AssignStaffModalProps {
  isOpen: boolean
  onClose: () => void
  formId: string
  formSubject: string
  onSuccess: () => void
}

const AssignStaffModal = ({ isOpen, onClose, formId, formSubject, onSuccess }: AssignStaffModalProps) => {
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [staffList, setStaffList] = useState<StaffInfo[]>([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Load staff list when modal opens
  useEffect(() => {
    if (isOpen) {
      loadStaffList()
    }
  }, [isOpen])

  const loadStaffList = async () => {
    try {
      setLoadingStaff(true)
      const response = await staffApi.getAllStaff({
        isActive: true // Only load active staff
      })
      setStaffList((response as any) || [])
    } catch (error) {
      console.error('Error loading staff list:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách nhân viên')
    } finally {
      setLoadingStaff(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedStaffId) {
      toast.error('Vui lòng chọn nhân viên')
      return
    }

    try {
      setIsAssigning(true)
      await formApi.assignStaff(selectedStaffId, formId)

      const selectedStaff = staffList.find((staff) => staff.userId === selectedStaffId)
      toast.success(`Đã phân công khiếu nại cho ${selectedStaff?.firstName} ${selectedStaff?.lastName}`)

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error assigning staff:', error)
      toast.error('Có lỗi xảy ra khi phân công nhân viên')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    setSelectedStaffId('')
    setIsAssigning(false)
    setStaffList([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-md mx-auto'>
        <DialogHeader>
          <DialogTitle className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
            <UserPlus className='w-5 h-5 text-blue-500' />
            Phân công nhân viên
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Form Info */}
          <div className='bg-gray-50 rounded-lg p-3'>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>Khiếu nại:</span> {formSubject}
            </p>
            <p className='text-xs text-gray-500 mt-1'>#{formId}</p>
          </div>

          {/* Staff Selection */}
          <div>
            <Label className='text-sm font-medium text-gray-700 mb-2 block'>
              Chọn nhân viên <span className='text-red-500'>*</span>
            </Label>
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId} disabled={isAssigning || loadingStaff}>
              <SelectTrigger>
                <SelectValue placeholder={loadingStaff ? 'Đang tải danh sách...' : 'Chọn nhân viên xử lý'} />
              </SelectTrigger>
              <SelectContent>
                {loadingStaff ? (
                  <div className='flex items-center justify-center py-4'>
                    <Loader2 className='w-4 h-4 animate-spin mr-2' />
                    <span className='text-sm text-gray-500'>Đang tải...</span>
                  </div>
                ) : staffList.length > 0 ? (
                  staffList.map((staff) => (
                    <SelectItem key={staff.userId} value={staff.userId}>
                      <div className='flex flex-col'>
                        <span className='font-medium'>
                          {staff.firstName} {staff.lastName}
                        </span>
                        <span className='text-xs text-gray-500'>{staff.email}</span>
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <div className='flex items-center justify-center py-4'>
                    <Users className='w-4 h-4 mr-2 text-gray-400' />
                    <span className='text-sm text-gray-500'>Không có nhân viên nào</span>
                  </div>
                )}
              </SelectContent>
            </Select>
            {staffList.length > 0 && (
              <p className='text-xs text-gray-500 mt-1'>Tìm thấy {staffList.length} nhân viên đang hoạt động</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <Button variant='outline' onClick={handleClose} className='flex-1' disabled={isAssigning}>
              Hủy
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning || !selectedStaffId || loadingStaff}
              className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
            >
              {isAssigning ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Đang phân công...
                </>
              ) : (
                <>
                  <UserPlus className='w-4 h-4 mr-2' />
                  Phân công
                </>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <p className='text-xs text-gray-500 text-center'>
            Nhân viên được phân công sẽ nhận được thông báo và có thể xử lý khiếu nại này.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AssignStaffModal
