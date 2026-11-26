import { apiRequest } from './api.service'
import type { DireccionGuardada } from '../lib/direccion'

export type EstadoPedido = 'PENDIENTE' | 'CANCELADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO'

export interface PedidoCliente {
  orderId: number
  userId: number
  status: EstadoPedido
  total: number
  createdAt: string
  updatedAt: string
  shippingAddress?: DireccionGuardada | null
  items: Array<{ id: number; productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }>
}

export const listarPedidosPorUsuario = (userId: number) =>
  apiRequest<PedidoCliente[]>(`/api/orders/user/${userId}`)

export const obtenerPedido = (id: number) =>
  apiRequest<PedidoCliente>(`/api/orders/${id}`)

export interface DatosNuevoPedido {
  userId: number
  creationKey: string
  items: Array<{ productId: number; quantity: number }>
  shippingAddress: DireccionGuardada
}

export const crearPedido = (datos: DatosNuevoPedido) =>
  apiRequest<PedidoCliente>('/api/orders', { method: 'POST', body: JSON.stringify(datos) })

export const obtenerPedidoPorIntento = (key: string) =>
  apiRequest<PedidoCliente | null>(`/api/orders/intentos/${encodeURIComponent(key)}`, { cache: 'no-store' })
    .then(pedido => pedido || null)
