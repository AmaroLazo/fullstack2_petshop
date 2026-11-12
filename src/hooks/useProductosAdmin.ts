import { useCallback, useEffect, useState } from 'react'
import { crearProducto, actualizarProducto, listarTodasCategorias, listarTodosProductos, type NuevoProducto, type ActualizacionProducto } from '../services/admin.service'
import type { Categoria, Producto } from '../services/producto.service'

export const useProductosAdmin = () => {
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargarProductos = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const [lista, listaCategorias] = await Promise.all([listarTodosProductos(), listarTodasCategorias()])
      setProductos(lista)
      setCategorias(listaCategorias)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargarProductos() }, [cargarProductos])

  const agregar = async (producto: NuevoProducto) => {
    setGuardando(true)
    try {
      const nuevo = await crearProducto(producto)
      await cargarProductos() // la lista reflejará lo que efectivamente guardó MySQL
      return nuevo
    } finally { setGuardando(false) }
  }

  const editar = async (id: number, datos: ActualizacionProducto) => {
    setGuardando(true)
    try {
      const resultado = await actualizarProducto(id, datos)
      await cargarProductos()
      return resultado
    } finally { setGuardando(false) }
  }

  return { productos, categorias, cargando, guardando, error, agregar, editar, recargar: cargarProductos }
}
