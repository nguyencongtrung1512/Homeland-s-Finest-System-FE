import { useRoutes } from 'react-router-dom'
import MainLayout from './Layouts/CustomerLayout/MainLayout'
import HomePage from './pages/customer/Home/HomePage'
import Products from './pages/customer/Products/products'
import path from './constants/path'
import ProductsDetail from './pages/customer/Products/ProductDetail/productsDetail'
import Login from './pages/authentication/Login'
import Register from './pages/authentication/Register'
import IntroPage from './pages/seller/IntroPage/introPage'
import LoginSeller from './pages/seller/components/login'
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
          path: path.loginCustomer,
          element: <Login />
        },
        {
          path: path.registerCustomer,
          element: <Register />
        }
      ]
    },
    {
      path: path.sellerPage,
      element: <IntroPage />
    },
    {
      path: path.loginSeller,
      element: <LoginSeller />
    },
    {
      path: "/",
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
    }
  ])
  return routeElements
}
