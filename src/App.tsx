import useRouteElements from './useRouteElement'
import { ToastContainer } from 'react-toastify'
import { CartProvider } from './contexts/cart.context'
import { AuthProvider } from './contexts/auth.context'

function App() {
  const routeElement = useRouteElements()

  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}

export default App
