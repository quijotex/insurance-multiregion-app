import type { Core } from '@strapi/strapi';
import {
  CL_MOBILE_PATTERN,
  CL_PLATE_PATTERN,
  CL_RUT_PATTERN,
  CO_DOCUMENT_NUMBER_PATTERN,
  CO_MOBILE_PATTERN,
  CO_PLATE_PATTERN,
  EMAIL_PATTERN,
  FULL_NAME_PATTERN,
} from './form-field-patterns';

const FIELD_UID = 'api::form-field.form-field';
const COUNTRY_UID = 'api::country.country';
const DEFAULT_LEGAL_AGE = 18;

interface SeedOption {
  label: string;
  value: string;
}

interface SeedField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox';
  section: 'policyholder' | 'vehicle';
  order: number;
  helpText?: string;
  placeholder?: string;
  errorMessage: string;
  options?: SeedOption[];
  validations?: {
    pattern?: string;
    validators?: Array<{ name: string; value?: number }>;
    allowedCharacters?: 'digits' | 'alphanumeric' | 'rut';
    maxLength?: number;
  };
}

const opts = (labels: string[]): SeedOption[] => labels.map((l) => ({ label: l, value: l }));

/** The 16 regions of Chile, north to south. */
export const CL_REGIONS = [
  'Arica y Parinacota',
  'Tarapacá',
  'Antofagasta',
  'Atacama',
  'Coquimbo',
  'Valparaíso',
  'Metropolitana de Santiago',
  "Libertador General Bernardo O'Higgins",
  'Maule',
  'Ñuble',
  'Biobío',
  'La Araucanía',
  'Los Ríos',
  'Los Lagos',
  'Aysén del General Carlos Ibáñez del Campo',
  'Magallanes y de la Antártica Chilena',
];

const MAKES = opts(['Chevrolet', 'Renault', 'Toyota', 'Mazda', 'Kia', 'Nissan']);

const fullName: Omit<SeedField, 'order'> = {
  key: 'fullName',
  label: 'Nombre completo',
  type: 'text',
  section: 'policyholder',
  helpText: 'Como aparece en tu documento de identidad.',
  placeholder: 'Ej: Ana María Pérez',
  errorMessage: 'Escribe un nombre de 3 a 80 letras, sin números.',
  validations: { pattern: FULL_NAME_PATTERN },
};
const birthDate: Omit<SeedField, 'order'> = {
  key: 'birthDate',
  label: 'Fecha de nacimiento',
  type: 'date',
  section: 'policyholder',
  helpText: 'Debes ser mayor de edad.',
  errorMessage: 'Indica una fecha válida de una persona mayor de edad.',
  validations: { validators: [{ name: 'legalAge' }] },
};
const email: Omit<SeedField, 'order'> = {
  key: 'email',
  label: 'Correo electrónico',
  type: 'text',
  section: 'policyholder',
  helpText: 'Te enviaremos la cotización a este correo.',
  placeholder: 'Ej: ana@correo.test',
  errorMessage: 'Escribe un correo válido, por ejemplo ana@correo.test.',
  validations: { pattern: EMAIL_PATTERN },
};
const vehicleMake: Omit<SeedField, 'order'> = {
  key: 'vehicleMake',
  label: 'Marca',
  type: 'select',
  section: 'vehicle',
  helpText: 'Marca del vehículo a asegurar.',
  errorMessage: 'Selecciona la marca del vehículo.',
  options: MAKES,
};
const vehicleYear: Omit<SeedField, 'order'> = {
  key: 'vehicleYear',
  label: 'Año del vehículo',
  type: 'number',
  section: 'vehicle',
  helpText: 'Año de fabricación del vehículo.',
  placeholder: 'Ej: 2020',
  errorMessage: 'Indica un año de hasta 20 años atrás o el próximo año.',
  validations: {
    validators: [{ name: 'maxYearsAgo', value: 20 }, { name: 'maxYearsAhead', value: 1 }],
    allowedCharacters: 'digits',
    maxLength: 4,
  },
};

const withOrder = (fields: Array<Omit<SeedField, 'order'>>): SeedField[] => {
  const counters: Record<string, number> = {};
  return fields.map((f) => {
    counters[f.section] = (counters[f.section] ?? 0) + 1;
    return { ...f, order: counters[f.section] };
  });
};

