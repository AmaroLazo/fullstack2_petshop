import { RouterProvider } from 'react-router'
import { AuthProvider } from './hooks/useAuth'
import { CarritoProvider } from './hooks/useCarrito'
import { rootRouter } from './router/app.router'

const MiApp = () => (
  <AuthProvider>
    <CarritoProvider>
      <RouterProvider router={rootRouter} />
    </CarritoProvider>
  </AuthProvider>
)
export default MiApp
