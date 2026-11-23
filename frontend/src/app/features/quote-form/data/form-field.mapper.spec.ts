import { mapFormFields } from './form-field.mapper';
import { FormFieldDto } from './form-field.model';

function dto(overrides: Partial<FormFieldDto>): FormFieldDto {
  return {
    id: 1,
    documentId: 'd',
    key: 'k',
    label: 'Label',
    type: 'text',
    required: true,
    helpText: null,
    placeholder: null,
    errorMessage: 'Error',
    order: 1,
    section: 'policyholder',
    validations: null,
    options: null,
    ...overrides,
  };
}

describe('US-01 · FR-002 form field mapper grouping and order', () => {
  it('groups by section and sorts by order', () => {
    const result = mapFormFields([
      dto({ key: 'b', order: 2, section: 'vehicle' }),
      dto({ key: 'c', order: 2 }),
      dto({ key: 'a', order: 1 }),
      dto({ key: 'd', order: 1, section: 'vehicle' }),
    ]);
    expect(result.policyholder.map((f) => f.key)).toEqual(['a', 'c']);
    expect(result.vehicle.map((f) => f.key)).toEqual(['d', 'b']);
  });

  it('keeps CMS order for equal order values (stable)', () => {
    const result = mapFormFields([dto({ key: 'x', order: 1 }), dto({ key: 'y', order: 1 })]);
    expect(result.policyholder.map((f) => f.key)).toEqual(['x', 'y']);
  });

  it('returns empty sections for no data', () => {
    expect(mapFormFields([])).toEqual({ policyholder: [], vehicle: [] });
  });

  it('drops unknown types and sections with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = mapFormFields([
      dto({ key: 'ok' }),
      dto({ key: 'bad-type', type: 'slider' }),
      dto({ key: 'bad-section', section: 'payment' }),
    ]);
    expect(result.policyholder.map((f) => f.key)).toEqual(['ok']);
    expect(result.vehicle).toEqual([]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});

describe('US-01 · FR-003 form field mapper rules and options', () => {
  it('maps null validations to empty rules mirroring required', () => {
    const [field] = mapFormFields([dto({ required: false, type: 'number' })]).policyholder;
    expect(field.rules).toEqual({
      type: 'number',
      required: false,
      min: null,
      max: null,
      pattern: null,
      validators: [],
    });
  });

  it('maps min, max, pattern and named validators', () => {
    const [field] = mapFormFields([
      dto({
        type: 'date',
        validations: {
          id: 1,
          min: 1,
          max: 9,
          pattern: '^[A-Z]+$',
          validators: [{ id: 1, name: 'legalAge', value: null }],
        },
      }),
    ]).policyholder;
    expect(field.rules).toEqual({
      type: 'date',
      required: true,
      min: 1,
      max: 9,
      pattern: '^[A-Z]+$',
      validators: [{ name: 'legalAge', value: null }],
    });
  });

  it('maps options, and null options to an empty list', () => {
    const [select] = mapFormFields([
      dto({ type: 'select', options: [{ id: 1, label: 'Chevrolet', value: 'chevrolet' }] }),
    ]).policyholder;
    expect(select.options).toEqual([{ label: 'Chevrolet', value: 'chevrolet' }]);
    const [text] = mapFormFields([dto({ options: null })]).policyholder;
    expect(text.options).toEqual([]);
  });
});

describe('US-01 · FR-015 form field mapper input limits', () => {
  const validations = (allowedCharacters: string | null, maxLength: number | null) => ({
    id: 1,
    min: null,
    max: null,
    pattern: null,
    validators: null,
    allowedCharacters,
    maxLength,
  });

  it('maps allowed characters and max length', () => {
    const [field] = mapFormFields([dto({ validations: validations('digits', 10) })]).policyholder;
    expect(field.inputLimits).toEqual({ allowedCharacters: 'digits', maxLength: 10 });
  });

  it('ignores an unknown character set with a warning, and missing limits', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const [field] = mapFormFields([dto({ validations: validations('emoji', null) })]).policyholder;
    expect(field.inputLimits).toEqual({ allowedCharacters: null, maxLength: null });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    const [plain] = mapFormFields([dto({ validations: null })]).policyholder;
    expect(plain.inputLimits).toEqual({ allowedCharacters: null, maxLength: null });
  });
});
