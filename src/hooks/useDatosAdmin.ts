import { useCallback, useEffect, useState } from 'react'
import { actualizarEstadoPedido, listarPaginaPedidos, listarTodosUsuarios } from '../services/admin.service'
import type { EstadoPedido, PedidoCliente } from '../services/pedido.service'
import type { Usuario } from '../services/usuario.service'

export function useDatosAdmin(incluirPedidos = false) {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [pedidos, setPedidos] = useState<PedidoCliente[] | null>(null)
  const [pagina, setPagina] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [errores, setErrores] = useState<string[]>([])

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [u, p] = await Promise.allSettled([
        listarTodosUsuarios(), incluirPedidos ? listarPaginaPedidos(pagina) : Promise.resolve(null)
      ])
      setUsuarios(u.status === 'fulfilled' ? u.value : null)
      const paginaPedidos = p.status === 'fulfilled' ? p.value : null
      setPedidos(paginaPedidos?.content ?? null)
      setTotalPaginas(paginaPedidos?.totalPages ?? 0)
      setTotalPedidos(paginaPedidos?.totalElements ?? 0)
      if (paginaPedidos && pagina > 0 && pagina >= paginaPedidos.totalPages) {
        setPagina(Math.max(0, paginaPedidos.totalPages - 1))
      }
      const mensajes = [
        ...(u.status === 'rejected' ? ['No se pudieron consultar los usuarios.'] : []),
        ...(p.status === 'rejected' ? ['No se pudieron consultar los pedidos.'] : [])
      ]
      setErrores(mensajes)
      if (mensajes.length) setError(new Error(mensajes.join(' ')))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido al cargar administración.'))
    } finally {
      setCargando(false)
    }
  }, [incluirPedidos, pagina])

  const cambiarEstadoPedido = useCallback(async (id: number, status: EstadoPedido) => {
    const actualizado = await actualizarEstadoPedido(id, status)
    setPedidos(actuales => actuales?.map(pedido => pedido.orderId === id ? actualizado : pedido) ?? actuales)
    return actualizado
  }, [])

  useEffect(() => { void cargarDatos() }, [cargarDatos])
  return { usuarios, pedidos, pagina, setPagina, totalPaginas, totalPedidos, cargando, error, errores,
    recargar: cargarDatos, cambiarEstadoPedido }
}
