import useRouteElements from './useRouteElement'
import { ToastContainer } from 'react-toastify'
import { CartProvider } from './contexts/cart.context'

function App() {
  const routeElement = useRouteElements()

  return (
    <CartProvider>
      {routeElement}
      <ToastContainer />
    </CartProvider>
  )
}

export default App
