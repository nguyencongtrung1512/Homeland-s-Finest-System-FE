import useRouteElements from './useRouteElement'
import { CartProvider } from './contexts/cart.context'
import { AuthProvider } from './contexts/auth.context'
import { SessionProvider } from './contexts/session.context'
import { StoreProvider } from './contexts/store.context'
import { ChatProvider } from './contexts/chat.context'
import { ToastProvider } from './contexts/toast.context'
import './service/axiosInstance'

function App() {
  const routeElement = useRouteElements()

  return (
    <AuthProvider>
      <StoreProvider>
        <SessionProvider>
          <CartProvider>
            <ChatProvider>
              <ToastProvider defaultPosition='top-right'>
                {routeElement}
              </ToastProvider>
            </ChatProvider>
          </CartProvider>
        </SessionProvider>
      </StoreProvider>
    </AuthProvider>
  )
}

export default App
