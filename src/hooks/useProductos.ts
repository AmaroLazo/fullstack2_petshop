import { useCallback, useEffect, useState } from 'react'
import { listarProductosDisponibles, type Producto } from '../services/producto.service'

// Mismo patrón que useMascotas del profesor: servicio -> hook -> página.
export const useProductos = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const cargarProductos = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const datos = await listarProductosDisponibles()
      setProductos(datos)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('No se pudieron cargar los productos.'))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargarProductos()
  }, [cargarProductos])

  return { productos, cargando, error, recargar: cargarProductos }
}
