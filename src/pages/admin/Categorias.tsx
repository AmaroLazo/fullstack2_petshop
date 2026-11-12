import { useEffect, useState, type FormEvent } from 'react'
import { Plus, RefreshCw, Tags, X, Pencil, Save } from 'lucide-react'
import { useCategoriasAdmin } from '../../hooks/useCategoriasAdmin'
import { useAuth } from '../../hooks/useAuth'
import { listarTodosProductos } from '../../services/admin.service'
import type { Producto } from '../../services/producto.service'

const formularioVacio = { name: '', description: '' }

export const Categorias = () => {
  const { categorias, cargando, guardando, error, agregar, editar, recargar } = useCategoriasAdmin()
  const { usuario, validarUsuario } = useAuth()
  const [productos, setProductos] = useState<Producto[] | null>(null)
  const [errorProductos, setErrorProductos] = useState('')
  const [intento, setIntento] = useState(0)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [formulario, setFormulario] = useState(formularioVacio)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [exito, setExito] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [edicion, setEdicion] = useState({ name: '', description: '', active: true })

  const abrirEdicion = (id: number) => {
    const categoria = categorias.find(c => c.id === id)
    if (!categoria) return
    setEditandoId(id)
    setEdicion({ name: categoria.name, description: categoria.description ?? '', active: categoria.active !== false })
    setMostrarFormulario(false)
    setErrorFormulario('')
    setExito('')
  }

  const guardarEdicion = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (editandoId === null) return
    setErrorFormulario('')
    setExito('')
    const nombre = edicion.name.trim()
    const descripcion = edicion.description.trim()
    if (!nombre || nombre.length > 100 || descripcion.length > 255) {
      setErrorFormulario('Nombre obligatorio (máximo 100 caracteres) y descripción de hasta 255 caracteres.')
      return
    }
    try {
      const perfil = await validarUsuario()
      if (perfil.role !== 'ADMIN') throw new Error('Solo un administrador puede editar categorías.')
      const actualizada = await editar(editandoId, { name: nombre, description: descripcion, active: edicion.active })
      setEditandoId(null)
      setExito(`Categoría «${actualizada.name}» actualizada en MySQL.`)
    } catch (err) {
      setErrorFormulario(err instanceof Error ? err.message : 'No se pudo modificar la categoría.')
    }
  }

  useEffect(() => {
    let activo = true
    void listarTodosProductos()
      .then(datos => { if (activo) { setProductos(datos); setErrorProductos('') } })
      .catch(err => { if (activo) setErrorProductos(err instanceof Error ? err.message : 'No se pudieron consultar los productos.') })
    return () => { activo = false }
  }, [intento])

  const actualizar = () => {
    void recargar()
    setErrorProductos('')
    setIntento(actual => actual + 1)
  }

  const cambiar = (campo: keyof typeof formulario, valor: string) => {
    setFormulario(actual => ({ ...actual, [campo]: valor }))
  }

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setErrorFormulario('')
    setExito('')

    const nombre = formulario.name.trim()
    const descripcion = formulario.description.trim()

    if (!nombre || nombre.length > 100 || descripcion.length > 255) {
      setErrorFormulario('El nombre es obligatorio (máximo 100 caracteres) y la descripción admite hasta 255 caracteres.')
      return
    }

    try {
      // Se consulta nuevamente el perfil en el microservicio de usuarios antes de permitir el alta desde esta pantalla.
      const perfil = await validarUsuario()
      if (perfil.role !== 'ADMIN') {
        throw new Error('Solo una cuenta con rol ADMIN puede crear categorías desde el panel.')
      }

      const nueva = await agregar({ name: nombre, description: descripcion, active: true })
      setExito(`La categoría «${nueva.name}» se guardó en catalogo_db. Ya está disponible en el selector del catálogo público.`)
      setFormulario(formularioVacio)
      setMostrarFormulario(false)
    } catch (err) {
      setErrorFormulario(err instanceof Error ? err.message : 'No se pudo guardar la categoría.')
    }
  }

  const esAdministrador = usuario?.role === 'ADMIN'

  return <section className="hc-dashboard">
    <div className="hc-dashboard-heading">
      <div><span className="hc-section-kicker">ADMINISTRACIÓN / CATÁLOGO</span>
        <h1>Administrar categorías</h1>
        <p>Crea categorías que se guardan en catalogo_db y se muestran en el catálogo público.</p>
      </div>
      <div className="hc-admin-actions">
        <button type="button" className="hc-admin-btn secondary" onClick={actualizar} disabled={cargando}>
          <RefreshCw size={16}/> Actualizar
        </button>
        {esAdministrador && <button type="button" className="hc-admin-btn" onClick={() => { setEditandoId(null); setMostrarFormulario(actual => !actual); setErrorFormulario(''); setExito('') }}>
          {mostrarFormulario ? <X size={17}/> : <Plus size={17}/>} {mostrarFormulario ? 'Cerrar formulario' : 'Añadir categoría'}
        </button>}
      </div>
    </div>

    {!esAdministrador && <div className="hc-admin-error" role="alert">
      Para crear categorías debes iniciar sesión con una cuenta que tenga el rol ADMIN. La consulta de categorías del catálogo público no requiere iniciar sesión.
    </div>}
    {error && <div className="hc-admin-error" role="alert">{error}</div>}
    {errorProductos && <div className="hc-admin-error" role="alert">No se pudo consultar el total de productos: {errorProductos}</div>}
    {exito && <div className="hc-admin-success" role="status">{exito}</div>}

    {editandoId !== null && esAdministrador && <form onSubmit={guardarEdicion} className="hc-admin-product-form" id="form-editar-categoria">
      <h2><Pencil size={20}/> Editar categoría #{editandoId}</h2>
      <div className="hc-admin-form-grid">
        <label className="hc-admin-span">Nombre *<input required maxLength={100} value={edicion.name} onChange={e => setEdicion(f => ({ ...f, name: e.target.value }))}/></label>
        <label className="hc-admin-span">Descripción<textarea maxLength={255} rows={3} value={edicion.description} onChange={e => setEdicion(f => ({ ...f, description: e.target.value }))}/></label>
        <label className="hc-admin-span" style={{display:'flex',alignItems:'center',gap:10}}>
          <input type="checkbox" checked={edicion.active} onChange={e => setEdicion(f => ({ ...f, active: e.target.checked }))} style={{width:18,height:18}} />
          Categoría activa
        </label>
      </div>
      {errorFormulario && <div className="hc-admin-error" role="alert">{errorFormulario}</div>}
      <div className="hc-admin-actions">
        <button type="submit" className="hc-admin-btn" disabled={guardando || cargando}><Save size={17}/>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
        <button type="button" className="hc-admin-btn secondary" disabled={guardando} onClick={() => { setEditandoId(null); setErrorFormulario('') }}><X size={17}/> Cancelar</button>
      </div>
    </form>}
    {mostrarFormulario && esAdministrador && <form onSubmit={guardar} className="hc-admin-product-form">
      <h2><Tags size={20}/> Nueva categoría</h2>
      <div className="hc-admin-form-grid">
        <label className="hc-admin-span">Nombre de la categoría *
          <input required maxLength={100} value={formulario.name} onChange={evento => cambiar('name', evento.target.value)} placeholder="Ej.: Juguetes para perros" />
        </label>
        <label className="hc-admin-span">Descripción (opcional)
          <textarea maxLength={255} rows={3} value={formulario.description} onChange={evento => cambiar('description', evento.target.value)} placeholder="Describe brevemente qué productos pertenecen a esta categoría." />
        </label>
      </div>
      {errorFormulario && <div className="hc-admin-error" role="alert">{errorFormulario}</div>}
      <button type="submit" className="hc-admin-btn" disabled={guardando}>
        <Tags size={17}/> {guardando ? 'Guardando...' : 'Guardar categoría en MySQL'}
      </button>
    </form>}

    <div className="hc-dashboard-card">
      <div className="hc-card-heading"><div>
        <h2>{cargando ? 'Consultando...' : `${categorias.length} categoría(s)`}</h2>
        <p>Registros consultados desde catalogo_db</p>
      </div></div>
      <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr>
        <th>ID</th><th>Categoría</th><th>Descripción</th><th>Productos</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>
        {categorias.map(categoria => <tr key={categoria.id}>
          <td>#{categoria.id}</td><td><strong>{categoria.name}</strong></td><td>{categoria.description || '—'}</td>
          <td>{productos === null ? '—' : productos.filter(producto => producto.categoryId === categoria.id).length}</td>
          <td>{categoria.active === false ? 'Inactiva' : 'Activa'}</td>
          <td>{esAdministrador && <button type="button" className="hc-admin-btn secondary" disabled={guardando} onClick={() => abrirEdicion(categoria.id)}><Pencil size={16}/> Editar</button>}</td>
        </tr>)}
        {!cargando && categorias.length === 0 && <tr><td colSpan={6}>No hay categorías registradas.</td></tr>}
      </tbody></table></div>
    </div>
  </section>
}
