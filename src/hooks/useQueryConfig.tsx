import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'

export interface QueryConfig {
  page?: string
  limit?: string
  sort_by?: string
  order?: string
  exclude?: string
  name?: string
  rating_filter?: string
  price_max?: string
  price_min?: string
  category?: string
  // Search API params
  queryText?: string
  categoryFilters?: string[]
  provinceFilters?: string[]
  regionFilters?: string[]
  subRegionFilters?: string[]
  sortBy?: 'newest' | 'best-selling' | 'rating' | 'price-asc' | 'price-desc' | string
}

/**
 * Hook để quản lý query parameters từ URL
 * Hỗ trợ cả query params truyền thống và search API params
 */
export default function useQueryConfig() {
  const [searchParams, setSearchParams] = useSearchParams()

  const queryParams: QueryConfig = useMemo(() => {
    const params: QueryConfig = {}

    // Lấy các query params truyền thống
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const sort_by = searchParams.get('sort_by')
    const order = searchParams.get('order')
    const exclude = searchParams.get('exclude')
    const name = searchParams.get('name')
    const rating_filter = searchParams.get('rating_filter')
    const price_max = searchParams.get('price_max')
    const price_min = searchParams.get('price_min')
    const category = searchParams.get('category')

    // Lấy search API params
    const queryText = searchParams.get('queryText')
    const sortBy = searchParams.get('sortBy') as QueryConfig['sortBy']

    // Lấy array params (categoryFilters, provinceFilters, etc.)
    const categoryFilters = searchParams.get('categoryFilters')
    const provinceFilters = searchParams.get('provinceFilters')
    const regionFilters = searchParams.get('regionFilters')
    const subRegionFilters = searchParams.get('subRegionFilters')

    // Gán các giá trị nếu tồn tại
    if (page) params.page = page
    if (limit) params.limit = limit
    if (sort_by) params.sort_by = sort_by
    if (order) params.order = order
    if (exclude) params.exclude = exclude
    if (name) params.name = name
    if (rating_filter) params.rating_filter = rating_filter
    if (price_max) params.price_max = price_max
    if (price_min) params.price_min = price_min
    if (category) params.category = category

    // Gán search API params
    if (queryText) params.queryText = queryText
    if (sortBy) params.sortBy = sortBy

    // Parse array params (format: "value1,value2,value3")
    if (categoryFilters) {
      params.categoryFilters = categoryFilters.split(',').filter(Boolean)
    }
    if (provinceFilters) {
      params.provinceFilters = provinceFilters.split(',').filter(Boolean)
    }
    if (regionFilters) {
      params.regionFilters = regionFilters.split(',').filter(Boolean)
    }
    if (subRegionFilters) {
      params.subRegionFilters = subRegionFilters.split(',').filter(Boolean)
    }

    return params
  }, [searchParams])

  /**
   * Cập nhật query params
   */
  const updateQueryParams = (updates: Partial<QueryConfig>) => {
    const newParams = new URLSearchParams(searchParams)

    // Cập nhật các params truyền thống
    if (updates.page !== undefined) {
      if (updates.page) newParams.set('page', updates.page)
      else newParams.delete('page')
    }
    if (updates.limit !== undefined) {
      if (updates.limit) newParams.set('limit', updates.limit)
      else newParams.delete('limit')
    }
    if (updates.sort_by !== undefined) {
      if (updates.sort_by) newParams.set('sort_by', updates.sort_by)
      else newParams.delete('sort_by')
    }
    if (updates.order !== undefined) {
      if (updates.order) newParams.set('order', updates.order)
      else newParams.delete('order')
    }
    if (updates.exclude !== undefined) {
      if (updates.exclude) newParams.set('exclude', updates.exclude)
      else newParams.delete('exclude')
    }
    if (updates.name !== undefined) {
      if (updates.name) newParams.set('name', updates.name)
      else newParams.delete('name')
    }
    if (updates.rating_filter !== undefined) {
      if (updates.rating_filter) newParams.set('rating_filter', updates.rating_filter)
      else newParams.delete('rating_filter')
    }
    if (updates.price_max !== undefined) {
      if (updates.price_max) newParams.set('price_max', updates.price_max)
      else newParams.delete('price_max')
    }
    if (updates.price_min !== undefined) {
      if (updates.price_min) newParams.set('price_min', updates.price_min)
      else newParams.delete('price_min')
    }
    if (updates.category !== undefined) {
      if (updates.category) newParams.set('category', updates.category)
      else newParams.delete('category')
    }

    // Cập nhật search API params
    if (updates.queryText !== undefined) {
      if (updates.queryText) newParams.set('queryText', updates.queryText)
      else newParams.delete('queryText')
    }
    if (updates.sortBy !== undefined) {
      if (updates.sortBy) newParams.set('sortBy', updates.sortBy)
      else newParams.delete('sortBy')
    }

    // Cập nhật array params
    if (updates.categoryFilters !== undefined) {
      if (updates.categoryFilters.length > 0) {
        newParams.set('categoryFilters', updates.categoryFilters.join(','))
      } else {
        newParams.delete('categoryFilters')
      }
    }
    if (updates.provinceFilters !== undefined) {
      if (updates.provinceFilters.length > 0) {
        newParams.set('provinceFilters', updates.provinceFilters.join(','))
      } else {
        newParams.delete('provinceFilters')
      }
    }
    if (updates.regionFilters !== undefined) {
      if (updates.regionFilters.length > 0) {
        newParams.set('regionFilters', updates.regionFilters.join(','))
      } else {
        newParams.delete('regionFilters')
      }
    }
    if (updates.subRegionFilters !== undefined) {
      if (updates.subRegionFilters.length > 0) {
        newParams.set('subRegionFilters', updates.subRegionFilters.join(','))
      } else {
        newParams.delete('subRegionFilters')
      }
    }

    setSearchParams(newParams)
  }

  /**
   * Xóa tất cả query params
   */
  const clearQueryParams = () => {
    setSearchParams(new URLSearchParams())
  }

  /**
   * Xóa một query param cụ thể
   */
  const removeQueryParam = (key: keyof QueryConfig) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete(key)
    setSearchParams(newParams)
  }

  return {
    queryParams,
    updateQueryParams,
    clearQueryParams,
    removeQueryParam
  }
}
