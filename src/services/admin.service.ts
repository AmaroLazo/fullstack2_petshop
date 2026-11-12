import { apiRequest } from './api.service'
import type { Producto, Categoria } from './producto.service'
import type { EstadoPedido, PedidoCliente } from './pedido.service'
import type { Usuario } from './usuario.service'

// Usa exclusivamente los endpoints que existen en los controladores Spring Boot.
export interface PagoAdministracion {
  id: number
  orderId: number
  amount: number | string
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
  transactionDate: string | null
}

interface PaginaPedidos {
  content: PedidoCliente[]
  last: boolean
  totalPages: number
}

export interface NuevaCategoria {
  name: string
  description?: string
  active?: boolean
}

export interface NuevoProducto {
  name: string
  description: string
  imageUrl?: string
  price: number
  discountPercent: number
  stockQuantity: number
  minStock: number
  categoryId: number
}

export const listarTodosProductos = () => apiRequest<Producto[]>('/api/v1/products')
export const listarTodasCategorias = () => apiRequest<Categoria[]>('/api/v1/categories', { cache: 'no-store' })
export const crearCategoria = (categoria: NuevaCategoria) =>
  apiRequest<Categoria>('/api/v1/categories', { method: 'POST', body: JSON.stringify(categoria) })
export const listarTodosUsuarios = () => apiRequest<Usuario[]>('/api/users')
export const listarPagosExitosos = () => apiRequest<PagoAdministracion[]>('/api/payments/by-status/SUCCESS')
export const crearProducto = (producto: NuevoProducto) =>
  apiRequest<Producto>('/api/v1/products', { method: 'POST', body: JSON.stringify(producto) })

export interface ActualizacionProducto extends NuevoProducto {
  active: boolean
}

export interface ActualizacionCategoria extends NuevaCategoria {
  active: boolean
}

export const actualizarProducto = (id: number, datos: ActualizacionProducto) =>
  apiRequest<Producto>(`/api/v1/products/${id}`, { method: 'PUT', body: JSON.stringify(datos) })

export const actualizarCategoria = (id: number, datos: ActualizacionCategoria) =>
  apiRequest<Categoria>(`/api/v1/categories/${id}`, { method: 'PUT', body: JSON.stringify(datos) })

// El endpoint de pedidos devuelve Page<OrderResponse>, no un array.
// Se recorren todas las páginas para no presentar totales parciales.
export async function listarTodosPedidos(): Promise<PedidoCliente[]> {
  const resultado: PedidoCliente[] = []
  let pagina = 0
  while (true) {
    const datos = await apiRequest<PaginaPedidos>(`/api/orders?page=${pagina}&size=100&sort=createdAt,desc`)
    resultado.push(...datos.content)
    if (datos.last || pagina + 1 >= datos.totalPages) return resultado
    pagina += 1
  }
}

// Cambia el estado del pedido. El microservicio valida la transición y persiste en pedidos_db.
export const actualizarEstadoPedido = (id: number, status: EstadoPedido) =>
  apiRequest<PedidoCliente>(`/api/orders/${id}/status?status=${encodeURIComponent(status)}`, { method: 'PUT' })
