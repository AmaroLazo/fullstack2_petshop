import { useEffect, useMemo, useState } from 'react'
import type { Producto } from '../services/producto.service'

// Acentos, mayúsculas y espacios extra no afectan los resultados.
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL').trim()

export const useBusquedaCatalogo = (productos: Producto[], busquedaUrl: string) => {
  const [busqueda, setBusqueda] = useState(busquedaUrl)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas')

  // Permite buscar desde el encabezado y desde la barra del propio catálogo.
  useEffect(() => { setBusqueda(busquedaUrl) }, [busquedaUrl])

  const productosFiltrados = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
    return productos.filter(({ name, description, categoryName }) => {
      if (categoriaSeleccionada !== 'todas' && categoryName !== categoriaSeleccionada) return false
      const contenido = normalizar([name, description, categoryName].filter(Boolean).join(' '))
      return palabras.every((palabra) => contenido.includes(palabra))
    })
  }, [productos, busqueda, categoriaSeleccionada])

  const limpiarFiltros = () => {
    setBusqueda('')
    setCategoriaSeleccionada('todas')
  }

  return { busqueda, setBusqueda, categoriaSeleccionada, setCategoriaSeleccionada, productosFiltrados, limpiarFiltros }
}
