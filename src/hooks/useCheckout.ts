import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { direccionVacia, limpiarDireccion, validarDireccion } from '../lib/direccion'
import { claveCompraPendiente, crearComprobante, leerCompraPendiente } from '../lib/compra'
import { useCarrito } from './useCarrito'
import { agregarDireccion, obtenerUsuario, type Usuario } from '../services/usuario.service'
import { crearPedido, obtenerPedido, obtenerPedidoPorIntento, type PedidoCliente } from '../services/pedido.service'
import { procesarPago, obtenerPagosPorPedido, reintentarPago, type PagoRegistrado } from '../services/pago.service'
import { revisarCarrito } from '../services/validacion-carrito.service'
import { RespuestaApiError } from '../services/api.service'

export type MetodoPago = 'DEBITO' | 'CREDITO'
export type PasoCheckout = 'direccion' | 'metodo' | 'tarjeta' | 'cuotas' | 'resumen' | 'procesando' | 'completado'
export const FACTORES_CUOTAS: Record<number, number> = {
  1: 0, 3: 0.03, 6: 0.06, 8: 0.09, 12: 0.12
}

type AccionCompra = 'pagar' | 'consultar' | 'recuperar-pedido' | 'reintentar-pago'

// La pasarela del backend es de pruebas; no se envían ni almacenan PAN o CVV.
export const useCheckout = () => {
  const { usuario, validarUsuario } = useAuth()
  const { items, retirarCompra, actualizarPrecios } = useCarrito()
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
  const [datosDireccion, setDatosDireccion] = useState(direccionVacia)
  const [guardandoDireccion, setGuardandoDireccion] = useState(false)
  const [errorDireccion, setErrorDireccion] = useState('')
  const [compra, setCompra] = useState<ReturnType<typeof crearComprobante> | null>(null)
  const [procesando, setProcesando] = useState(false)
  const userId = usuario?.userId
  const [pendiente, setPendiente] = useState(() => userId ? leerCompraPendiente(userId) : null)
  const [pedidoPendiente, setPedidoPendiente] = useState<PedidoCliente | null>(null)
  const [pagoFallido, setPagoFallido] = useState<PagoRegistrado | null>(null)
  const pendienteDetectado = Boolean(pendiente)
  useEffect(() => {
    setPendiente(userId ? leerCompraPendiente(userId) : null)
    setPagoFallido(null)
  }, [userId])
  useEffect(() => {
    if (!pendiente?.orderId) {
      setPedidoPendiente(null)
      return
    }
    let vigente = true
    Promise.all([obtenerPedido(pendiente.orderId), obtenerPagosPorPedido(pendiente.orderId)]).then(([pedido, pagos]) => {
      if (!vigente) return
      setPedidoPendiente(pedido)
      setPagoFallido(pagos.some(pago => pago.status === 'SUCCESS') ? null : pagos.find(pago => pago.status === 'FAILED') ?? null)
    }).catch(() => { /* La consulta explícita permite reintentar. */ })
    return () => { vigente = false }
  }, [pendiente])
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

  const total = pedidoPendiente?.total ?? items.reduce((s, i) => s + i.precio * i.cantidad, 0)
  // Los precios al consumidor en CLP ya incluyen IVA; se desglosa, no se añade de nuevo.
  const subtotal = Math.round(total / 1.19)
  const iva = total - subtotal
  const direccion = perfil?.addresses?.find((d) => d.id === direccionId)
  const siguienteDireccion = () => {
    if (!direccion && !pedidoPendiente?.shippingAddress) { setError('Selecciona o agrega una dirección para continuar.'); return }
    setError(''); setPaso('metodo')
  }
  const guardarDireccion = async () => {
    if (guardandoDireccion) return
    const datos = limpiarDireccion(datosDireccion)
    const errorValidacion = validarDireccion(datos)
    setErrorDireccion(errorValidacion)
    if (errorValidacion) return
    setGuardandoDireccion(true)
    try {
      const cuenta = await validarUsuario()
      const idsAnteriores = new Set(cuenta.addresses?.map((direccion) => direccion.id))
      const actualizado = await agregarDireccion(cuenta.userId, datos)
      const nueva = actualizado.addresses?.find((direccion) => !idsAnteriores.has(direccion.id)
        && direccion.street === datos.street && direccion.houseNumber === datos.houseNumber
        && direccion.city === datos.city && direccion.region === datos.region && direccion.postalCode === datos.postalCode)
      setPerfil(actualizado)
      setDireccionId(nueva?.id ?? actualizado.addresses?.[0]?.id ?? null)
      setDatosDireccion(direccionVacia)
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

  const procesarCompra = async (accion: AccionCompra = 'pagar') => {
    if (bloqueoEnvio.current || procesando || compra || !usuario) return
    if (accion === 'pagar' && (!metodo || !datosTarjetaCompletos || !vencimientoValido
        || (!pendienteDetectado && (!direccion || !items.length)))) {
      setError('Revisa la dirección, productos y datos de la tarjeta antes de continuar.')
      return
    }
    bloqueoEnvio.current = true
    setProcesando(true)
    setPaso('procesando')
    setError('')
    try {
      const cuenta = await validarUsuario()
      if (cuenta.userId !== usuario.userId) throw new Error('La cuenta cambió. Inicia sesión de nuevo.')

      const pendingKey = claveCompraPendiente(cuenta.userId)
      let operacion = leerCompraPendiente(cuenta.userId)
      const intentoExistente = Boolean(operacion)
      if (!operacion) {
        if (accion !== 'pagar' || !items.length) throw new Error('No se encontró una compra pendiente.')
        const direccionActual = cuenta.addresses?.find((d) => d.id === direccion?.id)
        if (!direccionActual) throw new Error('La dirección seleccionada ya no existe.')
        const revision = await revisarCarrito(items)
        if (revision.problemas.length) {
          throw new Error(revision.problemas.map((p) => `${p.nombre}: ${p.motivo}`).join(' | ') + ' Vuelve al carrito para corregirlo.')
        }
        if (revision.cambiosPrecio) {
          actualizarPrecios(revision.actualizados)
          throw new Error('Los precios cambiaron. Revisa el nuevo total antes de continuar.')
        }
        const key = crypto.randomUUID()
        operacion = {
          key,
          datos: {
            userId: cuenta.userId,
            creationKey: key,
            shippingAddress: {
              street: direccionActual.street, city: direccionActual.city, houseNumber: direccionActual.houseNumber,
              region: direccionActual.region, postalCode: direccionActual.postalCode
            },
            items: items.map(({ productoId, cantidad }) => ({ productId: productoId, quantity: cantidad }))
          }
        }
        localStorage.setItem(pendingKey, JSON.stringify(operacion))
        setPendiente(operacion)
      }

      let pedido = operacion.orderId ? await obtenerPedido(operacion.orderId) : null
      if (!pedido && intentoExistente) pedido = await obtenerPedidoPorIntento(operacion.key)
      if (!pedido && operacion.datos && (!intentoExistente || accion === 'recuperar-pedido')) {
        try {
          pedido = await crearPedido(operacion.datos)
        } catch (error) {
          const confirmado = await obtenerPedidoPorIntento(operacion.key).catch(() => undefined)
          if (!confirmado) {
            if (confirmado === null && error instanceof RespuestaApiError && [400, 404].includes(error.status)) {
              localStorage.removeItem(pendingKey)
              setPendiente(null)
              throw error
            }
            throw new Error('No se confirmó el pedido. Usa «Recuperar pedido» para revisar o repetir el mismo intento.')
          }
          pedido = confirmado
        }
      }
      if (!pedido) throw new Error('El pedido aún no está confirmado. Puedes recuperar el mismo intento.')
      if (pedido.orderId !== operacion.orderId) {
        operacion = { ...operacion, orderId: pedido.orderId }
        localStorage.setItem(pendingKey, JSON.stringify(operacion))
        setPendiente(operacion)
      }
      setPedidoPendiente(pedido)
      if (pedido.status === 'CANCELADO') {
        localStorage.removeItem(pendingKey)
        setPendiente(null)
        setPagoFallido(null)
        throw new Error('El pedido anterior está cancelado. Puedes iniciar una compra nueva.')
      }

      const pedidoId = pedido.orderId
      const pagosPrevios = await obtenerPagosPorPedido(pedidoId)
      let pago = pagosPrevios.find((resultado) => resultado.status === 'SUCCESS')
      const fallido = pagosPrevios.find((resultado) => resultado.status === 'FAILED') ?? null
      setPagoFallido(pago ? null : fallido)
      if (!pago && pagosPrevios.some((resultado) => resultado.status === 'PROCESSING' || resultado.status === 'PENDING')) {
        throw new Error('El pago aún está en proceso. Consulta nuevamente antes de reintentar.')
      }
      if (!pago && (accion === 'consultar' || accion === 'recuperar-pedido')) {
        if (fallido) throw new Error('El pago anterior falló. Revisa sus condiciones antes de reintentarlo.')
        throw new Error('El pedido está registrado y todavía no tiene un pago confirmado.')
      }
      if (!pago && fallido && (accion !== 'reintentar-pago' || pagoFallido?.id !== fallido.id
          || pagoFallido.method !== fallido.method || pagoFallido.installments !== fallido.installments
          || pagoFallido.amount !== fallido.amount)) {
        throw new Error('Revisa el método, las cuotas y el total guardados antes de reintentar.')
      }
      if (!pago && !fallido && (!metodo || accion === 'reintentar-pago')) {
        throw new Error('Selecciona un método para el pedido guardado.')
      }
      if (!pago && intentoExistente && !fallido && pedidoPendiente?.orderId !== pedidoId) {
        throw new Error('Revisa el pedido guardado en el resumen antes de confirmar el pago.')
      }
      if (!pago) {
        try {
          pago = fallido
            ? await reintentarPago(fallido.id)
            : await procesarPago({
              orderId: pedidoId, method: metodo!, idempotencyKey: operacion.key, installments: metodo === 'CREDITO' ? cuotas : 1
            })
        } catch {
          pago = (await obtenerPagosPorPedido(pedidoId).catch(() => []))
            .find((resultado) => resultado.status === 'SUCCESS')
          if (!pago) throw new Error('No se confirmó el pago. Consulta el estado del pedido antes de reintentar.')
        }
      }
      if (pago.status !== 'SUCCESS') {
        setPagoFallido(pago.status === 'FAILED' ? pago : null)
        throw new Error(`No se completó el pago (estado: ${pago.status}). El pedido #${pedidoId} sigue registrado.`)
      }
      const confirmado = await obtenerPedido(pedidoId)
      retirarCompra(confirmado.items)
      setCompra(crearComprobante(confirmado, pago))
      setNumeroTarjeta(''); setCvv(''); setVencimiento(''); setTitular('')
      localStorage.removeItem(pendingKey)
      setPendiente(null)
      setPagoFallido(null)
      setPaso('completado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la compra.')
      setPaso(accion === 'pagar' ? 'resumen' : paso)
    } finally {
      setProcesando(false)
      bloqueoEnvio.current = false
    }
  }

  return {
    perfil, cargando, error, setError, recargar: cargarDirecciones,
    direccionId, setDireccionId, direccion,
    mostrarNuevaDireccion, setMostrarNuevaDireccion,
    datosDireccion, setDatosDireccion,
    guardandoDireccion, errorDireccion, guardarDireccion,
    paso, setPaso, metodo, seleccionarMetodo, siguienteDireccion,
    numeroTarjeta, setNumeroTarjeta, titular, setTitular, vencimiento, setVencimiento,
    cvv, setCvv, cuotas, setCuotas,
    vencimientoValido, vencimientoVencido, numeroTarjetaValido,
    datosTarjetaCompletos, siguienteTarjeta,
    total, subtotal, iva, totalEstimado, valorCuota, confirmarCuotas, procesarCompra, procesando, compra,
    pendienteDetectado, pedidoPendiente, pagoFallido, pedidoSinConfirmar: Boolean(pendiente && !pendiente.orderId)
  }
}
