import { useCallback, useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { obtenerUsuario, type Usuario } from '../services/usuario.service'

export const useCuenta = () => {
  const { usuario, validarUsuario, actualizarUsuario, salir } = useAuth()
  const [perfil, setPerfil] = useState<Usuario | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargarCuenta = useCallback(async () => {
    if (!usuario) { setPerfil(null); setCargando(false); return }
    setCargando(true)
    setError('')
    try {
      const respuesta = await obtenerUsuario(usuario.userId)
      if (!respuesta.active || respuesta.userId !== usuario.userId) {
        salir()
        throw new Error('La cuenta ya no está activa. Inicia sesión nuevamente.')
      }
      setPerfil(respuesta)
    } catch (err) {
      setPerfil(null)
      setError(err instanceof Error ? err.message : 'No se pudo cargar la cuenta.')
    } finally { setCargando(false) }
  }, [usuario?.userId, salir])

  useEffect(() => { void cargarCuenta() }, [cargarCuenta])
  const guardarEnSesion = (datos: Usuario) => { actualizarUsuario(datos); setPerfil(datos) }
  return { usuario, perfil, cargando, error, refrescar: cargarCuenta,
    recargar: cargarCuenta, guardarEnSesion, validarUsuario, salir }
}
