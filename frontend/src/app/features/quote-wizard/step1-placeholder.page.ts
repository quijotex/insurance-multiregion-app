import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { WizardCountry } from './wizard-country.service';

@Component({
  selector: 'app-step1-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step mx-auto py-4">
      <p class="step__counter">Paso 1 de 3</p>
      <h1 class="step__heading" tabindex="-1">Tus datos y los de tu carro</h1>
      @if (wizardCountry.country(); as country) {
        <p class="step__country">País: {{ country.name }}</p>
      }
      <div class="step__placeholder">El formulario de datos llega con US-01.</div>
    </section>
  `,
  styles: `
    .step {
      max-width: 560px;
    }
    .step__counter {
      margin: 0 0 var(--space-2);
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-muted);
    }
    .step__heading {
      margin: 0 0 var(--space-4);
      font-size: 24px;
      font-weight: 700;
      color: var(--color-brand);
    }
    .step__heading:focus {
      outline: none;
    }
    .step__country {
      margin: 0 0 var(--space-4);
    }
    .step__placeholder {
      padding: var(--space-8) var(--space-4);
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-align: center;
    }
    @media (min-width: 768px) {
      .step__heading {
        font-size: 32px;
      }
    }
  `,
})
export class Step1PlaceholderPage {
  protected readonly wizardCountry = inject(WizardCountry);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus());
  }
}
