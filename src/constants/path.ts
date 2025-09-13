const path = {
  //===============Public===============
  home: '/',
  login: '/login',
  product: '/products',
  productDetail: '/product/:id',
  loginCustomer: '/login',
  registerCustomer: '/register',
  // ============ Customer ===========
  // ============ Seller=========
  sellerPage: '/sellerPage',
  loginSeller: '/loginSeller',
  dashboard: '/dashboard',
  productsSeller: '/productsSeller',
  createProduct: '/createProduct',
  ordersSeller: '/ordersSeller',
  orderDetailSeller: '/orderDetail/:orderId',
  myStorySeller: '/myStorySeller',
  createMyStorySeller: '/createMyStory',
  detailMyStorySeller: '/detailMyStory/:storyId',
  chatWithCustomerSeller: '/chatWithCustomerSeller',
  financeSeller: '/financeSeller',
  setupStoreSeller: '/setupStoreSeller',
  helpSeller: '/helpSeller',
  detailHelpSeller: '/detailHelp/:requestId',
  // ============ Staff========
  // ============ Admin =============

  forgotPassword: '/forgot-password/verify-email',
  verifyOTP: '/forgot-password/verify-otp',
  resetPassword: '/forgot-password/reset-password'
}
export default path