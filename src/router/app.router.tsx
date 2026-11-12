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

import { Dashboard } from '../pages/admin/Dashboard'
import { Productos } from '../pages/admin/Productos'
import { Categorias } from '../pages/admin/Categorias'
import { Pedidos } from '../pages/admin/Pedidos'
import { Usuarios } from '../pages/admin/Usuarios'
import { Reportes } from '../pages/admin/Reportes'

import { Login } from '../pages/auth/Login'
import { Registro } from '../pages/auth/Registro'

// Las rutas siguen la misma estructura del ejemplo_rutas del profesor.
export const rootRouter = createBrowserRouter([
    {
        path: '/',
        element: <UsuarioLayout></UsuarioLayout>,
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
            }
        ]
    },
    {
        path: '/admin',
        element: <AdminRoute></AdminRoute>,
        children: [
            {
                index: true,
                element: <Dashboard></Dashboard>
            },
            {
                path: 'productos',
                element: <Productos></Productos>
            },
            {
                path: 'categorias',
                element: <Categorias></Categorias>
            },
            {
                path: 'pedidos',
                element: <Pedidos></Pedidos>
            },
            {
                path: 'usuarios',
                element: <Usuarios></Usuarios>
            },
            {
                path: 'reportes',
                element: <Reportes></Reportes>
            }
        ]
    },
    {
        path: '/login',
        element: <Login></Login>
    },
    {
        path: '/registro',
        element: <Registro></Registro>
    }
])
