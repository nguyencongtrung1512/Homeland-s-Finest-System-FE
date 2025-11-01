import useRouteElements from './useRouteElement'
import { ToastContainer } from 'react-toastify'
import { CartProvider } from './contexts/cart.context'
import { AuthProvider } from './contexts/auth.context'
import { SessionProvider } from './contexts/session.context'
import { StoreProvider } from './contexts/store.context'
import { ChatProvider } from './contexts/chat.context'
import './service/axiosInstance'

function App() {
  const routeElement = useRouteElements()

  return (
    <AuthProvider>
      <StoreProvider>
        <SessionProvider>
          <CartProvider>
            <ChatProvider>
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
            </ChatProvider>
          </CartProvider>
        </SessionProvider>
      </StoreProvider>
    </AuthProvider>
  )
}

export default App
