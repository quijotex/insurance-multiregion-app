import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::plan.plan', () => ({
  // Only published plans are ever exposed (research R7); `?status=draft` cannot leak drafts.
  async find(ctx) {
    ctx.query = { ...ctx.query, status: 'published' };
    return super.find(ctx);
  },
}));
