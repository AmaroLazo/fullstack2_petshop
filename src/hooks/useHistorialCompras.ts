import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { listarPedidosPorUsuario, type PedidoCliente } from '../services/pedido.service'
import { obtenerPagosPorPedido, type PagoRegistrado } from '../services/pago.service'

export const useHistorialCompras = () => {
  const { usuario, validarUsuario } = useAuth()
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([])
  const [pagos, setPagos] = useState<Record<number, PagoRegistrado>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarHistorial = useCallback(async () => {
    setCargando(true)
    setError('')
    setPedidos([])
    setPagos({})
    if (!usuario) { setCargando(false); return }
    try {
      const cuenta = await validarUsuario()
      const resultado = await listarPedidosPorUsuario(cuenta.userId)
      setPedidos(resultado)
      setCargando(false)
      // La caída del microservicio de pagos no debe ocultar el historial de pedidos.
      const respuestas = await Promise.allSettled(resultado.map((pedido) => obtenerPagosPorPedido(pedido.orderId)))
      const porPedido: Record<number, PagoRegistrado> = {}
      respuestas.forEach((r, indice) => {
        if (r.status !== 'fulfilled') return
        const exitoso = r.value.find((p) => p.status === 'SUCCESS')
        if (exitoso) porPedido[resultado[indice].orderId] = exitoso
      })
      setPagos(porPedido)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener el historial.')
    } finally { setCargando(false) }
  }, [usuario?.userId, validarUsuario])

  useEffect(() => { void cargarHistorial() }, [cargarHistorial])
  return { usuario, pedidos, pagos, cargando, error, reintentar: cargarHistorial, recargar: cargarHistorial }
}
