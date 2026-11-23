import type { Core } from '@strapi/strapi';

// Actions the Public role needs, each with the reason it is granted.
const PUBLIC_ACTIONS = [
  // The wizard reads the list of available countries (US-00).
  'api::country.country.find',
  // The wizard reads the form fields of the selected country (US-01).
  'api::form-field.form-field.find',
];

export async function grantPublicPermissions(strapi: Core.Strapi): Promise<void> {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  if (!role) return;

  for (const action of PUBLIC_ACTIONS) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: role.id } });
    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  }
}
