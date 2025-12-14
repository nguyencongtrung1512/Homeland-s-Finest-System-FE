import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../components/ui/tabs'
import TransactionManagementAdmin from '../transactionManager/transactionManager'
import RequestWalletMoneyManagement from '../requestWalletMoneyManagement/list'
import BalanceHistory from './balanceHistory'

function GiaoDich() {
  const [activeTab, setActiveTab] = useState<'payment-gateway' | 'approval' | 'balance-history'>('payment-gateway')

  return (
    <div className='space-y-6 p-6 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold text-gray-900'>Giao dịch</h1>
        <p className='text-gray-600 mt-1'>Quản lý giao dịch và phê duyệt yêu cầu rút tiền, hoàn tiền</p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'payment-gateway' | 'approval' | 'balance-history')}
      >
        <TabsList className='bg-white shadow-sm border border-gray-200 mb-6'>
          <TabsTrigger value='payment-gateway' className='px-6 py-2'>
            Tiền vào / ra hệ thống
          </TabsTrigger>
          <TabsTrigger value='approval' className='px-6 py-2'>
            Phê Duyệt Giao Dịch
          </TabsTrigger>
          <TabsTrigger value='balance-history' className='px-6 py-2'>
            Tiền trong hệ thống
          </TabsTrigger>
        </TabsList>

        <TabsContent value='payment-gateway' className='mt-0'>
          <TransactionManagementAdmin />
        </TabsContent>

        <TabsContent value='approval' className='mt-0'>
          <RequestWalletMoneyManagement />
        </TabsContent>

        <TabsContent value='balance-history' className='mt-0'>
          <BalanceHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GiaoDich

