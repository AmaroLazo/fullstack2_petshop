import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth'
import { direccionVacia, limpiarDireccion, validarDireccion } from '../lib/direccion'
import { crearComprobante } from '../lib/compra'
import { useCarrito } from './useCarrito'
import { agregarDireccion, obtenerUsuario, type Usuario } from '../services/usuario.service'
import { crearPedido, obtenerPedido, type PedidoCliente } from '../services/pedido.service'
import { procesarPago, obtenerPagosPorPedido, reintentarPago } from '../services/pago.service'
import { revisarCarrito } from '../services/validacion-carrito.service'

export type MetodoPago = 'DEBITO' | 'CREDITO'
export type PasoCheckout = 'direccion' | 'metodo' | 'tarjeta' | 'cuotas' | 'resumen' | 'procesando' | 'completado'
export const FACTORES_CUOTAS: Record<number, number> = {
  1: 0, 3: 0.03, 6: 0.06, 8: 0.09, 12: 0.12
}

function leerPedidoPendiente(clave: string): { orderId: number; key: string } | null {
  try {
    const raw = localStorage.getItem(clave)
    if (!raw) return null
    const dato = JSON.parse(raw) as { orderId?: unknown; key?: unknown }
    if (Number.isInteger(dato.orderId) && typeof dato.orderId === 'number' && dato.orderId > 0
        && typeof dato.key === 'string' && dato.key) {
      return { orderId: dato.orderId, key: dato.key }
    }
  } catch { /* El valor local puede estar dañado. */ }
  return null
}

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
  const clavePendiente = usuario ? `huellitas_compra_pendiente_${usuario.userId}` : ''
  const [pendiente, setPendiente] = useState(() => leerPedidoPendiente(clavePendiente))
  const [pedidoPendiente, setPedidoPendiente] = useState<PedidoCliente | null>(null)
  const pendienteDetectado = Boolean(pendiente)
  useEffect(() => {
    setPendiente(leerPedidoPendiente(clavePendiente))
  }, [clavePendiente])
  useEffect(() => {
    setPedidoPendiente(null)
    if (!pendiente) return
    let vigente = true
    obtenerPedido(pendiente.orderId).then(pedido => {
      if (vigente) setPedidoPendiente(pedido)
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
    if (!direccion) { setError('Selecciona o agrega una dirección para continuar.'); return }
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

  const procesarCompra = async (soloConsultar = false) => {
    if (bloqueoEnvio.current || procesando || compra) return
    if (!usuario || (!soloConsultar && (!metodo || !datosTarjetaCompletos || !vencimientoValido))
        || (!pendienteDetectado && (soloConsultar || !direccion || items.length === 0))) {
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

      // Conservar pedido y clave entre reintentos, para no crear pedidos duplicados
      // cuando falla la llamada al microservicio de pagos.
      const pendingKey = `huellitas_compra_pendiente_${cuenta.userId}`
      const anterior = leerPedidoPendiente(pendingKey)
      let operacion = anterior
      if (!operacion) {
        if (soloConsultar || !items.length) throw new Error('No se encontró una compra pendiente.')
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
        const pedidoNuevo = await crearPedido({
          userId: cuenta.userId,
          shippingAddress: {
            street: direccionActual.street, city: direccionActual.city, houseNumber: direccionActual.houseNumber,
            region: direccionActual.region, postalCode: direccionActual.postalCode
          },
          items: items.map(({ productoId, cantidad }) => ({ productId: productoId, quantity: cantidad }))
        })
        operacion = { orderId: pedidoNuevo.orderId, key: crypto.randomUUID() }
        localStorage.setItem(pendingKey, JSON.stringify(operacion))
        setPendiente(operacion)
      }
      const pedidoId = operacion.orderId
      if (anterior) {
        const guardado = await obtenerPedido(pedidoId)
        setPedidoPendiente(guardado)
        if (guardado.status === 'CANCELADO') {
          localStorage.removeItem(pendingKey)
          setPendiente(null)
          throw new Error('El pedido anterior está cancelado. Puedes iniciar una compra nueva.')
        }
        if (!soloConsultar && pedidoPendiente?.orderId !== pedidoId) {
          throw new Error('Revisa primero el pedido guardado en el resumen antes de confirmar el pago.')
        }
      }
      // Ante pérdida de conexión, consultar primero el pago anterior evita duplicarlo.
      const pagosPrevios = await obtenerPagosPorPedido(pedidoId)
      const exitoso = pagosPrevios.find((p) => p.status === 'SUCCESS')
      const enProceso = pagosPrevios.some((p) => p.status === 'PROCESSING' || p.status === 'PENDING')
      if (enProceso && !exitoso) throw new Error('El pago aún está en proceso. Revisa el historial o intenta recuperarlo después.')
      const fallido = pagosPrevios.find((p) => p.status === 'FAILED')
      let pago = exitoso
      if (!pago) {
        if (soloConsultar || !metodo) throw new Error('El pedido todavía no tiene un pago confirmado.')
        try {
          pago = fallido
            ? await reintentarPago(fallido.id)
            : await procesarPago({ orderId: pedidoId, method: metodo, idempotencyKey: operacion.key, installments: metodo === 'CREDITO' ? cuotas : 1 })
        } catch {
          pago = (await obtenerPagosPorPedido(pedidoId).catch(() => []))
            .find((resultado) => resultado.status === 'SUCCESS')
          if (!pago) throw new Error('No se confirmó el pago. Consulta el estado del pedido antes de reintentar.')
        }
      }
      if (pago.status !== 'SUCCESS') {
        throw new Error(`No se completó el pago (estado: ${pago.status}). El pedido #${pedidoId} está registrado y puedes revisarlo en tu historial.`)
      }
      // Usamos el pedido confirmado en backend para mostrar precios reales y estado.
      const pedido = await obtenerPedido(pedidoId)
      retirarCompra(pedido.items)
      setCompra(crearComprobante(pedido, pago))
      setNumeroTarjeta(''); setCvv(''); setVencimiento(''); setTitular('')
      localStorage.removeItem(pendingKey)
      setPendiente(null)
      setPaso('completado')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la compra.')
      setPaso(soloConsultar ? 'direccion' : 'resumen')
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
    total, subtotal, iva, totalEstimado, valorCuota, confirmarCuotas, procesarCompra, procesando, compra, pendienteDetectado, pedidoPendiente
  }
}
