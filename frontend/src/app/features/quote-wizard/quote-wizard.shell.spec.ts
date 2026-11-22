import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { QuoteWizardShell } from './quote-wizard.shell';
import { WizardCountry } from './wizard-country.service';

describe('US-00 · FR-007 header "Cambiar país"', () => {
  let confirm: ReturnType<typeof vi.fn>;
  let navigate: ReturnType<typeof vi.spyOn>;
  let session: QuoteSessionStore;

  function setup(data: Record<string, unknown>) {
    sessionStorage.setItem('quote-session', JSON.stringify({ countryCode: 'co', data }));
    const fixture = TestBed.createComponent(QuoteWizardShell);
    fixture.detectChanges();
    return fixture;
  }

  async function clickChange(fixture: ReturnType<typeof setup>) {
    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.wizard-header__change',
    );
    button?.click();
    await fixture.whenStable();
    await Promise.resolve();
  }

  beforeEach(() => {
    sessionStorage.clear();
    confirm = vi.fn();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ConfirmDialogService, useValue: { confirm } }],
    });
    TestBed.inject(WizardCountry).set({
      code: 'co',
      name: 'Colombia',
      iconUrl: '/uploads/co.svg',
      iconAlt: 'Bandera de Colombia',
    });
    session = TestBed.inject(QuoteSessionStore);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  it('shows the active country flag and name', () => {
    const fixture = setup({});
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('img')?.getAttribute('alt')).toBe('Bandera de Colombia');
    expect(el.querySelector('.wizard-header__country-name')?.textContent).toContain('Colombia');
  });

  it('goes to the selection page without asking when there is no data', async () => {
    await clickChange(setup({}));
    expect(confirm).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
    expect(session.lastCountryCode()).toBe('co');
  });

  it('asks first when there is data, discards it and navigates on confirm', async () => {
    confirm.mockResolvedValue(true);
    await clickChange(setup({ a: 1 }));
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Los datos que ingresaste para Colombia se van a borrar.' }),
    );
    expect(session.hasData()).toBe(false);
    expect(session.lastCountryCode()).toBe('co');
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('stays and keeps the data on cancel', async () => {
    confirm.mockResolvedValue(false);
    await clickChange(setup({ a: 1 }));
    expect(session.hasData()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
