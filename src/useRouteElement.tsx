import { useRoutes } from 'react-router-dom'
import MainLayout from './Layouts/CustomerLayout/MainLayout'
import HomePage from './pages/customer/Home/HomePage'
import Products from './pages/customer/Products/products'
import path from './constants/path'
import ProductsDetail from './pages/customer/Products/ProductDetail/productsDetail'
import Cart from './pages/customer/Cart/Cart'
import Invoice from './pages/customer/Order/Invoice'
import Login from './pages/authentication/Login'
import Register from './pages/authentication/Register'
import IntroPage from './pages/seller/IntroPage/introPage'
import SellerRegisterPage from './Layouts/SellerLayout/Registration/SellerRegisterPage'
import SellerLoginLayout from './Layouts/SellerLayout/LoginSeller/SellerLoginLayout'
import Dashboard from './pages/seller/dashboard/dashboard'
import SellerLayout from './Layouts/SellerLayout/sellerLayout'
import ProductsSeller from './pages/seller/products/products'
import CreateProduct from './pages/seller/products/createProduct'
import OrderManagement from './pages/seller/order/order'
import ChatWithCustomer from './pages/seller/ChatWithCustomer/ChatWithCustomer'
import FinanceManagement from './pages/seller/finance/finance'
import SetupStore from './pages/seller/setupStore/setupStore'
import HelpCenter from './pages/seller/help/help'
import DetailHelp from './pages/seller/help/detailHelp'
import MyStory from './pages/seller/mystory/myStory'
import VerifyEmail from './pages/authentication/ForgotPassword/VerifyEmail'
import StaffDashboard from './pages/staff/dashboard/dashboard'
import StaffLayout from './Layouts/StaffLayout/staffLayout'
import ProfileCustomer from './pages/customer/Profile/ProfileCustomer'
import ProfileLayout from './Layouts/CustomerLayout/ProfileLayout'
import ListStore from './pages/staff/storeManagerment/listStore'
import ApproveStores from './pages/staff/storeManagerment/approveStores'
import LockedStores from './pages/staff/storeManagerment/lockedStores'
import ManagerProduct from './pages/staff/productManagerment/managerProduct'
import TransactionManagement from './pages/staff/transactions/transactions'
import ReportManagement from './pages/staff/formReport/reports'
import ReportDetail from './pages/staff/formReport/reportDetail'
import AdminLayout from './Layouts/AdminLayout/adminLayout'
import AdminDashboard from './pages/admin/dashboard'
import StoreManagement from './pages/admin/storeManagerment/list'
import CustomerManagement from './pages/admin/accountManagerment/list'
import TermsManagement from './pages/admin/terms/list'
import TransactionManagementAdmin from './pages/admin/transactionManager/transactionManager'
import RequestWalletMoneyManagement from './pages/admin/requestWalletMoneyManagement/list'
import { AdminPromotionList, AdminPromotionStats } from './pages/admin/promotionManagerment'
import OrderManagementStaff from './pages/staff/orderManager/list'
import StoryWithSeller from './pages/customer/storyWithSeller'
import StorePage from './pages/customer/storeSeller/storePage'
import NotFound from './components/Error/NotFound'
import SystemStorage from './pages/admin/systemStorage/list'
import ListCategory from './pages/staff/productCategory/listCategory'
import BlogManagement from './pages/staff/blogManagerment/list'
import BlogCategoryList from './pages/admin/blogManagerment/list'
import ComboSeller from './pages/seller/combos/listCombo'
import ProtectedRoute from './components/ProtectedRoute'
import Discover from './pages/customer/Discover/discover'
import BlogByCategory from './pages/admin/blogManagerment'
import CreateBlogByCategory from './pages/admin/blogManagerment/createBlog'
import UpdateBlogByCategory from './pages/admin/blogManagerment/updateBlog'
import StoreDetailAdmin from './pages/admin/storeManagerment/detail'
import DetailProductSeller from './pages/seller/products/detailProduct'
import DetailProductStaff from './pages/staff/productManagerment/detailProduct'
import StaffStoreDetail from './pages/staff/storeManagerment/storeDetail'
import ListProductByStoreStaff from './pages/staff/storeManagerment/listProductByStore'
import OrderCreate from './pages/customer/Order/OrderCreate'
import SellerPromotionList from './pages/seller/promotionManagement/list'
import CreateComboSeller from './pages/seller/combos/createCombo'
import DetailComboSeller from './pages/seller/combos/detailCombo'
import ProductReviews from './pages/seller/productReviews/productReviews'
import ViewBlog from './pages/customer/Blog/viewBlog'
import SellerManagement from './pages/admin/sellerManagerment/list'
import StaffManagement from './pages/admin/staffManagerment/list'
import AdminFormManagement from './pages/admin/formManagerment/form'
import FormOrderManagement from './pages/admin/formManagerment/formOrder'
import FormStoreManagement from './pages/admin/formManagerment/formStore'
import ManagerComboStaff from './pages/staff/comboManagerment/managerCombo'
import DetailComboStaff from './pages/staff/comboManagerment/detailCombo'
import ManagerProductAdmin from './pages/admin/productManagerment/list'
import ManagerComboAdmin from './pages/admin/comboManagerment/list'
import ComboDetail from './pages/customer/combo/detail'
import DetailProductAdmin from './pages/admin/productManagerment/detail'


