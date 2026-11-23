import type { Core } from '@strapi/strapi';
import { registerCountryIntegrity } from './middlewares/country-integrity';
import { seedAdmin } from './seed/admin';
import { backfillCountryPricing, backfillTerms, seedCountries } from './seed/countries';
import { backfillLegalAge, backfillMaskedInSummary, seedFormFields } from './seed/form-fields';
import { grantPublicPermissions } from './seed/permissions';
import { seedPlans } from './seed/plans';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerCountryIntegrity(strapi);
  },

  // Idempotent: safe to run on every start.
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
    await seedCountries(strapi);
    await backfillLegalAge(strapi);
    await seedFormFields(strapi);
    await backfillMaskedInSummary(strapi);
    await backfillCountryPricing(strapi);
    await backfillTerms(strapi);
    await seedPlans(strapi);
    await seedAdmin(strapi);
  },
};
