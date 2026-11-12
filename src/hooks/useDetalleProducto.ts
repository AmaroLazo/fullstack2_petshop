import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { obtenerProductoPorId, type Producto } from '../services/producto.service'

export const useDetalleProducto = () => {
  const { id } = useParams()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [mostrarInformacion, setMostrarInformacion] = useState(false)

  const cargarProducto = useCallback(async () => {
    setCargando(true)
    setError('')
    setProducto(null)
    setCantidad(1)
    setMostrarInformacion(false)
    const idProducto = Number(id)
    if (!Number.isInteger(idProducto) || idProducto <= 0) {
      setError('El identificador del producto no es válido.')
      setCargando(false)
      return
    }
    try {
      const respuesta = await obtenerProductoPorId(idProducto)
      setProducto(respuesta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el producto.')
    } finally { setCargando(false) }
  }, [id])

  useEffect(() => { void cargarProducto() }, [cargarProducto])

  const stockValor = Number(producto?.stockQuantity ?? 0)
  const stock = Number.isFinite(stockValor) ? Math.max(0, Math.floor(stockValor)) : 0
  const disponible = Boolean(producto && stock > 0 && (producto.available ?? producto.active ?? true))
  const disminuir = () => setCantidad((anterior) => Math.max(1, anterior - 1))
  const aumentar = () => {
    if (!disponible) return
    setCantidad((anterior) => Math.min(stock, anterior + 1))
  }
  const alternarInformacion = () => setMostrarInformacion((valor) => !valor)
  return {
    producto, cargando, error, cantidad, stock, disponible, mostrarInformacion,
    disminuir, aumentar, reintentar: cargarProducto, recargar: cargarProducto, alternarInformacion
  }
}
