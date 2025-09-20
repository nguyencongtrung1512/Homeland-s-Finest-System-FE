import SellerRegistrationLayout from './SellerRegistrationLayout'
import SellerRegistrationForm from './SellerRegistrationForm'

function SellerRegisterPage() {
  return (
    <div>
      {/* <Header /> */}
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50'>
        <SellerRegistrationLayout>
          <SellerRegistrationForm />
        </SellerRegistrationLayout>
      </div>
    </div>
  )
}

export default SellerRegisterPage
