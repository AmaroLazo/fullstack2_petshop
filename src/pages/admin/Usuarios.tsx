import { EstadoActivo, EstadoBadge } from '../../components/admin/EstadoBadge'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Pencil, RefreshCw, Save, X, Plus, Trash2, Search } from 'lucide-react'
import { useDatosAdmin } from '../../hooks/useDatosAdmin'
import { useEditarUsuarioAdmin } from '../../hooks/useEditarUsuarioAdmin'
import type { Usuario } from '../../services/usuario.service'
import { normalizarBusqueda } from '../../lib/normalizarBusqueda'

type Formulario = { name: string; email: string; phone: string; role: Usuario['role']; active: boolean }

import { CamposDireccion } from '../../components/CamposDireccion'
import { direccionVacia, formatearDireccion, limpiarDireccion, validarDireccion } from '../../lib/direccion'

export const Usuarios = () => {
  const { usuarios, cargando, errores, recargar } = useDatosAdmin()
  const { guardar, anadirDireccion, quitarDireccion, guardando, error } = useEditarUsuarioAdmin()
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const usuariosFiltrados = (usuarios ?? []).filter(u => {
    const coincideTexto = normalizarBusqueda(`${u.userId} ${u.name} ${u.email} ${u.phone ?? ''}`)
      .includes(normalizarBusqueda(busqueda))
    const coincideEstado = estadoFiltro === 'todos' || (estadoFiltro === 'activos' ? u.active : !u.active)
    return coincideTexto && coincideEstado
  })

  const [form, setForm] = useState<Formulario>({ name: '', email: '', phone: '', role: 'CUSTOMER', active: true })
  const [datosDireccion, setDatosDireccion] = useState(direccionVacia)
  const [mensaje, setMensaje] = useState('')
  const [errorForm, setErrorForm] = useState('')
  const formularioRef = useRef<HTMLFormElement>(null)

  // Al aparecer el formulario, llevarlo a la vista, incluso desde el final de la tabla.
  useEffect(() => {
    if (seleccionado) formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [seleccionado?.userId])

  const editar = (u: Usuario) => {
    setSeleccionado(u)
    setForm({ name: u.name, email: u.email, phone: u.phone ?? '', role: u.role, active: u.active })
    setDatosDireccion(direccionVacia)
    setMensaje('')
    setErrorForm('')
    // Permite desplazarse también al hacer clic dos veces sobre el mismo usuario.
    if (seleccionado?.userId === u.userId) formularioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const guardarCambios = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!seleccionado || guardando) return
    setErrorForm('')
    setMensaje('')
    const datos = { ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() }
    if (!datos.name || datos.name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email) || datos.phone.length > 30) {
      setErrorForm('Revisa nombre completo, correo y teléfono.')
      return
    }
    try {
      const actualizado = await guardar(seleccionado, datos)
      setSeleccionado(actualizado)
      setForm({ name: actualizado.name, email: actualizado.email, phone: actualizado.phone ?? '', role: actualizado.role, active: actualizado.active })
      setMensaje('Usuario actualizado correctamente en MySQL.')
      recargar()
    } catch { /* El hook muestra el error. */ }
  }

  const agregar = async () => {
    if (!seleccionado || guardando) return
    setErrorForm('')
    setMensaje('')
    const direccion = limpiarDireccion(datosDireccion)
    const errorDireccion = validarDireccion(direccion)
    if (errorDireccion) { setErrorForm(errorDireccion); return }
    try {
      const actualizado = await anadirDireccion(seleccionado.userId, direccion)
      setSeleccionado(actualizado)
      setDatosDireccion(direccionVacia)
      setMensaje('Dirección agregada correctamente.')
      recargar()
    } catch { /* El hook muestra el error. */ }
  }

  const eliminar = async (addressId: number) => {
    if (!seleccionado || guardando || !window.confirm('¿Eliminar esta dirección del usuario?')) return
    setErrorForm('')
    setMensaje('')
    try {
      const actualizado = await quitarDireccion(seleccionado.userId, addressId)
      setSeleccionado(actualizado)
      setMensaje('Dirección eliminada correctamente.')
      recargar()
    } catch { /* El hook muestra el error. */ }
  }

  return <section className="hc-dashboard">
    <div className="hc-dashboard-heading"><div><span className="hc-section-kicker">ADMINISTRACIÓN / CLIENTES</span>
      <h1>Usuarios registrados</h1><p>Gestiona usuarios, roles y direcciones desde el microservicio de usuarios.</p></div>
      <button type="button" className="hc-admin-btn secondary" onClick={recargar} disabled={cargando}><RefreshCw size={16}/> Actualizar</button>
    </div>
    {errores.length > 0 && <div className="hc-admin-error" role="alert">{errores.join(' · ')}</div>}
    {seleccionado && <form ref={formularioRef} onSubmit={guardarCambios} className="hc-admin-product-form" id="form-editar-usuario" style={{ scrollMarginTop: 24 }}>
      <h2><Pencil size={20}/> Editar usuario #{seleccionado.userId}</h2>
      <div className="hc-admin-form-grid">
        <label>Nombre completo *<input required maxLength={100} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></label>
        <label>Correo electrónico *<input type="email" required maxLength={100} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></label>
        <label>Teléfono<input maxLength={30} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></label>
        <label>Rol<select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value as Usuario['role']}))}>
          <option value="CUSTOMER">Cliente</option><option value="ADMIN">Administrador</option>
        </select></label>
        <label className="hc-admin-span" style={{display:'flex',alignItems:'center',gap:10}}>
          <input style={{width:18,height:18}} type="checkbox" checked={form.active} onChange={e=>setForm(f=>({...f,active:e.target.checked}))}/>
          Cuenta activa
        </label>
      </div>
      <h3>Direcciones registradas</h3>
      {(seleccionado.addresses ?? []).length === 0 && <p>No hay direcciones registradas.</p>}
      {(seleccionado.addresses ?? []).map(a=><div key={a.id} className="hc-admin-actions" style={{justifyContent:'space-between',marginBottom:8}}>
        <span>{formatearDireccion(a)}</span>
        <button type="button" className="hc-admin-btn secondary" disabled={guardando} onClick={()=>void eliminar(a.id)}><Trash2 size={16}/> Eliminar</button>
      </div>)}
      <CamposDireccion value={datosDireccion} onChange={setDatosDireccion} className="hc-admin-form-grid" required={false} />
      <div className="hc-admin-actions"><button className="hc-admin-btn secondary" type="button" disabled={guardando} onClick={()=>void agregar()}><Plus size={16}/> Agregar dirección</button></div>
      {(error || errorForm) && <div className="hc-admin-error" role="alert">{errorForm || error}</div>}
      {mensaje && <div className="hc-admin-success" role="status">{mensaje}</div>}
      <div className="hc-admin-actions">
        <button className="hc-admin-btn" type="submit" disabled={guardando}><Save size={16}/>{guardando?'Guardando...':'Guardar cambios'}</button>
        <button className="hc-admin-btn secondary" type="button" disabled={guardando} onClick={()=>setSeleccionado(null)}><X size={16}/> Cerrar</button>
      </div>
    </form>}
    <div className="hc-dashboard-card"><div className="hc-card-heading"><div><h2>{cargando ? 'Consultando...' : usuarios === null ? 'Sin conexión' : `${usuariosFiltrados.length} de ${usuarios.length} usuario(s)`}</h2><p>Registros de usuarios_db</p></div></div>
      <div className="hc-admin-filtros">
        <label className="hc-admin-filtro-busqueda"><span>Buscar usuario</span>
          <span className="hc-admin-search-field"><Search size={18} aria-hidden="true" />
            <input type="search" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre, correo, teléfono o ID" aria-label="Buscar usuarios" />
          </span>
        </label>
        <label><span>Filtrar por estado</span>
          <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)} aria-label="Filtrar usuarios por estado">
            <option value="todos">Todos</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option>
          </select>
        </label>
        <button type="button" className="hc-admin-btn secondary" disabled={!busqueda && estadoFiltro === 'todos'} onClick={() => { setBusqueda(''); setEstadoFiltro('todos') }}>Limpiar filtros</button>
      </div>
      <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr><th>ID</th><th>Nombre completo</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
        {usuariosFiltrados.map(u=><tr key={u.userId}><td>#{u.userId}</td><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.phone||'—'}</td><td><EstadoBadge tono={u.role === 'ADMIN' ? 'info' : 'neutral'}>{u.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</EstadoBadge></td><td><EstadoActivo activo={u.active} /></td>
          <td><button type="button" className="hc-admin-btn secondary" disabled={guardando} onClick={()=>editar(u)}><Pencil size={16}/> Editar</button></td></tr>)}
        {!cargando && usuarios?.length === 0 && <tr><td colSpan={7}>No hay usuarios registrados en la base de datos.</td></tr>}
        {!cargando && usuarios !== null && usuarios.length > 0 && usuariosFiltrados.length === 0 && <tr><td colSpan={7}>No hay usuarios que coincidan con los filtros.</td></tr>}
      </tbody></table></div>
    </div>
  </section>
}
