import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { listarPedidosPorUsuario, type PedidoCliente } from '../services/pedido.service'
import { obtenerPagosPorPedido, type PagoRegistrado } from '../services/pago.service'

const PEDIDOS_POR_PAGINA = 10

export const useHistorialCompras = () => {
  const { usuario, validarUsuario } = useAuth()
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([])
  const [pagos, setPagos] = useState<Record<number, PagoRegistrado>>({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [pagina, setPagina] = useState(0)
  const [pagosNoDisponibles, setPagosNoDisponibles] = useState<number[]>([])

  const cargarHistorial = useCallback(async () => {
    setCargando(true)
    setError('')
    setPedidos([])
    setPagos({})
    setPagosNoDisponibles([])
    setPagina(0)
    if (!usuario) { setCargando(false); return }
    try {
      const cuenta = await validarUsuario()
      const resultado = await listarPedidosPorUsuario(cuenta.userId)
      setPedidos([...resultado].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo obtener el historial.')
    } finally { setCargando(false) }
  }, [usuario?.userId, validarUsuario])

  useEffect(() => {
    let vigente = true
    const visibles = pedidos.slice(pagina * PEDIDOS_POR_PAGINA, (pagina + 1) * PEDIDOS_POR_PAGINA)
    const cargarPagos = async () => {
      const respuestas = await Promise.allSettled(visibles.map((pedido) => obtenerPagosPorPedido(pedido.orderId)))
      if (!vigente) return
      const porPedido: Record<number, PagoRegistrado> = {}
      const noDisponibles: number[] = []
      respuestas.forEach((r, indice) => {
        const id = visibles[indice].orderId
        if (r.status === 'rejected') { noDisponibles.push(id); return }
        const exitoso = r.value.find((p) => p.status === 'SUCCESS')
        if (exitoso) porPedido[id] = exitoso
      })
      setPagos(porPedido)
      setPagosNoDisponibles(noDisponibles)
    }
    if (visibles.length) void cargarPagos()
    return () => { vigente = false }
  }, [pedidos, pagina])

  useEffect(() => { void cargarHistorial() }, [cargarHistorial])
  return {
    usuario, pedidos: pedidos.slice(pagina * PEDIDOS_POR_PAGINA, (pagina + 1) * PEDIDOS_POR_PAGINA),
    pagos, pagosNoDisponibles, pagina, setPagina, totalPaginas: Math.ceil(pedidos.length / PEDIDOS_POR_PAGINA),
    cargando, error, reintentar: cargarHistorial, recargar: cargarHistorial
  }
}
