import { useCallback, useEffect, useState } from 'react'
import { listarCategorias, listarProductosDisponibles, type Producto, type Categoria } from '../services/producto.service'

// Consultas independientes para que las categorías sigan disponibles aunque falle el listado.
export const useCatalogo = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [errorCategorias, setErrorCategorias] = useState<Error | null>(null)

  const cargarCatalogo = useCallback(async () => {
    setCargando(true)
    setError(null)
    setErrorCategorias(null)
    try {
      const [respuestaProductos, respuestaCategorias] = await Promise.allSettled([
        listarProductosDisponibles(), listarCategorias()
      ])
      if (respuestaProductos.status === 'fulfilled') {
        setProductos(respuestaProductos.value)
      } else {
        setProductos([])
        setError(respuestaProductos.reason instanceof Error ? respuestaProductos.reason : new Error('Error al cargar los productos.'))
      }
      if (respuestaCategorias.status === 'fulfilled') {
        setCategorias(respuestaCategorias.value.filter(({ active }) => active !== false))
      } else {
        setCategorias([])
        setErrorCategorias(respuestaCategorias.reason instanceof Error ? respuestaCategorias.reason : new Error('Error al cargar las categorías.'))
      }
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargarCatalogo() }, [cargarCatalogo])
  return { productos, categorias, cargando, error, errorCategorias, recargar: cargarCatalogo }
}
