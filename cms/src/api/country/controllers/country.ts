import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::country.country', ({ strapi }) => ({
  // Only active countries are ever exposed (research R1). The client cannot override this:
  // its own filters are kept but combined with `active = true` through $and.
  async find(ctx) {
    const clientFilters = (ctx.query as Record<string, unknown>).filters;
    ctx.query = {
      ...ctx.query,
      filters: clientFilters ? { $and: [{ active: true }, clientFilters] } : { active: true },
    };
    return super.find(ctx);
  },
}));
