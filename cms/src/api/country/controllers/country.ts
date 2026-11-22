import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::country.country', ({ strapi }) => ({
  // Only active countries are ever exposed (research R1). The client cannot override this:
  // its own filters are kept but combined with `active = true` through $and. `status` is forced
  // to 'published' so `?status=draft` cannot leak unpublished countries (R1, ADR 0001).
  async find(ctx) {
    const clientFilters = (ctx.query as Record<string, unknown>).filters;
    ctx.query = {
      ...ctx.query,
      status: 'published',
      filters: clientFilters ? { $and: [{ active: true }, clientFilters] } : { active: true },
    };
    return super.find(ctx);
  },
}));
