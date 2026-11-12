import { createContext, useContext, useState, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { obtenerProductoPorId, type Producto } from '../services/producto.service'

export interface ItemCarrito {
  productoId: number
  nombre: string
  precio: number
  cantidad: number
  imageUrl?: string | null
}

interface ContextoCarrito {
  items: ItemCarrito[]
  agregar: (producto: Producto, cantidad: number) => Promise<void>
  cambiarCantidad: (productoId: number, nuevaCantidad: number) => Promise<void>
  quitar: (productoId: number) => void
  vaciar: () => void
  actualizarPrecios: (nuevos: ItemCarrito[]) => void
}

const CarritoContext = createContext<ContextoCarrito | null>(null)
const claveCarrito = (id: number) => `huellitas_carrito_${id}`
function leerCarrito(id: number | undefined): ItemCarrito[] {
  if (!id) return []
  try {
    const value: unknown = JSON.parse(localStorage.getItem(claveCarrito(id)) || '[]')
    return Array.isArray(value) ? value.filter((x): x is ItemCarrito =>
      Boolean(x && typeof x.productoId === 'number' && typeof x.cantidad === 'number' && x.cantidad > 0)) : []
  } catch { return [] }
}

export const CarritoProvider = ({ children }: { children: ReactNode }) => {
  const { usuario, validarUsuario } = useAuth()
  const [estado, setEstado] = useState<{ userId: number | null; items: ItemCarrito[] }>(
    () => ({ userId: usuario?.userId ?? null, items: leerCarrito(usuario?.userId) })
  )
  const userId = usuario?.userId ?? null
  const items = userId === null ? [] :
    estado.userId === userId ? estado.items : leerCarrito(userId)

  const actualizar = (nuevos: ItemCarrito[]) => {
    if (userId === null) return
    localStorage.setItem(claveCarrito(userId), JSON.stringify(nuevos))
    setEstado({ userId, items: nuevos })
  }

  const agregar = async (producto: Producto, cantidad: number) => {
    const perfil = await validarUsuario()
    if (perfil.userId !== userId) throw new Error('Debes iniciar sesión nuevamente.')
    const actual = await obtenerProductoPorId(producto.id)
    const stock = Math.max(0, Math.floor(Number(actual.stockQuantity ?? 0)))
    if (actual.active === false || actual.available === false || stock === 0) {
      throw new Error('Este producto ya no está disponible.')
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) throw new Error('La cantidad no es válida.')
    const anteriores = leerCarrito(perfil.userId)
    const anterior = anteriores.find((item) => item.productoId === producto.id)
    if ((anterior?.cantidad ?? 0) + cantidad > stock) {
      throw new Error(`No puedes superar el stock disponible (${stock} unidades).`)
    }
    const siguiente = anterior
      ? anteriores.map((item) => item.productoId === producto.id ? { ...item, cantidad: item.cantidad + cantidad } : item)
      : [...anteriores, {
          productoId: actual.id,
          nombre: actual.name,
          precio: Number(actual.finalPrice ?? actual.price),
          cantidad,
          imageUrl: actual.imageUrl
        }]
    actualizar(siguiente)
  }

  const cambiarCantidad = async (productoId: number, nuevaCantidad: number) => {
    const perfil = await validarUsuario()
    if (perfil.userId !== userId) throw new Error('Debes iniciar sesión nuevamente.')
    if (!Number.isInteger(nuevaCantidad) || nuevaCantidad < 1) {
      throw new Error('La cantidad mínima es una unidad. Usa Eliminar para quitar el producto.')
    }
    const actual = await obtenerProductoPorId(productoId)
    const stock = Math.max(0, Math.floor(Number(actual.stockQuantity ?? 0)))
    if (actual.active === false || actual.available === false || stock < nuevaCantidad) {
      throw new Error(`Stock disponible: ${stock} unidades. No se puede aumentar la cantidad.`)
    }
    // Lee el carrito más reciente después de consultar el backend.
    const anteriores = leerCarrito(perfil.userId)
    if (!anteriores.some((item) => item.productoId === productoId)) return
    actualizar(anteriores.map((item) => item.productoId === productoId
      ? { ...item, cantidad: nuevaCantidad, precio: Number(actual.finalPrice ?? actual.price), imageUrl: actual.imageUrl }
      : item))
  }

  const quitar = (productoId: number) => actualizar(items.filter((item) => item.productoId !== productoId))
  const vaciar = () => actualizar([])

  return <CarritoContext.Provider value={{ items, agregar, cambiarCantidad, quitar, vaciar, actualizarPrecios: actualizar }}>{children}</CarritoContext.Provider>
}

export function useCarrito() {
  const contexto = useContext(CarritoContext)
  if (!contexto) throw new Error('useCarrito necesita CarritoProvider')
  return contexto
}
