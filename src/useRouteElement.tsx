import { useRoutes } from 'react-router-dom'
import MainLayout from './Layouts/CustomerLayout/MainLayout'
import HomePage from './pages/customer/Home/HomePage'
import Products from './pages/customer/Products/products'
import path from './constants/path'
import ProductsDetail from './pages/customer/Products/ProductDetail/productsDetail'
import Cart from './pages/customer/Cart/Cart'
import OrderConfirm from './pages/customer/Cart/OrderConfirm'
import Invoice from './pages/customer/Cart/Invoice'
import Login from './pages/authentication/Login'
import Register from './pages/authentication/Register'
import IntroPage from './pages/seller/IntroPage/introPage'
import SellerRegisterPage from './Layouts/SellerLayout/Registration/SellerRegisterPage'
import SellerLoginLayout from './Layouts/SellerLayout/LoginSeller/SellerLoginLayout'
import Dashboard from './pages/seller/dashboard/dashboard'
import SellerLayout from './Layouts/SellerLayout/sellerLayout'
import ProductsSeller from './pages/seller/products/products'
import CreateProduct from './pages/seller/products/createProduct'
import UpdateProduct from './pages/seller/products/updateProduct'
import OrderManagement from './pages/seller/order/order'
import OrderDetail from './pages/seller/order/orderDetail'
import CreateMyStory from './pages/seller/mystory/createMyStory'
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
import TransactionManagement from './pages/staff/transactions/transactions'
import ReportManagement from './pages/staff/reports/reports'
import ReportDetail from './pages/staff/reports/reportDetail'
import AdminLayout from './Layouts/AdminLayout/adminLayout'
import AdminDashboard from './pages/admin/dashboard'
import StoreManagement from './pages/admin/storeManagerment/list'
import CustomerManagement from './pages/admin/accountManagerment/list'
import TermsManagement from './pages/admin/terms/list'
import TransactionManagementAdmin from './pages/admin/transactionManager/transactionManager'
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

// import ProtectedRoute from './components/ProtectedRoute'

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
          path: path.cart,
          element: <Cart />
        },
        {
          path: path.cartOrderConfirm,
          element: <OrderConfirm />
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
              path: path.updateProduct,
              element: <UpdateProduct />
            },
            {
              path: path.detailProduct,
              element: <DetailProductSeller />
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
            // TODO: Thêm các routes còn thiếu khi có components
            // {
            //   path: path.complianceStaff,
            //   element: <ComplianceStaff />
            // },
            // {
            //   path: path.settingsStaff,
            //   element: <SettingsStaff />
            // }
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
            // {
            //   path: path.PRODUCT_MANAGEMENT_ADMIN,
            //   element: <ManagerProductAdmin />
            // },
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
              element: <BlogCategoryList />
            },
            {
              path: path.BLOG_CATEGORY_DETAIL,
              element: <BlogByCategory />
            },
            {
              path: path.SYSTEM_STORAGE_ADMIN,
              element: <SystemStorage />
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
