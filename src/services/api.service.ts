// Servicio central para comunicarnos con el API Gateway de Huellitas.
// Axios se configura una sola vez y los demas servicios reutilizan apiRequest.
import axios, { type AxiosRequestConfig, type Method } from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8080')).replace(/\/+$/, '')
export const ACCESS_TOKEN_KEY = 'huellitas_access_token'
export const SESSION_EXPIRED_EVENT = 'huellitas:sesion-vencida'

export class RespuestaApiError extends Error {
    readonly status: number

    constructor(status: number, mensaje: string) {
        super(mensaje)
        this.status = status
    }
}

// Instancia compartida de Axios para todas las peticiones del frontend.
export const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        Accept: 'application/json'
    }
})

// Conservamos el formato de opciones que ya ocupaban los servicios.
// Asi no es necesario cambiar todos los hooks ni las llamadas existentes.
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers)
    const esAccesoPublico = options.method === 'POST'
        && (endpoint === '/api/users/login' || endpoint === '/api/users')
    const token = esAccesoPublico ? null : sessionStorage.getItem(ACCESS_TOKEN_KEY)
    if (token) headers.set('Authorization', `Bearer ${token}`)

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
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                throw new Error('El servidor tardó demasiado en responder. Intenta de nuevo.')
            }
            if (!error.response) {
                throw new Error(`No se pudo conectar con el API Gateway (${API_URL || 'http://localhost:8080'}). Revisa que esté iniciado.`)
            }

            if (error.response.status === 401 && token && token === sessionStorage.getItem(ACCESS_TOKEN_KEY)) {
                window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
                throw new Error('Tu sesión venció o dejó de ser válida. Inicia sesión nuevamente.')
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

            throw new RespuestaApiError(error.response.status,
                mensaje || `Error ${error.response.status}: ${error.response.statusText || 'No se pudo completar la solicitud.'}`)
        }

        throw error instanceof Error ? error : new Error('Ocurrió un error inesperado al comunicarse con el servidor.')
    }
}
