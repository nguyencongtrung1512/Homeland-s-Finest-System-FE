export const path = {
  //===============Public===============
  home: '/',
  login: '/login',
  product: '/products',
  productDetail: '/product/:id',
  store: '/store/:storeId',
  stories: '/stories',
  loginCustomer: '/login',
  registerCustomer: '/register',
  forgotPassword: '/forgot-password/verify-email',
  verifyOTP: '/forgot-password/verify-otp',
  resetPassword: '/forgot-password/reset-password',
  // ============ Customer ===========
  cart: '/cart',
  cartOrderConfirm: '/cart/confirm',
  cartInvoice: '/cart/invoice',
  profileCustomer: '/profile',
  // ============ SELLER=========
  sellerPage: '/sellerPage',
  loginSeller: '/loginSeller',
  registerSeller: '/registerSeller',
  BASE_SELLER: '/seller',
  // Seller nested routes (relative paths)
  productsSeller: 'product-management',
  createProduct: 'create-product',
  updateProduct: 'update-product/:id',
  ordersSeller: 'order-management',
  orderDetailSeller: 'order-detail/:orderId',
  myStorySeller: 'my-story',
  createMyStorySeller: 'create-story',
  detailMyStorySeller: 'detailMyStory/:storyId',
  chatWithCustomerSeller: 'chat',
  financeSeller: 'finance',
  setupStoreSeller: 'setup-store',
  helpSeller: 'help',
  detailHelpSeller: 'help/:requestId',
  // ============ STAFF========
  BASE_STAFF: 'staff',
  // Staff nested routes (relative paths)
  storesStaff: 'stores',
  storeDetailStaff: 'store-detail/:storeId',
  approveStoresStaff: 'approve-stores',
  lockedStoresStaff: 'locked-stores',
  approveProductsStaff: 'approve-products',
  managerProductStaff: 'manager-product',
  detailProductStaff: 'detail-product/:productId',
  Order_Management_Staff: 'orders',
  transactionsStaff: 'transactions',
  reportsStaff: 'reports',
  reportDetailStaff: 'reportDetail/:reportId',
  blogStaff: '/blog',
  complianceStaff: '/complianceStaff',

  settingsStaff: '/settingsStaff',
  BLOG_MANAGEMENT: '/blog/:id',
  CATEGORY_MANAGEMENT: '/category-management',
  BLOG_LIST_BY_CATEGORY: '/category/:categoryId/blogs',
  BLOG_DETAIL: '/blog-detail/:id',
  // ============ ADMIN =============
  BASE_ADMIN: '/admin',
  // Admin nested routes (relative paths)
  STORE_MANAGEMENT_ADMIN: 'storeManagement',
  ACCOUNT_MANAGEMENT_ADMIN: 'accountManagement',
  TERMS_MANAGEMENT_ADMIN: 'termsManagement',
  COMBO_MANAGEMENT_ADMIN: 'comboManagement',
  TRANSACTION_MANAGEMENT_ADMIN: 'transactionManagement',
  REPORT_MANAGEMENT_ADMIN: 'reportManagement',
  PRODUCT_MANAGEMENT_ADMIN: 'productManagement',
  BLOG_MANAGEMENT_ADMIN: 'blogManagement'
}

export default path
