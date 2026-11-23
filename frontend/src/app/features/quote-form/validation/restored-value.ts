import { FormFieldDescriptor } from '../data/form-field.model';
import { FieldValue } from './validation.model';

/**
 * Value restored from the session for a field: the wrong type falls back to empty, and a select
 * value that is no longer one of its options (renamed or removed in the CMS) is dropped (R-13).
 */
export function restoredValue(field: FormFieldDescriptor, saved: FieldValue | undefined): FieldValue {
  if (field.type === 'checkbox') return typeof saved === 'boolean' ? saved : false;
  if (typeof saved !== 'string') return '';
  if (field.type === 'select' && !field.options.some((o) => o.value === saved)) return '';
  return saved;
}
