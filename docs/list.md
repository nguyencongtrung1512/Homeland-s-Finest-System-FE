# Danh sách chức năng/Button cần vô hiệu hóa khi cửa hàng bị khóa (Status = Inactive)

## Tổng quan
Khi cửa hàng có trạng thái `Inactive` (bị khóa), seller không được phép thực hiện các thao tác create, update, delete hoặc các hành động thay đổi dữ liệu. Chỉ được phép xem (read-only).

---

## 1. Dashboard (Trang tổng quan)
**File:** `src/pages/seller/dashboard/dashboard.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo sản phẩm"** - Quick action button
- ✅ **Button "Tạo combo"** - Quick action button  
- ✅ **Button "Tạo khuyến mãi"** - Quick action button
- ✅ **Button "Refresh"** - Nếu có chức năng refresh dữ liệu

### Chức năng được phép:
- ✅ Xem thống kê (read-only)
- ✅ Xem biểu đồ (read-only)

---

## 2. Products (Quản lý sản phẩm)
**File:** `src/pages/seller/products/products.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo sản phẩm"** (`handleCreateProduct`)
- ✅ **Button "Chỉnh sửa"** (`handleEditProduct`) - Tất cả sản phẩm
- ✅ **Button "Xóa"** - Nếu có
- ✅ **Button "Kích hoạt/Tạm dừng"** (`handleActivate`, `handleDeactivate`)
- ✅ **Button "Tạo câu chuyện sản phẩm"** (`handleGoToCreateStory`)
- ✅ **Button "Xem chi tiết"** - Nếu có chức năng edit trong detail

**File liên quan:**
- `src/pages/seller/products/createProduct.tsx`
  - ✅ Toàn bộ form tạo sản phẩm
  - ✅ Button "Tạo sản phẩm" (`handleCreateProduct`)

- `src/pages/seller/products/detailProduct.tsx`
  - ✅ Button "Chỉnh sửa" (`setShowEditProductDialog`)
  - ✅ Button "Cập nhật" trong modal edit
  - ✅ Button "Thêm variant" (`modalVariantProduct.tsx`)
  - ✅ Button "Chỉnh sửa variant" (`modalEditVariant.tsx`)
  - ✅ Button "Xóa variant"
  - ✅ Button "Cập nhật variant" (`handleUpdateVariant`)
  - ✅ Button "Tạo câu chuyện sản phẩm"
  - ✅ Button "Chỉnh sửa câu chuyện" (`productStory.tsx`)

- `src/pages/seller/products/modalUpdateProduct.tsx`
  - ✅ Toàn bộ form update
  - ✅ Button "Cập nhật sản phẩm" (`handleUpdateProduct`)

- `src/pages/seller/products/modalEditProduct.tsx`
  - ✅ Toàn bộ form edit
  - ✅ Button "Cập nhật sản phẩm" (`handleUpdateProduct`)

- `src/pages/seller/products/modalVariantProduct.tsx`
  - ✅ Toàn bộ form tạo variant
  - ✅ Button "Tạo variant" (`handleCreateProductVariant`)

- `src/pages/seller/products/modalEditVariant.tsx`
  - ✅ Toàn bộ form edit variant
  - ✅ Button "Cập nhật variant" (`handleUpdateVariant`)

- `src/pages/seller/products/modalProductDetail.tsx`
  - ✅ Button "Tạo chi tiết sản phẩm" (`handleCreateProductDetail`)

- `src/pages/seller/products/productStory.tsx`
  - ✅ Button "Chỉnh sửa" (`onToggleEditMode`)
  - ✅ Button "Lưu" khi edit story

- `src/pages/seller/products/productCertificate.tsx`
  - ✅ Button "Cập nhật" certificate (nếu có)

### Chức năng được phép:
- ✅ Xem danh sách sản phẩm
- ✅ Xem chi tiết sản phẩm (read-only)
- ✅ Tìm kiếm, lọc, sắp xếp (read-only)

---

