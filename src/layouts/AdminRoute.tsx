import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { AdminLayout } from './AdminLayout'

export const AdminRoute = () => {
  const { usuario, validarUsuario } = useAuth()
  const navigate = useNavigate()
  const [validando, setValidando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true

    if (!usuario) {
      navigate('/login?redirect=%2Fadmin', { replace: true })
      return () => { activo = false }
    }

    setValidando(true)
    setError('')
    void validarUsuario()
      .then(perfil => {
        if (!activo) return
        if (perfil.role !== 'ADMIN') {
          navigate('/', { replace: true })
          return
        }
        setValidando(false)
      })
      .catch(err => {
        if (!activo) return
        setError(err instanceof Error ? err.message : 'No se pudo validar la cuenta administradora.')
        setValidando(false)
      })

    return () => { activo = false }
  }, [usuario?.userId, validarUsuario, navigate])

  if (!usuario) return null

  if (validando) {
    return <main className="hc-admin-access-state" aria-live="polite">Validando permisos de administrador...</main>
  }

  if (error) {
    return <main className="hc-admin-access-state" role="alert">
      <h1>No se pudo validar el acceso</h1>
      <p>{error}</p>
      <Link to="/">Volver a la tienda</Link>
    </main>
  }

  return <AdminLayout />
}
