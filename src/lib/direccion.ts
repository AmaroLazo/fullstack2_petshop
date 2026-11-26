export interface DatosDireccion {
  street: string
  houseNumber: string
  region: string
  city: string
  postalCode: string
}

export interface DireccionGuardada {
  street: string
  city: string
  houseNumber?: string | null
  region?: string | null
  postalCode?: string | null
}

export const direccionVacia: DatosDireccion = {
  street: '', houseNumber: '', region: '', city: '', postalCode: ''
}

export function limpiarDireccion(direccion: DatosDireccion): DatosDireccion {
  return {
    street: direccion.street.trim(),
    houseNumber: direccion.houseNumber.trim(),
    region: direccion.region.trim(),
    city: direccion.city.trim(),
    postalCode: direccion.postalCode.trim()
  }
}

export function validarDireccion(direccion: DatosDireccion): string {
  if (!direccion.street || !direccion.houseNumber || !direccion.region || !direccion.city) {
    return 'Completa la calle, el número de casa/departamento, la región y la comuna.'
  }
  return /^[0-9]{7}$/.test(direccion.postalCode) ? '' : 'Ingresa un código postal de 7 dígitos.'
}

export function formatearDireccion(direccion?: DireccionGuardada | null): string {
  if (!direccion) return ''
  const domicilio = [direccion.street, direccion.houseNumber].filter(Boolean).join(' ')
  return [domicilio, direccion.city, direccion.region, direccion.postalCode].filter(Boolean).join(', ')
}

export function validarDireccionRegistro(direccion: DatosDireccion): string {
  const error = validarDireccion(direccion)
  if (error) return error
  if (direccion.street.length < 3) return 'La calle debe tener al menos 3 caracteres.'
  if (!/^[0-9]+[A-Za-z]?$/.test(direccion.houseNumber)) return 'Ingresa el número de casa/departamento, con una letra opcional al final (ej.: 123 o 123B).'
  if (/\p{Nd}/u.test(direccion.region)) return 'La región no puede contener números.'
  if (/\p{Nd}/u.test(direccion.city)) return 'La comuna no puede contener números.'
  return ''
}
