import { apiRequest } from './api.service'

// Coinciden con UserRequest, UserResponse y AuthResponse del microservicio Java.
export interface Usuario {
  userId: number
  name: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  active: boolean
  createdAt?: string
  phone?: string | null
  addresses?: { id: number; street: string; city: string }[]
}

export interface RegistroUsuario {
  name: string
  email: string
  password: string
  phone: string
  street: string
  city: string
}

export interface RespuestaLogin {
  userId: number
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  message: string
}

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

export const agregarDireccion = (id: number, direccion: { street: string; city: string }) =>
  apiRequest<Usuario>(`/api/users/${id}/addresses`, { method: 'POST', body: JSON.stringify(direccion) })

export const eliminarDireccion = (id: number, addressId: number) =>
  apiRequest<Usuario>(`/api/users/${id}/addresses/${addressId}`, { method: 'DELETE' })

export const desactivarCuenta = (id: number) =>
  apiRequest<void>(`/api/users/${id}/deactivate`, { method: 'PATCH' })
