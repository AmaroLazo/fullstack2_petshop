import type { DatosDireccion } from '../lib/direccion'
import { useRegiones } from '../hooks/useRegiones'

const campos = [
  { key: 'street', label: 'Calle', maxLength: 100, autoComplete: 'address-line1', placeholder: 'Ej.: Los Robles' },
  { key: 'houseNumber', label: 'Número de casa/departamento', maxLength: 20, placeholder: 'Ej.: 123' },
  { key: 'region', label: 'Región' },
  { key: 'city', label: 'Comuna' },
  { key: 'postalCode', label: 'Código postal', maxLength: 7, autoComplete: 'postal-code', placeholder: '7 dígitos' }
] as const

interface Props {
  value: DatosDireccion
  onChange: (direccion: DatosDireccion) => void
  className?: string
  inputClassName?: string
  required?: boolean
  registro?: boolean
}

export function CamposDireccion({ value, onChange, className, inputClassName, required = true, registro = false }: Props) {
  const { regiones, error, recargar } = useRegiones()
  const comunas = regiones.find((region) => region.nombre === value.region)?.comunas ?? []
  const opcionRegion = error ? 'Regiones no disponibles' : regiones.length ? 'Selecciona una región' : 'Cargando regiones…'
  const claseSelector = inputClassName ?? 'w-full rounded-md border border-input bg-background px-3 py-2 disabled:opacity-60'

  return (
    <div className={className ?? 'grid gap-3 sm:grid-cols-2'}>
      {campos.map((campo) => (
        <label key={campo.key} className="block space-y-1 text-sm font-medium">
          {campo.label}
          {campo.key === 'region' ? (
            <select
              className={claseSelector}
              required={required}
              value={value.region}
              disabled={!regiones.length}
              onChange={(e) => onChange({ ...value, region: e.target.value, city: '' })}
            >
              <option value="">{opcionRegion}</option>
              {regiones.map(({ nombre }) => <option key={nombre} value={nombre}>{nombre}</option>)}
            </select>
          ) : campo.key === 'city' ? (
            <select
              className={claseSelector}
              required={required}
              value={value.city}
              disabled={!comunas.length}
              onChange={(e) => onChange({ ...value, city: e.target.value })}
            >
              <option value="">{comunas.length ? 'Selecciona una comuna' : 'Selecciona primero la región'}</option>
              {comunas.map((comuna) => <option key={comuna} value={comuna}>{comuna}</option>)}
            </select>
          ) : <input
            className={inputClassName}
            required={required}
            minLength={registro && campo.key === 'street' ? 3 : undefined}
            maxLength={campo.maxLength}
            autoComplete={'autoComplete' in campo ? campo.autoComplete : undefined}
            inputMode={campo.key === 'postalCode' ? 'numeric' : undefined}
            pattern={registro && campo.key === 'houseNumber' ? '[0-9]+[A-Za-z]?' : campo.key === 'postalCode' && required ? '[0-9]{7}' : undefined}
            title={registro && campo.key === 'houseNumber' ? 'Ej.: 123 o 123B. La letra al final es opcional.' : campo.key === 'postalCode' ? 'Ingresa 7 dígitos.' : undefined}
            placeholder={campo.placeholder}
            value={value[campo.key]}
            onChange={(e) => onChange({ ...value, [campo.key]: e.target.value })}
          />}
        </label>
      ))}
      {error && <div className="sm:col-span-2">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button type="button" className="text-sm underline" onClick={recargar}>Reintentar</button>
      </div>}
    </div>
  )
}
