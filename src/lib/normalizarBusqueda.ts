/** Normaliza el texto para buscar sin distinguir tildes ni mayúsculas. */
export const normalizarBusqueda = (texto: string | number | null | undefined): string =>
  String(texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
