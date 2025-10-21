
-----

# Tài Liệu API: Luồng Quản Lý Combo "Regional Combos"

Chào mừng bạn đến với tài liệu hướng dẫn API cho tính năng Combo. Tài liệu này sẽ giải thích chi tiết cách Frontend tương tác với Backend để tạo, quản lý và gửi duyệt các combo sản phẩm.

## 🎯 Khái Niệm Cốt Lõi

Luồng tạo combo được chia thành 2 giai đoạn chính:

1.  **Tạo Vỏ Combo (Combo Shell)**: Bạn tạo một "thùng chứa" với các thông tin cơ bản như Tên, Mô tả, và Ảnh bìa. Ở giai đoạn này, combo chưa có sản phẩm nào.
2.  **Thêm/Sửa Sản Phẩm (Combo Items)**: Sau khi có "vỏ", bạn bắt đầu thêm các sản phẩm (`ProductVariant`) vào đó. Các logic quan trọng sẽ diễn ra ở bước này.

### Vòng Đời & Trạng Thái (Status) Của Combo

Đây là phần quan trọng nhất mà Frontend cần nắm để hiển thị UI phù hợp.

  * `Draft` (Bản nháp):

      * Trạng thái ban đầu sau khi tạo vỏ combo.
      * Combo ở trạng thái này khi có **ít hơn 2 sản phẩm** đang hoạt động (`isActive: true`).
      * Người bán có toàn quyền thêm/sửa/xóa sản phẩm.
      * Combo không hiển thị cho người mua.

  * `Pending` (Chờ duyệt):

      * Trạng thái này được **tự động kích hoạt** bởi Backend khi combo có **từ 2 sản phẩm đang hoạt động trở lên**.
      * Bất kỳ thay đổi nào (thêm/sửa item, sửa thông tin vỏ) khi combo đang không ở trạng thái `Draft` cũng sẽ chuyển nó về `Pending`.
      * Lúc này, combo đã được gửi cho Ban Quản trị xét duyệt. Frontend nên **vô hiệu hóa các nút chỉnh sửa** và hiển thị thông báo "Đang chờ duyệt".

  * `Approved` / `Rejected` / `Inactive`: Các trạng thái sau khi được xét duyệt hoặc quản lý bởi admin.

-----

## 🌊 Luồng Hoạt Động Từ A đến Z

Đây là kịch bản chi tiết từng bước mà một người bán (Seller) sẽ thực hiện trên giao diện của bạn.

### Giai Đoạn 1: Tạo Vỏ Combo

Mục tiêu là tạo ra một combo rỗng và lấy về `comboId` để sử dụng cho các bước tiếp theo.

#### **Bước 1: Tạo Vỏ Combo**

  * **Endpoint**: `POST /api/combo`

  * **Request Type**: `multipart/form-data` (vì có upload file)

  * **Request Body (`FromForm`)**:

      * `Name` (string, required): Tên của combo.
      * `SellerId` (Guid, required): ID của người bán đang tạo combo.
      * `Description` (string, optional): Mô tả chi tiết.
      * `ThumbnailFile` (file, optional): Ảnh bìa cho combo.

  * **Logic Backend**:

      * Tạo một record `Combo` mới trong database.
      * Gán `Status` mặc định là `Draft`.

  * **Successful Response (`200 OK`)**:

      * Bạn sẽ nhận về một đối tượng `ComboDTO` hoàn chỉnh.
      * **Việc quan trọng nhất**: Lấy và lưu lại `id` từ response. Đây chính là `comboId` để dùng cho tất cả các bước sau.

    <!-- end list -->

    ```json
    {
      "status": 201,
      "message": "Tạo phần cơ bản của combo thành công. Hãy thêm sản phẩm.",
      "data": {
        "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", // <-- LƯU ID NÀY LẠI
        "name": "Combo Đặc Sản Tây Bắc",
        "storeId": "s1t2o3r4-...",
        "provinceId": 22,
        "provinceName": "Lào Cai",
        "thumbnailUrl": "/uploads/combos/thumbnail.jpg",
        "description": "Mô tả combo...",
        "status": "Draft", // <-- Trạng thái ban đầu
        "isActive": false,
        "createdAt": "20/10/2025 15:40:10",
        "updatedAt": null,
        "comboItems": [] // <-- Ban đầu chưa có sản phẩm
      }
    }
    ```

-----

### Giai Đoạn 2: Quản Lý Sản Phẩm Trong Combo

Sau khi có `comboId`, bạn sẽ điều hướng người dùng đến trang chỉnh sửa chi tiết, nơi họ có thể thêm/sửa các sản phẩm (`ComboItem`).

#### **Bước 2: Thêm Sản Phẩm Vào Combo**

  * **Endpoint**: `POST /api/combo/{comboId}/items`
  * **Request Type**: `application/json`
  * **Request Body (`FromBody`)**: `ComboItemAddRequest`
    ```json
    {
      "productVariantId": "p1v1a1r1-...",
      "comboItemName": "Thịt Trâu Gác Bếp 500g", // Tên hiển thị trong combo
      "price": 250000,
      "quantity": 1
    }
    ```
  * **Logic Backend & Frontend**:
      * **Lần thêm thứ 1**: Thêm sản phẩm đầu tiên. Response trả về sẽ có `comboItems` chứa 1 phần tử. `Status` của combo **vẫn là `Draft`**.
      * **Lần thêm thứ 2**: Thêm sản phẩm thứ hai.
          * Backend sẽ đếm tổng số item đang `isActive` trong combo.
          * Vì tổng số item \>= 2, Backend **tự động chuyển `Status` thành `Pending`**.
          * **Hành động của Frontend**: Khi nhận được response có `status: "Pending"`, bạn cần cập nhật UI ngay lập tức: vô hiệu hóa các nút "Thêm sản phẩm", "Lưu thông tin", và hiển thị trạng thái "Chờ duyệt" cho người dùng.

