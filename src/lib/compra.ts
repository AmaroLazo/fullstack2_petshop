import type { ItemCarrito } from '../hooks/useCarrito'
import type { PagoRegistrado } from '../services/pago.service'
import type { PedidoCliente } from '../services/pedido.service'

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
