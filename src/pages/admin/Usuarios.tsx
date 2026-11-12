import { RefreshCw } from 'lucide-react'
import { useDatosAdmin } from '../../hooks/useDatosAdmin'

export const Usuarios = () => {
  const { usuarios, cargando, errores, recargar } = useDatosAdmin()
  return <section className="hc-dashboard">
    <div className="hc-dashboard-heading"><div><span className="hc-section-kicker">ADMINISTRACIÓN / CLIENTES</span>
      <h1>Usuarios registrados</h1><p>Información real del microservicio de usuarios.</p></div>
      <button type="button" className="hc-admin-btn secondary" onClick={recargar} disabled={cargando}><RefreshCw size={16}/> Actualizar</button>
    </div>
    {errores.length > 0 && <div className="hc-admin-error" role="alert">{errores.join(' · ')}</div>}
    <div className="hc-dashboard-card"><div className="hc-card-heading"><div><h2>{cargando ? 'Consultando...' : usuarios === null ? 'Sin conexión' : `${usuarios.length} usuario(s)`}</h2><p>Registros de usuarios_db</p></div></div>
      <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr><th>ID</th><th>Nombre completo</th><th>Correo</th><th>Teléfono</th><th>Rol</th><th>Estado</th></tr></thead><tbody>
        {(usuarios ?? []).map(u => <tr key={u.userId}><td>#{u.userId}</td><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{u.role}</td><td>{u.active ? 'Activo' : 'Inactivo'}</td></tr>)}
        {!cargando && usuarios?.length === 0 && <tr><td colSpan={6}>No hay usuarios registrados en la base de datos.</td></tr>}
      </tbody></table></div>
    </div>
  </section>
}
