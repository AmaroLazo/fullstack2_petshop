import { useCallback, useEffect, useState } from 'react'
import {
  listarPagosExitosos, listarTodosPedidos, listarTodosProductos,
  listarTodosUsuarios, listarTodasCategorias, type PagoAdministracion
} from '../services/admin.service'
import type { Producto, Categoria } from '../services/producto.service'
import type { PedidoCliente } from '../services/pedido.service'
import type { Usuario } from '../services/usuario.service'

export interface EstadoDashboard {
  pagos: PagoAdministracion[] | null
  pedidos: PedidoCliente[] | null
  productos: Producto[] | null
  usuarios: Usuario[] | null
  categorias: Categoria[] | null
  errores: string[]
}

const inicial: EstadoDashboard = {
  pagos: null, pedidos: null, productos: null, usuarios: null, categorias: null, errores: []
}

export function useDashboardAdmin() {
  const [datos, setDatos] = useState<EstadoDashboard>(inicial)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const cargarDashboard = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [pagos, pedidos, productos, usuarios, categorias] = await Promise.allSettled([
        listarPagosExitosos(), listarTodosPedidos(), listarTodosProductos(), listarTodosUsuarios(), listarTodasCategorias()
      ])
      const errores: string[] = []
      if (pagos.status === 'rejected') errores.push('No se pudieron consultar los pagos.')
      if (pedidos.status === 'rejected') errores.push('No se pudieron consultar los pedidos.')
      if (productos.status === 'rejected') errores.push('No se pudo consultar el catálogo.')
      if (usuarios.status === 'rejected') errores.push('No se pudieron consultar los usuarios.')
      if (categorias.status === 'rejected') errores.push('No se pudieron consultar las categorías.')
      setDatos({
        pagos: pagos.status === 'fulfilled' ? pagos.value : null,
        pedidos: pedidos.status === 'fulfilled' ? pedidos.value : null,
        productos: productos.status === 'fulfilled' ? productos.value : null,
        usuarios: usuarios.status === 'fulfilled' ? usuarios.value : null,
        categorias: categorias.status === 'fulfilled' ? categorias.value : null,
        errores
      })
      if (errores.length) setError(new Error(errores.join(' ')))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error desconocido al cargar el panel.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargarDashboard() }, [cargarDashboard])
  return { datos, cargando, error, recargar: cargarDashboard }
}
