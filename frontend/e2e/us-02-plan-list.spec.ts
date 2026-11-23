import { expect, test, type Page } from '@playwright/test';

function isoDate(yearsAgo: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - yearsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function pickOption(page: Page, label: string | RegExp, index = 0): Promise<void> {
  await page.getByRole('combobox', { name: label }).click();
  await page.getByRole('option').nth(index).click();
}

/** Accessible description of a plan radio is its price ("$ 89.000 / mes"); only NBSP is normalised. */
async function priceOf(page: Page, name: string | RegExp): Promise<string> {
  const radio = page.getByRole('radio', { name });
  const id = await radio.getAttribute('aria-describedby');
  const text = (await page.locator(`[id="${id}"]`).textContent()) ?? '';
  return text.replace(/[  ]/g, ' ').trim();
}

async function fillColombiaStep1(page: Page): Promise<void> {
  await page.goto('/co/quote');
  await expect(page.getByRole('heading', { level: 1, name: 'Cuéntanos de ti y de tu vehículo' })).toBeVisible();
  await pickOption(page, 'Tipo de documento');
  await page.getByLabel('Número de documento').fill('1020304050');
  await page.getByLabel('Nombre completo').fill('Ana María Pérez');
  await page.getByLabel('Fecha de nacimiento').fill(isoDate(30));
  await page.getByLabel('Correo electrónico').fill('ana@correo.test');
  await page.getByLabel('Celular').fill('3001234567');
  await pickOption(page, 'Ciudad');
  await page.getByLabel('Placa').fill('ABC123');
  await pickOption(page, 'Marca');
  await page.getByLabel('Año del vehículo').fill(String(new Date().getFullYear() - 3));
}

test.describe('US-02 · plan list', () => {
  test('US-02 · E2E-3 Colombia: ordered plans, prices, recommended badge, choose, continue, back keeps choice (FR-002, FR-004, FR-006, FR-007, FR-008, FR-009, FR-012)', async ({ page }) => {
    await fillColombiaStep1(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/co\/quote\/plans$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Elige tu plan' })).toBeVisible();

    // Only the active plans, in configured order; the inactive "Clásico" is absent.
    const radios = page.getByRole('radio');
    await expect(radios).toHaveCount(3);
    await expect(radios.nth(0)).toHaveAccessibleName(/^Básico/);
    await expect(radios.nth(1)).toHaveAccessibleName(/^Plus/);
    await expect(radios.nth(2)).toHaveAccessibleName(/^Total/);
    await expect(page.getByText('Clásico')).toHaveCount(0);

    // Prices in COP format (driver 30 and vehicle 3 years: no adjustment).
    expect(await priceOf(page, /^Básico/)).toMatch(/^\$ ?89\.000 \/ mes$/);
    expect(await priceOf(page, /^Plus/)).toMatch(/^\$ ?145\.000 \/ mes$/);
    expect(await priceOf(page, /^Total/)).toMatch(/^\$ ?210\.000 \/ mes$/);

    // "Recomendado" badge on Plus only, also announced to assistive technology.
    await expect(page.getByText('Recomendado', { exact: true })).toHaveCount(1);
    await expect(page.getByRole('radio', { name: /^Plus, plan recomendado/ })).toHaveCount(1);
    await expect(page.getByRole('radio', { name: /recomendado/ })).toHaveCount(1);

    // Nothing chosen: Continuar disabled.
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeDisabled();

    // Choose a plan, then another: only the last is checked.
    await page.getByRole('radio', { name: /^Básico/ }).check({ force: true });
    await page.getByRole('radio', { name: /^Total/ }).check({ force: true });
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
    await expect(page.getByRole('radio', { name: /^Total/ })).toBeChecked();
    await expect(page.getByRole('button', { name: 'Continuar' })).toBeEnabled();

    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/co\/quote\/summary$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Resumen' })).toBeVisible();

    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page).toHaveURL(/\/co\/quote\/plans$/);
    await expect(page.getByRole('radio', { name: /^Total/ })).toBeChecked();
    await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
  });

  test('US-02 · E2E-4 Chile: prices follow the age rule, round(base x 1.20 x 1.10), es-CL format (FR-004, FR-005)', async ({ page }) => {
    await page.goto('/cl/quote');
    await expect(page.getByRole('heading', { level: 1, name: 'Cuéntanos de ti y de tu vehículo' })).toBeVisible();
    await page.getByLabel('RUT').fill('12.345.678-5');
    await page.getByLabel('Nombre completo').fill('Ana María Pérez');
    await page.getByLabel('Fecha de nacimiento').fill(isoDate(22));
    await page.getByLabel('Correo electrónico').fill('ana@correo.test');
    await page.getByLabel('Celular').fill('912345678');
    await pickOption(page, 'Región');
    await page.getByLabel('Patente').fill('BCDF12');
    await pickOption(page, 'Marca');
    await page.getByLabel('Año del vehículo').fill(String(new Date().getFullYear() - 8));
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/cl\/quote\/plans$/);

    const expected: [RegExp, number][] = [
      [/^Esencial/, 24990],
      [/^Plus/, 39990],
      [/^Full/, 59990],
    ];
    await expect(page.getByRole('radio')).toHaveCount(3);
    for (const [name, base] of expected) {
      const final = Math.round(base * 1.2 * 1.1);
      const formatted = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(final);
      expect(await priceOf(page, name)).toMatch(new RegExp(`^\\$ ?${formatted.replace('.', '\\.')} \\/ mes$`));
    }
  });
});
