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
  icon?: { file: string; alt: string };
}

// Fictitious demo data. PE is inactive on purpose to demo FR-006.
const COUNTRIES: SeedCountry[] = [
  { code: 'CO', name: 'Colombia', order: 1, active: true, legalAge: 18, icon: { file: 'co.svg', alt: 'Bandera de Colombia' } },
  { code: 'CL', name: 'Chile', order: 2, active: true, legalAge: 18, icon: { file: 'cl.svg', alt: 'Bandera de Chile' } },
  { code: 'PE', name: 'Perú', order: 3, active: false, legalAge: 18 },
];

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
      data: { code: country.code, name: country.name, order: country.order, active: country.active, legalAge: country.legalAge, icon },
      status: 'published',
    });
  }
}
