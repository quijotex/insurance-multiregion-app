import fs from 'node:fs';
import path from 'node:path';
import type { Core } from '@strapi/strapi';

const UID = 'api::country.country';

interface SeedCountry {
  code: string;
  name: string;
  order: number;
  active: boolean;
  legalAge: number;
  currency: string;
  numberLocale: string;
  icon?: { file: string; alt: string };
}

// Fictitious demo data. PE is inactive on purpose to demo FR-006.
const COUNTRIES: SeedCountry[] = [
  { code: 'CO', name: 'Colombia', order: 1, active: true, legalAge: 18, currency: 'COP', numberLocale: 'es-CO', icon: { file: 'co.svg', alt: 'Bandera de Colombia' } },
  { code: 'CL', name: 'Chile', order: 2, active: true, legalAge: 18, currency: 'CLP', numberLocale: 'es-CL', icon: { file: 'cl.svg', alt: 'Bandera de Chile' } },
  { code: 'PE', name: 'Perú', order: 3, active: false, legalAge: 18, currency: 'PEN', numberLocale: 'es-PE' },
];

export interface AgeBand {
  fromAge: number;
  toAge: number;
  factor: number;
}

// Same bands for every country (ADR 0005); editors adjust them per country in the admin.
export const DRIVER_BANDS: AgeBand[] = [
  { fromAge: 0, toAge: 24, factor: 1.2 },
  { fromAge: 25, toAge: 65, factor: 1.0 },
  { fromAge: 66, toAge: 120, factor: 1.15 },
];
export const VEHICLE_BANDS: AgeBand[] = [
  { fromAge: 0, toAge: 5, factor: 1.0 },
  { fromAge: 6, toAge: 10, factor: 1.1 },
  { fromAge: 11, toAge: 20, factor: 1.2 },
];

const PRICING_DEFAULTS: Record<string, { currency: string; numberLocale: string }> = Object.fromEntries(
  COUNTRIES.map((c) => [c.code, { currency: c.currency, numberLocale: c.numberLocale }]),
);

interface PricingRow {
  code?: string;
  currency?: string | null;
  numberLocale?: string | null;
  driverAgeBands?: unknown[] | null;
  vehicleAgeBands?: unknown[] | null;
}

/**
 * Pure: the values a country row is missing, taken from the defaults. Only rows that predate US-02
 * (currency or numberLocale missing) are backfilled; once a row has both, it is never touched, so bands
 * an editor emptied on purpose stay empty. Within a pre-US-02 row, only empty bands are filled.
 */
export function pricingPatch(row: PricingRow): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (row.currency && row.numberLocale) return patch;
  const defaults = PRICING_DEFAULTS[row.code ?? ''];
  if (!row.currency && defaults) patch.currency = defaults.currency;
  if (!row.numberLocale && defaults) patch.numberLocale = defaults.numberLocale;
  if (!row.driverAgeBands?.length) patch.driverAgeBands = DRIVER_BANDS;
  if (!row.vehicleAgeBands?.length) patch.vehicleAgeBands = VEHICLE_BANDS;
  return patch;
}

const BAND_KEYS = ['driverAgeBands', 'vehicleAgeBands'];

type DateLike = string | Date | null | undefined;

const toTime = (d: DateLike): number => (d ? new Date(d).getTime() : Number.NaN);

/**
 * Pure: whether the draft may be published after the backfill wrote to it. Publishing copies the whole draft
 * to the published version, so it is only safe when the draft carries no pending editor changes, i.e. it was
 * not modified after it was last published. Only `publishedAt` is compared: the published row's `updatedAt`
 * is bumped by DB-layer writes such as backfillLegalAge, which would hide a pending draft edit (R-15). A
 * DB-layer write can only make the draft look changed, which errs on the safe side (warning, no publish).
 * No published version, or unreadable dates, means do not publish (never publish a draft that was not live).
 */
