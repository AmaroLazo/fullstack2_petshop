import { apiRequest } from './api.service'

export type EstadoPedido = 'PENDIENTE' | 'CANCELADO' | 'EN_PREPARACION' | 'ENVIADO' | 'ENTREGADO'

export interface PedidoCliente {
  orderId: number
  userId: number
  status: EstadoPedido
  total: number
  createdAt: string
  updatedAt: string
  shippingAddress?: { street: string; city: string } | null
  items: Array<{ id: number; productId: number; productName: string; quantity: number; unitPrice: number; subtotal: number }>
}

export const listarPedidosPorUsuario = (userId: number) =>
  apiRequest<PedidoCliente[]>(`/api/orders/user/${userId}`)

export const obtenerPedido = (id: number) =>
  apiRequest<PedidoCliente>(`/api/orders/${id}`)

export const crearPedido = (datos: {
  userId: number
  items: Array<{ productId: number; quantity: number }>
  shippingAddress: { street: string; city: string }
}) => apiRequest<PedidoCliente>('/api/orders', { method: 'POST', body: JSON.stringify(datos) })