const CO_FIELDS: SeedField[] = withOrder([
  {
    key: 'documentType',
    label: 'Tipo de documento',
    type: 'select',
    section: 'policyholder',
    helpText: 'Documento con el que te identificas.',
    errorMessage: 'Selecciona el tipo de documento.',
    options: [
      { label: 'Cédula de ciudadanía', value: 'CC' },
      { label: 'Cédula de extranjería', value: 'CE' },
    ],
  },
  {
    key: 'documentNumber',
    label: 'Número de documento',
    type: 'text',
    section: 'policyholder',
    helpText: 'Solo números, sin puntos ni espacios.',
    placeholder: 'Ej: 1020304050',
    errorMessage: 'Escribe de 6 a 10 dígitos, sin puntos ni espacios.',
    validations: { pattern: CO_DOCUMENT_NUMBER_PATTERN, allowedCharacters: 'digits', maxLength: 10 },
  },
  fullName,
  birthDate,
  email,
  {
    key: 'mobilePhone',
    label: 'Celular',
    type: 'text',
    section: 'policyholder',
    helpText: '10 dígitos, empieza por 3.',
    placeholder: 'Ej: 3001234567',
    errorMessage: 'Escribe un celular de 10 dígitos que empiece por 3.',
    validations: { pattern: CO_MOBILE_PATTERN, allowedCharacters: 'digits', maxLength: 10 },
  },
  {
    key: 'city',
    label: 'Ciudad',
    type: 'select',
    section: 'policyholder',
    helpText: 'Ciudad donde vives.',
    errorMessage: 'Selecciona tu ciudad.',
    options: opts(['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena']),
  },
  {
    key: 'plate',
    label: 'Placa',
    type: 'text',
    section: 'vehicle',
    helpText: '3 letras y 3 números, sin guiones.',
    placeholder: 'Ej: ABC123',
    errorMessage: 'Escribe una placa de 3 letras y 3 números, por ejemplo ABC123.',
    validations: { pattern: CO_PLATE_PATTERN, allowedCharacters: 'alphanumeric', maxLength: 6 },
  },
  vehicleMake,
  vehicleYear,
]);

const CL_FIELDS: SeedField[] = withOrder([
  {
    key: 'rut',
    label: 'RUT',
    type: 'text',
    section: 'policyholder',
    helpText: 'Con o sin puntos, con dígito verificador.',
    placeholder: 'Ej: 12.345.678-5',
    errorMessage: 'Escribe un RUT válido, por ejemplo 12.345.678-5.',
    validations: { pattern: CL_RUT_PATTERN, validators: [{ name: 'rut' }], allowedCharacters: 'rut', maxLength: 12 },
  },
  fullName,
  birthDate,
  email,
  {
    key: 'mobilePhone',
    label: 'Celular',
    type: 'text',
    section: 'policyholder',
    helpText: '9 dígitos, empieza por 9.',
    placeholder: 'Ej: 912345678',
    errorMessage: 'Escribe un celular de 9 dígitos que empiece por 9.',
    validations: { pattern: CL_MOBILE_PATTERN, allowedCharacters: 'digits', maxLength: 9 },
  },
  {
    key: 'region',
    label: 'Región',
    type: 'select',
    section: 'policyholder',
    helpText: 'Región donde vives.',
    errorMessage: 'Selecciona tu región.',
    options: opts(CL_REGIONS),
  },
  {
    key: 'plate',
    label: 'Patente',
    type: 'text',
    section: 'vehicle',
    helpText: '4 letras y 2 números, o 2 letras y 4 números.',
    placeholder: 'Ej: BCDF12',
    errorMessage: 'Escribe una patente válida, por ejemplo BCDF12 o AB1234.',
    validations: { pattern: CL_PLATE_PATTERN, allowedCharacters: 'alphanumeric', maxLength: 6 },
  },
  vehicleMake,
  vehicleYear,
]);

export const BY_COUNTRY: Record<string, SeedField[]> = { CO: CO_FIELDS, CL: CL_FIELDS };

/** Pure helper: countries whose legalAge is missing (null/undefined). Existing values are never touched. */
export function countriesNeedingLegalAge<T extends { legalAge?: number | null }>(countries: T[]): T[] {
  return countries.filter((c) => c.legalAge === null || c.legalAge === undefined);
}

export async function backfillLegalAge(strapi: Core.Strapi): Promise<void> {
  const rows = (await strapi.db.query(COUNTRY_UID).findMany({})) as Array<{
    id: number;
    legalAge?: number | null;
  }>;
  // Direct DB update covers both the draft and published rows without touching their publication state.
  for (const row of countriesNeedingLegalAge(rows)) {
    await strapi.db.query(COUNTRY_UID).update({ where: { id: row.id }, data: { legalAge: DEFAULT_LEGAL_AGE } });
  }
}

export async function seedFormFields(strapi: Core.Strapi): Promise<void> {
  const total = await strapi.documents(FIELD_UID).count({});
  if (total > 0) return;

  for (const [code, fields] of Object.entries(BY_COUNTRY)) {
    const country = await strapi.documents(COUNTRY_UID).findFirst({ filters: { code }, status: 'published' });
    if (!country) continue;
    for (const field of fields) {
      await strapi.documents(FIELD_UID).create({
        data: { ...field, required: true, country: country.documentId },
        status: 'published',
      });
    }
  }
}
