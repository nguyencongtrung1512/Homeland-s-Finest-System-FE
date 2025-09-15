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
  // ============ CUSTOMER ===========
  // ============ SELLER=========
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
  // ============ STAFF========
  BASE_STAFF: '/dashboardStaff',
  storesStaff: '/storesStaff',
  storeDetailStaff: '/storeDetail/:storeId',
  approveStoresStaff: '/approveStoresStaff',
  lockedStoresStaff: '/lockedStoresStaff',
  approveProductsStaff: '/approveProductsStaff',
  managerProductStaff: '/managerProductStaff',
  detailProductStaff: '/detailProduct/:productId',
  transactionsStaff: '/transactionsStaff',
  reportsStaff: '/reportsStaff',
  reportDetailStaff: '/reportDetail/:reportId',
  blogStaff: '/blogStaff',
  complianceStaff: '/complianceStaff',

  settingsStaff: '/settingsStaff',
  BLOG_MANAGEMENT: '/blog/:id',
  CATEGORY_MANAGEMENT: '/category-management',
  BLOG_LIST_BY_CATEGORY: '/category/:categoryId/blogs',
  BLOG_DETAIL: '/blog-detail/:id',
  // ============ ADMIN =============
  BASE_ADMIN: '/admin',
  STORE_MANAGEMENT_ADMIN: '/storeManagement',
  ACCOUNT_MANAGEMENT_ADMIN: '/accountManagement',
  TERMS_MANAGEMENT_ADMIN: '/termsManagement',
}

export default path