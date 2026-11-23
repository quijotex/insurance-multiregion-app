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

/** Digits of the accessible description of a plan radio ("$ 89.000 / mes" -> "89000"). */
async function priceDigitsOf(page: Page, position: number): Promise<string> {
  const radio = page.getByRole('radio').nth(position);
  const id = ((await radio.getAttribute('aria-describedby')) ?? '').split(' ')[0];
  const text = (await page.locator(`[id="${id}"]`).textContent()) ?? '';
  return text.replace(/\D/g, '');
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

test.describe('US-03 · FR-001–FR-012 summary and simulated payment', () => {
  test('US-03 · E2E-5 Colombia: summary, terms, accept, pay, confirmation, reload, Back (SC-003)', async ({ page }) => {
    await fillColombiaStep1(page);
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/co\/quote\/plans$/);

    // Choose the second plan by position and remember its price.
    const position = 1;
    const listPrice = await priceDigitsOf(page, position);
    expect(listPrice).not.toBe('');
    await page.getByRole('radio').nth(position).check({ force: true });
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page).toHaveURL(/\/co\/quote\/summary$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Revisa y asegúrate' })).toBeVisible();

    // Policyholder and vehicle sections, cédula masked, same price as the plan list.
    const holder = page.getByRole('region', { name: 'Tus datos' });
    const vehicle = page.getByRole('region', { name: 'Tu vehículo' });
    await expect(holder).toBeVisible();
    await expect(vehicle).toBeVisible();
    await expect(holder.getByText('Ana María Pérez')).toBeVisible();
    await expect(holder.getByText('••••••4050')).toBeVisible();
    await expect(holder.getByText('1020304050')).toHaveCount(0);
    await expect(vehicle.getByText('ABC123')).toBeVisible();
    const plan = page.getByRole('region', { name: 'Tu plan' });
    await expect(plan).toBeVisible();
    const summaryPrice = ((await plan.locator('.summary-section__price').textContent()) ?? '').replace(/\D/g, '');
    expect(summaryPrice).toBe(listPrice);

    // Not accepted yet: the CTA is disabled.
    const pay = page.getByRole('button', { name: 'Quiero mi seguro' });
    await expect(pay).toBeDisabled();

    // Terms dialog.
    await page.getByRole('button', { name: 'términos y condiciones' }).click();
    const dialog = page.getByRole('dialog', { name: 'Términos y condiciones' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/\S/).nth(1)).toBeVisible();
    await dialog.getByRole('button', { name: 'Entendido' }).click();
    await expect(dialog).toBeHidden();
    await expect(pay).toBeDisabled();

    // Accept and pay.
    await page.getByRole('checkbox', { name: /Acepto/ }).check({ force: true });
    await expect(pay).toBeEnabled();
    await pay.click();
    await expect(page.getByRole('button', { name: 'Procesando…' })).toBeDisabled();

    // Confirmation.
    const confirmationHeading = page.getByRole('heading', { level: 1, name: '¡Listo, ya estás asegurado!' });
    await expect(confirmationHeading).toBeVisible();
    const numberValue = page.locator('dt', { hasText: 'Número de cotización' }).locator('xpath=following-sibling::dd[1]');
    await expect(numberValue).toHaveText(/^CO-\d{8}-[A-HJ-KM-NP-Z2-9]{6}$/);
    const quoteNumber = (await numberValue.textContent()) ?? '';

    // Reload keeps the confirmation and the same number.
    await page.reload();
    await expect(confirmationHeading).toBeVisible();
    await expect(numberValue).toHaveText(quoteNumber);

    // Back never shows the payment button.
    await page.goBack();
    await expect(page.getByRole('button', { name: /Quiero mi seguro|Procesando/ })).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1, name: '¡Listo, ya estás asegurado!' })).toBeVisible();
  });
});
