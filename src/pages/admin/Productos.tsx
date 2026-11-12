import { useState, type FormEvent } from 'react'
import { PackagePlus, Plus, RefreshCw, X, Pencil, Save } from 'lucide-react'
import { useProductosAdmin } from '../../hooks/useProductosAdmin'
import { useAuth } from '../../hooks/useAuth'
import type { NuevoProducto, ActualizacionProducto } from '../../services/admin.service'

const moneda = (n: number | string) => Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const vacio = { name: '', description: '', imageUrl: '', price: '', discountPercent: '0', stockQuantity: '0', minStock: '0', categoryId: '' }

export const Productos = () => {
  const { productos, categorias, cargando, guardando, error, agregar, editar, recargar } = useProductosAdmin()
  const { usuario, validarUsuario } = useAuth()
  const [mostrar, setMostrar] = useState(false)
  const [formulario, setFormulario] = useState(vacio)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [exito, setExito] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [edicion, setEdicion] = useState({ ...vacio, active: true })

  const abrirEdicion = (id: number) => {
    const seleccionado = productos.find(p => p.id === id)
    if (!seleccionado) return
    setEditandoId(id)
    setMostrar(false)
    setErrorFormulario('')
    setExito('')
    setEdicion({
      name: seleccionado.name,
      description: seleccionado.description ?? '',
      imageUrl: seleccionado.imageUrl?.startsWith('http') ? seleccionado.imageUrl : '',
      price: String(seleccionado.price),
      discountPercent: String(seleccionado.discountPercent ?? 0),
      stockQuantity: String(seleccionado.stockQuantity ?? 0),
      minStock: String(seleccionado.minStock ?? 0),
      categoryId: String(seleccionado.categoryId ?? ''),
      active: seleccionado.active !== false
    })
  }

  const guardarEdicion = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (editandoId === null) return
    setErrorFormulario('')
    setExito('')
    const datos: ActualizacionProducto = {
      name: edicion.name.trim(), description: edicion.description.trim(),
      imageUrl: edicion.imageUrl.trim(), price: Number(edicion.price),
      discountPercent: Number(edicion.discountPercent),
      stockQuantity: Number(edicion.stockQuantity), minStock: Number(edicion.minStock),
      categoryId: Number(edicion.categoryId), active: edicion.active
    }
    if (!datos.name || datos.name.length > 150 || datos.description.length > 500 ||
      !edicion.price.trim() || !Number.isFinite(datos.price) || datos.price <= 0 ||
      !edicion.discountPercent.trim() || !Number.isFinite(datos.discountPercent) ||
      datos.discountPercent < 0 || datos.discountPercent > 100 ||
      !edicion.stockQuantity.trim() || !Number.isInteger(datos.stockQuantity) || datos.stockQuantity < 0 ||
      !edicion.minStock.trim() || !Number.isInteger(datos.minStock) || datos.minStock < 0 ||
      !categorias.some(c => c.id === datos.categoryId && c.active !== false)) {
      setErrorFormulario('Revisa nombre, categoría activa, precio, descuento y stock.')
      return
    }
    try {
      const perfil = await validarUsuario()
      if (perfil.role !== 'ADMIN') throw new Error('Solo un administrador puede editar productos.')
      const actualizado = await editar(editandoId, datos)
      setEditandoId(null)
      setExito(`Producto «${actualizado.name}» actualizado correctamente en MySQL.`)
    } catch (err) {
      setErrorFormulario(err instanceof Error ? err.message : 'No se pudo modificar el producto.')
    }
  }

  const cambiar = (campo: keyof typeof vacio, valor: string) => {
    setFormulario(anterior => ({ ...anterior, [campo]: valor }))
  }

  const guardar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setErrorFormulario('')
    setExito('')
    const datos: NuevoProducto = {
      name: formulario.name.trim(), description: formulario.description.trim(),
      imageUrl: formulario.imageUrl.trim() || undefined,
      price: Number(formulario.price), discountPercent: Number(formulario.discountPercent),
      stockQuantity: Number(formulario.stockQuantity), minStock: Number(formulario.minStock),
      categoryId: Number(formulario.categoryId)
    }
    if (!datos.name || datos.name.length > 150 || datos.description.length > 500 ||
      !Number.isFinite(datos.price) || datos.price <= 0 ||
      !Number.isFinite(datos.discountPercent) || datos.discountPercent < 0 || datos.discountPercent > 100 ||
      !Number.isInteger(datos.stockQuantity) || datos.stockQuantity < 0 ||
      !Number.isInteger(datos.minStock) || datos.minStock < 0 ||
      !categorias.some(c => c.id === datos.categoryId && c.active !== false)) {
      setErrorFormulario('Revisa el nombre, categoría, precio, descuento y cantidades ingresadas.')
      return
    }
    try {
      const nuevo = await agregar(datos)
      setExito(`Producto «${nuevo.name}» guardado en MySQL con ID ${nuevo.id}.`)
      setFormulario(vacio)
      setMostrar(false)
    } catch (e) {
      setErrorFormulario(e instanceof Error ? e.message : 'No se pudo guardar el producto.')
    }
  }

  return <section className="hc-admin-products">
    <div className="hc-dashboard-heading"><div><span className="hc-section-kicker">HUELLITAS CLUB / ADMINISTRACIÓN</span>
      <h1>Administrar productos</h1><p>Productos y categorías obtenidos del microservicio de catálogo.</p></div>
      <div className="hc-admin-actions"><button type="button" className="hc-admin-btn secondary" onClick={recargar} disabled={cargando}>
        <RefreshCw size={16} /> Actualizar</button>
        <button type="button" className="hc-admin-btn" onClick={() => { setEditandoId(null); setMostrar(v => !v); setErrorFormulario(''); setExito('') }}>
          {mostrar ? <X size={17}/> : <Plus size={17}/>} {mostrar ? 'Cerrar formulario' : 'Añadir producto'}</button></div>
    </div>
    {error && <div className="hc-admin-error" role="alert">{error}</div>}
    {exito && <div className="hc-admin-success" role="status">{exito}</div>}
    {editandoId !== null && <form onSubmit={guardarEdicion} className="hc-admin-product-form" id="form-editar-producto">
      <h2><Pencil size={20}/> Editar producto #{editandoId}</h2>
      <div className="hc-admin-form-grid">
        <label>Nombre *<input required maxLength={150} value={edicion.name} onChange={e => setEdicion(f => ({ ...f, name: e.target.value }))}/></label>
        <label>Categoría *<select required value={edicion.categoryId} onChange={e => setEdicion(f => ({ ...f, categoryId: e.target.value }))}>
          <option value="">Selecciona una categoría</option>
          {categorias.filter(c => c.active !== false).map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
        </select></label>
        <label>Precio (CLP) *<input type="number" required min="0.01" step="0.01" value={edicion.price} onChange={e => setEdicion(f => ({ ...f, price: e.target.value }))}/></label>
        <label>Descuento (%)<input type="number" min="0" max="100" step="0.01" value={edicion.discountPercent} onChange={e => setEdicion(f => ({ ...f, discountPercent: e.target.value }))}/></label>
        <label>Stock disponible *<input type="number" required min="0" step="1" value={edicion.stockQuantity} onChange={e => setEdicion(f => ({ ...f, stockQuantity: e.target.value }))}/></label>
        <label>Stock mínimo<input type="number" required min="0" step="1" value={edicion.minStock} onChange={e => setEdicion(f => ({ ...f, minStock: e.target.value }))}/></label>
        <label className="hc-admin-span">URL de imagen<input type="url" value={edicion.imageUrl} onChange={e => setEdicion(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..."/></label>
        <label className="hc-admin-span">Descripción<textarea maxLength={500} rows={3} value={edicion.description} onChange={e => setEdicion(f => ({ ...f, description: e.target.value }))}/></label>
        <label className="hc-admin-span" style={{display:'flex',alignItems:'center',gap:10}}>
          <input type="checkbox" checked={edicion.active} onChange={e => setEdicion(f => ({ ...f, active: e.target.checked }))} style={{width:18,height:18}} />
          Producto activo (visible en la tienda cuando tenga stock)
        </label>
      </div>
      {errorFormulario && <div className="hc-admin-error" role="alert">{errorFormulario}</div>}
      <div className="hc-admin-actions">
        <button type="submit" className="hc-admin-btn" disabled={guardando || cargando}><Save size={17}/>{guardando ? 'Guardando...' : 'Guardar cambios'}</button>
        <button type="button" className="hc-admin-btn secondary" disabled={guardando} onClick={() => { setEditandoId(null); setErrorFormulario('') }}><X size={17}/> Cancelar</button>
      </div>
    </form>}
    {mostrar && <form onSubmit={guardar} className="hc-admin-product-form">
      <h2><PackagePlus size={20}/> Nuevo producto</h2>
      <div className="hc-admin-form-grid">
        <label>Nombre del producto *<input required maxLength={150} value={formulario.name} onChange={e => cambiar('name', e.target.value)}/></label>
        <label>Categoría *<select required value={formulario.categoryId} onChange={e => cambiar('categoryId', e.target.value)}>
          <option value="">Selecciona una categoría</option>
          {categorias.filter(c => c.active !== false).map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
        </select></label>
        <label>Precio (CLP) *<input type="number" required min="1" step="0.01" value={formulario.price} onChange={e => cambiar('price', e.target.value)}/></label>
        <label>Descuento (%)<input type="number" min="0" max="100" step="0.01" value={formulario.discountPercent} onChange={e => cambiar('discountPercent', e.target.value)}/></label>
        <label>Stock inicial *<input type="number" required min="0" step="1" value={formulario.stockQuantity} onChange={e => cambiar('stockQuantity', e.target.value)}/></label>
        <label>Stock mínimo<input type="number" min="0" step="1" value={formulario.minStock} onChange={e => cambiar('minStock', e.target.value)}/></label>
        <label className="hc-admin-span">URL de imagen (opcional)<input type="url" placeholder="https://..." value={formulario.imageUrl} onChange={e => cambiar('imageUrl', e.target.value)}/></label>
        <label className="hc-admin-span">Descripción<textarea maxLength={500} rows={3} value={formulario.description} onChange={e => cambiar('description', e.target.value)}/></label>
      </div>
      {errorFormulario && <div className="hc-admin-error" role="alert">{errorFormulario}</div>}
      <button type="submit" className="hc-admin-btn" disabled={guardando || cargando || categorias.length === 0}>
        <PackagePlus size={17}/> {guardando ? 'Guardando...' : 'Guardar producto en MySQL'}</button>
    </form>}
    <div className="hc-dashboard-card"><div className="hc-card-heading"><div><h2>Productos registrados</h2>
      <p>{cargando ? 'Cargando productos...' : `${productos.length} producto(s) en el catálogo`}</p></div></div>
      <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr>
        <th>ID</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>
        {productos.map(p => <tr key={p.id}><td>#{p.id}</td><td><strong>{p.name}</strong></td>
          <td>{p.categoryName || 'Sin categoría'}</td><td>{moneda(p.price)}</td><td>{p.stockQuantity ?? '—'}</td>
          <td>{p.active === false ? 'Inactivo' : 'Activo'}</td>
          <td><button type="button" className="hc-admin-btn secondary" onClick={() => abrirEdicion(p.id)} disabled={guardando || usuario?.role !== 'ADMIN'}>
            <Pencil size={16}/> Editar
          </button></td></tr>)}
        {!cargando && !error && productos.length === 0 && <tr><td colSpan={7}>No hay productos. Usa «Añadir producto» para crear el primero.</td></tr>}
      </tbody></table></div></div>
  </section>
}
