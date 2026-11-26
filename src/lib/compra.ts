import type { ItemCarrito } from '../hooks/useCarrito'
import type { PagoRegistrado } from '../services/pago.service'
import type { DatosNuevoPedido, PedidoCliente } from '../services/pedido.service'

export interface IntentoCompra {
  key: string
  orderId?: number
  datos?: DatosNuevoPedido
}

export const claveCompraPendiente = (userId: number) => `huellitas_compra_pendiente_${userId}`

export function leerCompraPendiente(userId: number): IntentoCompra | null {
  try {
    const raw = localStorage.getItem(claveCompraPendiente(userId))
    if (!raw) return null
    const intento = JSON.parse(raw) as IntentoCompra
    if (typeof intento.key !== 'string' || !intento.key) return null
    if (Number.isInteger(intento.orderId) && intento.orderId! > 0) return intento
    if (intento.datos?.userId === userId && intento.datos.creationKey === intento.key
        && Array.isArray(intento.datos.items) && intento.datos.items.length && intento.datos.shippingAddress) {
      return intento
    }
  } catch { /* El valor local puede estar dañado. */ }
  return null
}

export function crearComprobante(pedido: PedidoCliente, pago: PagoRegistrado) {
  return { pedido, pago, cuotas: pago.installments ?? 1 }
}

export function descontarCompra(items: ItemCarrito[], comprados: PedidoCliente['items']): ItemCarrito[] {
  const cantidades = new Map<number, number>()
  for (const producto of comprados) {
    cantidades.set(producto.productId, (cantidades.get(producto.productId) ?? 0) + producto.quantity)
  }
  return items.map(item => ({ ...item, cantidad: item.cantidad - (cantidades.get(item.productoId) ?? 0) }))
    .filter(item => item.cantidad > 0)
}
