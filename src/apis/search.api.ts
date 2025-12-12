import axiosInstance from '../service/axiosInstance'
import type { Product, ProductCategory } from '../types/productType'

const API_URL = `/Search`

// Search request interface
export interface SearchRequest {
  queryText: string // Required - empty string for trending
  userId?: string | null // Optional - for personalization
  limit?: number | null // Optional - recommended 50-100 when filters are applied
  sortBy?: 'newest' | 'best-selling' | 'rating' | 'price-asc' | 'price-desc' | string | null // Optional
  minPrice?: number | null // Optional
  maxPrice?: number | null // Optional
  categoryFilterIds?: string[] | null // Optional - List of category UUIDs (recommended, filter at SQL level)
  categoryFilters?: string[] | null // Optional - deprecated, for backward compatibility only
  provinceFilters?: string[] | null // Optional
  regionFilters?: string[] | null // Optional
  subRegionFilters?: string[] | null // Optional
}

// Search result interface (from API response)
export interface SearchResult {
  id: string
  name: string
  relevance_score?: number
  type?: string | null
  // Product fields
  price?: number
  rating?: number
  review_count?: number
  sale_count?: number
  store_status?: string
  product_images?: string[]
  category_names?: string[]
  createdAt?: string
  province_name?: string
  region_name?: string
  sub_region_name?: string
  // Document fields
  title?: string
  content?: string
  slug?: string
}

// Search suggest request interface
export interface SearchSuggestRequest {
  prefix: string // Required
  userId?: string | null // Optional
  limit?: number | null // Optional
}

/**
 * Map SearchResult to Product type
 */
function mapSearchResultToProduct(result: SearchResult): Product {
  return {
    id: result.id,
    storeId: '', // Not available in search result
    storeName: '', // Not available in search result
    provinceId: 0, // Not available in search result
    provinceName: '', // Not available in search result
    editedById: '', // Not available in search result
    summaryPrice: result.price || 0,
    price: result.price || 0,
    name: result.name,
    description: '', // Not available in search result
    productImages: result.product_images || [],
    productVideo: '', // Not available in search result
    material: '', // Not available in search result
    saleCount: result.sale_count || 0,
    rating: result.rating || 0,
    reviewCount: result.review_count || 0,
    isActive: true, // Assume active
    typeProduct: '', // Not available in search result
    status: result.store_status || '', // Not available in search result
    staffNote: '', // Not available in search result
    variantGroups: [], // Not available in search result
    productCategories: result.category_names?.[0]
      ? ([
        {
          id: '',
          name: result.category_names[0],
          description: '',
          level: 0,
          parentId: null,
          isActive: true,
          createdAt: '',
          updatedAt: ''
        } as ProductCategory
      ])
      : [],
    productCertificateDTOs: [] // Not available in search result
  }
}

// Search API Functions
export const searchApi = {
  /**
   * Search products with filters and sorting
   * @param request - Search request parameters
   * @returns Array of products matching the search criteria
   */
  search: async (request: SearchRequest): Promise<Product[]> => {
    // Build request body with PascalCase field names to match backend DTO
    const requestBody: Record<string, string | number | string[] | undefined> = {
      QueryText: request.queryText || '' // Empty string for trending
    }

    // Only add UserId if it's provided (not null/undefined)
    if (request.userId) {
      requestBody.UserId = request.userId
    }

    // Add optional fields only if they are provided
    if (request.limit !== null && request.limit !== undefined) {
      requestBody.Limit = request.limit
    }

    if (request.sortBy !== null && request.sortBy !== undefined && request.sortBy !== '') {
      requestBody.SortBy = request.sortBy
    }

    if (request.minPrice !== null && request.minPrice !== undefined) {
      requestBody.MinPrice = request.minPrice
    }

    if (request.maxPrice !== null && request.maxPrice !== undefined) {
      requestBody.MaxPrice = request.maxPrice
    }

    // Priority: CategoryFilterIds (recommended) > CategoryFilters (deprecated)
    if (request.categoryFilterIds && request.categoryFilterIds.length > 0) {
      requestBody.CategoryFilterIds = request.categoryFilterIds
    } else if (request.categoryFilters && request.categoryFilters.length > 0) {
      requestBody.CategoryFilters = request.categoryFilters
    }

    if (request.provinceFilters && request.provinceFilters.length > 0) {
      requestBody.ProvinceFilters = request.provinceFilters
    }

    if (request.regionFilters && request.regionFilters.length > 0) {
      requestBody.RegionFilters = request.regionFilters
    }

    if (request.subRegionFilters && request.subRegionFilters.length > 0) {
      requestBody.SubRegionFilters = request.subRegionFilters
    }

    const response = await axiosInstance.post(API_URL, requestBody)
    const searchResults = response as unknown as SearchResult[]

    // Filter only products (not documents) and map to Product type
    return searchResults
      .filter((result) => !result.type || result.type === 'Product')
      .map(mapSearchResultToProduct)
  },

  /**
   * Get search suggestions based on prefix
   * @param request - Suggest request parameters
   * @returns Array of suggested search terms or products
   */
  suggest: async (request: SearchSuggestRequest): Promise<string[] | Product[]> => {
    const params: Record<string, string | number | undefined> = {
      Prefix: request.prefix
    }

    // Only add userId if it's provided
    if (request.userId) {
      params.UserId = request.userId
    }

    // Add limit if provided
    if (request.limit !== null && request.limit !== undefined) {
      params.Limit = request.limit
    }

    const response = await axiosInstance.get(`${API_URL}/suggest`, { params })
    return response as unknown as string[] | Product[]
  }
}

export default searchApi
