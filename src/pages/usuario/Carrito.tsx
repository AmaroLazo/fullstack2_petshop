import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Minus, Plus, Trash2, PawPrint, ShoppingBag, ArrowRight, AlertTriangle, LoaderCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../hooks/useCarrito'
import { useCarritoProductos } from '../../hooks/useCarritoProductos'
import { useValidacionCarrito } from '../../hooks/useValidacionCarrito'

const clp = (valor: number) => valor.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export const Carrito = () => {
  const { usuario, validarUsuario } = useAuth()
  const { items, cambiarCantidad, quitar, vaciar } = useCarrito()
  const imagenes = useCarritoProductos()
  const { validando, noDisponibles, errorValidacion, validarAntesDeContinuar, quitarAdvertencia, limpiarAdvertencias } = useValidacionCarrito()
  const navigate = useNavigate()
  const [procesando, setProcesando] = useState<number | null>(null)
  const [continuando, setContinuando] = useState(false)
  const [error, setError] = useState('')
  const [confirmarVaciado, setConfirmarVaciado] = useState(false)

  if (!usuario) return (
    <section className="mx-auto max-w-4xl space-y-5 px-4 py-10">
      <h1 className="text-3xl font-extrabold text-[#3D2645]">Mi carrito</h1>
      <p>Para usar el carrito debes iniciar sesión con un usuario registrado.</p>
      <Link to="/login?redirect=%2Fcarrito" className="inline-block rounded-xl bg-[#6C2A8A] px-6 py-3 font-bold text-white">Iniciar sesión</Link>
      <p><Link to="/registro?redirect=%2Fcarrito" className="text-[#6C2A8A] underline">Crear cuenta</Link></p>
    </section>
  )

  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
  const subtotal = Math.round(total / 1.19)
  const iva = total - subtotal

  const cambiar = async (id: number, cantidad: number) => {
    setProcesando(id)
    setError('')
    try { await cambiarCantidad(id, cantidad) }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar la cantidad.') }
    finally { setProcesando(null) }
  }
  const continuar = async () => {
    setContinuando(true)
    setError('')
    try {
      await validarUsuario()
      if (items.length === 0) throw new Error('Tu carrito está vacío.')
      const disponibles = await validarAntesDeContinuar()
      if (!disponibles) return
      navigate('/checkout')
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo validar tu cuenta.') }
    finally { setContinuando(false) }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-9 sm:px-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#3D2645]">Mi carrito de compras</h1>
        <p className="mt-1 text-sm text-gray-500">Hola, {usuario.name}. Revisa las cantidades antes de continuar.</p>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {errorValidacion && <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{errorValidacion}</div>}
      {noDisponibles.length > 0 && (
        <div role="alert" className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-red-800">
          <div className="flex items-center gap-2 font-extrabold"><AlertTriangle size={22}/> No puedes continuar al pago</div>
          <p className="mt-2 text-sm">Los siguientes productos ya no están disponibles o superan el stock. Elimina los desactivados o eliminados del carrito para continuar.</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            {noDisponibles.map((p) => <li key={p.productoId}><strong>{p.nombre}:</strong> {p.motivo}</li>)}
          </ul>
        </div>
      )}
      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-10 text-center">
          <ShoppingBag className="mx-auto mb-3 text-[#6C2A8A]" size={44}/>
          <p className="mb-5 font-semibold">Todavía no hay productos en tu carrito.</p>
          <Link to="/catalogo" className="rounded-xl bg-[#6C2A8A] px-5 py-3 font-bold text-white">Ir al catálogo</Link>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            {items.map(({ productoId, nombre, precio, cantidad, imageUrl }) => {
              const advertencia = noDisponibles.find((p) => p.productoId === productoId)
              const imagen = imagenes[productoId] ?? imageUrl
              const imagenValida = typeof imagen === 'string' && /^https?:\/\//i.test(imagen)
              return (
                <article key={productoId} className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-nowrap ${advertencia ? 'border-2 border-red-400 bg-red-50/30' : 'border-purple-100'}`}>
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-50 sm:h-28 sm:w-28">
                    {imagenValida ? <img src={imagen} alt={nombre} className="h-full w-full object-contain" /> : <PawPrint aria-label="Imagen no disponible" size={38} className="text-[#6C2A8A]"/>}
                  </div>
                  <div className="min-w-[160px] flex-1 space-y-2">
                    <Link to={`/producto/${productoId}`} className="font-extrabold text-[#3D2645] hover:underline">{nombre}</Link>
                    <p className="text-sm text-gray-500">Precio unitario: {clp(precio)}</p>
                    {advertencia && <p role="alert" className="flex items-center gap-2 text-sm font-bold text-red-700"><AlertTriangle size={17}/> {advertencia.motivo}</p>}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="inline-flex items-center overflow-hidden rounded-xl border-2 border-[#6C2A8A]" aria-label={`Cantidad de ${nombre}`}>
                        <button type="button" disabled={procesando !== null || cantidad <= 1} onClick={() => void cambiar(productoId, cantidad - 1)} aria-label={`Restar una unidad de ${nombre}`} className="flex h-10 w-11 items-center justify-center bg-[#6C2A8A] text-white hover:bg-[#4B1B65] disabled:cursor-not-allowed disabled:bg-gray-300"><Minus size={20} strokeWidth={3}/></button>
                        <output aria-live="polite" className="min-w-11 px-2 text-center text-lg font-extrabold text-[#3D2645]">{cantidad}</output>
                        <button type="button" disabled={procesando !== null} onClick={() => void cambiar(productoId, cantidad + 1)} aria-label={`Sumar una unidad de ${nombre}`} className="flex h-10 w-11 items-center justify-center bg-[#6C2A8A] text-white hover:bg-[#4B1B65] disabled:cursor-not-allowed disabled:bg-gray-300"><Plus size={20} strokeWidth={3}/></button>
                      </div>
                      <button type="button" onClick={() => { quitar(productoId); quitarAdvertencia(productoId) }} className="inline-flex items-center gap-1 text-sm font-semibold text-red-700 hover:underline"><Trash2 size={16}/> Eliminar</button>
                    </div>
                  </div>
                  <strong className="ml-auto text-lg text-[#3D2645]">{clp(precio * cantidad)}</strong>
                </article>
              )
            })}
            <button type="button" onClick={() => setConfirmarVaciado(true)} className="text-sm font-semibold text-red-700 underline">Vaciar carrito</button>
            {confirmarVaciado && <div role="group" aria-label="Confirmar vaciado" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="font-bold">¿Seguro que quieres eliminar todos los productos?</p>
              <button type="button" className="mr-3 rounded-lg border bg-white px-4 py-2" onClick={() => setConfirmarVaciado(false)}>Cancelar</button>
              <button type="button" className="rounded-lg bg-red-700 px-4 py-2 text-white" onClick={() => { vaciar(); limpiarAdvertencias(); setConfirmarVaciado(false) }}>Sí, vaciar carrito</button>
            </div>}
          </div>
          <aside className="sticky top-6 rounded-2xl border border-purple-100 bg-white p-6 shadow-md">
            <h2 className="mb-5 text-xl font-extrabold text-[#3D2645]">Resumen de compra</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt>Subtotal neto</dt><dd className="font-semibold">{clp(subtotal)}</dd></div>
              <div className="flex justify-between gap-4"><dt>IVA (19 %)</dt><dd className="font-semibold">{clp(iva)}</dd></div>
              <div className="flex justify-between gap-4 border-t pt-4 text-xl font-extrabold text-[#3D2645]"><dt>Total</dt><dd>{clp(total)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-gray-500">El IVA ya está incluido en el precio publicado.</p>
            <button type="button" disabled={continuando || validando || procesando !== null} onClick={() => void continuar()} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C2A8A] px-4 py-3 font-extrabold text-white hover:bg-[#4B1B65] disabled:opacity-50">{continuando || validando ? <><LoaderCircle className="animate-spin" size={18}/> Comprobando productos...</> : <>Continuar al pago <ArrowRight size={18}/></>}</button>

          </aside>
        </div>
      )}
    </section>
  )
}
