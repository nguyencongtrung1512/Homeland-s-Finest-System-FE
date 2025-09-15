export const path = {
  //===============Public===============
  home: '/',
  login: '/login',
  product: '/products',
  productDetail: '/product/:id',
  loginCustomer: '/login',
  registerCustomer: '/register',
  forgotPassword: '/forgot-password/verify-email',
  verifyOTP: '/forgot-password/verify-otp',
  resetPassword: '/forgot-password/reset-password',
  // ============ Customer ===========
  profileCustomer: '/profile',
  // ============ Seller=========
  sellerPage: '/sellerPage',
  loginSeller: '/loginSeller',
  registerSeller: '/registerSeller',
  dashboard: '/dashboardSeller',
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
  dashboardStaff: '/dashboardStaff',
  storesStaff: '/storesStaff',
  storeDetailStaff: '/storeDetail/:storeId',
  approveStoresStaff: '/approveStoresStaff',
  lockedStoresStaff: '/lockedStoresStaff',
  approveProductsStaff: '/approveProductsStaff',
  managerProductStaff: '/managerProductStaff',
  detailProductStaff: '/detailProduct/:productId',
  transactionsStaff: '/transactionsStaff',
  reportsStaff: '/reportsStaff',
  blogStaff: '/blogStaff',
  complianceStaff: '/complianceStaff',
  settingsStaff: '/settingsStaff'
  // ============ Admin =============
}

export default path