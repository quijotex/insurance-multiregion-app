import type { Core } from '@strapi/strapi';

export async function seedAdmin(strapi: Core.Strapi): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await strapi.db.query('admin::user').count({});
  if (existing > 0) return;

  const superAdminRole = await strapi.db.query('admin::role').findOne({ where: { code: 'strapi-super-admin' } });
  if (!superAdminRole) return;

  const hashedPassword = await strapi.service('admin::auth').hashPassword(password);
  await strapi.db.query('admin::user').create({
    data: {
      email,
      firstname: 'Admin',
      lastname: 'User',
      password: hashedPassword,
      isActive: true,
      blocked: false,
      roles: [superAdminRole.id],
    },
  });
  strapi.log.info(`Seed: created admin user ${email}`);
}
