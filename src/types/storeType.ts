export interface Store {
  id: string // UUID
  sellerId: string // UUID - Foreign key to Seller
  storeName: string // varchar(255)
  address: string // text
  logoUrl: string // varchar(500)
  coverImageUrl: string // varchar(500)
  status: 'active' | 'inactive' | 'suspended' | 'pending' // varchar(50)
  note: string // text
  history: unknown[] // JSONB - Array of history records
  createdAt: string // TIMESTAMPTZ
  updatedAt: string // TIMESTAMPTZ
}

export interface StoreCreateInput {
  sellerId: string
  storeName: string
  address: string
  logoUrl?: string
  coverImageUrl?: string
  status?: 'active' | 'inactive' | 'suspended' | 'pending'
  note?: string
}

export interface StoreUpdateInput {
  storeName?: string
  address?: string
  logoUrl?: string
  coverImageUrl?: string
  status?: 'active' | 'inactive' | 'suspended' | 'pending'
  note?: string
  history?: unknown[]
}
