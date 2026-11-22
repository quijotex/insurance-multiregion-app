import type { Core } from '@strapi/strapi';
import { seedAdmin } from './seed/admin';
import { seedCountries } from './seed/countries';
import { grantPublicPermissions } from './seed/permissions';

export default {
  register() {},

  // Idempotent: safe to run on every start.
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicPermissions(strapi);
    await seedCountries(strapi);
    await seedAdmin(strapi);
  },
};
