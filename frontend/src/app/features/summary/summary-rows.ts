import type { Step1Values } from '../../core/session/quote-session.store';
import type {
  FormFieldDescriptor,
  FormSection,
  FormSections,
} from '../quote-form/data/form-field.model';
import { maskValue } from './mask';

export interface SummaryRow {
  key: string;
  label: string;
  display: string;
}

export interface SummaryRows {
  policyholder: SummaryRow[];
  vehicle: SummaryRow[];
}

const SECTIONS: readonly FormSection[] = ['policyholder', 'vehicle'];
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

function formatDate(value: string, locale: string): string {
  const match = ISO_DATE.exec(value);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return value;
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  };
  try {
    return new Intl.DateTimeFormat(locale || 'es', options).format(date);
  } catch {
    return new Intl.DateTimeFormat('es', options).format(date);
  }
}

function displayFor(
  field: FormFieldDescriptor,
  value: string | boolean | undefined,
  locale: string,
): string | null {
  if (field.type === 'checkbox') {
    if (value === undefined && !field.required) return null;
    return value === true ? 'Sí' : 'No';
  }
  const text = typeof value === 'string' ? value.trim() : '';
  if (text === '') return field.required ? '—' : null;
  if (field.maskedInSummary) return maskValue(text);
  if (field.type === 'select') {
    return field.options.find((option) => option.value === text)?.label ?? text;
  }
  if (field.type === 'date') return formatDate(text, locale);
  return text;
}

/** Rows per section in the configured order; only configured fields are shown (R8). */
export function buildSummaryRows(
  fields: FormSections,
  values: Step1Values,
  locale: string,
): SummaryRows {
  const rows: SummaryRows = { policyholder: [], vehicle: [] };
  for (const section of SECTIONS) {
    for (const field of fields[section]) {
      const display = displayFor(field, values[field.key], locale);
      if (display !== null) rows[section].push({ key: field.key, label: field.label, display });
    }
  }
  return rows;
}
