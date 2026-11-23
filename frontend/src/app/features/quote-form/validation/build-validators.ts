import { ValidatorFn } from '@angular/forms';
import { NAMED_RULES } from './named-rules';
import { FieldRules, INVALID_ERROR, ValidationContext } from './validation.model';

const FAIL = { [INVALID_ERROR]: true };

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
}

export function buildValidators(
  rules: FieldRules,
  ctx: ValidationContext,
  fieldKey: string,
): ValidatorFn[] {
  const validators: ValidatorFn[] = [];

  if (rules.required) {
    validators.push((c) => {
      const v: unknown = c.value;
      if (rules.type === 'checkbox') return v === true ? null : FAIL;
      return isEmpty(v) || v === false ? FAIL : null;
    });
  }

  if (rules.type === 'number' && (rules.min !== null || rules.max !== null)) {
    validators.push((c) => {
      const v: unknown = c.value;
      if (isEmpty(v)) return null;
      const n = Number(String(v).trim());
      if (!Number.isFinite(n)) return FAIL;
      if (rules.min !== null && n < rules.min) return FAIL;
      if (rules.max !== null && n > rules.max) return FAIL;
      return null;
    });
  }

  if (rules.pattern) {
    try {
      const re = new RegExp(`^(?:${rules.pattern})$`);
      validators.push((c) => {
        const v: unknown = c.value;
        if (isEmpty(v)) return null;
        return re.test(String(v)) ? null : FAIL;
      });
    } catch {
      console.warn(`[form] Invalid pattern on field "${fieldKey}" – skipped`);
    }
  }

  for (const rule of rules.validators) {
    const factory = Object.hasOwn(NAMED_RULES, rule.name) ? NAMED_RULES[rule.name] : undefined;
    if (!factory) {
      console.warn(`[form] Unknown rule "${rule.name}" on field "${fieldKey}" – skipped`);
      continue;
    }
    const check = factory(rule.value, ctx);
    validators.push((c) => {
      const v: unknown = c.value;
      if (isEmpty(v) || typeof v !== 'string') return null;
      return check(v) ? null : FAIL;
    });
  }

  return validators;
}
