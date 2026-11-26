import { apiRequest } from './api.service'
import type { DatosDireccion, DireccionGuardada } from '../lib/direccion'

// Coinciden con UserRequest, UserResponse y AuthResponse del microservicio Java.
export interface Usuario {
  userId: number
  name: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  active: boolean
  createdAt?: string
  phone?: string | null
  addresses?: (DireccionGuardada & { id: number })[]
}

export interface RegistroUsuario extends DatosDireccion {
  name: string
  email: string
  password: string
  phone: string
}

export interface RespuestaLogin {
  userId: number
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  message: string
  accessToken: string
}

export interface RegionChile {
  nombre: string
  comunas: string[]
}

export const listarRegiones = (signal?: AbortSignal) =>
  apiRequest<RegionChile[]>('/api/users/regiones', { signal })

export const registrarUsuario = (datos: RegistroUsuario) =>
  apiRequest<Usuario>('/api/users', { method: 'POST', body: JSON.stringify(datos) })

export const iniciarSesion = (email: string, password: string) =>
  apiRequest<RespuestaLogin>('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })

export const obtenerUsuario = (id: number) =>
  apiRequest<Usuario>(`/api/users/${id}`)

// Edición permitida por los endpoints actuales del microservicio de usuarios.
export const actualizarPerfil = (id: number, datos: { name: string; email: string }) =>
  apiRequest<Usuario>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(datos) })

export const cambiarContrasena = (id: number, currentPassword: string, newPassword: string) =>
  apiRequest<void>(`/api/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })

export const agregarDireccion = (id: number, direccion: DatosDireccion) =>
  apiRequest<Usuario>(`/api/users/${id}/addresses`, { method: 'POST', body: JSON.stringify(direccion) })

export const eliminarDireccion = (id: number, addressId: number) =>
  apiRequest<Usuario>(`/api/users/${id}/addresses/${addressId}`, { method: 'DELETE' })

export const desactivarCuenta = (id: number) =>
  apiRequest<void>(`/api/users/${id}/deactivate`, { method: 'PATCH' })

// Operaciones de edición usadas por el panel de administración.
export const actualizarUsuarioAdmin = (id: number, datos: { name: string; email: string; phone: string }) =>
  apiRequest<Usuario>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(datos) })

export const cambiarRolUsuario = (id: number, role: Usuario['role']) =>
  apiRequest<void>(`/api/users/${id}/role?role=${encodeURIComponent(role)}`, { method: 'PATCH' })

export const alternarEstadoUsuario = (id: number) =>
  apiRequest<void>(`/api/users/${id}/toggle-status`, { method: 'PATCH' })
