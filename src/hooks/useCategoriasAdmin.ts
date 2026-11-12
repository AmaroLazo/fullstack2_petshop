import { useCallback, useEffect, useState } from 'react'
import { crearCategoria, actualizarCategoria, listarTodasCategorias, type NuevaCategoria, type ActualizacionCategoria } from '../services/admin.service'
import type { Categoria } from '../services/producto.service'

// Este hook concentra la consulta y el registro de categorías del administrador.
export const useCategoriasAdmin = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const datos = await listarTodasCategorias()
      setCategorias(datos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las categorías.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void recargar() }, [recargar])

  const agregar = async (datos: NuevaCategoria) => {
    setGuardando(true)
    setError('')
    try {
      // El backend devuelve el registro creado después de guardarlo en catalogo_db.
      const nuevaCategoria = await crearCategoria(datos)
      setCategorias(actuales =>
        [...actuales.filter(categoria => categoria.id !== nuevaCategoria.id), nuevaCategoria]
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      )
      return nuevaCategoria
    } finally {
      setGuardando(false)
    }
  }

  const editar = async (id: number, datos: ActualizacionCategoria) => {
    setGuardando(true)
    try {
      const actualizada = await actualizarCategoria(id, datos)
      await recargar()
      return actualizada
    } finally { setGuardando(false) }
  }

  return { categorias, cargando, guardando, error, agregar, editar, recargar }
}
