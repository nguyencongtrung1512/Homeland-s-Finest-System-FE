import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'

export default function ProfileContent() {
  return (
    <div className='max-w-2xl'>
      <h2 className='text-lg font-semibold text-gray-900 mb-6'>Thông tin cá nhân</h2>

      {/* Profile Form */}
      <div className='bg-white p-6 rounded-lg border'>
        <div className='grid grid-cols-2 gap-6'>
          <div>
            <Label htmlFor='fullName'>Họ và tên</Label>
            <Input id='fullName' defaultValue='Nguyễn Minh Anh' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input id='email' type='email' defaultValue='minhanh@email.com' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='phone'>Số điện thoại</Label>
            <Input id='phone' defaultValue='0362 345 678' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='birthDate'>Ngày sinh</Label>
            <Input id='birthDate' type='date' defaultValue='1990-01-15' className='mt-1' />
          </div>
        </div>

        <div className='mt-6'>
          <Button className='bg-green-600 hover:bg-green-700 text-white'>Cập nhật thông tin</Button>
        </div>
      </div>
      {/* Change Password Section */}
      <div className='bg-white p-6 rounded-lg border mt-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Đổi mật khẩu</h3>
        <p className='text-sm text-gray-600 mb-6'>Cập nhật mật khẩu của bạn để đảm bảo tính bảo mật</p>

        <div className='space-y-4 max-w-md'>
          <div>
            <Label htmlFor='currentPassword'>Mật khẩu hiện tại</Label>
            <Input id='currentPassword' type='password' placeholder='Nhập mật khẩu hiện tại' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='newPassword'>Mật khẩu mới</Label>
            <Input id='newPassword' type='password' placeholder='Nhập mật khẩu mới' className='mt-1' />
          </div>
          <div>
            <Label htmlFor='confirmPassword'>Xác nhận mật khẩu mới</Label>
            <Input id='confirmPassword' type='password' placeholder='Nhập lại mật khẩu mới' className='mt-1' />
          </div>
        </div>

        {/* Password Requirements */}
        <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
          <div className='text-sm text-blue-800'>
            <div className='font-medium mb-1'>🛡️ Mẹo bảo mật:</div>
            <ul className='text-xs space-y-1 text-blue-700'>
              <li>✓ Sử dụng mật khẩu mạnh, ít nhất 8 ký tự bao gồm chữ và số</li>
              <li>✓ Tráy sử dụng mật khẩu dễ đoán như ngày sinh hoặc tên</li>
              <li>✓ Không chia sẻ mật khẩu với người khác, kể cả nhân viên</li>
            </ul>
          </div>
        </div>

        <div className='mt-6'>
          <Button className='bg-green-600 hover:bg-green-700 text-white'>Cập nhật mật khẩu</Button>
          <Button variant='outline' className='ml-3'>
            Hủy bỏ
          </Button>
        </div>
      </div>
    </div>
  )
}
