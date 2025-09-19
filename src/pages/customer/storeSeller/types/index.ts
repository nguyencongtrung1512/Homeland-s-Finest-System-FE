export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  rating: number
  ratingCount: number
  discount?: number
  badge?: {
    text: string
    color: string
  }
}

export interface Certificate {
  id?: string
  name: string
  description: string
  image: string
  issuedBy?: string
  issueDate?: string
}

export interface Store {
  id: string
  name: string
  description: string
  address: string
  rating: number
  ratingCount: number
  image: string
  coverImage: string
  products: Product[]
  story: string
  certificates: Certificate[]
}

export interface StoreApiResponse {
  store: Store
  products: Product[]
  certificates: Certificate[]
  story: {
    content: string
    images: string[]
    video?: string
  }
}