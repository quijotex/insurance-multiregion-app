export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';
export interface NamedRule {
  name: string;
  value: number | null;
}
export interface FieldRules {
  type: FieldType;
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  validators: NamedRule[];
}
export type FieldValue = string | boolean;
export interface ValidationContext {
  legalAge: number;
  today: Date;
}
export const INVALID_ERROR = 'invalid';
