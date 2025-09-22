import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Plus, Edit, Trash2, Eye, ChevronRight, Home } from 'lucide-react'
import path from '../../../constants/path'

function ProductsSeller() {
  const navigate = useNavigate()

  const products = [
    {
      id: 'SP001',
      name: 'Mật ong rừng U Minh Hạ',
      price: 450000,
      status: 'active'
    },
    {
      id: 'SP002',
      name: 'Bánh tráng mường Tây Ninh',
      price: 320000,
      status: 'active'
    },
    {
      id: 'SP003',
      name: 'Mắm ruốc Huế',
      price: 680000,
      status: 'inactive'
    }
  ]

  const handleCreateProduct = () => {
    navigate(`../${path.createProduct}`)
  }

  const handleEditProduct = (productId: string) => {
    navigate(`../${path.updateProduct.replace(':id', productId)}`)
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-semibold text-gray-900'>Quản lý sản phẩm</h1>
        <Button className='bg-green-600 hover:bg-green-700' onClick={handleCreateProduct}>
          <Plus className='w-4 h-4 mr-2' />
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b'>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>ID</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Tên sản phẩm</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Giá</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Trạng thái</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className='border-b hover:bg-gray-50'>
                    <td className='py-3 px-4 text-gray-900'>{product.id}</td>
                    <td className='py-3 px-4 text-gray-900'>{product.name}</td>
                    <td className='py-3 px-4 text-gray-900'>{product.price.toLocaleString()}₫</td>
                    <td className='py-3 px-4'>
                      <Badge
                        variant={product.status === 'active' ? 'default' : 'secondary'}
                        className={
                          product.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : 'bg-red-100 text-red-800 hover:bg-red-100'
                        }
                      >
                        {product.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex space-x-2'>
                        <Button variant='ghost' size='sm'>
                          <Eye className='w-4 h-4' />
                        </Button>
                        <Button variant='ghost' size='sm' onClick={() => handleEditProduct(product.id)}>
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button variant='ghost' size='sm' className='text-red-600 hover:text-red-700'>
                          <Trash2 className='w-4 h-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between mt-6'>
            <div className='text-sm text-gray-700'>Hiển thị 1-3 của 3 sản phẩm</div>
            <div className='flex space-x-2'>
              <Button variant='outline' size='sm' disabled>
                Trước
              </Button>
              <Button variant='outline' size='sm' className='bg-green-600 text-white hover:bg-green-700'>
                1
              </Button>
              <Button variant='outline' size='sm' disabled>
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductsSeller
