# Form Management System - Flow Documentation

## Tổng quan hệ thống

Hệ thống quản lý form hỗ trợ xử lý các yêu cầu từ customer thông qua quy trình phê duyệt nhiều cấp với 3 vai trò chính: **Customer**, **Staff**, và **Admin**.

## Form Types (Loại Form)

Hệ thống hỗ trợ 11 loại form sau:

| Form Type | Mô tả |
|-----------|-------|
| `SupportAccount` | Hỗ trợ tài khoản |
| `SupportPayment` | Hỗ trợ thanh toán |
| `SupportTechnical` | Hỗ trợ kỹ thuật |
| `ComplaintContent` | Khiếu nại nội dung |
| `RequestInformation` | Yêu cầu thông tin |
| `ReportSeller` | Báo cáo người bán |
| `FeedbackSuggestion` | Góp ý đề xuất |
| `PrivacyDataRequest` | Yêu cầu dữ liệu cá nhân |
| `SupportMarketing` | Hỗ trợ marketing |
| `SupportOther` | Hỗ trợ khác |
| `SupportRefundMoney` | Hỗ trợ hoàn tiền |

## Form Status (Trạng thái Form)

Hệ thống có 6 trạng thái chính:

| Status | Mô tả | Người thao tác |
|--------|-------|----------------|
| `Pending` | Chờ xử lý | Trạng thái ban đầu |
| `Processing` | Đang xử lý | Admin assign cho Staff |
| `ApprovedByStaff` | Staff phê duyệt | Staff |
| `RejectedByStaff` | Staff từ chối | Staff |
| `ApprovedByAdmin` | Admin phê duyệt cuối cùng | Admin |
| `RejectedByAdmin` | Admin từ chối cuối cùng | Admin |

## Flow Xử Lý Form

### 1. Customer tạo Form (Draft → Pending)

**Endpoint:** `POST /api/form`

**Request:**
```json
{
  "userId": "guid",
  "orderId": "string (optional)",
  "type": "FormType enum",
  "subject": "string",
  "description": "string",
  "imageFiles": "IFormFile[] (optional)"
}
```

**Quy trình:**
1. Customer tạo form mới
2. Hệ thống tự động set status = `Pending`
3. Upload và lưu trữ hình ảnh (nếu có)
4. Trả về FormDTO

**Lưu ý:**
- Customer chỉ có thể chỉnh sửa/hủy form khi status = `Pending`

### 2. Admin xử lý Form (có thể ở nhiều giai đoạn)

#### 2.1. Admin assign Staff (Pending → Processing)

**Endpoint:** `PUT /api/form/Admin/assign-staff/{staffId}/form/{formId}`

**Authorization:** Chỉ Admin

**Quy trình:**
1. Admin chọn Staff để xử lý form
2. Status chuyển thành `Processing`
3. Ghi nhận thông tin Staff được assign
4. Ghi nhận Admin đã assign

#### 2.2. Admin reject trực tiếp (Pending → RejectedByAdmin)

**Endpoint:** `PUT /api/form/{formId}/admin-update`

**Authorization:** Chỉ Admin

**Request:**
```json
{
  "adminText": "string (lý do reject)",
  "status": "RejectedByAdmin"
}
```

**Quy trình:**
1. Admin review form và quyết định reject ngay
2. Không cần assign Staff
3. Form kết thúc với status `RejectedByAdmin`

**Điều kiện:**
- Form ở trạng thái `Pending`

### 3. Staff xử lý Form (Processing → ApprovedByStaff/RejectedByStaff)

**Endpoint:** `PUT /api/form/{formId}/staff-update`

**Authorization:** Chỉ Staff được assign

**Request:**
```json
{
  "reply": "string",
  "status": "ApprovedByStaff | RejectedByStaff"
}
```

**Quy trình:**
1. Staff review form và đưa ra quyết định
2. Nhập reply (lý do/giải thích)
3. Chọn status: `ApprovedByStaff` hoặc `RejectedByStaff`

**Điều kiện:**
- Form phải ở trạng thái `Processing`
- Chỉ Staff được assign mới có quyền

### 4. Admin xử lý cuối cùng (ApprovedByStaff → ApprovedByAdmin/RejectedByAdmin)

**Endpoint:** `PUT /api/form/{formId}/admin-update`

**Authorization:** Chỉ Admin

**Request:**
```json
{
  "adminText": "string",
  "status": "ApprovedByAdmin | RejectedByAdmin"
}
```

**Quy trình:**
1. Admin review kết quả từ Staff
2. Có thể approve hoặc reject dù Staff đã approve
3. Form được đóng với trạng thái cuối cùng

**Điều kiện:**
- Form phải ở trạng thái `ApprovedByStaff`
- Admin có thể reject nếu thấy Staff approve không hợp lý

## Customer Actions

### 1. Chỉnh sửa Form (chỉ khi Pending)

**Endpoint:** `PUT /api/form/customer-update/{id}`

