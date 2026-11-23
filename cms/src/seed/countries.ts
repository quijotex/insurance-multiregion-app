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

/** Pure: the values a country is missing, taken from the defaults. Present values are never in the patch. */
export function pricingPatch(row: PricingRow): Record<string, unknown> {
  const defaults = PRICING_DEFAULTS[row.code ?? ''];
  const patch: Record<string, unknown> = {};
  if (!row.currency && defaults) patch.currency = defaults.currency;
  if (!row.numberLocale && defaults) patch.numberLocale = defaults.numberLocale;
  if (!row.driverAgeBands?.length) patch.driverAgeBands = DRIVER_BANDS;
  if (!row.vehicleAgeBands?.length) patch.vehicleAgeBands = VEHICLE_BANDS;
  return patch;
}

/** Existing databases get currency, locale and bands only where they are missing (US-02). */
export async function backfillCountryPricing(strapi: Core.Strapi): Promise<void> {
  for (const status of ['draft', 'published'] as const) {
    const rows = (await strapi.documents(UID).findMany({
      status,
      populate: { driverAgeBands: true, vehicleAgeBands: true },
    })) as unknown as Array<PricingRow & { documentId: string }>;
    for (const row of rows) {
      const patch = pricingPatch(row);
      if (Object.keys(patch).length === 0) continue;
      await strapi.documents(UID).update({ documentId: row.documentId, data: patch as never, status });
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
