import useRouteElements from './useRouteElement'
import { ToastContainer } from 'react-toastify'
import { CartProvider } from './contexts/cart.context'

function App() {
  const routeElement = useRouteElements()

  return (
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
  )
}

export default App