#### **Bước 3: Cập Nhật Sản Phẩm Trong Combo**

Hành động này dùng để thay đổi số lượng, giá, hoặc thậm chí thay thế bằng một sản phẩm khác.

  * **Endpoint**: `PUT /api/combo/{comboId}/items/{itemId}`
      * `comboId`: ID của combo đang sửa.
      * `itemId`: ID của `ComboItem` (lấy từ trong mảng `comboItems` của `ComboDTO`).
  * **Request Type**: `application/json`
  * **Request Body (`FromBody`)**: `ComboItemUpdateRequest`
    ```json
    {
      "productVariantId": "p1v1a1r1-...",
      "comboItemName": "Thịt Trâu Gác Bếp loại đặc biệt 500g",
      "price": 275000,
      "quantity": 2,
      "isActive": true // <-- Dùng để tạm ẩn/hiện item
    }
    ```
  * **Logic Backend & Frontend**:
      * Bất kỳ cập nhật nào vào một item cũng sẽ khiến Backend kiểm tra lại các điều kiện và có thể chuyển `Status` về `Pending` (nếu trước đó nó không phải là `Draft`).
      * **Để xóa/tạm ẩn một item**: Gọi endpoint này và chỉ cần set `"isActive": false`.
      * Nếu việc set `isActive: false` làm cho số lượng item active trong combo giảm xuống dưới 2, Backend sẽ **tự động chuyển `Status` về lại `Draft`**.
      * **Hành động của Frontend**: Luôn kiểm tra `status` trong response và mở lại các chức năng chỉnh sửa nếu nó là `Draft`.

-----

### Giai Đoạn 3: Cập Nhật Thông Tin Vỏ Combo

Nếu người dùng muốn đổi tên, mô tả hoặc ảnh bìa của combo sau khi đã tạo.

#### **Bước 4: Cập Nhật Thông Tin Vỏ Combo**

  * **Endpoint**: `PUT /api/combo/{id}`
  * **Request Type**: `multipart/form-data`
  * **Request Body (`FromForm`)**:
      * `Name` (string, required)
      * `Description` (string, optional)
      * `IsActive` (boolean)
      * `ThumbnailFile` (file, optional)
  * **Logic Backend & Frontend**:
      * Tương tự như cập nhật item, hành động này cũng sẽ trigger việc kiểm tra và chuyển `Status` của combo về `Pending` để admin duyệt lại thay đổi.

-----

## 📚 Phụ Lục: Các Data Models (DTOs)

### Request Models

\<details\>
\<summary\>\<code\>POST /api/combo\</code\> (Tạo vỏ combo)\</summary\>

**ComboShellCreateRequest**

```csharp
public class ComboShellCreateRequest
{
    public string Name { get; set; }
    public Guid SellerId { get; set; }
    public string? Description { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
}
```

\</details\>

\<details\>
\<summary\>\<code\>POST /api/combo/{comboId}/items\</code\> (Thêm item)\</summary\>

**ComboItemAddRequest**

```csharp
public class ComboItemAddRequest
{
    public Guid ProductVariantId { get; set; }
    public string ComboItemName { get; set; }
    public int Price { get; set; }
    public int Quantity { get; set; }
}
```

\</details\>

\<details\>
\<summary\>\<code\>PUT /api/combo/{comboId}/items/{itemId}\</code\> (Sửa item)\</summary\>

**ComboItemUpdateRequest**

```csharp
public class ComboItemUpdateRequest
{
    public Guid ProductVariantId { get; set; }
    public string ComboItemName { get; set; }
    public int Price { get; set; }
    public int Quantity { get; set; }
    public bool IsActive { get; set; } = true;
}
```

\</details\>

### Response Models

\<details\>
\<summary\>Đối tượng trả về chính: \<code\>ComboDTO\</code\>\</summary\>

```csharp
public class ComboDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public Guid? StoreId { get; set; }
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? Description { get; set; }
    public string? Status { get; set; } // "Draft", "Pending", ...
    public bool? IsActive { get; set; }
    public string? CreatedAt { get; set; }
    public string? UpdatedAt { get; set; }
    public List<ComboItemDTO> ComboItems { get; set; }
}
```

\</details\>

\<details\>
\<summary\>Đối tượng item con: \<code\>ComboItemDTO\</code\>\</summary\>

```csharp
public class ComboItemDTO
{
    public Guid Id { get; set; } // Dùng làm itemId khi cập nhật
    public Guid ProductVariantId { get; set; }
    public string ComboItemName { get; set; }
    public string? ComboItemImageUrl { get; set; }
    public int Price { get; set; }
    public int Quantity { get; set; }
    public string ProductName { get; set; }
    public string VariantName { get; set; }
    public string StoreName { get; set; }
}
```

\</details\>