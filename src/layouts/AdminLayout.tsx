import { Link, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import {
    PawPrint,
    LayoutDashboard,
    Package,
    Tags,
    ShoppingBag,
    Users,
    ChartNoAxesCombined,
    Store,
    LogOut,
    Bell,
} from 'lucide-react'

const enlacesAdmin = [
    { texto: 'Resumen', ruta: '/admin', Icono: LayoutDashboard },
    { texto: 'Productos', ruta: '/admin/productos', Icono: Package },
    { texto: 'Categorías', ruta: '/admin/categorias', Icono: Tags },
    { texto: 'Pedidos', ruta: '/admin/pedidos', Icono: ShoppingBag },
    { texto: 'Clientes', ruta: '/admin/usuarios', Icono: Users },
    { texto: 'Reportes', ruta: '/admin/reportes', Icono: ChartNoAxesCombined },
]

export const AdminLayout = () => {
    const { usuario, salir } = useAuth()
    const navigate = useNavigate()

    const cerrarSesion = () => {
        salir()
        navigate('/login', { replace: true })
    }

    return (
        <div className="hc-admin-shell">
            <header className="hc-admin-topbar">
                <Link to="/admin" className="hc-admin-brand">
                    <img src="https://raw.githubusercontent.com/AmaroLazo/fullstack2_petshop/master/img/icono.png" alt="" />
                    <span>Huellitas <strong>Club</strong></span>
                    <small>ADMIN</small>
                </Link>
                <div className="hc-admin-top-actions">
                    <button type="button" className="hc-admin-bell" aria-label="Notificaciones"><Bell size={19} /></button>
                    <div className="hc-admin-user"><span className="hc-admin-avatar">{usuario?.name?.charAt(0).toUpperCase() || 'A'}</span><span>{usuario?.name || 'Administrador'}</span></div>
                    <Link to="/" className="hc-admin-exit"><Store size={17} /> Ir a la tienda</Link>
                    <button type="button" className="hc-admin-exit hc-admin-logout" onClick={cerrarSesion}><LogOut size={17} /> Cerrar sesión</button>
                </div>
            </header>

            <div className="hc-admin-body">
                <aside className="hc-admin-sidebar">
                    <p className="hc-sidebar-caption">MENÚ PRINCIPAL</p>
                    <nav aria-label="Navegación administrativa">
                        {enlacesAdmin.map(({ texto, ruta, Icono }) => (
                            <Link key={ruta} to={ruta} className="hc-admin-nav-link">
                                <Icono size={18} />
                                <span>{texto}</span>
                                
                            </Link>
                        ))}
                    </nav>
                    <div className="hc-sidebar-help">
                        <PawPrint size={23} />
                        <strong>Huellitas Club</strong>
                        <span>Panel de administración</span>
                    </div>
                    <Link to="/" className="hc-sidebar-store"><LogOut size={17} /> Volver a la tienda</Link>
                </aside>

                <main className="hc-admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
