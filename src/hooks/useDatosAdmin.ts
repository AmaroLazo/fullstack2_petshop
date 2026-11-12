import { useCallback, useEffect, useState } from 'react'
import { actualizarEstadoPedido, listarTodosPedidos, listarTodosUsuarios, listarTodasCategorias } from '../services/admin.service'
import type { EstadoPedido, PedidoCliente } from '../services/pedido.service'
import type { Usuario } from '../services/usuario.service'
import type { Categoria } from '../services/producto.service'

export function useDatosAdmin() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [pedidos, setPedidos] = useState<PedidoCliente[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [errores, setErrores] = useState<string[]>([])

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [u, p, c] = await Promise.allSettled([
        listarTodosUsuarios(), listarTodosPedidos(), listarTodasCategorias()
      ])
      setUsuarios(u.status === 'fulfilled' ? u.value : null)
      setPedidos(p.status === 'fulfilled' ? p.value : null)
      setCategorias(c.status === 'fulfilled' ? c.value : null)
      const mensajes = [
        ...(u.status === 'rejected' ? ['No se pudieron consultar los usuarios.'] : []),
        ...(p.status === 'rejected' ? ['No se pudieron consultar los pedidos.'] : []),
        ...(c.status === 'rejected' ? ['No se pudieron consultar las categorías.'] : [])
      ]
      setErrores(mensajes)
      if (mensajes.length) setError(new Error(mensajes.join(' ')))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido al cargar administración.'))
    } finally {
      setCargando(false)
    }
  }, [])

  const cambiarEstadoPedido = useCallback(async (id: number, status: EstadoPedido) => {
    const actualizado = await actualizarEstadoPedido(id, status)
    setPedidos(actuales => actuales?.map(pedido => pedido.orderId === id ? actualizado : pedido) ?? actuales)
    return actualizado
  }, [])

  useEffect(() => { void cargarDatos() }, [cargarDatos])
  return { usuarios, pedidos, categorias, cargando, error, errores, recargar: cargarDatos, cambiarEstadoPedido }
}
