import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { WizardCountry } from './wizard-country.service';

@Component({
  selector: 'app-quote-wizard-shell',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './quote-wizard.shell.html',
  styleUrl: './quote-wizard.shell.scss',
})
export class QuoteWizardShell {
  protected readonly wizardCountry = inject(WizardCountry);
  private readonly session = inject(QuoteSessionStore);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly router = inject(Router);

  /** FR-007: leave the wizard; ask first when the session holds data. */
  async changeCountry(): Promise<void> {
    if (this.session.hasData()) {
      const name = this.wizardCountry.country()?.name ?? 'este país';
      const confirmed = await this.confirmDialog.confirm({
        title: '¿Cambiar de país?',
        message: `Los datos que ingresaste para ${name} se van a borrar.`,
        confirmLabel: 'Sí, cambiar',
        cancelLabel: `Seguir en ${name}`,
      });
      if (!confirmed) return;
      this.session.discardData();
    }
    await this.router.navigate(['/']);
  }
}
