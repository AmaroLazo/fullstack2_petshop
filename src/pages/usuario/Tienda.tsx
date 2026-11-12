import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, PawPrint, Truck, Heart, ShieldCheck, Search, ArrowRight, ShoppingBag, RefreshCw } from 'lucide-react'
import { useProductos } from '../../hooks/useProductos'

const imagenesCarrusel = [
    'https://github.com/AmaroLazo/fullstack2_petshop/blob/amaro/img/gato1.png?raw=true',
    'https://github.com/AmaroLazo/fullstack2_petshop/blob/amaro/img/gato2.png?raw=true',
    'https://github.com/AmaroLazo/fullstack2_petshop/blob/amaro/img/gato3.png?raw=true',
    'https://github.com/AmaroLazo/fullstack2_petshop/blob/amaro/img/gato4.png?raw=true',
]

const formatoPrecio = (precio: number | string | null | undefined) => {
    return Number(precio ?? 0).toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    })
}

export const Tienda = () => {
    const [searchParams] = useSearchParams()
    const [slideActual, setSlideActual] = useState(0)
    const { productos, cargando, error, recargar } = useProductos()
    const termino = (searchParams.get('q') || '').trim()

    // La búsqueda utiliza nombre, descripción y categoría que entrega el backend.
    const productosVisibles = useMemo(() => {
        const textoBusqueda = termino.toLocaleLowerCase('es-CL')

        return productos.filter(({ name, description, categoryName }) => {
            const textoProducto = [name, description, categoryName]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('es-CL')

            return !textoBusqueda || textoProducto.includes(textoBusqueda)
        })
    }, [productos, termino])

    // La portada muestra hasta ocho productos; el catálogo permite verlos todos.
    const productosPortada = termino
        ? productosVisibles
        : productosVisibles.slice(0, 8)

    const avanzarSlide = () => setSlideActual((actual) => (actual + 1) % imagenesCarrusel.length)
    const retrocederSlide = () => setSlideActual((actual) => (actual - 1 + imagenesCarrusel.length) % imagenesCarrusel.length)

    return (
        <div className="hc-home-content">
            <section className="hc-promo-banner">
                <div>
                    <span className="hc-eyebrow"><PawPrint size={15} /> HUELLITAS CLUB</span>
                    <h1>¡Todo para consentir a tu mascota!</h1>
                    <p>Envíos gratis en compras sobre $25.000 y <strong>15% de descuento</strong> en alimentos seleccionados.</p>
                </div>
                <div className="hc-promo-badge">Amor en cada<br />huellita <Heart size={20} fill="currentColor" /></div>
            </section>

            <section className="hc-carousel" aria-label="Promociones destacadas">
                <img src={imagenesCarrusel[slideActual]} alt={`Promoción destacada ${slideActual + 1} de Huellitas Club`} />
                <button type="button" className="hc-carousel-control hc-carousel-prev" onClick={retrocederSlide} aria-label="Promoción anterior">
                    <ChevronLeft size={25} />
                </button>
                <button type="button" className="hc-carousel-control hc-carousel-next" onClick={avanzarSlide} aria-label="Promoción siguiente">
                    <ChevronRight size={25} />
                </button>
                <div className="hc-carousel-indicators">
                    {imagenesCarrusel.map((imagen, index) => (
                        <button
                            key={imagen}
                            type="button"
                            className={slideActual === index ? 'active' : ''}
                            onClick={() => setSlideActual(index)}
                            aria-label={`Ver promoción ${index + 1}`}
                        />
                    ))}
                </div>
            </section>

            <section className="hc-benefits" aria-label="Beneficios de la tienda">
                <div><Truck size={24} /><span><strong>Envíos gratis</strong><small>En compras sobre $25.000</small></span></div>
                <div><Heart size={24} /><span><strong>Amor por las mascotas</strong><small>Productos seleccionados</small></span></div>
                <div><ShieldCheck size={24} /><span><strong>Compra con confianza</strong><small>Atención cercana y segura</small></span></div>
            </section>

            <section className="hc-products-section" id="productos">
                <div className="hc-section-heading">
                    <div>
                        <span className="hc-section-kicker">PARA LOS CONSENTIDOS DE CASA</span>
                        <h2>{termino ? 'Resultados de búsqueda' : 'Productos disponibles'}</h2>
                        <p>Estos productos se cargan desde el catálogo de Huellitas.</p>
                    </div>
                    <Link to="/catalogo" className="hc-see-all">Ver todos <ArrowRight size={17} /></Link>
                </div>

                {termino && (
                    <div className="hc-filter-summary">
                        <Search size={16} />
                        <span>{productosVisibles.length} producto(s) encontrado(s) para “{termino}”</span>
                        <Link to="/">Limpiar búsqueda</Link>
                    </div>
                )}

                {cargando && (
                    <div className="hc-catalog-state" role="status">
                        <span className="hc-catalog-loader" />
                        <strong>Cargando productos...</strong>
                        <p>Estamos consultando el catálogo de Huellitas.</p>
                    </div>
                )}

                {!cargando && error && (
                    <div className="hc-catalog-state" role="alert">
                        <PawPrint size={34} />
                        <h2>No pudimos cargar los productos</h2>
                        <p>{error.message}</p>
                        <p className="hc-catalog-help">Comprueba que el API Gateway y el microservicio de catálogo estén ejecutándose.</p>
                        <button type="button" className="hc-catalog-retry" onClick={() => void recargar()}>
                            <RefreshCw size={16} /> Reintentar
                        </button>
                    </div>
                )}

                {!cargando && !error && productosPortada.length > 0 && (
                    <div className="hc-product-grid">
                        {productosPortada.map((producto) => {
                            const {
                                id,
                                name,
                                description,
                                imageUrl,
                                categoryName,
                                price,
                                finalPrice,
                                onSale,
                                discountPercent
                            } = producto
                            const precioActual = Number(finalPrice ?? price)
                            const tieneDescuento = Boolean(onSale || Number(discountPercent ?? 0) > 0)
                            const tieneImagen = Boolean(imageUrl && /^https?:\/\//i.test(imageUrl))

                            return (
                                <article className="hc-product-card" key={id}>
                                    <Link to={`/producto/${id}`} className="hc-product-image-link" aria-label={`Ver ${name}`}>
                                        {categoryName && <span className="hc-product-tag">{categoryName}</span>}
                                        {tieneImagen
                                            ? <img src={imageUrl || ''} alt={name} loading="lazy" />
                                            : <PawPrint className="hc-product-image-placeholder" size={46} aria-hidden="true" />}
                                    </Link>
                                    <div className="hc-product-info">
                                        <span className="hc-product-animal">{categoryName || 'Producto para mascotas'}</span>
                                        <h3><Link to={`/producto/${id}`}>{name}</Link></h3>
                                        <p>{description || 'Producto seleccionado para el cuidado de tu mascota.'}</p>
                                        <div className="hc-product-bottom">
                                            <div className="hc-home-price">
                                                <strong>{formatoPrecio(precioActual)}</strong>
                                                {tieneDescuento && Number(price) > precioActual && <del>{formatoPrecio(price)}</del>}
                                            </div>
                                            <Link to={`/producto/${id}`} className="hc-product-action" aria-label={`Ver ${name}`}>
                                                <ShoppingBag size={17} />
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}

                {!cargando && !error && productosPortada.length === 0 && (
                    <div className="hc-empty-products">
                        <PawPrint size={34} />
                        <h3>{productos.length === 0 ? 'Todavía no hay productos disponibles' : 'No encontramos productos'}</h3>
                        <p>{productos.length === 0
                            ? 'Agrega productos desde el microservicio de catálogo y aparecerán aquí.'
                            : 'Prueba con otro término o revisa todo nuestro catálogo.'}</p>
                        <Link to="/catalogo" className="hc-catalog-retry">Ver catálogo completo</Link>
                    </div>
                )}
            </section>
        </div>
    )
}
