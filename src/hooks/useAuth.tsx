import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { iniciarSesion, obtenerUsuario, type Usuario } from '../services/usuario.service'

const STORAGE_KEY = 'huellitas_usuario'
const ANTIGUO_TOKEN_KEY = 'huellitas_access_token'

function leerSesion(): Usuario | null {
  try {
    // Limpia cualquier token de sesión que hubiera quedado guardado por la versión anterior.
    sessionStorage.removeItem(ANTIGUO_TOKEN_KEY)
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const datos: unknown = JSON.parse(raw)
    if (!datos || typeof datos !== 'object') return null
    const usuario = datos as Usuario
    return Number.isInteger(usuario.userId) && usuario.userId > 0 && usuario.active === true
      ? usuario : null
  } catch { return null }
}

interface ContextoAuth {
  usuario: Usuario | null
  ingresar: (email: string, password: string) => Promise<Usuario>
  validarUsuario: () => Promise<Usuario>
  salir: () => void
  actualizarUsuario: (datos: Usuario) => void
}

const AuthContext = createContext<ContextoAuth | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(leerSesion)
  // Mantiene la sesión actual disponible sin cambiar la identidad de validarUsuario.
  // Así los efectos que dependen de validarUsuario no se reinician al actualizar el perfil.
  const usuarioRef = useRef<Usuario | null>(usuario)

  const salir = useCallback(() => {
    usuarioRef.current = null
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(ANTIGUO_TOKEN_KEY)
    setUsuario(null)
  }, [])

  const actualizarUsuario = useCallback((datos: Usuario) => {
    usuarioRef.current = datos
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datos))
    setUsuario(datos)
  }, [])

  const ingresar = useCallback(async (email: string, password: string): Promise<Usuario> => {
    // El login devuelve los datos básicos de la cuenta para consultar el perfil.
    const respuesta = await iniciarSesion(email.trim(), password)
    if (!Number.isInteger(respuesta.userId) || respuesta.userId <= 0) {
      throw new Error('El servidor no devolvió los datos de la cuenta.')
    }

    // Se consulta el perfil en el microservicio para confirmar el rol y que la cuenta siga activa.
    const perfil = await obtenerUsuario(respuesta.userId)
    if (!perfil.active || perfil.userId !== respuesta.userId || perfil.email !== respuesta.email || perfil.role !== respuesta.role) {
      throw new Error('No se pudo verificar la cuenta en la base de datos.')
    }

    usuarioRef.current = perfil
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(perfil))
    setUsuario(perfil)
    return perfil
  }, [])

  // Se vuelve a consultar MySQL a través del Gateway antes de permitir acciones protegidas.
  // La función es estable: lee el usuario desde un ref para no reiniciar efectos al refrescar el perfil.
  const validarUsuario = useCallback(async (): Promise<Usuario> => {
    const sesionActual = usuarioRef.current
    if (!sesionActual) throw new Error('Debes iniciar sesión o registrarte para continuar.')
    try {
      const perfil = await obtenerUsuario(sesionActual.userId)
      if (!perfil.active || perfil.userId !== sesionActual.userId || perfil.email !== sesionActual.email) {
        salir()
        throw new Error('Tu usuario no está activo o ya no existe. Inicia sesión nuevamente.')
      }
      usuarioRef.current = perfil
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(perfil))
      setUsuario(perfil)
      return perfil
    } catch (error) {
      if (error instanceof Error && error.message.includes('Inicia sesión nuevamente')) throw error
      // No asumir que el usuario es válido si MySQL o el Gateway no responden.
      throw new Error('No se pudo validar tu cuenta con el servidor. Intenta de nuevo.')
    }
  }, [salir])

  return <AuthContext.Provider value={{ usuario, ingresar, validarUsuario, actualizarUsuario, salir }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth necesita AuthProvider')
  return contexto
}
