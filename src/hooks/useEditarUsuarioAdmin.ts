import { useCallback, useState } from 'react'
import { useAuth } from './useAuth'
import type { DatosDireccion } from '../lib/direccion'
import {
  actualizarUsuarioAdmin, cambiarRolUsuario, alternarEstadoUsuario,
  agregarDireccion, eliminarDireccion, obtenerUsuario, type Usuario
} from '../services/usuario.service'

export const useEditarUsuarioAdmin = () => {
  const { validarUsuario, usuario, actualizarUsuario } = useAuth()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const comprobarAdmin = useCallback(async () => {
    const perfil = await validarUsuario()
    if (perfil.role !== 'ADMIN') throw new Error('Solo un administrador puede modificar usuarios.')
  }, [validarUsuario])

  const guardar = useCallback(async (
    original: Usuario,
    datos: { name: string; email: string; phone: string; role: Usuario['role']; active: boolean }
  ) => {
    setGuardando(true)
    setError('')
    try {
      await comprobarAdmin()
      // No permitir que el administrador desactive o quite el rol de su propia cuenta.
      if (original.userId === usuario?.userId && (datos.role !== 'ADMIN' || !datos.active)) {
        throw new Error('No puedes quitarte el rol ADMIN ni desactivar tu propia cuenta.')
      }
      let actualizado = original
      if (datos.name !== original.name || datos.email !== original.email || datos.phone !== (original.phone ?? '')) {
        actualizado = await actualizarUsuarioAdmin(original.userId, {
          name: datos.name, email: datos.email, phone: datos.phone
        })
      }
      if (datos.role !== original.role) await cambiarRolUsuario(original.userId, datos.role)
      if (datos.active !== original.active) await alternarEstadoUsuario(original.userId)
      actualizado = await obtenerUsuario(original.userId)
      if (actualizado.userId === usuario?.userId) actualizarUsuario(actualizado)
      return actualizado
    } catch (e) {
      const mensaje = e instanceof Error ? e.message : 'No se pudieron guardar los cambios.'
      setError(mensaje)
      throw e
    } finally { setGuardando(false) }
  }, [comprobarAdmin, usuario?.userId, actualizarUsuario])

  const anadirDireccion = useCallback(async (id: number, direccion: DatosDireccion) => {
    setGuardando(true)
    setError('')
    try {
      await comprobarAdmin()
      return await agregarDireccion(id, direccion)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agregar la dirección.')
      throw e
    } finally { setGuardando(false) }
  }, [comprobarAdmin])

  const quitarDireccion = useCallback(async (id: number, addressId: number) => {
    setGuardando(true)
    setError('')
    try {
      await comprobarAdmin()
      return await eliminarDireccion(id, addressId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la dirección.')
      throw e
    } finally { setGuardando(false) }
  }, [comprobarAdmin])

  return { guardar, anadirDireccion, quitarDireccion, guardando, error }
}
