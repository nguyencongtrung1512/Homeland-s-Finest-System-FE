 🖼️ TÀI LIỆU CẬP NHẬT API STORE STORY - XÓA CHỌN LỌC ẢNH GALLERY


---

## 📚 MỤC LỤC

1. [Tổng quan thay đổi](#1-tổng-quan-thay-đổi)
2. [Vấn đề trước đây](#2-vấn-đề-trước-đây)
3. [Giải pháp mới](#3-giải-pháp-mới)
4. [API bị ảnh hưởng](#4-api-bị-ảnh-hưởng)
5. [Cấu trúc Request mới](#5-cấu-trúc-request-mới)
6. [Các trường hợp sử dụng](#6-các-trường-hợp-sử-dụng)
7. [Ví dụ Request/Response](#7-ví-dụ-requestresponse)
8. [Hướng dẫn cập nhật Frontend](#8-hướng-dẫn-cập-nhật-frontend)
9. [Validation Rules](#9-validation-rules)
10. [Breaking Changes](#10-breaking-changes)

---

## 1. TỔNG QUAN THAY ĐỔI

### 1.1. Mô tả
Backend đã thêm tính năng **xóa chọn lọc ảnh trong gallery** của Store Story. Thay vì chỉ có thể xóa toàn bộ hoặc thay thế toàn bộ, giờ đây bạn có thể:
- ✅ Giữ lại một số ảnh cũ
- ✅ Xóa một số ảnh cũ
- ✅ Thêm ảnh mới
- ✅ Kết hợp cả 3 thao tác trên trong một request

### 1.2. Lý do thay đổi
**Vấn đề trước đây:**
- Để xóa một phần ảnh (ví dụ: xóa Ảnh 3, Ảnh 4, giữ lại Ảnh 1, Ảnh 2), bạn phải:
  1. Upload lại Ảnh 1 và Ảnh 2 (ảnh muốn giữ)
  2. Set `RemoveExistingGalleryImages = true`
  3. Hệ thống xóa tất cả 4 ảnh cũ
  4. Hệ thống thêm lại 2 ảnh vừa upload

**Hạn chế:**
- ❌ Phải upload lại ảnh đã có → Tốn băng thông và thời gian
- ❌ Tăng nguy cơ lỗi khi upload
- ❌ Không tối ưu về tài nguyên

**Giải pháp mới:**
- ✅ Chỉ cần gửi danh sách URL ảnh muốn giữ lại
- ✅ Không cần upload lại ảnh đã có
- ✅ Tiết kiệm băng thông và thời gian
- ✅ Giảm nguy cơ lỗi

---

## 2. VẤN ĐỀ TRƯỚC ĐÂY

### 2.1. Logic cũ (vẫn hoạt động - tương thích ngược)

Hệ thống chỉ hỗ trợ 3 trường hợp:

#### Trường hợp 1: Thay thế toàn bộ
```json
{
  "NewGalleryImages": [File1, File2],
  "RemoveExistingGalleryImages": true
}
```
**Kết quả:** Gallery chỉ còn ảnh mới

#### Trường hợp 2: Thêm vào đầu
```json
{
  "NewGalleryImages": [File1, File2],
  "RemoveExistingGalleryImages": false
}
```
**Kết quả:** Gallery = [Ảnh mới, Ảnh cũ 1, Ảnh cũ 2, ...]

#### Trường hợp 3: Xóa toàn bộ
```json
{
  "NewGalleryImages": null,
  "RemoveExistingGalleryImages": true
}
```
**Kết quả:** Gallery rỗng

### 2.2. Vấn đề
Không có cách để:
- ❌ Xóa một phần ảnh (ví dụ: chỉ xóa Ảnh 3, Ảnh 4)
- ❌ Giữ lại một phần ảnh cũ mà không cần upload lại

---

## 3. GIẢI PHÁP MỚI

### 3.1. Property mới: `ExistingGalleryImageUrls`

Thêm property `ExistingGalleryImageUrls` (List<string>) vào `StoreStoryUpdateRequest`:

```csharp
public List<string>? ExistingGalleryImageUrls { get; set; }
```

**Mô tả:** Danh sách URL của các ảnh trong gallery hiện tại mà bạn muốn **GIỮ LẠI**.

### 3.2. Logic xử lý mới

**Ưu tiên:** Nếu có `ExistingGalleryImageUrls`, hệ thống sẽ sử dụng logic mới (ưu tiên). Nếu không có, hệ thống sẽ fallback về logic cũ.

**Logic mới:**
1. Giữ lại các ảnh cũ có URL trong `ExistingGalleryImageUrls`
2. Xóa các ảnh cũ không có URL trong `ExistingGalleryImageUrls`
3. Thêm ảnh mới vào cuối (nếu có `NewGalleryImages`)

### 3.3. Ví dụ

**Tình huống:**
- Gallery hiện tại: [Ảnh1, Ảnh2, Ảnh3, Ảnh4]
- Mục tiêu: Xóa Ảnh3, Ảnh4; giữ lại Ảnh1, Ảnh2; thêm Ảnh5

**Request:**
```json
{
  "ExistingGalleryImageUrls": [
    "/images/StoryImages/Ảnh1.jpg",
    "/images/StoryImages/Ảnh2.jpg"
  ],
  "NewGalleryImages": [File5]
}
```

**Kết quả:** [Ảnh1, Ảnh2, Ảnh5]

---

## 4. API BỊ ẢNH HƯỞNG

### 4.1. Endpoint chính

```
PUT /api/Story/{id}
```

**Method:** `PUT`  
**Content-Type:** `multipart/form-data`  
**Path Parameter:**
- `id` (Guid, required): ID của Store Story cần cập nhật

**Request Body:** `StoreStoryUpdateRequest` (multipart/form-data)

### 4.2. Các API khác không bị ảnh hưởng
- ✅ `POST /api/Story` - Không thay đổi
- ✅ `GET /api/StoreStory/{id}` - Không thay đổi
- ✅ `GET /api/StoreStory/by-store/{storeId}` - Không thay đổi

---

## 5. CẤU TRÚC REQUEST MỚI

### 5.1. Request Structure

```typescript
interface StoreStoryUpdateRequest {
  // ... các trường khác ...
  
  // === Gallery Images ===
  NewGalleryImages?: File[];                    // Ảnh mới muốn thêm
  RemoveExistingGalleryImages?: boolean;         // Logic cũ: xóa toàn bộ (tương thích ngược)
  ExistingGalleryImageUrls?: string[];          // ⬅️ MỚI: Danh sách URL ảnh muốn giữ lại
  GalleryDescription?: string;                   // Mô tả gallery
}
```

### 5.2. So sánh trước và sau

#### ❌ Trước khi thay đổi:
```typescript
interface StoreStoryUpdateRequest {
  // ... các trường khác ...
  NewGalleryImages?: File[];
  RemoveExistingGalleryImages?: boolean;
  GalleryDescription?: string;
  // Không có ExistingGalleryImageUrls
}
```

#### ✅ Sau khi thay đổi:
```typescript
interface StoreStoryUpdateRequest {
  // ... các trường khác ...
  NewGalleryImages?: File[];
  RemoveExistingGalleryImages?: boolean;
  ExistingGalleryImageUrls?: string[];  // ⬅️ TRƯỜNG MỚI
  GalleryDescription?: string;
}
```

### 5.3. Chi tiết các trường

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `NewGalleryImages` | `File[]` | ❌ | Danh sách file ảnh mới muốn thêm vào gallery |
| `RemoveExistingGalleryImages` | `boolean` | ❌ | Logic cũ: `true` = xóa toàn bộ ảnh cũ (chỉ dùng khi không có `ExistingGalleryImageUrls`) |
| `ExistingGalleryImageUrls` | `string[]` | ❌ | **MỚI:** Danh sách URL của các ảnh cũ muốn giữ lại |
| `GalleryDescription` | `string` | ❌ | Mô tả cho gallery (tối đa 500 ký tự) |

---

## 6. CÁC TRƯỜNG HỢP SỬ DỤNG

### 6.1. Trường hợp 1: Xóa một phần ảnh (Logic mới - ưu tiên)

**Tình huống:** Gallery có 4 ảnh, muốn xóa Ảnh 3, Ảnh 4, giữ lại Ảnh 1, Ảnh 2

**Request:**
```typescript
const formData = new FormData();
formData.append('Title', 'Tiêu đề story');
formData.append('TextIntro', 'Nội dung intro');
formData.append('TextClosing', 'Nội dung closing');

// Chỉ định ảnh muốn giữ lại
formData.append('ExistingGalleryImageUrls', '/images/StoryImages/Ảnh1.jpg');
formData.append('ExistingGalleryImageUrls', '/images/StoryImages/Ảnh2.jpg');
```

**Kết quả:** Gallery = [Ảnh1, Ảnh2]

### 6.2. Trường hợp 2: Giữ ảnh cũ + Thêm ảnh mới

**Tình huống:** Gallery có 4 ảnh, muốn giữ Ảnh 1, Ảnh 2, xóa Ảnh 3, Ảnh 4, thêm Ảnh 5

**Request:**
```typescript
const formData = new FormData();
formData.append('Title', 'Tiêu đề story');
formData.append('TextIntro', 'Nội dung intro');
formData.append('TextClosing', 'Nội dung closing');

// Ảnh muốn giữ lại
formData.append('ExistingGalleryImageUrls', '/images/StoryImages/Ảnh1.jpg');
formData.append('ExistingGalleryImageUrls', '/images/StoryImages/Ảnh2.jpg');

// Ảnh mới
formData.append('NewGalleryImages', file5);
```

**Kết quả:** Gallery = [Ảnh1, Ảnh2, Ảnh5]

### 6.3. Trường hợp 3: Xóa tất cả ảnh (Logic cũ - tương thích ngược)

**Tình huống:** Xóa toàn bộ ảnh trong gallery

**Request:**
```typescript
const formData = new FormData();
formData.append('Title', 'Tiêu đề story');
formData.append('TextIntro', 'Nội dung intro');
formData.append('TextClosing', 'Nội dung closing');
formData.append('RemoveExistingGalleryImages', 'true');
// Không có ExistingGalleryImageUrls
// Không có NewGalleryImages
```

**Kết quả:** Gallery rỗng

### 6.4. Trường hợp 4: Thay thế toàn bộ (Logic cũ - tương thích ngược)

**Tình huống:** Thay thế toàn bộ ảnh cũ bằng ảnh mới

**Request:**
```typescript
const formData = new FormData();
formData.append('Title', 'Tiêu đề story');
formData.append('TextIntro', 'Nội dung intro');
formData.append('TextClosing', 'Nội dung closing');
formData.append('RemoveExistingGalleryImages', 'true');
formData.append('NewGalleryImages', file1);
formData.append('NewGalleryImages', file2);
```

**Kết quả:** Gallery = [Ảnh mới 1, Ảnh mới 2]

### 6.5. Trường hợp 5: Thêm vào đầu (Logic cũ - tương thích ngược)

**Tình huống:** Thêm ảnh mới vào đầu gallery, giữ nguyên ảnh cũ

**Request:**
```typescript
const formData = new FormData();
formData.append('Title', 'Tiêu đề story');
formData.append('TextIntro', 'Nội dung intro');
formData.append('TextClosing', 'Nội dung closing');
formData.append('RemoveExistingGalleryImages', 'false');
formData.append('NewGalleryImages', file1);
formData.append('NewGalleryImages', file2);
```

**Kết quả:** Gallery = [Ảnh mới 1, Ảnh mới 2, Ảnh cũ 1, Ảnh cũ 2, ...]

---

## 7. VÍ DỤ REQUEST/RESPONSE

### 7.1. Ví dụ 1: Xóa một phần ảnh

**Request:**
```http
PUT /api/Story/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Content-Type: multipart/form-data

Title: Câu chuyện cửa hàng
TextIntro: Giới thiệu về cửa hàng
TextClosing: Kết thúc câu chuyện
ExistingGalleryImageUrls: /images/StoryImages/img1.jpg
ExistingGalleryImageUrls: /images/StoryImages/img2.jpg
```

**Response:**
```json
{
  "status": 200,
  "message": "Câu chuyện cửa hàng đã được cập nhật thành công.",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "storeId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "title": "Câu chuyện cửa hàng",
    "thumbnailUrl": "/images/StoryThumbnails/abc123.png",
    "contents": [
      // ... các content khác ...
      {
        "id": "gallery-content-id",
        "contentType": "ImageGallery",
        "contentData": "Bộ sưu tập hình ảnh",
        "imageUrls": [
          "/images/StoryImages/img1.jpg",
          "/images/StoryImages/img2.jpg"
        ],
        "order": 6
      }
    ],
    "createdAt": "2025-01-15T10:30:00+07:00"
  }
}
```

### 7.2. Ví dụ 2: Giữ ảnh cũ + Thêm ảnh mới

**Request (JavaScript/TypeScript):**
```typescript
const updateStoreStory = async (storyId: string, data: {
  title: string;
  textIntro: string;
  textClosing: string;
  existingGalleryImageUrls?: string[];
  newGalleryImages?: File[];
}) => {
  const formData = new FormData();
  
  formData.append('Title', data.title);
  formData.append('TextIntro', data.textIntro);
  formData.append('TextClosing', data.textClosing);
  
  // Thêm ExistingGalleryImageUrls (nếu có)
  if (data.existingGalleryImageUrls) {
    data.existingGalleryImageUrls.forEach(url => {
      formData.append('ExistingGalleryImageUrls', url);
    });
  }
  
  // Thêm NewGalleryImages (nếu có)
  if (data.newGalleryImages) {
    data.newGalleryImages.forEach(file => {
      formData.append('NewGalleryImages', file);
    });
  }
  
  const response = await fetch(`/api/Story/${storyId}`, {
    method: 'PUT',
    body: formData
  });
  
  return response.json();
};

// Sử dụng
await updateStoreStory('story-id', {
  title: 'Câu chuyện cửa hàng',
  textIntro: 'Giới thiệu',
  textClosing: 'Kết thúc',
  existingGalleryImageUrls: [
    '/images/StoryImages/img1.jpg',
    '/images/StoryImages/img2.jpg'
  ],
  newGalleryImages: [newFile1, newFile2]
});
```

**Response:**
```json
{
  "status": 200,
  "message": "Câu chuyện cửa hàng đã được cập nhật thành công.",
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "contents": [
      {
        "id": "gallery-content-id",
        "contentType": "ImageGallery",
        "contentData": "Bộ sưu tập hình ảnh",
        "imageUrls": [
          "/images/StoryImages/img1.jpg",
          "/images/StoryImages/img2.jpg",
          "/images/StoryImages/new-img1.jpg",
          "/images/StoryImages/new-img2.jpg"
        ],
        "order": 6
      }
    ]
  }
}
```

### 7.3. Ví dụ 3: Lấy URL ảnh từ response hiện tại

**Bước 1: Lấy thông tin story hiện tại**
```typescript
const getStoreStory = async (storyId: string) => {
  const response = await fetch(`/api/StoreStory/${storyId}`);
  return response.json();
};

const story = await getStoreStory('story-id');
```

**Bước 2: Tìm gallery content và lấy URL ảnh**
```typescript
const galleryContent = story.data.contents.find(
  (content: any) => content.contentType === 'ImageGallery'
);

const currentImageUrls = galleryContent?.imageUrls || [];
// currentImageUrls = [
//   '/images/StoryImages/img1.jpg',
//   '/images/StoryImages/img2.jpg',
//   '/images/StoryImages/img3.jpg',
//   '/images/StoryImages/img4.jpg'
// ]
```

**Bước 3: Chọn ảnh muốn giữ lại và cập nhật**
```typescript
// Người dùng chọn giữ lại img1 và img2, xóa img3 và img4
const imagesToKeep = [
  '/images/StoryImages/img1.jpg',
  '/images/StoryImages/img2.jpg'
];

await updateStoreStory('story-id', {
  title: story.data.title,
  textIntro: story.data.contents.find(c => c.contentType === 'TextIntro')?.contentData || '',
  textClosing: story.data.contents.find(c => c.contentType === 'TextClosing')?.contentData || '',
  existingGalleryImageUrls: imagesToKeep
});
```

---

## 8. HƯỚNG DẪN CẬP NHẬT FRONTEND

### 8.1. Cập nhật TypeScript Interface/Type

#### Trước:
```typescript
interface StoreStoryUpdateRequest {
  title: string;
  textIntro: string;
  textClosing: string;
  newGalleryImages?: File[];
  removeExistingGalleryImages?: boolean;
  galleryDescription?: string;
  // ... các trường khác ...
}
```

#### Sau:
```typescript
interface StoreStoryUpdateRequest {
  title: string;
  textIntro: string;
  textClosing: string;
  newGalleryImages?: File[];
  removeExistingGalleryImages?: boolean;
  existingGalleryImageUrls?: string[];  // ⬅️ THÊM TRƯỜNG NÀY
  galleryDescription?: string;
  // ... các trường khác ...
}
```

### 8.2. Cập nhật Form Component

#### Ví dụ với React + TypeScript:

```typescript
import React, { useState, useEffect } from 'react';

interface GalleryImage {
  url: string;
  file?: File;
  isNew: boolean;
}

const StoreStoryUpdateForm: React.FC<{ storyId: string }> = ({ storyId }) => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  // Load story hiện tại
  useEffect(() => {
    const loadStory = async () => {
      const response = await fetch(`/api/StoreStory/${storyId}`);
      const data = await response.json();
      
      const galleryContent = data.data.contents.find(
        (c: any) => c.contentType === 'ImageGallery'
      );
      
      if (galleryContent?.imageUrls) {
        const images = galleryContent.imageUrls.map((url: string) => ({
          url,
          isNew: false
        }));
        setGalleryImages(images);
        setSelectedImages(galleryContent.imageUrls); // Mặc định chọn tất cả
      }
    };
    
    loadStory();
  }, [storyId]);

  // Xử lý chọn/bỏ chọn ảnh
  const handleToggleImage = (url: string) => {
    setSelectedImages(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  // Xử lý thêm ảnh mới
  const handleAddNewImages = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setNewImages(prev => [...prev, ...fileArray]);
      
      // Thêm vào gallery để preview (tạm thời dùng URL.createObjectURL)
      const newImageObjects = fileArray.map(file => ({
        url: URL.createObjectURL(file),
        file,
        isNew: true
      }));
      setGalleryImages(prev => [...prev, ...newImageObjects]);
    }
  };

  // Xử lý submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('Title', 'Tiêu đề');
    formData.append('TextIntro', 'Intro');
    formData.append('TextClosing', 'Closing');
    
    // Thêm ExistingGalleryImageUrls (chỉ ảnh cũ được chọn)
    const existingUrls = selectedImages.filter(url => 
      galleryImages.some(img => img.url === url && !img.isNew)
    );
    existingUrls.forEach(url => {
      formData.append('ExistingGalleryImageUrls', url);
    });
    
    // Thêm NewGalleryImages
    newImages.forEach(file => {
      formData.append('NewGalleryImages', file);
    });
    
    const response = await fetch(`/api/Story/${storyId}`, {
      method: 'PUT',
      body: formData
    });
    
    const result = await response.json();
    console.log('Updated:', result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="gallery-editor">
        <h3>Gallery Images</h3>
        
        {/* Hiển thị ảnh hiện tại */}
        <div className="gallery-grid">
          {galleryImages.map((image, index) => (
            <div key={index} className="gallery-item">
              <img src={image.url} alt={`Gallery ${index + 1}`} />
              
              {/* Checkbox để chọn/bỏ chọn ảnh cũ */}
              {!image.isNew && (
                <label>
                  <input
                    type="checkbox"
                    checked={selectedImages.includes(image.url)}
                    onChange={() => handleToggleImage(image.url)}
                  />
                  Giữ lại
                </label>
              )}
              
              {/* Badge cho ảnh mới */}
              {image.isNew && (
                <span className="badge-new">Mới</span>
              )}
            </div>
          ))}
        </div>
        
        {/* Input để thêm ảnh mới */}
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleAddNewImages(e.target.files)}
        />
        
        <button type="submit">Cập nhật Story</button>
      </div>
    </form>
  );
};

export default StoreStoryUpdateForm;
```

### 8.3. Cập nhật API Service/Client

```typescript
// api/storeStory.ts

export interface StoreStoryUpdateRequest {
  title: string;
  textIntro: string;
  textClosing: string;
  newGalleryImages?: File[];
  removeExistingGalleryImages?: boolean;
  existingGalleryImageUrls?: string[];  // ⬅️ THÊM TRƯỜNG NÀY
  galleryDescription?: string;
  // ... các trường khác ...
}

export const updateStoreStory = async (
  storyId: string,
  request: StoreStoryUpdateRequest
): Promise<ApiResponse<StoreStoryResponseDTO>> => {
  const formData = new FormData();
  
  // Thêm các trường text
  formData.append('Title', request.title);
  formData.append('TextIntro', request.textIntro);
  formData.append('TextClosing', request.textClosing);
  
  // Thêm ExistingGalleryImageUrls (nếu có)
  if (request.existingGalleryImageUrls) {
    request.existingGalleryImageUrls.forEach(url => {
      formData.append('ExistingGalleryImageUrls', url);
    });
  }
  
  // Thêm NewGalleryImages (nếu có)
  if (request.newGalleryImages) {
    request.newGalleryImages.forEach(file => {
      formData.append('NewGalleryImages', file);
    });
  }
  
  // Thêm RemoveExistingGalleryImages (chỉ khi không có ExistingGalleryImageUrls)
  if (!request.existingGalleryImageUrls && request.removeExistingGalleryImages !== undefined) {
    formData.append('RemoveExistingGalleryImages', request.removeExistingGalleryImages.toString());
  }
  
  // Thêm GalleryDescription (nếu có)
  if (request.galleryDescription) {
    formData.append('GalleryDescription', request.galleryDescription);
  }
  
  const response = await fetch(`/api/Story/${storyId}`, {
    method: 'PUT',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to update store story');
  }
  
  return response.json();
};
```

### 8.4. Helper Function để xử lý gallery

```typescript
// utils/galleryHelper.ts

/**
 * Lấy danh sách URL ảnh từ story response
 */
export const getGalleryImageUrls = (story: StoreStoryResponseDTO): string[] => {
  const galleryContent = story.contents.find(
    c => c.contentType === 'ImageGallery'
  );
  return galleryContent?.imageUrls || [];
};

/**
 * Tạo request để xóa một số ảnh trong gallery
 */
export const createSelectiveDeleteRequest = (
  currentImageUrls: string[],
  imagesToKeep: string[],
  newImages?: File[]
): Partial<StoreStoryUpdateRequest> => {
  return {
    existingGalleryImageUrls: imagesToKeep,
    newGalleryImages: newImages
  };
};

/**
 * Validate số lượng ảnh (tối đa 6)
 */
export const validateGalleryImageCount = (
  existingCount: number,
  newCount: number
): { valid: boolean; message?: string } => {
  const total = existingCount + newCount;
  
  if (total > 6) {
    return {
      valid: false,
      message: `Tổng số ảnh không được vượt quá 6. Hiện tại: ${total} ảnh (giữ lại: ${existingCount}, thêm mới: ${newCount}).`
    };
  }
  
  return { valid: true };
};
```

---

## 9. VALIDATION RULES

### 9.1. Validation phía Backend

Backend sẽ validate các điều kiện sau:

1. **URL hợp lệ:**
   - Tất cả URL trong `ExistingGalleryImageUrls` phải thuộc về gallery hiện tại
   - Nếu có URL không hợp lệ, API sẽ trả về lỗi 400 với message:
     ```
     "Các URL sau không thuộc về gallery hiện tại: [danh sách URL không hợp lệ]"
     ```

2. **Số lượng ảnh:**
   - Tổng số ảnh (ExistingGalleryImageUrls + NewGalleryImages) không được vượt quá 6
   - Nếu vượt quá, API sẽ trả về lỗi 400 với message:
     ```
     "Tổng số ảnh không được vượt quá 6. Hiện tại: X ảnh (giữ lại: Y, thêm mới: Z)."
     ```

3. **Gallery chưa có ảnh:**
   - Nếu gallery chưa có ảnh nhưng có `ExistingGalleryImageUrls`, API sẽ trả về lỗi 400:
     ```
     "Không thể chỉ định ExistingGalleryImageUrls khi gallery chưa có ảnh."
     ```

### 9.2. Validation phía Frontend (Khuyến nghị)

Frontend nên validate trước khi gửi request:

```typescript
const validateGalleryUpdate = (
  existingUrls: string[],
  newImages: File[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate số lượng
  const totalCount = existingUrls.length + newImages.length;
  if (totalCount > 6) {
    errors.push(
      `Tổng số ảnh không được vượt quá 6. Hiện tại: ${totalCount} ảnh.`
    );
  }
  
  // Validate file size (nếu cần)
  const maxSize = 5 * 1024 * 1024; // 5MB
  newImages.forEach((file, index) => {
    if (file.size > maxSize) {
      errors.push(`Ảnh ${index + 1} vượt quá kích thước cho phép (5MB).`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

---

## 10. BREAKING CHANGES

### 10.1. Thay đổi không breaking

✅ **Không có breaking changes** - Đây là thay đổi **backward compatible**:
- Trường `ExistingGalleryImageUrls` là trường **mới được thêm vào**, không thay thế trường nào
- Logic cũ (`RemoveExistingGalleryImages`) vẫn hoạt động bình thường
- Frontend cũ vẫn hoạt động bình thường (chỉ không sử dụng tính năng mới)

### 10.2. Migration Guide

#### Bước 1: Cập nhật Type Definitions
- Thêm trường `ExistingGalleryImageUrls?: string[]` vào `StoreStoryUpdateRequest`

#### Bước 2: Cập nhật UI Components
- Thêm UI để người dùng chọn ảnh muốn giữ lại (checkbox, toggle, etc.)
- Cập nhật form để gửi `ExistingGalleryImageUrls` khi có

#### Bước 3: Cập nhật API Client
- Cập nhật function `updateStoreStory` để hỗ trợ `ExistingGalleryImageUrls`
- Xử lý FormData để gửi array của strings

#### Bước 4: Testing
- Test với `ExistingGalleryImageUrls` (logic mới)
- Test với `RemoveExistingGalleryImages` (logic cũ - tương thích ngược)
- Test validation (số lượng ảnh, URL hợp lệ)

### 10.3. Ưu tiên Logic

**Quan trọng:** Nếu có `ExistingGalleryImageUrls`, hệ thống sẽ **bỏ qua** `RemoveExistingGalleryImages` và sử dụng logic mới.

**Ví dụ:**
```typescript
// Request này sẽ sử dụng logic mới (ExistingGalleryImageUrls)
// RemoveExistingGalleryImages sẽ bị bỏ qua
{
  existingGalleryImageUrls: ['url1', 'url2'],
  removeExistingGalleryImages: true  // ⬅️ Bị bỏ qua
}
```

---

## 11. TÓM TẮT

### ✅ Những gì đã thay đổi:
1. **Thêm trường `ExistingGalleryImageUrls`** vào `StoreStoryUpdateRequest`
2. **Logic mới:** Cho phép xóa chọn lọc ảnh trong gallery
3. **Tương thích ngược:** Logic cũ vẫn hoạt động bình thường

### 🎯 Lợi ích:
- ✅ Không cần upload lại ảnh đã có
- ✅ Tiết kiệm băng thông và thời gian
- ✅ Giảm nguy cơ lỗi khi upload
- ✅ Tối ưu về tài nguyên

### 📝 Action Items cho Frontend:
1. ✅ Cập nhật TypeScript interfaces/types
2. ✅ Cập nhật form component để hỗ trợ chọn ảnh muốn giữ lại
3. ✅ Cập nhật API client để gửi `ExistingGalleryImageUrls`
4. ✅ Thêm validation phía frontend (khuyến nghị)
5. ✅ Test với các trường hợp: xóa một phần, giữ + thêm mới, logic cũ

### ⚠️ Lưu ý:
- `ExistingGalleryImageUrls` có **ưu tiên cao hơn** `RemoveExistingGalleryImages`
- Tổng số ảnh (ExistingGalleryImageUrls + NewGalleryImages) không được vượt quá 6
- URL trong `ExistingGalleryImageUrls` phải thuộc về gallery hiện tại

---

## 12. VÍ DỤ HOÀN CHỈNH

### 12.1. Component React hoàn chỉnh

```typescript
import React, { useState, useEffect } from 'react';
import { updateStoreStory, getStoreStory } from '../api/storeStory';
import { validateGalleryImageCount } from '../utils/galleryHelper';

interface GalleryEditorProps {
  storyId: string;
  onSuccess?: () => void;
}

const GalleryEditor: React.FC<GalleryEditorProps> = ({ storyId, onSuccess }) => {
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load gallery hiện tại
  useEffect(() => {
    const loadGallery = async () => {
      try {
        const response = await getStoreStory(storyId);
        const galleryContent = response.data.contents.find(
          (c: any) => c.contentType === 'ImageGallery'
        );
        
        if (galleryContent?.imageUrls) {
          setCurrentImages(galleryContent.imageUrls);
          setSelectedImages(galleryContent.imageUrls); // Mặc định chọn tất cả
        }
      } catch (err) {
        setError('Không thể tải gallery');
      }
    };
    
    loadGallery();
  }, [storyId]);

  // Xử lý chọn/bỏ chọn ảnh
  const handleToggleImage = (url: string) => {
    setSelectedImages(prev => {
      if (prev.includes(url)) {
        return prev.filter(u => u !== url);
      } else {
        return [...prev, url];
      }
    });
  };

  // Xử lý thêm ảnh mới
  const handleAddImages = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      
      // Validate số lượng
      const validation = validateGalleryImageCount(
        selectedImages.length,
        fileArray.length
      );
      
      if (!validation.valid) {
        setError(validation.message || 'Số lượng ảnh không hợp lệ');
        return;
      }
      
      setNewImages(prev => [...prev, ...fileArray]);
      setError(null);
    }
  };

  // Xử lý xóa ảnh mới (chưa upload)
  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // Xử lý submit
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validate
      const validation = validateGalleryImageCount(
        selectedImages.length,
        newImages.length
      );
      
      if (!validation.valid) {
        setError(validation.message || 'Số lượng ảnh không hợp lệ');
        setLoading(false);
        return;
      }
      
      // Lấy thông tin story hiện tại để lấy các trường bắt buộc
      const storyResponse = await getStoreStory(storyId);
      const story = storyResponse.data;
      
      // Tìm các content cần thiết
      const textIntro = story.contents.find(
        (c: any) => c.contentType === 'TextIntro'
      )?.contentData || '';
      
      const textClosing = story.contents.find(
        (c: any) => c.contentType === 'TextClosing'
      )?.contentData || '';
      
      // Cập nhật story
      await updateStoreStory(storyId, {
        title: story.title,
        textIntro,
        textClosing,
        existingGalleryImageUrls: selectedImages,
        newGalleryImages: newImages.length > 0 ? newImages : undefined
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reload gallery
      const updatedResponse = await getStoreStory(storyId);
      const updatedGallery = updatedResponse.data.contents.find(
        (c: any) => c.contentType === 'ImageGallery'
      );
      
      if (updatedGallery?.imageUrls) {
        setCurrentImages(updatedGallery.imageUrls);
        setSelectedImages(updatedGallery.imageUrls);
        setNewImages([]);
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật gallery');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gallery-editor">
      <h3>Quản lý Gallery</h3>
      
      {error && (
        <div className="error-message" style={{ color: 'red' }}>
          {error}
        </div>
      )}
      
      {/* Ảnh hiện tại */}
      <div className="current-images">
        <h4>Ảnh hiện tại ({currentImages.length}/6)</h4>
        <div className="image-grid">
          {currentImages.map((url, index) => (
            <div key={index} className="image-item">
              <img src={url} alt={`Image ${index + 1}`} />
              <label>
                <input
                  type="checkbox"
                  checked={selectedImages.includes(url)}
                  onChange={() => handleToggleImage(url)}
                />
                Giữ lại
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Ảnh mới */}
      <div className="new-images">
        <h4>Ảnh mới ({newImages.length})</h4>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleAddImages(e.target.files)}
        />
        <div className="new-images-preview">
          {newImages.map((file, index) => (
            <div key={index} className="new-image-item">
              <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} />
              <button onClick={() => handleRemoveNewImage(index)}>Xóa</button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Thông tin */}
      <div className="info">
        <p>
          Tổng số ảnh sau khi cập nhật: {selectedImages.length + newImages.length}/6
        </p>
        <p>
          Sẽ giữ lại: {selectedImages.length} ảnh | 
          Sẽ thêm mới: {newImages.length} ảnh | 
          Sẽ xóa: {currentImages.length - selectedImages.length} ảnh
        </p>
      </div>
      
      {/* Nút submit */}
      <button 
        onClick={handleSubmit} 
        disabled={loading}
      >
        {loading ? 'Đang cập nhật...' : 'Cập nhật Gallery'}
      </button>
    </div>
  );
};

export default GalleryEditor;
`