## 3. Combos (Quản lý Combo)
**File:** `src/pages/seller/combos/listCombo.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo combo"** (`handleCreateCombo`)
- ✅ **Button "Chỉnh sửa"** (`handleEditCombo`)

**File liên quan:**
- `src/pages/seller/combos/createCombo.tsx`
  - ✅ Toàn bộ form tạo combo
  - ✅ Button "Tạo Combo" (submit form)

- `src/pages/seller/combos/detailCombo.tsx`
  - ✅ Button "Gửi duyệt" (`handleSubmit`)
  - ✅ Button "Hủy" (`handleCancel`)
  - ✅ Button "Cập nhật giá cuối" (`handleUpdateFinalPrice`)
  - ✅ Button "Chỉnh sửa combo" - Nếu có
  - ✅ Button "Xóa combo" - Nếu có

- `src/pages/seller/combos/updateCombo.tsx`
  - ✅ Toàn bộ form update combo
  - ✅ Button "Cập nhật combo"

- `src/pages/seller/combos/ComboItemsManager.tsx`
  - ✅ Button "Thêm sản phẩm" (`onAddItem`)
  - ✅ Button "Chỉnh sửa item" (`openEditDialog`)
  - ✅ Button "Cập nhật item" (`handleUpdateItem`)
  - ✅ Button "Xóa item" (`onRemoveItem`)

### Chức năng được phép:
- ✅ Xem danh sách combo
- ✅ Xem chi tiết combo (read-only)

---

## 4. Orders (Đơn hàng)
**File:** `src/pages/seller/order/order.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Xác nhận đơn hàng"** - Nếu có
- ✅ **Button "Hủy đơn hàng"** - Nếu có
- ✅ **Button "Cập nhật trạng thái"** - Nếu có
- ✅ **Button "In hóa đơn"** - Nếu có chức năng tạo mới
- ✅ **Button "Gửi tin nhắn"** - Nếu có chức năng tạo mới

**File liên quan:**
- `src/pages/seller/order/orderDetail.tsx`
  - ✅ Button "Cập nhật trạng thái đơn hàng"
  - ✅ Button "Hủy đơn hàng"
  - ✅ Button "Xác nhận đơn hàng"
  - ✅ Button "Gửi tin nhắn" - Nếu có chức năng tạo mới

### Chức năng được phép:
- ✅ Xem danh sách đơn hàng
- ✅ Xem chi tiết đơn hàng (read-only)
- ✅ Xem tin nhắn (read-only)
- ✅ Tìm kiếm, lọc đơn hàng (read-only)

---

## 5. Promotion Management (Quản lý khuyến mãi)
**File:** `src/pages/seller/promotionManagement/list.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo khuyến mãi"** (`handleCreatePromotion`)
- ✅ **Button "Chỉnh sửa"** (`handleEditPromotion`)

**File liên quan:**
- `src/pages/seller/promotionManagement/promotionFrom.tsx`
  - ✅ Toàn bộ form create/edit promotion
  - ✅ Button "Tạo khuyến mãi"
  - ✅ Button "Cập nhật khuyến mãi"
  - ✅ Button "Chỉnh sửa" (`setIsEditing`)

- `src/pages/seller/promotionManagement/detail.tsx`
  - ✅ Button "Chỉnh sửa" - Nếu có
  - ✅ Button "Xóa" - Nếu có
  - ✅ Button "Kích hoạt/Tạm dừng" - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách khuyến mãi
- ✅ Xem chi tiết khuyến mãi (read-only)

---

## 6. My Story (Câu chuyện cửa hàng)
**File:** `src/pages/seller/mystory/myStory.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo câu chuyện"** (`handleCreateClick`)

**File liên quan:**
- `src/pages/seller/mystory/createMyStoryPage.tsx`
  - ✅ Toàn bộ form tạo story
  - ✅ Button "Tạo câu chuyện" (`handleCreateStory`)

- `src/pages/seller/mystory/detail.tsx`
  - ✅ Button "Chỉnh sửa" - Nếu có
  - ✅ Button "Xóa" - Nếu có
  - ✅ Button "Cập nhật" - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách câu chuyện
- ✅ Xem chi tiết câu chuyện (read-only)

---