export function shouldPublishAfterBackfill(input: { draftUpdatedAt: DateLike; publishedAt: DateLike }): boolean {
  const published = toTime(input.publishedAt);
  const draft = toTime(input.draftUpdatedAt);
  if (Number.isNaN(published) || Number.isNaN(draft)) return false;
  return draft <= published;
}

type DbRow = PricingRow & {
  id: number;
  documentId: string;
  publishedAt?: DateLike;
  updatedAt?: DateLike;
};

/**
 * Existing databases get currency, locale and bands only on rows that predate US-02, never overwriting.
 * Scalars are written at the DB layer on each row (draft and published alike, like backfillLegalAge). The db
 * layer does not manage components, so the bands go through the Document Service. In Strapi 5,
 * `documents().update({ status: 'published' })` writes the draft and then publishes the WHOLE draft, which
 * would take unpublished editor changes live. So the bands are written to the draft only, and the draft is
 * published afterwards only if it had no pending changes (see shouldPublishAfterBackfill); otherwise a
 * warning names the country, whose published version lacks the bands until an editor publishes.
 */
export async function backfillCountryPricing(strapi: Core.Strapi): Promise<void> {
  const rows = (await strapi.db.query(UID).findMany({
    populate: { driverAgeBands: true, vehicleAgeBands: true },
  })) as unknown as DbRow[];
  const byDocument = new Map<string, DbRow[]>();
  for (const row of rows) byDocument.set(row.documentId, [...(byDocument.get(row.documentId) ?? []), row]);

  for (const [documentId, versions] of byDocument) {
    const draft = versions.find((v) => !v.publishedAt);
    const published = versions.find((v) => v.publishedAt);
    const draftUpdatedAtBefore = draft?.updatedAt;

    let bandsPatch: Record<string, unknown> = {};
    for (const row of versions) {
      const patch = pricingPatch(row);
      const scalars = Object.fromEntries(Object.entries(patch).filter(([k]) => !BAND_KEYS.includes(k)));
      if (Object.keys(scalars).length > 0) {
        await strapi.db.query(UID).update({ where: { id: row.id }, data: scalars });
      }
      if (row === (draft ?? published)) {
        bandsPatch = Object.fromEntries(Object.entries(patch).filter(([k]) => BAND_KEYS.includes(k)));
      }
    }
    if (Object.keys(bandsPatch).length === 0) continue;

    await strapi.documents(UID).update({ documentId, data: bandsPatch as never, status: 'draft' });
    if (!published) continue;
    const code = (draft ?? published).code;
    if (
      shouldPublishAfterBackfill({
        draftUpdatedAt: draftUpdatedAtBefore,
        publishedAt: published.publishedAt,
      })
    ) {
      await strapi.documents(UID).publish({ documentId });
    } else {
      strapi.log.warn(
        `Country ${code}: age bands were added to the draft only because it has unpublished changes; the published version lacks the pricing until an editor publishes it.`,
      );
    }
  }
}

async function uploadIcon(strapi: Core.Strapi, file: string, alt: string): Promise<number> {
  // Read from src/ (not dist/) so the SVGs do not need a build copy step.
  const filepath = path.join(strapi.dirs.app.root, 'src', 'seed', 'assets', file);
  const { size } = fs.statSync(filepath);
  const [uploaded] = await strapi.plugin('upload').service('upload').upload({
    data: { fileInfo: { name: file, alternativeText: alt, caption: alt } },
    files: { filepath, originalFilename: file, mimetype: 'image/svg+xml', size },
  });
  return uploaded.id;
}

export async function seedCountries(strapi: Core.Strapi): Promise<void> {
  const total = await strapi.documents(UID).count({});
  if (total > 0) return;

  for (const country of COUNTRIES) {
    const icon = country.icon ? await uploadIcon(strapi, country.icon.file, country.icon.alt) : undefined;
    await strapi.documents(UID).create({
      data: { code: country.code, name: country.name, order: country.order, active: country.active, legalAge: country.legalAge, currency: country.currency, numberLocale: country.numberLocale, driverAgeBands: DRIVER_BANDS, vehicleAgeBands: VEHICLE_BANDS, icon },
      status: 'published',
    });
  }
}
