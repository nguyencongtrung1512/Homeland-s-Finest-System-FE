import useRouteElements from "./useRouteElement"
import { ToastContainer } from 'react-toastify'

function App() {
  const routeElement = useRouteElements()

  return (
    <>
      {routeElement}
      <ToastContainer />
    </>
  )
}

export default App