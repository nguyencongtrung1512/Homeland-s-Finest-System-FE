export interface SearchClickLog {
  id: string // UUID
  searchId: string // UUID - Foreign key to Search
  productId: string // UUID - Foreign key to Product
  clickPosition: number // integer - Position in search results
  clickedAt: string // TIMESTAMPTZ
}

export interface SearchClickLogCreateInput {
  searchId: string
  productId: string
  clickPosition: number
  clickedAt?: string
}
