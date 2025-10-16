# Hướng dẫn sử dụng hệ thống quyền hạn

## Tổng quan
Hệ thống quyền hạn được thiết kế để kiểm soát quyền truy cập của người dùng dựa trên thuộc tính `isPermission` trong thông tin user.

- `isPermission: true` - User có thể sử dụng đầy đủ chức năng
- `isPermission: false` - User chỉ có thể xem, không thể thực hiện các hành động

## Các cách sử dụng

### 1. Sử dụng trực tiếp từ Auth Context

```tsx
import { useAuth } from '../contexts/auth.context'

const MyComponent = () => {
  const { hasPermission, requirePermission } = useAuth()

  const handleAction = () => {
    if (requirePermission('Tên hành động')) {
      // Thực hiện hành động
    }
  }

  return (
    <div>
      {hasPermission ? (
        <button onClick={handleAction}>Thực hiện hành động</button>
      ) : (
        <p>Bạn không có quyền</p>
      )}
    </div>
  )
}
```

### 2. Sử dụng Custom Hook usePermission

```tsx
import { usePermission } from '../hooks/usePermission'

const MyComponent = () => {
  const { hasPermission, canPerformAction, showPermissionError } = usePermission()

  const handleAction = () => {
    if (canPerformAction('Tên hành động')) {
      // Thực hiện hành động
    } else {
      showPermissionError('Tên hành động')
    }
  }

  return (
    <button onClick={handleAction}>
      Thực hiện hành động
    </button>
  )
}
```

### 3. Sử dụng PermissionWrapper

```tsx
import { PermissionWrapper } from '../components/Permission/PermissionWrapper'

const MyComponent = () => {
  return (
    <PermissionWrapper 
      actionName="Chỉnh sửa sản phẩm"
      fallback={<p>Bạn không có quyền chỉnh sửa</p>}
    >
      <button>Chỉnh sửa sản phẩm</button>
    </PermissionWrapper>
  )
}
```

### 4. Sử dụng PermissionButton

```tsx
import { PermissionButton } from '../components/Permission/PermissionWrapper'

const MyComponent = () => {
  const handleClick = () => {
    console.log('Thực hiện hành động')
  }

  return (
    <PermissionButton 
      onClick={handleClick}
      actionName="Xóa sản phẩm"
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
    >
      Xóa sản phẩm
    </PermissionButton>
  )
}
```

### 5. Sử dụng PermissionInput

```tsx
import { PermissionInput } from '../components/Permission/PermissionWrapper'
import { Input } from '../components/ui/input'

const MyComponent = () => {
  return (
    <PermissionInput actionName="Chỉnh sửa giá">
      <Input 
        placeholder="Nhập giá sản phẩm"
        defaultValue="100000"
      />
    </PermissionInput>
  )
}
```

## Các trường hợp sử dụng phổ biến

### Trong Form
```tsx
<form>
  <PermissionInput actionName="Chỉnh sửa thông tin">
    <Input placeholder="Tên sản phẩm" />
  </PermissionInput>
  
  <PermissionButton 
    type="submit"
    actionName="Lưu thay đổi"
  >
    Lưu
  </PermissionButton>
</form>
```

### Trong Table/Action buttons
```tsx
<div className="flex space-x-2">
  <PermissionButton 
    onClick={() => handleEdit(item.id)}
    actionName="Chỉnh sửa"
  >
    Sửa
  </PermissionButton>
  
  <PermissionButton 
    onClick={() => handleDelete(item.id)}
    actionName="Xóa"
  >
    Xóa
  </PermissionButton>
</div>
```

### Trong Navigation/Menu
```tsx
<PermissionWrapper 
  actionName="Quản lý sản phẩm"
  fallback={null}
>
  <NavLink to="/products">Quản lý sản phẩm</NavLink>
</PermissionWrapper>
```

## Lưu ý quan trọng

1. **Luôn kiểm tra quyền hạn**: Không bao giờ tin tưởng hoàn toàn vào frontend, luôn có validation ở backend
2. **Sử dụng actionName**: Cung cấp tên hành động rõ ràng để user hiểu tại sao không thể thực hiện
3. **UX tốt**: Cung cấp fallback UI phù hợp khi user không có quyền
4. **Consistent**: Sử dụng cùng một pattern trong toàn bộ ứng dụng

## API Reference

### useAuth()
- `hasPermission: boolean` - Kiểm tra user có quyền không
- `requirePermission(actionName?: string): boolean` - Kiểm tra và hiển thị lỗi nếu không có quyền
- `canPerformAction(actionName?: string): boolean` - Chỉ kiểm tra quyền, không hiển thị lỗi

### usePermission()
- `hasPermission: boolean` - Kiểm tra user có quyền không
- `canPerformAction(actionName?: string): boolean` - Kiểm tra quyền cho hành động cụ thể
- `requirePermission(actionName?: string): boolean` - Kiểm tra và hiển thị lỗi
- `showPermissionError(actionName?: string): void` - Hiển thị thông báo lỗi

### PermissionWrapper Props
- `children: ReactNode` - Nội dung hiển thị khi có quyền
- `fallback?: ReactNode` - Nội dung hiển thị khi không có quyền
- `actionName?: string` - Tên hành động để hiển thị trong thông báo lỗi
- `showError?: boolean` - Có hiển thị thông báo lỗi không

### PermissionButton Props
- `onClick?: () => void` - Hàm xử lý khi click
- `actionName?: string` - Tên hành động
- `disabled?: boolean` - Trạng thái disabled
- `className?: string` - CSS classes
- Các props khác của button element

### PermissionInput Props
- `children: ReactNode` - Input element
- `actionName?: string` - Tên hành động
- Các props khác sẽ được truyền cho children
