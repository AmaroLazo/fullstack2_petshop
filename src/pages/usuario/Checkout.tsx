import { Link, Navigate } from 'react-router'
import { ArrowLeft, CreditCard, MapPin, Wallet, Plus, LoaderCircle, PackageCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCarrito } from '../../hooks/useCarrito'
import { FACTORES_CUOTAS, useCheckout } from '../../hooks/useCheckout'

const clp = (valor: number) => Math.round(valor).toLocaleString('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0
})

const control = 'w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-[#3D2645] outline-none focus:border-[#6C2A8A]'
const btn = 'rounded-xl bg-[#6C2A8A] px-5 py-3 font-bold text-white hover:bg-[#4B1B65] disabled:cursor-not-allowed disabled:opacity-50'

export const Checkout = () => {
  const { usuario } = useAuth()
  const { items } = useCarrito()
  const checkout = useCheckout()
  const {
    perfil, cargando, error, setError, recargar, direccionId, setDireccionId, direccion,
    mostrarNuevaDireccion, setMostrarNuevaDireccion, calleNueva, setCalleNueva,
    ciudadNueva, setCiudadNueva, guardandoDireccion, errorDireccion, guardarDireccion,
    paso, setPaso, metodo, seleccionarMetodo, siguienteDireccion,
    numeroTarjeta, setNumeroTarjeta, titular, setTitular, vencimiento, setVencimiento,
    cvv, setCvv, cuotas, setCuotas, vencimientoValido, vencimientoVencido, numeroTarjetaValido, datosTarjetaCompletos, siguienteTarjeta,
    total, subtotal, iva, totalEstimado, valorCuota, confirmarCuotas, procesarCompra, procesando, compra, pendienteDetectado
  } = checkout

  if (!usuario) return <Navigate to="/login?redirect=%2Fcheckout" replace />
  if (items.length === 0 && !compra && !pendienteDetectado) return <Navigate to="/carrito" replace />

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-9 sm:px-6">
      {paso !== 'completado' && paso !== 'procesando' && <Link to="/carrito" className="inline-flex items-center gap-2 text-sm font-bold text-[#6C2A8A]"><ArrowLeft size={18}/> Volver al carrito</Link>}
      <div>
        <h1 className="text-3xl font-extrabold text-[#3D2645]">Continuar compra</h1>
        <p className="mt-1 text-sm text-gray-500">Selecciona la dirección de entrega y completa tus datos de pago.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
          <nav aria-label="Progreso de compra" className="flex flex-wrap gap-2 text-xs font-bold">
            {(['direccion', 'metodo', 'tarjeta', ...(metodo === 'CREDITO' ? ['cuotas'] : []), 'resumen', 'completado'] as string[]).map((etapa, i) => (
              <span key={etapa} className={`rounded-full px-3 py-2 ${paso === etapa ? 'bg-[#6C2A8A] text-white' : 'bg-purple-50 text-[#6C2A8A]'}`}>{i + 1}. {etapa === 'direccion' ? 'Dirección' : etapa === 'metodo' ? 'Método' : etapa === 'tarjeta' ? 'Tarjeta' : etapa === 'cuotas' ? 'Cuotas' : etapa === 'resumen' ? 'Resumen' : 'Confirmación'}</span>
            ))}
          </nav>
          {pendienteDetectado && paso !== 'completado' && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-900">Tienes un pedido anterior pendiente de verificar. Al procesar, primero revisaremos su pago para evitar duplicar la compra.</div>}
          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          {cargando ? (
            <p role="status">Consultando tus direcciones registradas...</p>
          ) : !perfil ? (
            <div className="space-y-3"><p>No se pudo cargar tu perfil y tus direcciones.</p><button className={btn} onClick={() => void recargar()} type="button">Reintentar</button></div>
          ) : paso === 'direccion' ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2"><MapPin className="text-[#6C2A8A]"/><h2 className="text-xl font-extrabold">Dirección de entrega</h2></div>
              <p className="text-sm text-gray-600">Elige una dirección registrada o agrega una nueva.</p>
              {perfil.addresses?.length ? (
                <div className="space-y-3">
                  {perfil.addresses.map((d) => (
                    <label key={d.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${direccionId === d.id ? 'border-[#6C2A8A] bg-purple-50' : 'border-gray-200'}`}>
                      <input type="radio" name="direccion" checked={direccionId === d.id} onChange={() => setDireccionId(d.id)} className="accent-[#6C2A8A]"/>
                      <span className="font-semibold">{d.street}, {d.city}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Todavía no tienes direcciones registradas.</p>
              )}
              <button type="button" className="inline-flex items-center gap-2 rounded-xl border-2 border-purple-200 px-4 py-3 font-bold text-[#6C2A8A] hover:bg-purple-50" onClick={() => { setMostrarNuevaDireccion(!mostrarNuevaDireccion) }}>
                <Plus size={18}/> {mostrarNuevaDireccion ? 'Cerrar formulario' : 'Agregar dirección'}
              </button>
              {mostrarNuevaDireccion && (
                <form className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4" onSubmit={(e) => { e.preventDefault(); void guardarDireccion() }}>
                  <h3 className="font-extrabold text-[#3D2645]">Nueva dirección</h3>
                  <div className="space-y-1"><label htmlFor="direccion-calle" className="text-sm font-bold">Calle y número</label><input id="direccion-calle" required maxLength={150} className={control} value={calleNueva} onChange={(e) => setCalleNueva(e.target.value)} placeholder="Ej.: Los Robles 123"/></div>
                  <div className="space-y-1"><label htmlFor="direccion-ciudad" className="text-sm font-bold">Ciudad o comuna</label><input id="direccion-ciudad" required maxLength={100} className={control} value={ciudadNueva} onChange={(e) => setCiudadNueva(e.target.value)} placeholder="Ej.: Coronel"/></div>
                  {errorDireccion && <p role="alert" className="text-sm text-red-700">{errorDireccion}</p>}
                  <button type="submit" className={btn} disabled={guardandoDireccion}>{guardandoDireccion ? 'Guardando dirección...' : 'Guardar dirección'}</button>
                </form>
              )}
              <div><button type="button" className={btn} onClick={siguienteDireccion} disabled={!direccion}>Continuar al método de pago</button></div>
            </div>
          ) : paso === 'metodo' ? (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-[#3D2645]">Selecciona el método de pago</h2>
              <p className="text-sm text-gray-600">Dirección: {direccion?.street}, {direccion?.city}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => seleccionarMetodo('DEBITO')} className="flex items-center gap-3 rounded-xl border-2 border-purple-200 p-5 text-left font-bold text-[#3D2645] hover:border-[#6C2A8A] hover:bg-purple-50"><Wallet size={30} className="text-[#6C2A8A]"/> Tarjeta de débito</button>
                <button type="button" onClick={() => seleccionarMetodo('CREDITO')} className="flex items-center gap-3 rounded-xl border-2 border-purple-200 p-5 text-left font-bold text-[#3D2645] hover:border-[#6C2A8A] hover:bg-purple-50"><CreditCard size={30} className="text-[#6C2A8A]"/> Tarjeta de crédito</button>
              </div>
              <button type="button" className="text-sm font-semibold text-[#6C2A8A] underline" onClick={() => { setError(''); setPaso('direccion') }}>Volver a direcciones</button>
            </div>
          ) : paso === 'tarjeta' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2"><CreditCard className="text-[#6C2A8A]"/><h2 className="text-xl font-extrabold text-[#3D2645]">Datos de tarjeta de {metodo === 'CREDITO' ? 'crédito' : 'débito'}</h2></div>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); siguienteTarjeta() }} autoComplete="off">
                <div className="space-y-1"><label htmlFor="tarjeta-titular" className="text-sm font-bold">Nombre del titular</label><input id="tarjeta-titular" className={control} value={titular} onChange={(e) => setTitular(e.target.value)} placeholder="Nombre impreso en tarjeta" autoComplete="off"/></div>
                <div className="space-y-1"><label htmlFor="tarjeta-numero" className="text-sm font-bold">Número de tarjeta</label><input id="tarjeta-numero" className={control} value={numeroTarjeta} onChange={(e) => setNumeroTarjeta(e.target.value.replace(/\D/g, '').slice(0, 16))} placeholder="16 dígitos" maxLength={16} inputMode="numeric" autoComplete="off" aria-invalid={numeroTarjeta.length > 0 && !numeroTarjetaValido} aria-describedby="tarjeta-numero-error"/></div>
                {numeroTarjeta.length > 0 && !numeroTarjetaValido && <p id="tarjeta-numero-error" role="alert" className="text-sm font-semibold text-red-600">El número de tarjeta debe tener exactamente 16 dígitos ({numeroTarjeta.length}/16).</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label htmlFor="tarjeta-fecha" className="text-sm font-bold">Vencimiento (MM/AA)</label><input id="tarjeta-fecha" className={`${control} ${vencimiento.length === 5 && !vencimientoValido ? "border-red-400 focus:border-red-600" : ""}`} value={vencimiento} maxLength={5} onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setVencimiento(value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value)
                  }} placeholder="MM/AA" inputMode="numeric" autoComplete="off" aria-invalid={vencimiento.length === 5 && !vencimientoValido} aria-describedby="tarjeta-fecha-error"/>
                    {vencimiento.length === 5 && !vencimientoValido && <p id="tarjeta-fecha-error" role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{vencimientoVencido ? 'La tarjeta está vencida. Ingresa una fecha vigente.' : 'Fecha inválida. Revisa el mes y el año.'}</p>}
                  </div>
                  <div className="space-y-1"><label htmlFor="tarjeta-cvv" className="text-sm font-bold">CVV</label><input id="tarjeta-cvv" className={control} value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} type="password" placeholder="***" inputMode="numeric" autoComplete="off"/>{cvv.length > 0 && cvv.length < 3 && <p role="alert" className="text-xs text-red-700">El CVV debe tener 3 o 4 dígitos.</p>}</div>
                </div>
                <button type="submit" className={btn} disabled={!datosTarjetaCompletos || !vencimientoValido}>
                  {metodo === 'CREDITO' ? 'Ver opciones de cuotas' : 'Continuar al resumen'}
                </button>
              </form>
              <button type="button" className="text-sm font-semibold text-[#6C2A8A] underline" onClick={() => { setError(''); setPaso('metodo') }}>Cambiar método de pago</button>
            </div>
          ) : paso === 'procesando' ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4" role="status" aria-live="polite">
              <LoaderCircle className="animate-spin text-[#6C2A8A]" size={56}/>
              <h2 className="text-xl font-extrabold text-[#3D2645]">Procesando tu compra...</h2>
              <p className="text-sm text-gray-500">Estamos registrando el pedido y verificando su pago.</p>
            </div>
          ) : paso === 'completado' && compra ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-green-700"><PackageCheck size={38}/><h2 className="text-2xl font-extrabold">¡Compra completada!</h2></div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-4"><p className="font-bold">ID de compra: #{compra.pedido.orderId}</p><p className="text-sm">ID de pago: #{compra.pago.id}</p><p className="text-sm">Estado: {compra.pedido.status === 'EN_PREPARACION' ? 'En preparación' : compra.pedido.status}</p></div>
              <h3 className="font-extrabold text-[#3D2645]">Comprobante de compra</h3>
              <div className="space-y-2">{compra.pedido.items?.map((i) => <div key={i.id} className="flex justify-between gap-3 border-b pb-2 text-sm"><span>{i.quantity} × {i.productName}</span><strong>{clp(i.subtotal)}</strong></div>)}</div>
              <p><strong>Dirección:</strong> {compra.direccion.street}, {compra.direccion.city}</p>
              <p><strong>Método:</strong> {compra.metodo === 'CREDITO' ? 'Crédito' : 'Débito'} · Tarjeta terminada en {compra.ultimos4}</p>
              {compra.metodo === 'CREDITO' && <p><strong>Cuotas elegidas:</strong> {compra.cuotas} {compra.cuotas === 1 ? 'mes' : 'meses'} · {clp(compra.totalEstimado / compra.cuotas)} por cuota</p>}
              <div className="rounded-xl bg-purple-50 p-4"><strong>Total del pedido: {clp(compra.pedido.total)} · Total pagado: {clp(compra.pago.amount)}</strong></div>
              <Link to="/compras" className={`${btn} inline-flex`}>Ver historial de compras</Link>
            </div>
          ) : paso === 'resumen' ? (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-[#3D2645]">Resumen general de compra</h2>
              <h3 className="font-bold">Productos</h3>
              <div className="space-y-2">{items.map((i) => <div key={i.productoId} className="flex justify-between gap-3 border-b pb-2 text-sm"><span>{i.cantidad} × {i.nombre}</span><strong>{clp(i.precio * i.cantidad)}</strong></div>)}</div>
              <p><strong>Dirección:</strong> {direccion?.street}, {direccion?.city}</p>
              <p><strong>Método:</strong> {metodo === 'CREDITO' ? 'Crédito' : 'Débito'}</p>
              <p><strong>Tarjeta:</strong> •••• {numeroTarjeta.slice(-4)}</p>
              {metodo === 'CREDITO' && <p><strong>Cuotas:</strong> {cuotas} {cuotas === 1 ? 'mes' : 'meses'} · {clp(valorCuota)} por cuota</p>}
              <div className="rounded-xl bg-purple-50 p-4"><p>Total de productos: <strong>{clp(total)}</strong></p>{metodo === 'CREDITO' && cuotas > 1 && <p>Total con intereses: <strong>{clp(totalEstimado)}</strong></p>}</div>
              <button type="button" disabled={procesando} className={`${btn} flex w-full items-center justify-center gap-2`} onClick={() => void procesarCompra()}>{procesando ? <LoaderCircle className="animate-spin" size={20}/> : <CreditCard size={20}/>} Procesar el pago</button>
              <p className="text-xs text-gray-500">El total del pago, incluyendo intereses de cuotas cuando corresponda, se calcula en el microservicio de pagos.</p>
              <button type="button" className="text-sm font-semibold text-[#6C2A8A] underline" onClick={() => setPaso(metodo === 'CREDITO' ? 'cuotas' : 'tarjeta')}>Modificar datos</button>
            </div>
          ) : (
            <div className="space-y-5">
              <h2 className="text-xl font-extrabold text-[#3D2645]">Cuotas con tarjeta de crédito</h2>
              <p className="text-sm text-gray-600">Selecciona un plan para visualizar cuánto pagarías por cuota.</p>
              <fieldset className="space-y-3">
                <legend className="sr-only">Cantidad de cuotas</legend>
                {([1, 3, 6, 8, 12] as const).map((n) => {
                  const interes = FACTORES_CUOTAS[n]
                  const totalConInteres = Math.round(total * (1 + interes))
                  return (
                    <label key={n} className={`flex cursor-pointer flex-wrap items-center gap-3 rounded-xl border p-4 ${cuotas === n ? 'border-[#6C2A8A] bg-purple-50' : 'border-gray-200'}`}>
                      <input type="radio" name="cuotas" checked={cuotas === n} onChange={() => setCuotas(n)} className="accent-[#6C2A8A]" />
                      <span className="font-bold text-[#3D2645]">{n} {n === 1 ? 'cuota' : 'cuotas'}</span>
                      <span className="text-xs text-gray-500">{interes === 0 ? 'Sin interés' : `${Math.round(interes * 100)} % de interés`}</span>
                      <strong className="ml-auto text-[#6C2A8A]">{clp(totalConInteres / n)} / cuota</strong>
                    </label>
                  )
                })}
              </fieldset>
              <div className="rounded-xl bg-purple-50 p-4 text-sm">
                <p>Total con interés: <strong>{clp(total * (1 + FACTORES_CUOTAS[cuotas]))}</strong></p>
                <p className="mt-1">{cuotas} {cuotas === 1 ? 'cuota' : 'cuotas'} de aproximadamente <strong>{clp(Math.round(total * (1 + FACTORES_CUOTAS[cuotas])) / cuotas)}</strong></p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button type="button" className={btn} onClick={confirmarCuotas}>Continuar al resumen</button>
                <button type="button" className="text-sm font-semibold text-[#6C2A8A] underline" onClick={() => setPaso('tarjeta')}>Volver a tarjeta</button>
              </div>
            </div>
          )}
        </div>
        {paso !== 'completado' && paso !== 'procesando' && <aside className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#3D2645]">Resumen de compra</h2>
          <p className="mt-2 text-sm text-gray-500">{items.reduce((s, i) => s + i.cantidad, 0)} productos</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3"><dt>Subtotal neto</dt><dd>{clp(subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt>IVA (19 %)</dt><dd>{clp(iva)}</dd></div>
            <div className="flex justify-between gap-3 border-t pt-3 text-lg font-extrabold text-[#3D2645]"><dt>Total</dt><dd>{clp(total)}</dd></div>
          </dl>
          {direccion && <p className="mt-5 text-xs text-gray-500">Entrega: {direccion.street}, {direccion.city}</p>}
          <p className="mt-4 text-xs text-gray-500">Los precios incluyen IVA.</p>
        </aside>}
      </div>
    </section>
  )
}
