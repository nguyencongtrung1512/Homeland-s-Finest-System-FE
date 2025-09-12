import { useRoutes } from 'react-router-dom'
import MainLayout from './Layouts/CustomerLayout/MainLayout'
import HomePage from './pages/customer/Home/HomePage'
import Products from './pages/customer/Products/products'
import path from './constants/path'
import ProductsDetail from './pages/customer/Products/ProductDetail/productsDetail'
import Login from './pages/authentication/Login'
import Register from './pages/authentication/Register'
import VerifyEmail from './pages/authentication/ForgotPassword/VerifyEmail'
import NewPassword from './pages/authentication/ForgotPassword/NewPassword'

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
    }
  ])

  return routeElements
}
