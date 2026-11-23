import type { FormFieldDescriptor, FormSections } from '../quote-form/data/form-field.model';
import { buildSummaryRows } from './summary-rows';

function field(overrides: Partial<FormFieldDescriptor> & { key: string }): FormFieldDescriptor {
  return {
    label: overrides.key,
    type: 'text',
    required: false,
    helpText: null,
    placeholder: null,
    errorMessage: '',
    order: 1,
    section: 'policyholder',
    options: [],
    rules: { type: 'text', required: false, min: null, max: null, pattern: null, validators: [] },
    inputLimits: { allowedCharacters: null, maxLength: null },
    maskedInSummary: false,
    ...overrides,
  };
}

describe('US-03 · FR-001 summary rows from the configured fields', () => {
  const fields: FormSections = {
    policyholder: [
      field({ key: 'name', label: 'Nombre', required: true }),
      field({ key: 'documentNumber', label: 'Documento', maskedInSummary: true }),
      field({ key: 'birthDate', label: 'Nacimiento', type: 'date' }),
      field({
        key: 'docType',
        label: 'Tipo',
        type: 'select',
        options: [{ label: 'Cédula', value: 'cc' }],
      }),
      field({ key: 'nickname', label: 'Apodo' }),
    ],
    vehicle: [
      field({ key: 'plate', label: 'Placa', section: 'vehicle' }),
      field({ key: 'gas', label: 'Gas', section: 'vehicle', type: 'checkbox' }),
    ],
  };
  const values = {
    name: ' Ana ',
    documentNumber: '1020304050',
    birthDate: '1990-05-12',
    docType: 'cc',
    nickname: '',
    plate: 'ABC123',
    gas: false,
    removedField: 'x',
  };

  it('shows each configured value in order, skipping empty optionals and unknown keys', () => {
    const rows = buildSummaryRows(fields, values, 'es-CO');
    expect(rows.policyholder.map((r) => r.key)).toEqual([
      'name',
      'documentNumber',
      'birthDate',
      'docType',
    ]);
    expect(rows.vehicle.map((r) => r.key)).toEqual(['plate', 'gas']);
    expect(rows.policyholder[0].display).toBe('Ana');
  });

  it('masks the flagged field', () => {
    expect(buildSummaryRows(fields, values, 'es-CO').policyholder[1].display).toBe('••••••4050');
  });

  it('formats a date as dd/mm/yyyy for the locale', () => {
    expect(buildSummaryRows(fields, values, 'es-CO').policyholder[2].display).toBe('12/05/1990');
  });

  it('shows the option label of a select', () => {
    expect(buildSummaryRows(fields, values, 'es-CO').policyholder[3].display).toBe('Cédula');
  });

  it('shows a checkbox as Sí / No', () => {
    expect(buildSummaryRows(fields, values, 'es-CO').vehicle[1].display).toBe('No');
    expect(buildSummaryRows(fields, { ...values, gas: true }, 'es-CO').vehicle[1].display).toBe(
      'Sí',
    );
  });
});
