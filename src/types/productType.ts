export interface Product {
  id: string; // UUID
  storeId: string; // UUID
  name: string;
  description: string;
  productImages: string[]; // jsonb (có thể khai báo cụ thể hơn: string[] nếu chỉ chứa url ảnh)
  price: number; // numeric(10,2)
  type: string; // varchar(100)
  categoryId: string[]; // array
  brandName: string;
  weight: number; // numeric(10,2)
  dimensions: string;
  material: string;
  size: string;
  color: string;
  viewCount: number;
  saleCount: number;
  rating: number; // numeric(3,2)
  reviewCount: number;
  createdAt: string; // TIMESTAMPTZ -> ISO string
  updatedAt: string; // TIMESTAMPTZ
  isActive: boolean;
  status: string;
  itemCombo: string[]; // JsonB (nếu cấu trúc rõ ràng thì định nghĩa interface riêng)
  log: string[]; // JsonB (tương tự, có thể refine)
}
