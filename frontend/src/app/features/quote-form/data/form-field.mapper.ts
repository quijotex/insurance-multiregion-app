import type { FieldType } from '../validation/validation.model';
import type {
  FormFieldDescriptor,
  FormFieldDto,
  FormSection,
  FormSections,
} from './form-field.model';

const FIELD_TYPES: readonly FieldType[] = ['text', 'number', 'select', 'date', 'checkbox'];
const SECTIONS: readonly FormSection[] = ['policyholder', 'vehicle'];

function isFieldType(value: string): value is FieldType {
  return (FIELD_TYPES as readonly string[]).includes(value);
}

function isSection(value: string): value is FormSection {
  return (SECTIONS as readonly string[]).includes(value);
}

function mapField(dto: FormFieldDto, section: FormSection, type: FieldType): FormFieldDescriptor {
  return {
    key: dto.key,
    label: dto.label,
    type,
    required: dto.required,
    helpText: dto.helpText ?? null,
    placeholder: dto.placeholder ?? null,
    errorMessage: dto.errorMessage,
    order: dto.order,
    section,
    options: (dto.options ?? []).map((o) => ({ label: o.label, value: o.value })),
    rules: {
      type,
      required: dto.required,
      min: dto.validations?.min ?? null,
      max: dto.validations?.max ?? null,
      pattern: dto.validations?.pattern ?? null,
      validators: (dto.validations?.validators ?? []).map((v) => ({
        name: v.name,
        value: v.value ?? null,
      })),
    },
  };
}

/** Groups CMS fields by section, sorted by `order` (stable). Unknown types/sections are dropped. */
export function mapFormFields(dtos: FormFieldDto[]): FormSections {
  const result: FormSections = { policyholder: [], vehicle: [] };
  for (const dto of dtos) {
    if (!isSection(dto.section)) {
      console.warn(`Form field "${dto.key}" dropped: unknown section "${dto.section}".`);
      continue;
    }
    if (!isFieldType(dto.type)) {
      console.warn(`Form field "${dto.key}" dropped: unknown type "${dto.type}".`);
      continue;
    }
    result[dto.section].push(mapField(dto, dto.section, dto.type));
  }
  // Array.prototype.sort is stable: equal orders keep CMS order.
  result.policyholder.sort((a, b) => a.order - b.order);
  result.vehicle.sort((a, b) => a.order - b.order);
  return result;
}
