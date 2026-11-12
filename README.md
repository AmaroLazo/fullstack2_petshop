# 🐾 PetShop Huellitas – Frontend

## Descripción

Frontend de **PetShop Huellitas**, una tienda web de productos para mascotas desarrollada con React y TypeScript.

La aplicación permite consultar productos, registrarse, iniciar sesión, administrar un carrito de compras, realizar pedidos y acceder a un panel de administración.

Se conecta a microservicios desarrollados con Spring Boot mediante un API Gateway.

## Tecnologías utilizadas

- **React:** construcción de interfaces y componentes.
- **TypeScript:** tipado de datos y funciones.
- **Vite:** entorno de desarrollo.
- **React Router:** navegación entre páginas.
- **Tailwind CSS y shadcn/ui:** estilos y componentes visuales.
- **Lucide React:** iconos.
- **Fetch API:** peticiones HTTP hacia el backend.
- **React Hooks:** manejo de estados y lógica.

## Estructura del proyecto

```text
src/
├── components/   # Componentes reutilizables y shadcn/ui
├── hooks/        # Hooks personalizados
├── layouts/      # Estructuras de las páginas
├── pages/        # Vistas de usuarios, autenticación y administración
├── router/       # Configuración de rutas
├── services/     # Comunicación con los microservicios
├── lib/          # Funciones auxiliares
└── index.css     # Estilos generales
```

## Instalación

**1. Clonar el repositorio**

```bash
git clone URL_DEL_REPOSITORIO
cd petshop
```

**2. Instalar dependencias**

```bash
npm install
```

**3. Configurar el archivo `.env`**

```env
VITE_API_URL=http://localhost:8080
```

**4. Iniciar el frontend**

```bash
npm run dev
```

La aplicación estará disponible en:

`http://localhost:5173`

Es necesario tener funcionando el API Gateway y los microservicios para cargar y guardar datos.

## Funcionalidades

### Clientes
- Registro e inicio de sesión.
- Catálogo con búsqueda y categorías.
- Detalle de productos.
- Carrito de compras.
- Proceso de compra y pagos de prueba.
- Perfil, direcciones e historial de compras.

### Administradores
- Dashboard con estadísticas.
- Gestión de productos y stock.
- Gestión de categorías.
- Consulta de usuarios y pedidos.
- Reportes de ventas y productos.

## Arquitectura

```text
React + TypeScript
        |
        v
Services (Fetch API)
        |
        v
API Gateway (8080)
        |
        +-- Usuarios (8090)
        +-- Catálogo (8082)
        +-- Pedidos (8084)
        +-- Pagos (8091)
        |
        v
       MySQL
```

## Hooks y promesas

El proyecto utiliza `useState`, `useEffect`, `useCallback` y hooks personalizados para manejar información, formularios y estados de carga.

Las peticiones al backend se realizan mediante promesas con `async/await` y manejo de errores con `try/catch/finally`.

Se sigue la organización:

**Pages → Hooks → Services → API Gateway → Microservicios**

## Consideraciones

- El backend debe estar funcionando para utilizar las funcionalidades conectadas a MySQL.
- El procesamiento de pagos utiliza una pasarela de prueba.
- La autenticación y autorización del backend requieren mejoras antes de utilizar el sistema en producción.
- El proyecto está desarrollado con fines académicos.

## Equipo de desarrollo

Proyecto académico **PetShop Huellitas**.
