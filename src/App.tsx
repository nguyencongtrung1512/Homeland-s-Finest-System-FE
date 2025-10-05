import useRouteElements from './useRouteElement'
import { ToastContainer } from 'react-toastify'
import { CartProvider } from './contexts/cart.context'
import { AuthProvider } from './contexts/auth.context'
import { SessionProvider } from './contexts/session.context'
import './service/axiosInstance'
function App() {
  const routeElement = useRouteElements()

  return (
    <AuthProvider>
      <SessionProvider>
        <CartProvider>
          {routeElement}
          <ToastContainer
            position='top-right'
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme='light'
          />
        </CartProvider>
      </SessionProvider>
    </AuthProvider>
  )
}

export default App
