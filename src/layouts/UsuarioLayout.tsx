import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
    Search,
    UserRound,
    ShoppingCart,
    PawPrint,
    Menu,
    X,
    House,
    Mail,
    MapPin,
    Phone,
    ChevronDown, Settings, ClipboardList, LayoutDashboard,
} from 'lucide-react'

export const UsuarioLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const perfilMenuRef = useRef<HTMLDivElement>(null)
    const [perfilAbierto, setPerfilAbierto] = useState(false)
    useEffect(() => { setPerfilAbierto(false) }, [location.pathname])
    useEffect(() => {
        const cerrar = (evento: MouseEvent) => { if (!perfilMenuRef.current?.contains(evento.target as Node)) setPerfilAbierto(false) }
        const tecla = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setPerfilAbierto(false) }
        document.addEventListener('mousedown', cerrar)
        document.addEventListener('keydown', tecla)
        return () => { document.removeEventListener('mousedown', cerrar); document.removeEventListener('keydown', tecla) }
    }, [])
    const { usuario, salir } = useAuth()
    const [busqueda, setBusqueda] = useState(new URLSearchParams(location.search).get('q') || '')
    useEffect(() => {
        setBusqueda(new URLSearchParams(location.search).get('q') || '')
    }, [location.pathname, location.search])
    const [menuAbierto, setMenuAbierto] = useState(false)

    const buscarProductos = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const termino = busqueda.trim()
        navigate(termino ? `/catalogo?q=${encodeURIComponent(termino)}` : '/catalogo')
        setMenuAbierto(false)
    }

    return (
        <div className="hc-app-shell">
            <header className="hc-store-header">
                <div className="hc-header-main">
                    <div className="hc-header-inner">
                        <Link to="/" className="hc-brand" aria-label="Huellitas Club, inicio">
                            <img
                                src="https://raw.githubusercontent.com/AmaroLazo/fullstack2_petshop/master/img/icono.png"
                                alt=""
                                className="hc-brand-logo"
                            />
                            <span>Huellitas <strong>Club</strong></span>
                        </Link>

                        <form className="hc-search" onSubmit={buscarProductos} role="search">
                            <label className="sr-only" htmlFor="busqueda-petshop">Buscar productos</label>
                            <input
                                id="busqueda-petshop"
                                type="search"
                                placeholder="¿Qué necesita tu mascota?"
                                value={busqueda}
                                onChange={(event) => setBusqueda(event.target.value)}
                            />
                            <button type="submit" aria-label="Buscar productos">
                                <Search size={19} />
                            </button>
                        </form>

                        <div className="hc-header-actions">
                            {usuario ? (
                                <div className="flex items-center gap-2">
                                    <div className="hc-profile-dropdown" ref={perfilMenuRef}>
                                        <button type="button" className="hc-account-link" aria-haspopup="menu" aria-expanded={perfilAbierto} onClick={() => setPerfilAbierto((v) => !v)}><UserRound size={20}/><span>{usuario.name}</span><ChevronDown size={15}/></button>
                                        {perfilAbierto && <nav className="hc-profile-dropdown-menu" aria-label="Opciones de perfil">
                                            {usuario.role === 'ADMIN' && <Link to="/admin" onClick={() => setPerfilAbierto(false)}><LayoutDashboard size={17}/> Volver al dashboard</Link>}
                                            <Link to="/perfil" onClick={() => setPerfilAbierto(false)}><UserRound size={17}/> Mi cuenta</Link>
                                            <Link to="/compras" onClick={() => setPerfilAbierto(false)}><ClipboardList size={17}/> Historial de compras</Link>
                                            <Link to="/ajustes" onClick={() => setPerfilAbierto(false)}><Settings size={17}/> Ajustes de cuenta</Link>
                                        </nav>}
                                    </div>
                                    <button type="button" onClick={() => { salir(); navigate('/') }} className="text-xs font-semibold underline">Salir</button>
                                </div>
                            ) : (
                                <Link to="/login" className="hc-account-link"><UserRound size={20} /><span>Iniciar sesión</span></Link>
                            )}
                            <Link to="/carrito" className="hc-cart-link" aria-label="Ver carrito">
                                <ShoppingCart size={20} />
                                <span>Carrito</span>
                            </Link>
                            <button
                                type="button"
                                className="hc-mobile-menu-button"
                                onClick={() => setMenuAbierto(!menuAbierto)}
                                aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
                            >
                                {menuAbierto ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`hc-category-bar ${menuAbierto ? 'hc-category-bar-open' : ''}`}>
                    <nav className="hc-category-inner" aria-label="Navegación de la tienda">
                        <Link to="/" className="hc-category-home" onClick={() => setMenuAbierto(false)}>
                            <House size={17} /> Inicio
                        </Link>
                        <Link to="/catalogo" onClick={() => setMenuAbierto(false)}>Catálogo</Link>
                        {usuario?.role === 'ADMIN' && <Link to="/admin" className="hc-admin-return-link" onClick={() => setMenuAbierto(false)}><LayoutDashboard size={17}/> Volver al dashboard</Link>}
                        <Link to="/compras" onClick={() => setMenuAbierto(false)}>Mis compras</Link>
                    </nav>
                </div>
            </header>

            <main className="hc-store-main">
                <Outlet />
            </main>

            <footer className="hc-store-footer">
                <div className="hc-footer-grid">
                    <div className="hc-footer-brand-block">
                        <div className="hc-footer-brand">
                            <PawPrint size={28} />
                            <span>Huellitas Club</span>
                        </div>
                        <p>Petshop oficial. Todo lo que tus mascotas necesitan, con el cariño que se merecen.</p>
                        <a className="hc-whatsapp-link" href="https://wa.me/56967144636" target="_blank" rel="noreferrer">
                            Contactar por WhatsApp
                        </a>
                    </div>

                    <div>
                        <h3>Enlaces</h3>
                        <Link to="/">Inicio</Link>
                        <Link to="/catalogo">Catálogo</Link>
                        <Link to="/perfil">Mi cuenta</Link>
                        <Link to="/compras">Mis compras</Link>
                        <Link to="/carrito">Carrito</Link>
                    </div>

                    <div>
                        <h3>Contacto</h3>
                        <p><MapPin size={15} /> Concepción, Chile</p>
                        <p><Phone size={15} /> +56 9 6714 4636</p>
                        <p><Mail size={15} /> huellitasclub@huellitas.cl</p>
                    </div>

                    <div>
                        <h3>Síguenos</h3>
                        <div className="hc-social-links">
                            <a href="#facebook" aria-label="Facebook" className="hc-facebook-mark">f</a>
                            <a href="#instagram" aria-label="Instagram" className="hc-facebook-mark">I</a>
                            <a href="mailto:huellitasclub@huellitas.cl" aria-label="Correo"><Mail size={20} /></a>
                        </div>
                        <p className="hc-footer-note">Gracias por confiar en nosotros y cuidar de quienes llenan tu vida de alegría.</p>
                    </div>
                </div>
                <div className="hc-footer-bottom">© 2026 Huellitas Club. Todos los derechos reservados.</div>
            </footer>
        </div>
    )
}