## 7. Hashtag Management (Quản lý nhãn dán)
**File:** `src/pages/seller/hashtagManagement/hashtagManagement.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo nhãn dán"** (`handleCreateClick`)
- ✅ **Button "Chỉnh sửa"** (`handleEditClick`)
- ✅ **Button "Xóa"** (`handleDeleteClick`)
- ✅ **Button "Kích hoạt/Tạm dừng"** - Nếu có toggle status

**Trong modal:**
- ✅ Button "Tạo nhãn dán" (`handleCreateSubmit`)
- ✅ Button "Cập nhật nhãn dán" (`handleEditSubmit`)

### Chức năng được phép:
- ✅ Xem danh sách nhãn dán
- ✅ Tìm kiếm, lọc nhãn dán (read-only)

---

## 8. Setup Store (Thiết lập cửa hàng)
**File:** `src/pages/seller/setupStore/setupStore.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Chỉnh sửa thông tin"** (`handleEdit`)
- ✅ **Button "Chỉnh sửa ảnh bìa"** (`handleEditCover`)
- ✅ **Button "Chỉnh sửa logo"** (`handleEditLogo`)
- ✅ **Button "Lưu thay đổi"** (`handleSave`)
- ✅ **Button "Lưu ảnh bìa"** (`handleSaveCover`)
- ✅ **Button "Lưu logo"** (`handleSaveLogo`)
- ✅ **Button "Tải lên hình ảnh đơn đăng ký"** (`handleVendorAppUpload`)
- ✅ **Button "Xóa hình ảnh"** (`removeVendorAppFile`, `removeExistingVendorAppUrl`)

### Chức năng được phép:
- ✅ Xem thông tin cửa hàng (read-only)
- ✅ Button "Gửi lại đơn đăng ký" - Chỉ khi status = RejectedByStaff hoặc Rejected

---

## 9. Help (Trung tâm trợ giúp)
**File:** `src/pages/seller/help/help.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo yêu cầu hỗ trợ"** (`handleCreateRequest`)

**File liên quan:**
- `src/pages/seller/help/detailHelp.tsx`
  - ✅ Button "Tạo yêu cầu mới" (`handleCreateNew`) - Nếu có
  - ✅ Button "Cập nhật yêu cầu" - Nếu có
  - ✅ Button "Phản hồi" - Nếu có chức năng tạo mới

### Chức năng được phép:
- ✅ Xem danh sách yêu cầu hỗ trợ
- ✅ Xem chi tiết yêu cầu hỗ trợ (read-only)

---

## 10. Categories (Danh mục sử dụng)
**File:** `src/pages/seller/categories/categories.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo danh mục"** - Nếu có
- ✅ **Button "Chỉnh sửa"** - Nếu có
- ✅ **Button "Xóa"** - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách danh mục (read-only)

---

## 11. Product Reviews (Đánh giá sản phẩm)
**File:** `src/pages/seller/productReviews/productReviews.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Phản hồi đánh giá"** - Nếu có chức năng tạo mới
- ✅ **Button "Cập nhật phản hồi"** - Nếu có
- ✅ **Button "Xóa phản hồi"** - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách đánh giá (read-only)
- ✅ Xem chi tiết đánh giá (read-only)

---

## 12. Complain (Khiếu nại)
**File:** `src/pages/seller/complain/complain.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tạo khiếu nại"** - Nếu có
- ✅ **Button "Phản hồi khiếu nại"** - Nếu có chức năng tạo mới
- ✅ **Button "Cập nhật khiếu nại"** - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách khiếu nại (read-only)
- ✅ Xem chi tiết khiếu nại (read-only)

---

## 13. Chat (Tin nhắn)
**File:** `src/pages/seller/ChatWithCustomer/ChatWithCustomer.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Input gửi tin nhắn** - Disable input field
- ✅ **Button "Gửi tin nhắn"** - Disable send button

### Chức năng được phép:
- ✅ Xem tin nhắn (read-only)
- ✅ Xem lịch sử chat (read-only)

---

## 14. Finance (Tài chính)
**File:** `src/pages/seller/finance/finance.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Rút tiền"** - Nếu có
- ✅ **Button "Yêu cầu thanh toán"** - Nếu có
- ✅ **Button "Cập nhật thông tin ngân hàng"** - Nếu có

