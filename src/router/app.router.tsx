import { createBrowserRouter } from 'react-router'

import { UsuarioLayout } from '../layouts/UsuarioLayout'
import { AdminRoute } from '../layouts/AdminRoute'

import { Tienda } from '../pages/usuario/Tienda'
import { CatalogoPage } from '../pages/usuario/CatalogoPage'
import { Perfil } from '../pages/usuario/Perfil'
import { Carrito } from '../pages/usuario/Carrito'
import { Checkout } from '../pages/usuario/Checkout'
import { Compras } from '../pages/usuario/Compras'
import { AjustesCuenta } from '../pages/usuario/AjustesCuenta'
import { DetalleProducto } from '../pages/usuario/DetalleProducto'

import { ErrorPagina, PaginaNoEncontrada } from '../pages/usuario/ErrorPagina'

import { Login } from '../pages/auth/Login'
import { Registro } from '../pages/auth/Registro'

// Las rutas siguen la misma estructura del ejemplo_rutas del profesor.
export const rootRouter = createBrowserRouter([
    {
        path: '/',
        element: <UsuarioLayout></UsuarioLayout>,
        errorElement: <ErrorPagina />,
        children: [
            {
                index: true,
                element: <Tienda></Tienda>
            },
            {
                path: 'catalogo',
                element: <CatalogoPage></CatalogoPage>
            },
            {
                path: 'perfil',
                element: <Perfil></Perfil>
            },
            {
                path: 'ajustes',
                element: <AjustesCuenta />
            },
            {
                path: 'carrito',
                element: <Carrito></Carrito>
            },
            {
                path: 'checkout',
                element: <Checkout />
            },
            {
                path: 'compras',
                element: <Compras></Compras>
            },
            {
                path: 'producto/:id',
                element: <DetalleProducto></DetalleProducto>
            },
            {
                path: '*',
                element: <PaginaNoEncontrada />
            }
        ]
    },
    {
        path: '/admin',
        element: <AdminRoute></AdminRoute>,
        errorElement: <ErrorPagina />,
        children: [
            {
                index: true,
                lazy: async () => ({ Component: (await import('../pages/admin/Dashboard')).Dashboard })
            },
            {
                path: 'productos',
                lazy: async () => ({ Component: (await import('../pages/admin/Productos')).Productos })
            },
            {
                path: 'categorias',
                lazy: async () => ({ Component: (await import('../pages/admin/Categorias')).Categorias })
            },
            {
                path: 'pedidos',
                lazy: async () => ({ Component: (await import('../pages/admin/Pedidos')).Pedidos })
            },
            {
                path: 'usuarios',
                lazy: async () => ({ Component: (await import('../pages/admin/Usuarios')).Usuarios })
            },
            {
                path: 'reportes',
                lazy: async () => ({ Component: (await import('../pages/admin/Reportes')).Reportes })
            },
            {
                path: '*',
                element: <PaginaNoEncontrada />
            }
        ]
    },
    {
        path: '/login',
        element: <Login></Login>,
        errorElement: <ErrorPagina />
    },
    {
        path: '/registro',
        element: <Registro></Registro>,
        errorElement: <ErrorPagina />
    }
])
