import { obtenerProductoPorId } from './producto.service'
import type { ItemCarrito } from '../hooks/useCarrito'

export interface ProblemaCarrito {
  productoId: number
  nombre: string
  motivo: string
}

// Consulta precios y stock actuales, incluso si se ingresa al checkout directamente.
export async function revisarCarrito(items: ItemCarrito[]) {
  const resultado = await Promise.all(items.map(async (item) => {
    try {
      const p = await obtenerProductoPorId(item.productoId, { cache: 'no-store' })
      if (p.active === false || p.available === false) {
        return { item, problema: 'Producto desactivado o no disponible.' }
      }
      const stock = Number(p.stockQuantity ?? 0)
      if (stock < item.cantidad) {
        return { item, problema: `Stock disponible: ${stock}. Reduce la cantidad o elimina el producto.` }
      }
      const precio = Number(p.finalPrice ?? p.price)
      if (!Number.isFinite(precio) || precio <= 0) {
        return { item, problema: 'El producto tiene un precio inválido.' }
      }
      return { item, precio }
    } catch (error) {
      if (error instanceof Error && /404|no encontrad[oa]|no existe/i.test(error.message)) {
        return { item, problema: 'Producto eliminado del catálogo.' }
      }
      throw new Error('No pudimos verificar el catálogo. Inténtalo nuevamente.')
    }
  }))
  const problemas: ProblemaCarrito[] = resultado.filter((r) => 'problema' in r)
    .map((r) => ({ productoId: r.item.productoId, nombre: r.item.nombre, motivo: r.problema! }))
  const cambiosPrecio = resultado.filter((r) => 'precio' in r && r.precio !== r.item.precio)
  const actualizados = items.map((item) => {
    const hallazgo = resultado.find((r) => r.item.productoId === item.productoId)
    return hallazgo && 'precio' in hallazgo && hallazgo.precio !== undefined
      ? { ...item, precio: hallazgo.precio } : item
  })
  return { problemas, cambiosPrecio: cambiosPrecio.length > 0, actualizados }
}
