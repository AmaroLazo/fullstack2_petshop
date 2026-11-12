import { useEffect, useState } from 'react'
import { obtenerProductoPorId } from '../services/producto.service'
import { useCarrito } from './useCarrito'

// Recupera imágenes incluso para artículos agregados antes de esta actualización.
export const useCarritoProductos = () => {
  const { items } = useCarrito()
  const [imagenes, setImagenes] = useState<Record<number, string | null>>({})
  const ids = items.map((item) => item.productoId).join(',')

  useEffect(() => {
    let activo = true
    const idsActuales = ids.split(',').filter(Boolean).map(Number)
    if (!idsActuales.length) { setImagenes({}); return }

    void Promise.all(idsActuales.map(async (id) => {
      try {
        const producto = await obtenerProductoPorId(id)
        return [id, producto.imageUrl ?? null] as const
      } catch {
        return [id, null] as const
      }
    })).then((resultados) => {
      if (activo) setImagenes(Object.fromEntries(resultados))
    })
    return () => { activo = false }
  }, [ids])

  return imagenes
}
