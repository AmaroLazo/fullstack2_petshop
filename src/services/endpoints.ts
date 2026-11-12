// Endpoints del proyecto. Los de productos ya corresponden al API Gateway de Huellitas.
// Las demás rutas quedan como referencias iniciales hasta implementar esos servicios.
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register'
    },
    USUARIO: {
        PERFIL: '/usuario/perfil'
    },
    ADMIN: {
        DASHBOARD: '/admin/dashboard'
    },
    PRODUCTOS: {
        LISTAR: '/api/v1/products',
        DISPONIBLES: '/api/v1/products/available',
        DETALLE: '/api/v1/products'
    },
    PEDIDOS: {
        LISTAR: '/pedidos',
        CREAR: '/pedidos'
    },
    PAGOS: {
        PROCESAR: '/pagos'
    }
}
