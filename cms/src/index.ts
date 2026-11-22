import type { Core } from '@strapi/strapi';
import { registerFormFieldIntegrity } from './middlewares/form-field-integrity';
import { seedAdmin } from './seed/admin';
import { seedCountries } from './seed/countries';
import { backfillLegalAge, seedFormFields } from './seed/form-fields';
import { grantPublicPermissions } from './seed/permissions';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerFormFieldIntegrity(strapi);
  },

  // Idempotent: safe to run on every start.
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
    await seedCountries(strapi);
    await backfillLegalAge(strapi);
    await seedFormFields(strapi);
    await seedAdmin(strapi);
  },
};