export default function useRouteElements() {
  const routeElements = useRoutes([
    // CUSTOMER routes
    {
      path: '',
      element: <MainLayout />,
      children: [
        {
          path: path.home,
          element: <HomePage />
        },
        {
          path: path.product,
          element: <Products />
        },
        {
          path: path.productDetail,
          element: <ProductsDetail />
        },
        {
          path: path.detailCombo,
          element: <ComboDetail />
        },
        {
          path: path.cart,
          element: <Cart />
        },
        {
          path: path.cartOrderCreate,
          element: <OrderCreate />
        },
        {
          path: path.cartInvoice,
          element: <Invoice />
        },
        {
          path: path.store,
          element: <StorePage />
        },
        {
          path: path.stories,
          element: <StoryWithSeller />
        },
        {
          path: path.discover,
          element: <Discover />
        },
        {
          path: path.blog,
          element: <ViewBlog />
        }
      ]
    },
    {
      path: path.loginCustomer,
      element: <Login />
    },
    {
      path: path.registerCustomer,
      element: <Register />
    },
    {
      path: path.forgotPassword,
      element: <VerifyEmail />
    },
    // Profile Customer with separate layout
    {
      path: '',
      element: <ProfileLayout />,
      children: [
        {
          path: path.profileCustomer,
          element: <ProfileCustomer />
        }
      ]
    },
    {
      path: path.sellerPage,
      element: <IntroPage />
    },
    {
      path: path.registerSeller,
      element: <SellerRegisterPage />
    },
    {
      path: path.loginSeller,
      element: <SellerLoginLayout />
    },
    // =================================SELLER================================
    {
      path: path.BASE_SELLER,
      element: <ProtectedRoute requiredRole='Seller' />,
      children: [
        {
          path: '',
          element: <SellerLayout />,
          children: [
            {
              path: '',
              element: <Dashboard />
            },
            {
              path: path.productsSeller,
              element: <ProductsSeller />
            },
            {
              path: path.createProduct,
              element: <CreateProduct />
            },
            {
              path: path.detailProductSeller,
              element: <DetailProductSeller />
            },
            {
              path: path.ordersSeller,
              element: <OrderManagement />
            },
            {
              path: path.promotionSeller,
              element: <SellerPromotionList />
            },
            {
              path: path.myStorySeller,
              element: <MyStory />
            },
            {
              path: path.chatWithCustomerSeller,
              element: <ChatWithCustomer />
            },
            {
              path: path.financeSeller,
              element: <FinanceManagement />
            },
            {
              path: path.setupStoreSeller,
              element: <SetupStore />
            },
            {
              path: path.helpSeller,
              element: <HelpCenter />
            },
            {
              path: path.detailHelpSeller,
              element: <DetailHelp />
            },
            {
              path: path.comboSeller,
              element: <ComboSeller />
            },
            {
              path: path.createComboSeller,
              element: <CreateComboSeller />
            },
            {
              path: path.detailComboSeller,
              element: <DetailComboSeller />
            },
            {
              path: path.productReviewsSeller,
              element: <ProductReviews />
            }
          ]
        }
      ]
    },
    //=================================STAFF================================
    {
      path: path.BASE_STAFF,
      element: <ProtectedRoute requiredRole='Staff' />,
      children: [
        {
          path: '',
          element: <StaffLayout />,
          children: [
            {
              path: '',
              element: <StaffDashboard />
            },
            {
              path: path.storesStaff,
              element: <ListStore />
            },
            {
              path: path.listProductByStoreStaff,
              element: <ListProductByStoreStaff />
            },
            {
              path: path.storeDetailStaff,
              element: <StaffStoreDetail />
            },
            {
              path: path.reportDetailStaff,
              element: <ReportDetail />
            },
            {
              path: path.approveStoresStaff,
              element: <ApproveStores />
            },
            {
              path: path.lockedStoresStaff,
              element: <LockedStores />
            },
            {
              path: path.managerProductStaff,
              element: <ManagerProduct />
            },
            {
              path: path.comboManagementStaff,
              element: <ManagerComboStaff />
            },
            {
              path: path.detailComboStaff,
              element: <DetailComboStaff />
            },
            {
              path: path.detailProductStaff,
              element: <DetailProductStaff />
            },
            {
              path: path.transactionsStaff,
              element: <TransactionManagement />
            },
            {
              path: path.reportsStaff,
              element: <ReportManagement />
            },
            {
              path: path.reportDetailStaff,
              element: <ReportDetail />
            },
            {
              path: path.Order_Management_Staff,
              element: <OrderManagementStaff />
            },
            {
              path: path.productCategoryStaff,
              element: <ListCategory />
            },
            {
              path: path.blogStaff,
              element: <BlogManagement />
            }

          ]
        }
      ]
    },

    // =================================ADMIN================================
    {
      path: path.BASE_ADMIN,
      element: <ProtectedRoute requiredRole='Admin' />,
      children: [
        {
          path: '',
          element: <AdminLayout />,
          children: [
            {
              path: '',
              element: <AdminDashboard />
            },
            {
              path: path.STORE_MANAGEMENT_ADMIN,
              element: <StoreManagement />
            },
            {
              path: path.STORE_DETAIL_ADMIN,
              element: <StoreDetailAdmin />
            },
            {
              path: path.PRODUCT_MANAGEMENT_ADMIN,
              element: <ManagerProductAdmin />
            },
            {
              path: path.PRODUCT_DETAIL_ADMIN,
              element: <DetailProductAdmin />
            },
            {
              path: path.COMBO_MANAGEMENT_ADMIN,
              element: <ManagerComboAdmin />
            },
            {
              path: path.ACCOUNT_MANAGEMENT_ADMIN,
              element: <CustomerManagement />
            },
            {
              path: path.TERMS_MANAGEMENT_ADMIN,
              element: <TermsManagement />
            },
            {
              path: path.TRANSACTION_MANAGEMENT_ADMIN,
              element: <TransactionManagementAdmin />
            },
            {
              path: path.REQUEST_WALLET_MONEY_MANAGEMENT_ADMIN,
              element: <RequestWalletMoneyManagement />
            },
            {
              path: path.BLOG_MANAGEMENT_ADMIN,
              element: <BlogCategoryList />
            },
            {
              path: path.BLOG_CATEGORY_DETAIL,
              element: <BlogByCategory />
            },
            {
              path: path.SYSTEM_STORAGE_ADMIN,
              element: <SystemStorage />
            },
            {
              path: path.SELLER_MANAGEMENT_ADMIN,
              element: <SellerManagement />
            },
            {
              path: path.STAFF_MANAGEMENT_ADMIN,
              element: <StaffManagement />
            },
            {
              path: path.PROMOTION_MANAGEMENT_ADMIN,
              element: <AdminPromotionList />
            },
            {
              path: path.FORM_MANAGEMENT_ADMIN,
              element: <AdminFormManagement />
            },
            {
              path: path.FORM_ORDER_MANAGEMENT_ADMIN,
              element: <FormOrderManagement />
            },
            {
              path: path.FORM_STORE_MANAGEMENT_ADMIN,
              element: <FormStoreManagement />
            },
            {
              path: '/admin/promotions/stats',
              element: <AdminPromotionStats />
            }
          ]
        }
      ]
    },

    // Blog Category Detail Route (absolute path)
    {
      path: '',
      element: <AdminLayout />,
      children: [
        {
          path: path.CREATE_BLOG,
          element: <CreateBlogByCategory />
        },
        {
          path: path.BLOG_CATEGORY_EDIT,
          element: <UpdateBlogByCategory />
        }
      ]
    },

    // Catch-all route for 404 Not Found
    {
      path: '*',
      element: <NotFound />
    }
  ])

  return routeElements
}
