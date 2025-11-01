export interface Address {
  id: string // UUID - Primary Key
  userId: string // UUID - Foreign Key to User
  province: string // varchar(255)
  district: string | null // varchar(255)
  ward: string // varchar(255)
  provinceId: number // integer
  districtId: number | null // integer
  wardId: number // integer
  streetAddress: string // text
  isDefault: boolean | null // boolean
  createdAt: string | null // TIMESTAMPTZ
  updatedAt: string | null // TIMESTAMPTZ
  isActive: boolean | null // boolean
}

export interface AddressCreateInput {
  userId: string
  province: string
  district: string
  ward: string
  provinceId: number
  districtId: number
  wardId: number
  streetAddress: string
  isDefault?: boolean
}

export interface AddressUpdateInput {
  province?: string
  district?: string
  ward?: string
  provinceId?: number
  districtId?: number
  wardId?: number
  streetAddress?: string
  isDefault?: boolean
  isActive?: boolean
}

export interface AddressQueryParams {
  userId?: string
  provinceId?: number
  districtId?: number
  wardId?: number
  isDefault?: boolean
  isActive?: boolean
  pageSize?: number
  pageNumber?: number
  sortBy?: 'createdAt' | 'updatedAt' | 'province' | 'district' | 'ward'
  sortOrder?: 'asc' | 'desc'
}
