import React, { useState } from 'react'
import { Card, CardContent } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import {
  PiggyBank,
  Clock,
  TrendingUp,
  Search,
  Calendar,
  Building2,
  CreditCard,
  User,
  Edit,
  Download
} from 'lucide-react'

function FinanceManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Mock data
  const financialSummary = {
    availableBalance: 2450000,
    pendingSettlement: 850000,
    totalRevenue: 15680000,
    revenueGrowth: 12
  }

  const transactions = [
    {
      id: 'DH001234',
      date: '15/01/2024',
      amount: 450000,
      platformFee: 22500,
      netAmount: 427500,
      status: 'paid'
    },
    {
      id: 'DH001235',
      date: '14/01/2024',
      amount: 320000,
      platformFee: 16000,
      netAmount: 304000,
      status: 'pending'
    },
    {
      id: 'DH001236',
      date: '13/01/2024',
      amount: 680000,
      platformFee: 34000,
      netAmount: 646000,
      status: 'paid'
    }
  ]

  const bankInfo = {
    bankName: 'Vietcombank',
    accountNumber: '**** **** **** 1234',
    accountHolder: 'Nguyễn Văn A'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className='bg-green-100 text-green-800 hover:bg-green-100 border-green-200'>
            Đã thanh toán
          </Badge>
        )
      case 'pending':
        return (
          <Badge className='bg-yellow-100 text-orange-800 hover:bg-yellow-100 border-yellow-200'>
            Đang chờ
          </Badge>
        )
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800 hover:bg-gray-100'>
            {status}
          </Badge>
        )
    }
  }

  const handleUpdateInfo = () => {
    console.log('Update bank info')
  }

  const handleDownloadReport = () => {
    console.log('Download financial report')
  }

  return (
    <div className='p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-green-700 mb-2'>Quản lý tài chính</h1>
        <p className='text-gray-600'>Theo dõi doanh thu và quản lý tài chính của bạn</p>
      </div>

      {/* Financial Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        {/* Available Balance */}
        <Card className='relative overflow-hidden'>
          <CardContent className='p-6'>
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='text-sm font-medium text-gray-600 mb-2'>Số dư khả dụng</h3>
                <p className='text-3xl font-bold text-green-600'>
                  {financialSummary.availableBalance.toLocaleString()} ₫
                </p>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center'>
                <PiggyBank className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Settlement */}
        <Card className='relative overflow-hidden'>
          <CardContent className='p-6'>
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='text-sm font-medium text-gray-600 mb-2'>Đang chờ quyết toán</h3>
                <p className='text-3xl font-bold text-green-600'>
                  {financialSummary.pendingSettlement.toLocaleString()} ₫
                </p>
                <p className='text-sm text-gray-500 mt-1'>Sẽ được quyết toán trong 3-5 ngày</p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Clock className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className='relative overflow-hidden'>
          <CardContent className='p-6'>
            <div className='flex justify-between items-start'>
              <div>
                <h3 className='text-sm font-medium text-gray-600 mb-2'>Tổng doanh thu</h3>
                <p className='text-3xl font-bold text-green-600'>
                  {financialSummary.totalRevenue.toLocaleString()} ₫
                </p>
                <p className='text-sm text-green-600 mt-1 flex items-center gap-1'>
                  <TrendingUp className='w-4 h-4' />
                  +{financialSummary.revenueGrowth}% so với tháng trước
                </p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <TrendingUp className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>Lịch sử giao dịch</h2>
          </div>

          {/* Filters */}
          <div className='flex gap-4 mb-6'>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                type='date'
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className='pl-10 w-48'
                placeholder='mm/dd/yyyy'
              />
            </div>
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <Input
                placeholder='Tìm kiếm mã đơn hàng...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>

          {/* Transaction Table */}
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-gray-200'>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Mã đơn hàng</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Ngày</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Số tiền</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Phí nền tảng</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Thực nhận</th>
                  <th className='text-left py-3 px-4 font-medium text-gray-700'>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className='border-b border-gray-100 hover:bg-gray-50'>
                    <td className='py-4 px-4 text-gray-900 font-medium'>#{transaction.id}</td>
                    <td className='py-4 px-4 text-gray-700'>{transaction.date}</td>
                    <td className='py-4 px-4 text-gray-900 font-medium'>
                      {transaction.amount.toLocaleString()} ₫
                    </td>
                    <td className='py-4 px-4 text-gray-700'>
                      {transaction.platformFee.toLocaleString()} ₫
                    </td>
                    <td className='py-4 px-4 text-green-600 font-medium'>
                      {transaction.netAmount.toLocaleString()} ₫
                    </td>
                    <td className='py-4 px-4'>
                      {getStatusBadge(transaction.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardContent className='p-6'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6'>Thông tin thanh toán</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Bank Details */}
            <div className='space-y-6'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                  <Building2 className='w-5 h-5 text-gray-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Ngân hàng</p>
                  <p className='font-medium text-gray-900'>{bankInfo.bankName}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                  <CreditCard className='w-5 h-5 text-gray-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Số tài khoản</p>
                  <p className='font-medium text-gray-900'>{bankInfo.accountNumber}</p>
                </div>
              </div>

              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                  <User className='w-5 h-5 text-gray-600' />
                </div>
                <div>
                  <p className='text-sm text-gray-600'>Tên chủ tài khoản</p>
                  <p className='font-medium text-gray-900'>{bankInfo.accountHolder}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-col gap-4'>
              <Button
                onClick={handleUpdateInfo}
                className='bg-green-600 hover:bg-green-700 text-white'
              >
                <Edit className='w-4 h-4 mr-2' />
                Cập nhật thông tin
              </Button>

              <Button
                variant='outline'
                onClick={handleDownloadReport}
                className='border-gray-300 text-gray-700 hover:bg-gray-50'
              >
                <Download className='w-4 h-4 mr-2' />
                Tải xuống báo cáo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FinanceManagement
