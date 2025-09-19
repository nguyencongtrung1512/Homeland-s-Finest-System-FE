// import React, { useState } from 'react'
// import SellerRegisterLayout from '~/Layouts/SellerLayout/LoginSeller/SellerRegisterLayout'

// function SellerRegister() {
//   const [currentStep, setCurrentStep] = useState(1)
//   const [formData, setFormData] = useState({
//     step1: {},
//     step2: {},
//     step3: {}
//   })

//   const stepTitles = ['Tạo tài khoản', 'Thông tin cửa hàng', 'Giấy tờ & Cam kết', 'Hoàn tất']

//   const handleStep1Next = (data: any) => {
//     setFormData((prev) => ({ ...prev, step1: data }))
//     setCurrentStep(2)
//   }

//   const handleStep2Next = (data: any) => {
//     setFormData((prev) => ({ ...prev, step2: data }))
//     setCurrentStep(3)
//   }

//   const handleStep3Next = (data: any) => {
//     setFormData((prev) => ({ ...prev, step3: data }))
//     // Here you would typically submit all form data to your API
//     console.log('Complete registration data:', {
//       ...formData,
//       step3: data
//     })
//     setCurrentStep(4)
//   }

//   const handleBack = () => {
//     if (currentStep > 1) {
//       setCurrentStep(currentStep - 1)
//     }
//   }

//   const renderCurrentStep = () => {
//     switch (currentStep) {
//       case 1:
//         return <Step1AccountForm onNext={handleStep1Next} formData={formData.step1} />
//       case 2:
//         return <Step2StoreInfo onNext={handleStep2Next} onBack={handleBack} formData={formData.step2} />
//       case 3:
//         return <Step3Documents onNext={handleStep3Next} onBack={handleBack} formData={formData.step3} />
//       case 4:
//         return <Step4Success />
//       default:
//         return null
//     }
//   }

//   return (
//     <SellerRegisterLayout currentStep={currentStep} totalSteps={4} stepTitles={stepTitles}>
//       {renderCurrentStep()}
//     </SellerRegisterLayout>
//   )
// }

// export default SellerRegister
