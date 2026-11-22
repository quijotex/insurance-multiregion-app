import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::form-field.form-field', () => ({
  // Only published fields are exposed: ?status=draft cannot leak unpublished fields (ADR 0001).
  // Client filters (country, section), sort and populate are kept.
  async find(ctx) {
    ctx.query = { ...ctx.query, status: 'published' };
    return super.find(ctx);
  },
}));
