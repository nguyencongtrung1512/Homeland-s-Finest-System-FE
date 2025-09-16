import { useRoutes } from 'react-router-dom'
import MainLayout from './Layouts/CustomerLayout/MainLayout'
import HomePage from './pages/customer/Home/HomePage'
import Products from './pages/customer/Products/products'
import Store from './pages/customer/Store/Store'
import path from './constants/path'
import ProductsDetail from './pages/customer/Products/ProductDetail/productsDetail'
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
import OrderDetail from './pages/seller/order/orderDetail'
import CreateMyStory from './pages/seller/mystory/createMyStory'
import DetailMyStory from './pages/seller/mystory/detailMyStory'
import ChatWithCustomer from './pages/seller/ChatWithCustomer/ChatWithCustomer'
import FinanceManagement from './pages/seller/finance/finance'
import SetupStore from './pages/seller/setupStore/setupStore'
import HelpCenter from './pages/seller/help/help'
import DetailHelp from './pages/seller/help/detailHelp'
import MyStory from './pages/seller/mystory/myStory'
import VerifyEmail from './pages/authentication/ForgotPassword/VerifyEmail'
import NewPassword from './pages/authentication/ForgotPassword/NewPassword'
import StaffDashboard from './pages/staff/dashboard/dashboard'
import StaffLayout from './Layouts/StaffLayout/staffLayout'
import ProfileCustomer from './pages/customer/Profile/ProfileCustomer'
import ProfileLayout from './Layouts/CustomerLayout/ProfileLayout'
import ListStore from './pages/staff/storeManagerment/listStore'
import ApproveStores from './pages/staff/storeManagerment/approveStores'
import LockedStores from './pages/staff/storeManagerment/lockedStores'
import StoreDetail from './pages/staff/storeManagerment/storeDetail'
import ManagerProduct from './pages/staff/productManagerment/managerProduct'
import DetailProduct from './pages/staff/productManagerment/detailProduct'
import TransactionManagement from './pages/staff/transactions/transactions'
import ReportManagement from './pages/staff/reports/reports'
import ReportDetail from './pages/staff/reports/reportDetail'
import AdminLayout from './Layouts/AdminLayout/adminLayout'
import AdminDashboard from './pages/admin/dashboard'
import StoreManagement from './pages/admin/storeManagerment/list'
import CustomerManagement from './pages/admin/accountManagerment/list'
import TermsManagement from './pages/admin/terms/list'

import StoriesLayout from './Layouts/CustomerLayout/StoriesLayout/StoriesLayout'
import { Stories } from './pages/customer/Stories'

import TransactionManagementAdmin from './pages/admin/transactionManager/transactionManager'
import BlogList from './pages/admin/blogManagerment/list'
import ManagerProductAdmin from './pages/admin/productManagerment/productManager'


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
          path: '/store/:storeId',
          element: <Store />
        }
      ]
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
    // Stories pages with dedicated layout
    {
      path: '',
      element: <StoriesLayout />,
      children: [
        {
          path: path.stories,
          element: <Stories />
        }
      ]
    },
    {
      path: path.sellerPage,
      element: <IntroPage />
    },
    {
      path: path.loginSeller,
      element: <SellerLoginLayout />
    },
    {
      path: path.registerSeller,
      element: <SellerRegisterPage />
    },
    {
      path: '/',
      element: <SellerLayout />,
      children: [
        {
          path: path.dashboard,
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
          path: path.ordersSeller,
          element: <OrderManagement />
        },
        {
          path: path.orderDetailSeller,
          element: <OrderDetail />
        },
        {
          path: path.myStorySeller,
          element: <MyStory />
        },
        {
          path: path.createMyStorySeller,
          element: <CreateMyStory />
        },
        {
          path: path.detailMyStorySeller,
          element: <DetailMyStory />
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
    {
      path: path.resetPassword,
      element: <NewPassword />
    },

    // STAFF routes
    {
      path: '/',
      element: <StaffLayout />,
      children: [
        {
          path: path.BASE_STAFF,
          element: <StaffDashboard />
        },
        {
          path: path.storesStaff,
          element: <ListStore />
        },
        {
          path: path.storeDetailStaff,
          element: <StoreDetail />
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
          path: path.detailProductStaff,
          element: <DetailProduct />
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
        }
      ]
    },
    // ADMIN routes
    {
      path: '/',
      element: <AdminLayout />,
      children: [
        {
          path: path.BASE_ADMIN,
          element: <AdminDashboard />
        },
        {
          path: path.STORE_MANAGEMENT_ADMIN,
          element: <StoreManagement />
        },
        {
          path: path.PRODUCT_MANAGEMENT_ADMIN,
          element: <ManagerProductAdmin />
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
          path: path.BLOG_MANAGEMENT_ADMIN,
          element: <BlogList />
        }
      ]
    }
  ])

  return routeElements
}
