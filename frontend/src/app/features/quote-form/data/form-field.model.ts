import type { FieldRules, FieldType } from '../validation/validation.model';

/** Strapi DTOs — mirror cms/src/api/form-field (see contracts/form-fields-api.md). */
export interface FormValidatorDto {
  id: number;
  name: string;
  value: number | null;
}

export interface FormValidationsDto {
  id: number;
  min: number | null;
  max: number | null;
  pattern: string | null;
  validators: FormValidatorDto[] | null;
}

export interface FormOptionDto {
  id: number;
  label: string;
  value: string;
}

export interface FormFieldDto {
  id: number;
  documentId: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  helpText: string | null;
  placeholder: string | null;
  errorMessage: string;
  order: number;
  section: string;
  validations: FormValidationsDto | null;
  options: FormOptionDto[] | null;
}

export interface FormFieldsResponseDto {
  data: FormFieldDto[];
  meta?: { pagination?: { page: number; pageSize: number; pageCount: number; total: number } };
}

/** App models. */
export type FormSection = 'policyholder' | 'vehicle';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FormFieldDescriptor {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  helpText: string | null;
  placeholder: string | null;
  errorMessage: string;
  order: number;
  section: FormSection;
  options: FieldOption[];
  rules: FieldRules;
}

export interface FormSections {
  policyholder: FormFieldDescriptor[];
  vehicle: FormFieldDescriptor[];
}
