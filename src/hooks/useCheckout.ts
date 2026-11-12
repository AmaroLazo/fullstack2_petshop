import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { useCarrito } from './useCarrito'
import { agregarDireccion, obtenerUsuario, type Usuario } from '../services/usuario.service'
import { crearPedido, obtenerPedido, type PedidoCliente } from '../services/pedido.service'
import { procesarPago, obtenerPagosPorPedido, reintentarPago, type PagoRegistrado } from '../services/pago.service'
import { revisarCarrito } from '../services/validacion-carrito.service'

export type MetodoPago = 'DEBITO' | 'CREDITO'
export type PasoCheckout = 'direccion' | 'metodo' | 'tarjeta' | 'cuotas' | 'resumen' | 'procesando' | 'completado'
export const FACTORES_CUOTAS: Record<number, number> = {
  1: 0, 3: 0.03, 6: 0.06, 8: 0.09, 12: 0.12
}

// La pasarela del backend es de pruebas; no se envían ni almacenan PAN o CVV.
export const useCheckout = () => {
  const { usuario, validarUsuario } = useAuth()
  const { items, vaciar, actualizarPrecios } = useCarrito()
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [direccionId, setDireccionId] = useState<number | null>(null)
  const [paso, setPaso] = useState<PasoCheckout>('direccion')
  const [metodo, setMetodo] = useState<MetodoPago | null>(null)
  const [numeroTarjeta, setNumeroTarjeta] = useState('')
  const [titular, setTitular] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [cvv, setCvv] = useState('')
  const [cuotas, setCuotas] = useState(1)
  const [mostrarNuevaDireccion, setMostrarNuevaDireccion] = useState(false)
  const [calleNueva, setCalleNueva] = useState('')
  const [ciudadNueva, setCiudadNueva] = useState('')
  const [guardandoDireccion, setGuardandoDireccion] = useState(false)
  const [errorDireccion, setErrorDireccion] = useState('')
  const [compra, setCompra] = useState<{ pedido: PedidoCliente; pago: PagoRegistrado; ultimos4: string; metodo: MetodoPago; cuotas: number; totalProductos: number; totalEstimado: number; direccion: { street: string; city: string }; productos: {nombre: string; cantidad: number; precio: number}[] } | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [pendienteDetectado, setPendienteDetectado] = useState(() =>
    Boolean(usuario && localStorage.getItem(`huellitas_compra_pendiente_${usuario.userId}`)))
  useEffect(() => {
    setPendienteDetectado(Boolean(usuario && localStorage.getItem(`huellitas_compra_pendiente_${usuario.userId}`)))
  }, [usuario?.userId])
  const bloqueoEnvio = useRef(false)

  const cargarDirecciones = useCallback(async () => {
    setCargando(true)
    setError('')
    if (!usuario) { setPerfil(null); setCargando(false); return }
    try {
      await validarUsuario()
      const datos = await obtenerUsuario(usuario.userId)
      setPerfil(datos)
      setDireccionId((actual) => datos.addresses?.some((d) => d.id === actual)
        ? actual : (datos.addresses?.[0]?.id ?? null))
    } catch (err) {
      setPerfil(null)
      setError(err instanceof Error ? err.message : 'No se pudo cargar la cuenta.')
    } finally { setCargando(false) }
  }, [usuario?.userId, validarUsuario])

  useEffect(() => { void cargarDirecciones() }, [cargarDirecciones])

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  // Los precios al consumidor en CLP ya incluyen IVA; se desglosa, no se añade de nuevo.
  const subtotal = Math.round(total / 1.19)
  const iva = total - subtotal
  const direccion = perfil?.addresses?.find((d) => d.id === direccionId)
  const siguienteDireccion = () => {
    if (!direccion) { setError('Selecciona o agrega una dirección para continuar.'); return }
    setError(''); setPaso('metodo')
  }
  const guardarDireccion = async () => {
    if (guardandoDireccion) return
    const street = calleNueva.trim()
    const city = ciudadNueva.trim()
    setErrorDireccion('')
    if (!street || !city) {
      setErrorDireccion('Ingresa la calle y la ciudad o comuna.')
      return
    }
    setGuardandoDireccion(true)
    try {
      const cuenta = await validarUsuario()
      await agregarDireccion(cuenta.userId, { street, city })
      // Consultar nuevamente al backend garantiza que usamos el ID real de la dirección guardada.
      const actualizado = await obtenerUsuario(cuenta.userId)
      const nueva = [...(actualizado.addresses ?? [])].reverse().find(
        (d) => d.street === street && d.city === city
      )
      setPerfil(actualizado)
      setDireccionId(nueva?.id ?? actualizado.addresses?.[0]?.id ?? null)
      setCalleNueva('')
      setCiudadNueva('')
      setMostrarNuevaDireccion(false)
      setError('')
    } catch (e: unknown) {
      setErrorDireccion(e instanceof Error ? e.message : 'No se pudo guardar la dirección.')
    } finally {
      setGuardandoDireccion(false)
    }
  }
  const seleccionarMetodo = (valor: MetodoPago) => {
    setMetodo(valor); setNumeroTarjeta(''); setTitular(''); setVencimiento(''); setCvv(''); setCuotas(1)
    setError(''); setPaso('tarjeta')
  }

  const vencimientoValido = (() => {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento)
    if (!match) return false
    const mes = Number(match[1]); const anio = 2000 + Number(match[2])
    const hoy = new Date()
    return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1)
  })()

  const vencimientoVencido = (() => {
    const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(vencimiento)
    if (!match) return false
    const hoy = new Date()
    const anio = 2000 + Number(match[2])
    const mes = Number(match[1])
    return anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)
  })()

  const numeroTarjetaValido = /^\d{16}$/.test(numeroTarjeta)
  const cvvValido = /^\d{3,4}$/.test(cvv)
  const datosTarjetaCompletos = Boolean(numeroTarjetaValido && titular.trim() && cvvValido)
  const siguienteTarjeta = () => {
    if (!datosTarjetaCompletos) { setError('Ingresa un número de tarjeta de 16 dígitos y completa los demás campos.'); return }
    if (!vencimientoValido) { setError('La fecha de vencimiento debe ser MM/AA y no estar vencida.'); return }
    setError('')
    if (metodo === 'CREDITO') setPaso('cuotas')
    else setPaso('resumen')
  }

  const totalEstimado = Math.round(total * (metodo === 'CREDITO' ? (1 + FACTORES_CUOTAS[cuotas]) : 1))
  const valorCuota = Math.round(totalEstimado / (metodo === 'CREDITO' ? cuotas : 1))
  const confirmarCuotas = () => { setError(''); setPaso('resumen') }

  const procesarCompra = async () => {
    if (bloqueoEnvio.current || procesando || compra) return
    if (!usuario || !direccion || !metodo || (items.length === 0 && !pendienteDetectado) || !datosTarjetaCompletos || !vencimientoValido) {
      setError('Revisa la dirección, productos y datos de la tarjeta antes de continuar.')
      return
    }
    bloqueoEnvio.current = true
    setProcesando(true)
    setPaso('procesando')
    setError('')
    const inicio = Date.now()
    const minimoVisual = () => new Promise<void>((resolve) => setTimeout(resolve, Math.max(0, 5000 - (Date.now() - inicio))))
    try {
      const cuenta = await validarUsuario()
      if (cuenta.userId !== usuario.userId) throw new Error('La cuenta cambió. Inicia sesión de nuevo.')
      const direccionActual = cuenta.addresses?.find((d) => d.id === direccion.id)
      if (!direccionActual) throw new Error('La dirección seleccionada ya no existe.')

      // Conservar pedido y clave entre reintentos, para no crear pedidos duplicados
      // cuando falla la llamada al microservicio de pagos.
      const pendingKey = `huellitas_compra_pendiente_${cuenta.userId}`
      let pendiente: { orderId: number; key: string } | null = null
      try {
        const raw = localStorage.getItem(pendingKey)
        if (raw) {
          const p = JSON.parse(raw) as { orderId?: unknown; key?: unknown }
          if (typeof p.orderId === 'number' && p.orderId > 0 && typeof p.key === 'string') {
            pendiente = { orderId: p.orderId, key: p.key }
          }
        }
      } catch { /* Sin pedido previo válido */ }

      if (!pendiente) {
        const revision = await revisarCarrito(items)
        if (revision.problemas.length) {
          throw new Error(revision.problemas.map((p) => `${p.nombre}: ${p.motivo}`).join(' | ') + ' Vuelve al carrito para corregirlo.')
        }
        if (revision.cambiosPrecio) {
          actualizarPrecios(revision.actualizados)
          throw new Error('Los precios cambiaron. Revisa el nuevo total antes de continuar.')
        }
        const pedidoNuevo = await crearPedido({
          userId: cuenta.userId,
          shippingAddress: { street: direccionActual.street, city: direccionActual.city },
          items: items.map(({ productoId, cantidad }) => ({ productId: productoId, quantity: cantidad }))
        })
        pendiente = { orderId: pedidoNuevo.orderId, key: crypto.randomUUID() }
        localStorage.setItem(pendingKey, JSON.stringify(pendiente))
      }
      // Ante pérdida de conexión, consultar primero el pago anterior evita duplicarlo.
      const pagosPrevios = await obtenerPagosPorPedido(pendiente.orderId)
      const exitoso = pagosPrevios.find((p) => p.status === 'SUCCESS')
      const enProceso = pagosPrevios.some((p) => p.status === 'PROCESSING' || p.status === 'PENDING')
      if (enProceso && !exitoso) throw new Error('El pago aún está en proceso. Revisa el historial o intenta recuperarlo después.')
      const fallido = pagosPrevios.find((p) => p.status === 'FAILED')
      const pago = exitoso ?? (fallido
        ? await reintentarPago(fallido.id)
        : await procesarPago({ orderId: pendiente.orderId, method: metodo, idempotencyKey: pendiente.key, installments: metodo === 'CREDITO' ? cuotas : 1 }))
      if (pago.status !== 'SUCCESS') {
        throw new Error(`No se completó el pago (estado: ${pago.status}). El pedido #${pendiente.orderId} está registrado y puedes revisarlo en tu historial.`)
      }
      // Usamos el pedido confirmado en backend para mostrar precios reales y estado.
      const pedido = await obtenerPedido(pendiente.orderId)
      const vista = {
        pedido, pago, ultimos4: numeroTarjeta.slice(-4), metodo: pago.method, cuotas: pago.installments ?? 1,
        totalProductos: pedido.total, totalEstimado: pago.amount,
        direccion: { street: direccionActual.street, city: direccionActual.city },
        productos: items.map((i) => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio }))
      }
      await minimoVisual()
      setCompra(vista)
      setNumeroTarjeta(''); setCvv(''); setVencimiento(''); setTitular('')
      localStorage.removeItem(pendingKey)
      setPendienteDetectado(false)
      vaciar()
      setPaso('completado')
    } catch (e) {
      await minimoVisual()
      setError(e instanceof Error ? e.message : 'No se pudo completar la compra.')
      setPaso('resumen')
    } finally {
      setProcesando(false)
      bloqueoEnvio.current = false
    }
  }

  return {
    perfil, cargando, error, setError, recargar: cargarDirecciones,
    direccionId, setDireccionId, direccion,
    mostrarNuevaDireccion, setMostrarNuevaDireccion,
    calleNueva, setCalleNueva, ciudadNueva, setCiudadNueva,
    guardandoDireccion, errorDireccion, guardarDireccion,
    paso, setPaso, metodo, seleccionarMetodo, siguienteDireccion,
    numeroTarjeta, setNumeroTarjeta, titular, setTitular, vencimiento, setVencimiento,
    cvv, setCvv, cuotas, setCuotas,
    vencimientoValido, vencimientoVencido, numeroTarjetaValido,
    datosTarjetaCompletos, siguienteTarjeta,
    total, subtotal, iva, totalEstimado, valorCuota, confirmarCuotas, procesarCompra, procesando, compra, pendienteDetectado
  }
}
