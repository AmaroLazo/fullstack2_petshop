// Validaciones simples para los formularios de Huellitas.
export const validarCorreo = (valor: string): string => {
  const correo = valor.trim()
  if (!correo) return 'Ingresa tu correo electrónico.'
  if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(correo)) {
    return 'Ingresa un correo válido, por ejemplo nombre@correo.cl.'
  }
  return ''
}

export const validarNombre = (valor: string): string => {
  const nombre = valor.trim().replace(/\s+/g, ' ')
  if (!nombre) return 'Ingresa tu nombre completo.'
  if (nombre.length < 3 || nombre.length > 100) return 'El nombre debe tener entre 3 y 100 caracteres.'
  if (!/^[\p{L}]+(?:[ '-][\p{L}]+)*$/u.test(nombre)) {
    return 'El nombre solo puede contener letras, espacios, apóstrofes y guiones; no números.'
  }
  if (nombre.split(' ').length < 2) return 'Ingresa al menos nombre y apellido.'
  return ''
}

export const validarTelefono = (valor: string): string => {
  return /^[0-9]{8}$/.test(valor) ? '' : 'Ingresa los 8 dígitos que siguen al +56 9.'
}
