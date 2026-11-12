import { Link, useLocation, useNavigate } from 'react-router'
import { ArrowLeft, LoaderCircle, Minus, PawPrint, Plus, RefreshCw, ShoppingCart } from 'lucide-react'
import { useDetalleProducto } from '../../hooks/useDetalleProducto'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../hooks/useCarrito'
import { useRef, useState } from 'react'

const formatoPrecio = (precio: number | string | null | undefined) =>
  Number(precio ?? 0).toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  })

export const DetalleProducto = () => {
  const { usuario } = useAuth()
  const { agregar } = useCarrito()
  const navigate = useNavigate()
  const location = useLocation()
  const [agregando, setAgregando] = useState(false)
  // Este bloqueo es inmediato y evita que varios clics inicien la misma operación.
  const bloqueoAgregar = useRef(false)
  const [mensajeCarrito, setMensajeCarrito] = useState('')
  const [errorCarrito, setErrorCarrito] = useState('')
  const {
    producto, cargando, error, cantidad, stock, disponible,
    mostrarInformacion, disminuir, aumentar, reintentar, alternarInformacion
  } = useDetalleProducto()

  const agregarAlCarrito = async () => {
    // useRef evita la carrera entre clics antes de que React actualice el botón.
    if (bloqueoAgregar.current || !producto || !disponible || agregando) return
    setMensajeCarrito('')
    setErrorCarrito('')
    if (!usuario) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
      return
    }
    bloqueoAgregar.current = true
    setAgregando(true)
    try {
      await agregar(producto, cantidad)
      setMensajeCarrito(`${cantidad} unidad(es) agregada(s) a tu carrito.`)
    } catch (e) {
      setErrorCarrito(e instanceof Error ? e.message : 'No se pudo agregar al carrito.')
    } finally {
      bloqueoAgregar.current = false
      setAgregando(false)
    }
  }

  if (cargando) {
    return <div className="hc-catalog-state" role="status">Cargando producto...</div>
  }

  if (error || !producto) {
    return (
      <div className="hc-catalog-page">
        <div className="hc-catalog-state" role="alert">
          <PawPrint size={36} />
          <h1>No pudimos mostrar este producto</h1>
          <p>{error || 'El producto solicitado no existe.'}</p>
          <button type="button" className="hc-catalog-retry" onClick={reintentar}>
            <RefreshCw size={16} /> Reintentar
          </button>
          <Link to="/catalogo" className="hc-detail-back"><ArrowLeft size={17} /> Volver al catálogo</Link>
        </div>
      </div>
    )
  }

  const {
    id: idProducto, name, description, imageUrl, categoryName,
    price, finalPrice, onSale,
  } = producto

  const imagenValida = Boolean(imageUrl && /^https?:\/\//i.test(imageUrl))
  const precioActual = finalPrice ?? price

  return (
    <div className="hc-catalog-page">
      <Link to="/catalogo" className="hc-detail-back"><ArrowLeft size={17} /> Volver al catálogo</Link>

      <section className="hc-detail-product">
        <div className="hc-detail-image">
          {imagenValida ? <img src={imageUrl ?? ''} alt={name} /> : <PawPrint size={76} />}
        </div>

        <div className="hc-detail-info">
          <span className="hc-catalog-product-category">{categoryName || 'Producto para mascotas'}</span>
          <h1>{name}</h1>
          <p>{description || 'Producto seleccionado para el cuidado de tu mascota.'}</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <strong className="hc-detail-price">{formatoPrecio(precioActual)}</strong>
            {onSale && Number(price) > Number(precioActual) && <del>{formatoPrecio(price)}</del>}
          </div>
          <p className={disponible ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
            {disponible ? `Disponible · ${stock} unidades` : 'No disponible actualmente'}
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <span className="text-sm font-bold text-[#3D2645]">Cantidad</span>
            <div className="inline-flex w-fit items-center overflow-hidden rounded-xl border-2 border-[#6C2A8A] bg-white shadow-md">
              <button
                type="button"
                onClick={disminuir}
                disabled={!disponible || cantidad <= 1 || agregando}
                aria-label="Disminuir cantidad"
                className="flex h-14 w-16 items-center justify-center bg-[#6C2A8A] text-white transition-colors hover:bg-[#4B1B65] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                <Minus size={27} strokeWidth={3} />
              </button>
              <output aria-live="polite" className="min-w-16 px-5 text-center text-2xl font-extrabold text-[#3D2645]">
                {disponible ? cantidad : 0}
              </output>
              <button
                type="button"
                onClick={aumentar}
                disabled={!disponible || cantidad >= stock || agregando}
                aria-label="Aumentar cantidad"
                className="flex h-14 w-16 items-center justify-center bg-[#6C2A8A] text-white transition-colors hover:bg-[#4B1B65] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                <Plus size={27} strokeWidth={3} />
              </button>
            </div>
            <p className="text-xs text-gray-500">Puedes seleccionar entre 1 y {stock} unidades disponibles.</p>
          </div>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              onClick={agregarAlCarrito}
              disabled={!disponible || agregando}
              aria-busy={agregando}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#6C2A8A] px-5 py-3 font-bold text-white shadow-md transition-colors hover:bg-[#4B1B65] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {agregando ? (
                <>
                  <LoaderCircle size={19} className="animate-spin" aria-hidden="true" />
                  <span>Añadiendo...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={21} aria-hidden="true" />
                  <span>{usuario ? 'Agregar al carrito' : 'Inicia sesión para agregar al carrito'}</span>
                </>
              )}
            </button>
            {mensajeCarrito && <p role="status" className="text-sm font-semibold text-green-700">{mensajeCarrito} <Link to="/carrito" className="underline">Ver carrito</Link></p>}
            {errorCarrito && <p role="alert" className="text-sm text-red-700">{errorCarrito}</p>}
          </div>

          <button
            type="button"
            className="hc-detail-more mt-4"
            onClick={alternarInformacion}
            aria-expanded={mostrarInformacion}
          >
            {mostrarInformacion ? 'Ocultar información' : 'Ver información del producto'}
          </button>
          {mostrarInformacion && (
            <div className="hc-detail-extra mt-3 rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p><strong>Código:</strong> {idProducto}</p>
              <p><strong>Categoría:</strong> {categoryName || 'No especificada'}</p>
              <p><strong>Stock:</strong> {stock} unidades</p>
              <p><strong>Estado:</strong> {disponible ? 'Disponible' : 'No disponible'}</p>
              <p className="mt-2 text-xs text-gray-500">La cantidad se agrega al carrito únicamente tras validar la cuenta.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
