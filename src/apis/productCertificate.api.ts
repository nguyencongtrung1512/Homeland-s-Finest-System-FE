import axiosInstance from '../service/axiosInstance'
import type {
  ProductCertificateCreateInput,
  ProductCertificateListResponse,
  ProductCertificateResponse
} from '../types/productCertificateType'

const API_URL = `/ProductCertificate`

export const productCertificateApi = {
  // Get certificates by product ID with pagination
  getByProductId: async (productId: string, pageSize?: number, pageNumber?: number) => {
    const params = new URLSearchParams()
    if (pageSize) params.append('pageSize', pageSize.toString())
    if (pageNumber) params.append('pageNumber', pageNumber.toString())

    const queryString = params.toString()
    const url = `${API_URL}/product/${productId}${queryString ? `?${queryString}` : ''}`

    return await axiosInstance.get<ProductCertificateListResponse>(url)
  },

  // Create certificate with multipart/form-data
  create: async (data: ProductCertificateCreateInput) => {
    const formData = new FormData()
    formData.append('ProductId', data.productId)
    formData.append('CertificateImage', data.certificateImage)
    formData.append('Status', data.status)

    return await axiosInstance.post<ProductCertificateResponse>(`${API_URL}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // Update certificate status
  updateStatus: async (certificateId: string, status: string) => {
    return await axiosInstance.put(`${API_URL}/${certificateId}`, { status })
  }
}

export default productCertificateApi
