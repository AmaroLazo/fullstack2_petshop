import { useEffect, useState } from 'react'
import { listarRegiones, type RegionChile } from '../services/usuario.service'

export function useRegiones() {
  const [regiones, setRegiones] = useState<RegionChile[]>([])
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    listarRegiones(controller.signal)
      .then(setRegiones)
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : 'No se pudieron cargar las regiones y comunas.')
        }
      })
    return () => controller.abort()
  }, [intento])

  const recargar = () => {
    setError('')
    setIntento((actual) => actual + 1)
  }

  return { regiones, error, recargar }
}
