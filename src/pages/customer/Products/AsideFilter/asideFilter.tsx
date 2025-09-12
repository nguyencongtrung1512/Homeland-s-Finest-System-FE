import React, { useState } from 'react'

type Brand = {
  id: string
  name: string
}

const BRANDS: Brand[] = [
  { id: 'cozy', name: 'Cozy' },
  { id: 'maloca', name: 'Maloca' },
  { id: 'lavie', name: 'Lavie' },
  { id: 'th-true-milk', name: 'TH True Milk' }
]

function AsideFilter() {
  const [price, setPrice] = useState(500000)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  const toggleBrand = (id: string) => {
    setSelectedBrands((prev) => (prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]))
  }

  return (
    <aside className='w-full bg-white rounded-xl border border-gray-200 p-4 sticky top-24 h-max'>
      <h3 className='text-sm font-bold text-white bg-[#2D5016] p-2 rounded-lg  '>TẤT CẢ SẢN PHẨM</h3>

      {/* Categories */}
      <div className='mt-4 space-y-2 text-sm'>
        {['Trái cây tươi ngon', 'Đặc sản vùng miền', 'Trà – Cà phê – Socola', 'Đồ sấy – Ăn vặt', 'Đồ uống'].map(
          (item) => (
            <button key={item} className='block w-full text-left px-2 py-1.5 rounded hover:bg-gray-50'>
              {item}
            </button>
          )
        )}
      </div>

      {/* Brand */}
      <div className='mt-6'>
        <p className='text-sm font-semibold text-gray-700 mb-2'>Thương hiệu uy tín</p>
        <div className='grid grid-cols-2 gap-2'>
          {BRANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleBrand(b.id)}
              className={`text-sm rounded border px-3 py-1.5 transition ${selectedBrands.includes(b.id)
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 hover:border-green-400'
                }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className='mt-6'>
        <p className='text-sm font-semibold text-gray-700'>KHOẢNG GIÁ (TRÊN M | KG)</p>
        <div className='mt-3'>
          <input
            type='range'
            min={0}
            max={1000000}
            step={10000}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className='w-full accent-green-600'
          />
          <div className='flex justify-between text-xs text-gray-500 mt-1'>
            <span>0đ</span>
            <span>1,000,000đ</span>
          </div>
          <div className='mt-2 text-sm font-medium text-green-700'>Tối đa: {price.toLocaleString('vi-VN')}đ</div>
        </div>
      </div>

      {/* Apply button */}
      <button className='mt-6 w-full rounded-lg bg-green-600 text-white py-2 text-sm font-semibold hover:bg-green-700'>
        Áp dụng lọc
      </button>
    </aside>
  )
}

export default AsideFilter