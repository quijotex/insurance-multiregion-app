import { TestBed } from '@angular/core/testing';
import { ConfirmDialogService } from './confirm-dialog.service';

const options = {
  title: 'Cambiar país',
  message: 'Se perderán tus datos.',
  confirmLabel: 'Sí, cambiar',
  cancelLabel: 'Cancelar',
};

function button(label: string): HTMLButtonElement {
  const found = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === label,
  );
  if (!found) throw new Error(`button ${label} not found`);
  return found;
}

describe('US-00 · FR-007 / FR-012 confirm dialog', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    // jsdom does not implement showModal/close.
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
    service = TestBed.inject(ConfirmDialogService);
  });

  afterEach(() => {
    document.body.querySelectorAll('app-confirm-dialog').forEach((el) => el.remove());
  });

  it('resolves true on confirm and removes the dialog', async () => {
    const result = service.confirm(options);
    button('Sí, cambiar').click();
    expect(await result).toBe(true);
    expect(document.querySelector('app-confirm-dialog')).toBeNull();
  });

  it('resolves false on cancel', async () => {
    const result = service.confirm(options);
    button('Cancelar').click();
    expect(await result).toBe(false);
  });

  it('resolves false on Esc (cancel event)', async () => {
    const result = service.confirm(options);
    const dialog = document.querySelector('dialog');
    dialog?.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(await result).toBe(false);
  });

  it('returns focus to the previously focused element', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const result = service.confirm(options);
    button('Cancelar').click();
    await result;
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
