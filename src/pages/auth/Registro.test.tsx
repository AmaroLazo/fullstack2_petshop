// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { validarDireccionRegistro } from '../../lib/direccion'
import { validarCorreo, validarTelefono } from '../../lib/validaciones-auth'
import { Registro } from './Registro'

vi.mock('../../hooks/useRegiones', () => ({
  useRegiones: () => ({
    regiones: [
      { nombre: 'Región del Biobío', comunas: ['Coronel', 'Concepción'] },
      { nombre: 'Región de Ñuble', comunas: ['Chillán'] },
    ],
    error: '',
    recargar: vi.fn(),
  }),
}))

afterEach(cleanup)

const mostrarRegistro = () => render(<MemoryRouter><Registro /></MemoryRouter>)

describe('Crear usuario', () => {
  it('rechaza correos sin dominio y acepta un correo válido', () => {
    expect(validarCorreo('cliente@')).not.toBe('')
    expect(validarCorreo('cliente@ejemplo.cl')).toBe('')
  })

  it('valida exactamente los ocho dígitos del teléfono después del prefijo', () => {
    expect(validarTelefono('12345678')).toBe('')
    expect(validarTelefono('1234567')).not.toBe('')
    expect(validarTelefono('123456789')).not.toBe('')
    expect(validarTelefono('1234567A')).not.toBe('')
  })

  it('valida la calle y permite una letra opcional al final del domicilio', () => {
    const direccion = {
      street: 'Los Robles', houseNumber: '123', region: 'Región del Biobío',
      city: 'Coronel', postalCode: '1234567',
    }
    expect(validarDireccionRegistro(direccion)).toBe('')
    expect(validarDireccionRegistro({ ...direccion, houseNumber: '123B' })).toBe('')
    expect(validarDireccionRegistro({ ...direccion, houseNumber: 'B123' })).not.toBe('')
    expect(validarDireccionRegistro({ ...direccion, street: 'AB' })).not.toBe('')
  })

  it('filtra las comunas y limpia la selección cuando cambia la región', () => {
    mostrarRegistro()
    const region = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Región' })
    const comuna = screen.getByRole<HTMLSelectElement>('combobox', { name: 'Comuna' })

    expect(comuna.disabled).toBe(true)
    fireEvent.change(region, { target: { value: 'Región del Biobío' } })
    expect(within(comuna).queryByRole('option', { name: 'Chillán' })).toBeNull()
    fireEvent.change(comuna, { target: { value: 'Coronel' } })
    expect(comuna.value).toBe('Coronel')

    fireEvent.change(region, { target: { value: 'Región de Ñuble' } })
    expect(comuna.value).toBe('')
    expect(within(comuna).queryByRole('option', { name: 'Coronel' })).toBeNull()
    expect(within(comuna).getByRole('option', { name: 'Chillán' })).toBeTruthy()
  })

  it('mantiene el snapshot del campo de teléfono con el prefijo fijo', () => {
    mostrarRegistro()
    const telefono = screen.getByRole('textbox', { name: /número de teléfono/i })
    expect(telefono.parentElement).toMatchSnapshot()
  })
})
