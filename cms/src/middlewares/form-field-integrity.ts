import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const UID = 'api::form-field.form-field';
const ACTIONS = ['create', 'update', 'publish'];

export interface FormFieldIntegrityInput {
  key?: string | null;
  countryDocumentId?: string | null;
  selfDocumentId?: string | null;
}

export interface ExistingKey {
  documentId: string;
  key: string;
}

/** Pure rule: a field needs a country, and its key is unique within that country. */
export function checkFormFieldIntegrity(
  input: FormFieldIntegrityInput,
  existingSameCountryKeys: ExistingKey[],
): string | null {
  if (!input.countryDocumentId) return 'El campo debe tener un país.';
  const duplicate = existingSameCountryKeys.some(
    (f) => f.key === input.key && f.documentId !== input.selfDocumentId,
  );
  if (duplicate) return `Ya existe un campo con la clave «${input.key}» para este país.`;
  return null;
}

type Ref = string | number;

function refOf(item: unknown): Ref | null {
  if (typeof item === 'string' || typeof item === 'number') return item;
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    return (o.documentId ?? o.id ?? null) as Ref | null;
  }
  return null;
}

/** Reads the country from the relation payload shapes Strapi accepts. `present=false` means untouched. */
export function readCountryPayload(value: unknown): { present: boolean; ref: Ref | null } {
  if (value === undefined) return { present: false, ref: null };
  if (value === null) return { present: true, ref: null };
  if (typeof value === 'string' || typeof value === 'number') return { present: true, ref: value };
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    // `set` replaces the relation: an empty set clears it.
    if (Array.isArray(v.set)) return { present: true, ref: refOf(v.set[0]) };
    if (Array.isArray(v.connect) && v.connect.length > 0) return { present: true, ref: refOf(v.connect[0]) };
    if (Array.isArray(v.disconnect) && v.disconnect.length > 0) return { present: true, ref: null };
    // The admin sends `{ connect: [], disconnect: [] }` when the relation is left as is.
    if (Array.isArray(v.connect) || Array.isArray(v.disconnect)) return { present: false, ref: null };
    if (v.documentId !== undefined || v.id !== undefined) return { present: true, ref: refOf(v) };
  }
  return { present: false, ref: null };
}

export function registerFormFieldIntegrity(strapi: Core.Strapi): void {
  strapi.documents.use(async (context, next) => {
    if (context.uid !== UID || !ACTIONS.includes(context.action)) return next();

    const params = (context.params ?? {}) as { documentId?: string; data?: Record<string, unknown> };
    const data = params.data ?? {};
    const selfDocumentId = params.documentId ?? null;

    type Existing = { key?: string; country?: { documentId: string } | null } | null;
    let existing = null as Existing;
    if (selfDocumentId) {
      existing = (await strapi.documents(UID).findOne({
        documentId: selfDocumentId,
        populate: { country: { fields: ['documentId'] } },
        status: 'draft',
      })) as Existing;
    }

    const key = (data.key as string | undefined) ?? existing?.key ?? null;

    const { present, ref } = readCountryPayload(data.country);
    let countryDocumentId: string | null = null;
    if (present) {
      if (typeof ref === 'number') {
        const found = (await strapi.db.query('api::country.country').findOne({ where: { id: ref } })) as {
          documentId: string;
        } | null;
        countryDocumentId = found?.documentId ?? null;
      } else {
        countryDocumentId = ref;
      }
    } else {
      countryDocumentId = existing?.country?.documentId ?? null;
    }

    let others: ExistingKey[] = [];
    if (countryDocumentId) {
      // Draft and published versions share a documentId, so excluding it covers both.
      others = (await strapi.documents(UID).findMany({
        filters: { country: { documentId: countryDocumentId } },
        fields: ['key'],
        status: 'draft',
      })) as ExistingKey[];
    }

    const message = checkFormFieldIntegrity({ key, countryDocumentId, selfDocumentId }, others);
    if (message) throw new errors.ValidationError(message);
    return next();
  });
}
