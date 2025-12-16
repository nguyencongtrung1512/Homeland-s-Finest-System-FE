import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog'
import { Button } from '../../../../components/ui/button'
import { Label } from '../../../../components/ui/label'
import { Loader2, UserPlus } from 'lucide-react'
import { formApi } from '../../../../apis/form.api'
import { staffApi, type StaffInfo } from '../../../../apis/staff.api'
import { toast } from '../../../../utils/toast'
import StaffComboBox from '../../../../components/ui/staff-combo-box'
import type { Staff } from '../../../../apis/admin.api'

interface ApiError {
  message?: string
  errors?: Array<{ field?: string; message: string } | string>
  response?: {
    data?: {
      message?: string
      errors?: Array<{ field?: string; message: string } | string>
    }
  }
}

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

      // Handle different response formats (similar to other components)
      let staffData: StaffInfo[] = []

      if (Array.isArray(response)) {
        // Response is directly an array
        staffData = response
      } else if (response && typeof response === 'object') {
        // Check if response has data field
        if ('data' in response) {
          const responseWithData = response as { data?: StaffInfo[] | unknown }
          if (Array.isArray(responseWithData.data)) {
            // Response has structure {status, message, data: StaffInfo[]}
            staffData = responseWithData.data
          }
        }
        // Fallback: check if response itself has nested data structure
        else if ((response as any).data && Array.isArray((response as any).data)) {
          staffData = (response as any).data
        }
      }

      console.log('Staff API Response:', response)
      console.log('Parsed staff data:', staffData)
      console.log('Staff list length:', staffData.length)
      setStaffList(staffData)
    } catch (error) {
      console.error('Error loading staff list:', error)

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi tải danh sách nhân viên'

      if (error && typeof error === 'object') {
        const err = error as ApiError

        // Priority 1: Check for direct message field (axios interceptor returns error.response.data directly)
        if (err.message) {
          errorMessage = err.message
        }
        // Priority 2: Check for errors array
        else if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
          errorMessage = err.errors.map((e) => (typeof e === 'object' && e.message ? e.message : String(e))).join(', ')
        }
        // Priority 3: Check for axios error response structure (fallback)
        else if (err.response?.data) {
          const responseData = err.response.data
          if (responseData.message) {
            errorMessage = responseData.message
          } else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.map((e) => (typeof e === 'object' && e.message ? e.message : String(e))).join(', ')
          }
        }
      }
      // Priority 4: Check if error itself is a string
      else if (typeof error === 'string') {
        errorMessage = error
      }

      toast.error(errorMessage)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Convert StaffInfo[] to Staff[] format for StaffComboBox
  const staffOptions: Staff[] = useMemo(() => {
    const options = staffList.map((staff) => ({
      staffId: staff.userId,
      staffName: `${staff.firstName} ${staff.lastName}`.trim(),
      email: staff.email,
      processingStoreCount: 0 // Not needed for this use case
    }))
    console.log('Staff options for combobox:', options)
    return options
  }, [staffList])

  const handleStaffSelect = (staffId: string | null) => {
    setSelectedStaffId(staffId || '')
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

      // Extract error message from backend response
      let errorMessage = 'Có lỗi xảy ra khi phân công nhân viên'

      if (error && typeof error === 'object') {
        const err = error as ApiError

        // Priority 1: Check for direct message field (axios interceptor returns error.response.data directly)
        if (err.message) {
          errorMessage = err.message
        }
        // Priority 2: Check for errors array
        else if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
          errorMessage = err.errors.map((e) => (typeof e === 'object' && e.message ? e.message : String(e))).join(', ')
        }
        // Priority 3: Check for axios error response structure (fallback)
        else if (err.response?.data) {
          const responseData = err.response.data
          if (responseData.message) {
            errorMessage = responseData.message
          } else if (responseData.errors && Array.isArray(responseData.errors)) {
            errorMessage = responseData.errors.map((e) => (typeof e === 'object' && e.message ? e.message : String(e))).join(', ')
          }
        }
      }
      // Priority 4: Check if error itself is a string
      else if (typeof error === 'string') {
        errorMessage = error
      }

      toast.error(errorMessage)
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
            {loadingStaff ? (
              <div className='flex items-center justify-center py-4 border border-gray-300 rounded-lg bg-gray-50'>
                <Loader2 className='w-4 h-4 animate-spin mr-2' />
                <span className='text-sm text-gray-500'>Đang tải danh sách nhân viên...</span>
              </div>
            ) : (
              <StaffComboBox
                options={staffOptions}
                placeholder='Chọn nhân viên xử lý'
                onSelect={handleStaffSelect}
                value={selectedStaffId}
                disabled={isAssigning || loadingStaff}
              />
            )}
            {!loadingStaff && staffList.length > 0 && (
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
              variant='blue'
              className='flex-1'
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
