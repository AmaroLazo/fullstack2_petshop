import { type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PawPrint, Search, ShoppingBag, RefreshCw } from 'lucide-react'
import { useCatalogo } from '../../hooks/useCatalogo'
import { useBusquedaCatalogo } from '../../hooks/useBusquedaCatalogo'
import { Card, CardContent } from '../../components/ui/card'

const formatoPrecio = (precio: number | string | null | undefined) => {
    const valor = Number(precio ?? 0)
    return valor.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    })
}


export const CatalogoPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const { productos, categorias, cargando, error, errorCategorias, recargar } = useCatalogo()
    const {
        busqueda, setBusqueda, categoriaSeleccionada, setCategoriaSeleccionada,
        productosFiltrados, limpiarFiltros: limpiarEstado
    } = useBusquedaCatalogo(productos, searchParams.get('q') || '')

    const buscar = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const termino = busqueda.trim()
        setSearchParams(termino ? { q: termino } : {})
    }

    const limpiarFiltros = () => {
        limpiarEstado()
        setSearchParams({})
    }

    return (
        <div className="hc-catalog-page">
            <section className="hc-catalog-heading">
                <div>
                    <span className="hc-section-kicker">HUELLITAS CLUB / PRODUCTOS</span>
                    <h1>Nuestro catálogo</h1>
                    <p>Encuentra alimentos, accesorios y todo lo que tu mascota necesita.</p>
                </div>
                <span className="hc-catalog-count">
                    {cargando ? 'Cargando...' : `${productosFiltrados.length} productos`}
                </span>
            </section>

            <section className="hc-catalog-toolbar" aria-label="Filtros del catálogo">
                <form className="flex min-w-[200px] flex-1 items-center gap-2 max-[650px]:basis-full" onSubmit={buscar} role="search">
                    <label className="hc-catalog-search flex-1">
                        <Search size={18} />
                        <span className="sr-only">Buscar productos</span>
                        <input
                            type="search"
                            placeholder="Buscar por nombre, descripción o categoría..."
                            value={busqueda}
                            onChange={(event) => setBusqueda(event.target.value)}
                            aria-label="Buscar productos del catálogo"
                        />
                    </label>
                    <button type="submit" className="h-[43px] rounded-lg bg-[#6C2A8A] px-4 text-[13px] font-extrabold text-white hover:bg-[#502069]">Buscar</button>
                </form>

                <label className="hc-catalog-category">
                    <span>Categoría</span>
                    <select
                        value={categoriaSeleccionada}
                        onChange={(event) => setCategoriaSeleccionada(event.target.value)}
                    >
                        <option value="todas">Todas las categorías</option>
                        {categorias.map(({ id, name }) => (
                            <option value={name} key={id}>{name}</option>
                        ))}
                    </select>
                    {errorCategorias && <small role="alert">No se pudieron cargar las categorías: {errorCategorias.message}</small>}
                </label>

                <button type="button" className="hc-catalog-clear" onClick={limpiarFiltros}>
                    Limpiar filtros
                </button>
            </section>

            {cargando && (
                <div className="hc-catalog-state" role="status">
                    <span className="hc-catalog-loader" />
                    <strong>Cargando productos...</strong>
                    <p>Estamos consultando el catálogo de Huellitas.</p>
                </div>
            )}

            {!cargando && error && (
                <div className="hc-catalog-state hc-catalog-error" role="alert">
                    <PawPrint size={34} />
                    <h2>No pudimos cargar el catálogo</h2>
                    <p>{error.message}</p>
                    <p className="hc-catalog-help">
                        Comprueba que el API Gateway esté ejecutándose en el puerto 8080 y que el microservicio de catálogo esté activo.
                    </p>
                    <button type="button" className="hc-catalog-retry" onClick={() => void recargar()}>
                        <RefreshCw size={16} /> Reintentar
                    </button>
                </div>
            )}

            {!cargando && !error && productosFiltrados.length === 0 && (
                <div className="hc-catalog-state">
                    <PawPrint size={36} />
                    <h2>No encontramos productos</h2>
                    <p>
                        {productos.length === 0
                            ? 'El catálogo no tiene productos disponibles por ahora.'
                            : 'Prueba con otro nombre o selecciona una categoría diferente.'}
                    </p>
                    <button type="button" className="hc-catalog-retry" onClick={limpiarFiltros}>
                        Ver todos los productos
                    </button>
                </div>
            )}

            {!cargando && !error && productosFiltrados.length > 0 && (
                <section className="hc-catalog-grid" aria-label="Productos disponibles">
                    {productosFiltrados.map((producto) => {
                        const {
                            id, name, description, imageUrl, categoryName, price,
                            finalPrice, onSale, discountPercent, stockQuantity
                        } = producto
                        const precioActual = Number(finalPrice ?? price)
                        const tieneImagen = Boolean(imageUrl && /^https?:\/\//i.test(imageUrl))
                        const tieneDescuento = Boolean(onSale || Number(discountPercent || 0) > 0)

                        return (
                            <Card className="hc-catalog-card gap-0 overflow-hidden py-0" key={id}>
                                <Link to={`/producto/${id}`} className="hc-catalog-product-image">
                                    {tieneDescuento && <span className="hc-catalog-sale">Oferta</span>}
                                    {tieneImagen ? (
                                        <img src={imageUrl || ''} alt={name} loading="lazy" />
                                    ) : (
                                        <span className="hc-catalog-image-placeholder"><PawPrint size={42} /></span>
                                    )}
                                </Link>

                                <CardContent className="hc-catalog-product-info flex flex-1 flex-col">
                                    <span className="hc-catalog-product-category">
                                        {categoryName || 'Producto para mascotas'}
                                    </span>
                                    <h2><Link to={`/producto/${id}`}>{name}</Link></h2>
                                    <p>{description || 'Un producto seleccionado para el cuidado de tu mascota.'}</p>
                                    <div className="hc-catalog-product-price">
                                        <strong>{formatoPrecio(precioActual)}</strong>
                                        {tieneDescuento && Number(price) > precioActual && (
                                            <del>{formatoPrecio(price)}</del>
                                        )}
                                    </div>
                                    <div className="hc-catalog-product-footer">
                                        <span className="hc-stock-label">Disponible · {stockQuantity ?? 0} unidades</span>
                                        <Link
                                            to={`/producto/${id}`}
                                            className="hc-catalog-product-action"
                                            aria-label={`Ver ${name}`}
                                        >
                                            <ShoppingBag size={17} />
                                            Ver producto
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </section>
            )}
        </div>
    )
}