### Chức năng được phép:
- ✅ Xem số dư (read-only)
- ✅ Xem lịch sử giao dịch (read-only)
- ✅ Xem báo cáo tài chính (read-only)

---

## 15. Transaction (Giao dịch)
**File:** `src/pages/seller/Transaction/transaction.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Cập nhật thông tin"** (`handleUpdateInfo`) - Nếu có
- ✅ **Button "Tạo giao dịch"** - Nếu có
- ✅ **Button "Xác nhận giao dịch"** - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách giao dịch (read-only)
- ✅ Xem chi tiết giao dịch (read-only)

---

## 16. Document Seller (Tài liệu người bán)
**File:** `src/pages/seller/documentSeller/document.tsx`

### Chức năng cần vô hiệu hóa:
- ✅ **Button "Tải lên tài liệu"** - Nếu có
- ✅ **Button "Cập nhật tài liệu"** - Nếu có
- ✅ **Button "Xóa tài liệu"** - Nếu có

### Chức năng được phép:
- ✅ Xem danh sách tài liệu (read-only)
- ✅ Xem/tải xuống tài liệu (read-only)

---

## Cách triển khai

### 1. Kiểm tra trạng thái cửa hàng
Sử dụng `useStore` hook để lấy thông tin store:
```typescript
import { useStore } from '../../../contexts/store.context'

const { store } = useStore()
const isStoreLocked = store?.status === 'Inactive'
```

### 2. Vô hiệu hóa button
```typescript
<Button 
  onClick={handleCreate}
  disabled={isStoreLocked}
  title={isStoreLocked ? 'Cửa hàng đang bị khóa. Vui lòng liên hệ hỗ trợ.' : ''}
>
  Tạo mới
</Button>
```

### 3. Ẩn button (tùy chọn)
```typescript
{!isStoreLocked && (
  <Button onClick={handleCreate}>
    Tạo mới
  </Button>
)}
```

### 4. Vô hiệu hóa form input
```typescript
<Input
  value={formData.name}
  onChange={handleChange}
  disabled={isStoreLocked}
/>
```

### 5. Hiển thị thông báo
```typescript
{isStoreLocked && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <p className="text-red-800 text-sm">
      Cửa hàng của bạn đang bị khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.
    </p>
  </div>
)}
```

---

## Lưu ý

1. **Trạng thái cần kiểm tra:** `store.status === 'Inactive'`
2. **Chỉ vô hiệu hóa các thao tác write:** Create, Update, Delete
3. **Cho phép các thao tác read:** View, Search, Filter, Sort
4. **Hiển thị thông báo rõ ràng** khi người dùng cố gắng thực hiện hành động bị khóa
5. **Kiểm tra ở cả component cha và component con** (modal, dialog, form)

---

## Checklist triển khai

- [ ] Dashboard - Vô hiệu hóa quick actions
- [ ] Products - Vô hiệu hóa create, update, delete
- [ ] Combos - Vô hiệu hóa create, update, delete
- [ ] Orders - Vô hiệu hóa các action buttons
- [ ] Promotions - Vô hiệu hóa create, update
- [ ] My Story - Vô hiệu hóa create, update
- [ ] Hashtags - Vô hiệu hóa create, update, delete
- [ ] Setup Store - Vô hiệu hóa edit buttons
- [ ] Help - Vô hiệu hóa create request
- [ ] Chat - Vô hiệu hóa send message
- [ ] Finance - Vô hiệu hóa withdraw, update bank info
- [ ] Transaction - Vô hiệu hóa update info
- [ ] Product Reviews - Vô hiệu hóa reply
- [ ] Complain - Vô hiệu hóa create, reply
- [ ] Categories - Vô hiệu hóa create, update, delete (nếu có)
- [ ] Document - Vô hiệu hóa upload, update, delete (nếu có)

---

**Cập nhật lần cuối:** 2025-01-11