**Request:**
```json
{
  "orderId": "string (optional)",
  "type": "FormType enum",
  "subject": "string",
  "description": "string", 
  "imageUrl": "string[] (optional)"
}
```

### 2. Hủy Form (chỉ khi Pending)

**Endpoint:** `PUT /cancel-form/{id}`

**Quy trình:**
- Status chuyển thành `Cancel`
- Form không thể chỉnh sửa sau khi hủy

### 3. Xem Form của mình

**Endpoint:** `GET /api/form/{id}`

**Authorization:** Customer chỉ xem được form do mình tạo

## Query Forms

### 1. Lấy tất cả forms (Admin/Staff view)

**Endpoint:** `GET /api/form`

**Query Parameters:**
```
pageSize: int
pageNumber: int  
userId: guid (optional) - Filter theo user
status: FormStatus (optional) - Filter theo status
type: FormType (optional) - Filter theo type
sortBy: string (optional) - "status" | "type" | "createdat"
sortOrder: string (optional) - "asc" | "desc"
```

**Response:** `FormAdminDTO[]` với thông tin đầy đủ

### 2. Customer xem forms của mình

**Endpoint:** `GET /api/form?userId={customerUserId}`

**Lưu ý:** 
- FE cần hard code userId của customer hiện tại vào query parameter
- Không cho customer thay đổi userId này
- Customer chỉ thấy forms do chính họ tạo
- **Ẩn fields:** Customer không được hiển thị `adminId` và `adminText` trên UI

**Response:** `FormAdminDTO[]` nhưng customer chỉ thấy forms của mình

**Fields hiển thị cho Customer:**
```json
{
  "id": "guid",
  "userId": "guid", 
  "orderId": "string",
  "type": "FormType",
  "subject": "string",
  "description": "string",
  "imageUrl": "string[]",
  "status": "FormStatus",
  "reply": "string",
  "staffId": "guid",
  "staffName": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime"
  // ❌ KHÔNG hiển thị: adminId, adminText
}
```

## Permission Matrix

| Action | Customer | Staff | Admin |
|--------|----------|-------|-------|
| Tạo form | ✅ | ❌ | ❌ |
| Chỉnh sửa form (Pending) | ✅ (own) | ❌ | ❌ |
| Hủy form (Pending) | ✅ (own) | ❌ | ❌ |
| Assign Staff | ❌ | ❌ | ✅ |
| Reject trực tiếp (Pending) | ❌ | ❌ | ✅ |
| Xử lý form (Staff level) | ❌ | ✅ (assigned) | ❌ |
| Xử lý form (Admin level) | ❌ | ❌ | ✅ |
| Override Staff decision | ❌ | ❌ | ✅ |
| Xem form detail | ✅ (own) | ✅ (assigned) | ✅ (all) |
| Xem danh sách forms | ✅ (own - hard code userId) | ✅ (assigned) | ✅ (all) |

## State Diagram

```
Draft → Pending → Processing → ApprovedByStaff → ApprovedByAdmin (END)
         ↓            ↓              ↓                ↓
       Cancel    RejectedByAdmin  RejectedByStaff   RejectedByAdmin (END)
                      (END)         (END)            (Admin override)
```

**Admin Decision Points:**
- **Tại Pending**: Có thể assign Staff hoặc reject trực tiếp
- **Tại ApprovedByStaff**: Có thể approve hoặc reject (override Staff decision)

## Error Handling

### Common Errors:
- `401 Unauthorized`: Không có quyền truy cập
- `403 Forbidden`: Không có quyền thực hiện hành động
- `404 Not Found`: Không tìm thấy form
- `400 Bad Request`: Dữ liệu không hợp lệ hoặc vi phạm business rule

### Business Rules:
1. Customer chỉ có thể chỉnh sửa/hủy form khi status = `Pending`
2. Staff chỉ có thể xử lý form được assign và status = `Processing`  
3. **Admin có 2 điểm quyết định:**
   - **Tại Pending**: Có thể assign Staff hoặc reject trực tiếp
   - **Tại ApprovedByStaff**: Có thể approve hoặc reject (override quyết định của Staff)
4. Form một khi đã `Cancel`, `RejectedByStaff`, `RejectedByAdmin`, hoặc `ApprovedByAdmin` sẽ không thể thay đổi
5. **Admin có quyền tối cao**: Có thể reject form ngay cả khi Staff đã approve

## Frontend Implementation Notes

### 1. Form Creation
- Hỗ trợ multiple file upload cho hình ảnh
- Validate required fields trước khi submit
- Show preview hình ảnh được upload

### 2. Status Display
- Sử dụng color coding cho các status khác nhau
- Hiển thị progress indicator cho flow xử lý

### 3. Conditional Actions
- Hiển thị các action buttons dựa trên status và role
- Disable actions không được phép theo business rules

### 4. Real-time Updates
- Consider implementing WebSocket/SignalR cho real-time status updates
- Notification system cho customer khi form được xử lý  