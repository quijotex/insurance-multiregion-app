import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const CMS = 'http://localhost:1337';

function isoDate(yearsAgo: number, extraDays = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  d.setDate(d.getDate() + extraDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function pickOption(page: Page, label: string | RegExp, index = 0): Promise<string> {
  await page.getByRole('combobox', { name: label }).click();
  const option = page.getByRole('option').nth(index);
  const text = ((await option.textContent()) ?? '').trim();
  await option.click();
  return text;
}

async function errorMessages(request: APIRequestContext, country: string): Promise<Record<string, string>> {
  const res = await request.get(`${CMS}/api/form-fields`, {
    params: { 'filters[country][code][$eq]': country, 'pagination[pageSize]': '50' },
  });
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { data: { key: string; errorMessage: string }[] };
  return Object.fromEntries(body.data.map((f) => [f.key, f.errorMessage]));
}

test.describe('US-01', () => {
  test('US-01 · E2E-1 Colombia: fill step 1, continue, go back and keep values (FR-002, FR-009, FR-012)', async ({ page }) => {
    await page.goto('/co/quote');
    await expect(page.getByRole('heading', { level: 1, name: 'Cuéntanos de ti y de tu vehículo' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toHaveCount(2);

    const labels = [
      'Tipo de documento', 'Número de documento', 'Nombre completo', 'Fecha de nacimiento', 'Correo electrónico',
      'Celular', 'Ciudad', 'Placa', 'Marca', 'Año del vehículo',
    ];
    for (const l of labels) {
      await expect(page.getByLabel(l)).toBeVisible();
    }

    const year = new Date().getFullYear() - 3;
    const birth = isoDate(30);
    const selected: Record<string, string> = {};
    selected['Tipo de documento'] = await pickOption(page, 'Tipo de documento');
    await page.getByLabel('Número de documento').fill('1020304050');
    await page.getByLabel('Nombre completo').fill('Ana María Pérez');
    await page.getByLabel('Fecha de nacimiento').fill(birth);
    await page.getByLabel('Correo electrónico').fill('ana@correo.test');
    await page.getByLabel('Celular').fill('3001234567');
    selected['Ciudad'] = await pickOption(page, 'Ciudad');
    await page.getByLabel('Placa').fill('ABC123');
    selected['Marca'] = await pickOption(page, 'Marca');
    await page.getByLabel('Año del vehículo').fill(String(year));

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/co\/quote\/plans$/);
    await expect(page.getByRole('heading', { name: 'Elige tu plan' })).toBeVisible();

    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page).toHaveURL(/\/co\/quote$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Cuéntanos de ti y de tu vehículo' })).toBeVisible();

    await expect(page.getByLabel('Número de documento')).toHaveValue('1020304050');
    await expect(page.getByLabel('Nombre completo')).toHaveValue('Ana María Pérez');
    await expect(page.getByLabel('Fecha de nacimiento')).toHaveValue(birth);
    await expect(page.getByLabel('Correo electrónico')).toHaveValue('ana@correo.test');
    await expect(page.getByLabel('Celular')).toHaveValue('3001234567');
    await expect(page.getByLabel('Placa')).toHaveValue('ABC123');
    await expect(page.getByLabel('Año del vehículo')).toHaveValue(String(year));
    for (const [label, text] of Object.entries(selected)) {
      await expect(page.getByRole('combobox', { name: label })).toContainText(text);
    }
  });

  test('US-01 · E2E-2 Chile: invalid RUT and minor show configured errors, focus first invalid, then succeed (FR-005, FR-006, FR-007, FR-014)', async ({ page, request }) => {
    const messages = await errorMessages(request, 'CL');

    await page.goto('/cl/quote');
    await expect(page.getByRole('heading', { level: 1, name: 'Cuéntanos de ti y de tu vehículo' })).toBeVisible();

    await page.getByLabel('RUT').fill('12.345.678-9');
    await page.getByLabel('Nombre completo').fill('Ana María Pérez');
    await page.getByLabel('Fecha de nacimiento').fill(isoDate(17, 1));
    await page.getByLabel('Correo electrónico').fill('ana@correo.test');
    await page.getByLabel('Celular').fill('912345678');
    await pickOption(page, 'Región');
    await page.getByLabel('Patente').fill('BCDF12');
    await pickOption(page, 'Marca');
    await page.getByLabel('Año del vehículo').fill(String(new Date().getFullYear() - 3));

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/cl\/quote$/);

    await expect(page.locator('.form-field__error').filter({ hasText: messages['rut'] })).toBeVisible();
    await expect(page.locator('.form-field__error').filter({ hasText: messages['birthDate'] })).toBeVisible();
    await expect(page.getByLabel('RUT')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Fecha de nacimiento')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('RUT')).toBeFocused();

    await page.getByLabel('RUT').fill('12.345.678-5');
    await page.getByLabel('Fecha de nacimiento').fill(isoDate(30));
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/cl\/quote\/plans$/);
  });
});
