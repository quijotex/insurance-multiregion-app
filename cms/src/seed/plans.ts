import type { Core } from '@strapi/strapi';

const PLAN_UID = 'api::plan.plan';
const COUNTRY_UID = 'api::country.country';

interface SeedPlan {
  name: string;
  shortDescription: string;
  basePrice: number;
  recommended?: boolean;
  active?: boolean;
  coverages: string[];
  benefits: string[];
}

// Fictitious demo data. Order = position in the list.
export const PLANS_BY_COUNTRY: Record<string, SeedPlan[]> = {
  CO: [
    {
      name: 'Básico',
      shortDescription: 'La protección esencial para circular tranquilo.',
      basePrice: 89000,
      coverages: ['Responsabilidad civil', 'Pérdida total por hurto', 'Asistencia jurídica'],
      benefits: ['Grúa en caso de accidente'],
    },
    {
      name: 'Plus',
      shortDescription: 'Cobertura amplia con asistencia todo el año.',
      basePrice: 145000,
      recommended: true,
      coverages: ['Responsabilidad civil', 'Pérdida total por hurto', 'Pérdida parcial por daños', 'Asistencia jurídica'],
      benefits: ['Grúa 24/7', 'Vehículo de reemplazo por 5 días'],
    },
    {
      name: 'Total',
      shortDescription: 'La cobertura más completa, sin deducible en pérdidas totales.',
      basePrice: 210000,
      coverages: [
        'Responsabilidad civil',
        'Pérdida total por hurto',
        'Pérdida parcial por daños',
        'Cobertura de cristales',
        'Asistencia jurídica',
      ],
      benefits: ['Grúa 24/7', 'Vehículo de reemplazo por 15 días', 'Revisión técnica anual'],
    },
    {
      name: 'Clásico',
      shortDescription: 'Plan descontinuado, ya no se ofrece a nuevos clientes.',
      basePrice: 99000,
      active: false,
      coverages: ['Responsabilidad civil', 'Pérdida total por hurto'],
      benefits: ['Grúa en caso de accidente'],
    },
  ],
  CL: [
    {
      name: 'Esencial',
      shortDescription: 'Lo básico para estar protegido en el camino.',
      basePrice: 24990,
      coverages: ['Responsabilidad civil', 'Robo del vehículo'],
      benefits: ['Asistencia en ruta'],
    },
    {
      name: 'Plus',
      shortDescription: 'Equilibrio entre cobertura y precio, con asistencia.',
      basePrice: 39990,
      recommended: true,
      coverages: ['Responsabilidad civil', 'Robo del vehículo', 'Daños propios', 'Defensa jurídica'],
      benefits: ['Asistencia en ruta 24/7', 'Auto de reemplazo por 7 días'],
    },
    {
      name: 'Full',
      shortDescription: 'Protección total para ti y tu vehículo.',
      basePrice: 59990,
      coverages: ['Responsabilidad civil', 'Robo del vehículo', 'Daños propios', 'Cobertura de cristales', 'Defensa jurídica'],
      benefits: ['Asistencia en ruta 24/7', 'Auto de reemplazo por 15 días', 'Lavado mensual'],
    },
  ],
};

/** Seeds the demo plans only when no Plan exists; every plan is published. */
export async function seedPlans(strapi: Core.Strapi): Promise<void> {
  const total = await strapi.documents(PLAN_UID).count({});
  if (total > 0) return;

  for (const [code, plans] of Object.entries(PLANS_BY_COUNTRY)) {
    const country = await strapi.documents(COUNTRY_UID).findFirst({ filters: { code }, status: 'published' });
    if (!country) continue;
    let order = 1;
    for (const plan of plans) {
      await strapi.documents(PLAN_UID).create({
        data: {
          name: plan.name,
          shortDescription: plan.shortDescription,
          basePrice: plan.basePrice,
          order: order++,
          recommended: plan.recommended ?? false,
          active: plan.active ?? true,
          coverages: plan.coverages.map((text) => ({ text })),
          benefits: plan.benefits.map((text) => ({ text })),
          country: country.documentId,
        },
        status: 'published',
      });
    }
  }
}
