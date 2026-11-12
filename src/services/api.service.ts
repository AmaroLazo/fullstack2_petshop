// Servicio central para comunicarnos con el API Gateway de Huellitas.
// Axios se configura una sola vez y los demas servicios reutilizan apiRequest.
import axios, { type AxiosRequestConfig, type Method } from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')

// Instancia compartida de Axios para todas las peticiones del frontend.
export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        Accept: 'application/json'
    }
})

// Conservamos el formato de opciones que ya ocupaban los servicios.
// Asi no es necesario cambiar todos los hooks ni las llamadas existentes.
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers)

    // Cuando enviamos un body JSON, indicamos su tipo de contenido.
    if (!headers.has('Content-Type') && options.body) {
        headers.set('Content-Type', 'application/json')
    }

    // Fetch permitia indicar cache: 'no-store'. Con Axios pedimos al navegador
    // y a los intermediarios que no reutilicen una respuesta almacenada.
    if (options.cache === 'no-store') {
        headers.set('Cache-Control', 'no-cache, no-store, max-age=0')
        headers.set('Pragma', 'no-cache')
    }

    const cabecerasAxios: Record<string, string> = {}
    headers.forEach((valor, nombre) => {
        cabecerasAxios[nombre] = valor
    })

    const config: AxiosRequestConfig = {
        url: endpoint,
        method: (options.method || 'GET') as Method,
        headers: cabecerasAxios,
        data: options.body ?? undefined,
        signal: options.signal ?? undefined
    }

    try {
        const respuesta = await apiClient.request<T>(config)
        return respuesta.data
    } catch (error) {
        // Axios guarda el codigo y el cuerpo de error en response.
        if (axios.isAxiosError(error)) {
            if (!error.response) {
                throw new Error(`No se pudo conectar con el API Gateway (${API_URL}). Revisa que esté iniciado.`)
            }

            const cuerpo = error.response.data as Record<string, unknown> | string | null
            let mensaje: string | undefined

            if (typeof cuerpo === 'string' && cuerpo.trim()) {
                mensaje = cuerpo
            } else if (cuerpo && typeof cuerpo === 'object') {
                const mensajeDirecto = cuerpo.message ?? cuerpo.error
                if (typeof mensajeDirecto === 'string' && mensajeDirecto.trim()) {
                    mensaje = mensajeDirecto
                } else {
                    mensaje = Object.values(cuerpo).find(
                        (valor): valor is string => typeof valor === 'string' && valor.trim().length > 0
                    )
                }
            }

            throw new Error(mensaje || `Error ${error.response.status}: ${error.response.statusText || 'No se pudo completar la solicitud.'}`)
        }

        throw error instanceof Error ? error : new Error('Ocurrió un error inesperado al comunicarse con el servidor.')
    }
}
