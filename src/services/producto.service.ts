import { apiRequest } from './api.service'
import { ENDPOINTS } from './endpoints'

// Estos campos corresponden al ProductResponseDTO del microservicio de catálogo.
export interface Producto {
    id: number
    name: string
    description?: string | null
    imageUrl?: string | null
    price: number | string
    discountPercent?: number | string | null
    finalPrice?: number | string | null
    onSale?: boolean
    categoryId?: number
    categoryName?: string | null
    stockQuantity?: number
    minStock?: number
    lowStock?: boolean
    active?: boolean
    available?: boolean
}

// El endpoint /available devuelve productos activos que tienen stock.
export function listarProductosDisponibles(): Promise<Producto[]> {
    return apiRequest<Producto[]>(ENDPOINTS.PRODUCTOS.DISPONIBLES)
}

export function obtenerProductoPorId(id: number, options: RequestInit = {}): Promise<Producto> {
    return apiRequest<Producto>(`${ENDPOINTS.PRODUCTOS.DETALLE}/${id}`, options)
}


// Representa la respuesta del endpoint GET /api/v1/categories.
export interface Categoria {
    id: number
    name: string
    description?: string | null
    active?: boolean
}

// Obtiene las categorías registradas, independientemente de sus productos.
export function listarCategorias(): Promise<Categoria[]> {
    return apiRequest<Categoria[]>('/api/v1/categories', { cache: 'no-store' })
}
