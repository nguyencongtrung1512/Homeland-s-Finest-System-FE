export interface Province {
  id: string // UUID
  name: string // varchar(255)
  region: string // varchar(100)
}

export interface ProvinceCreateInput {
  name: string
  region: string
}

export interface ProvinceUpdateInput {
  name?: string
  region?: string
}
