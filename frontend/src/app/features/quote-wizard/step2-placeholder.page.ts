import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StepperComponent } from '../../shared/ui/stepper/stepper.component';

@Component({
  selector: 'app-step2-placeholder',
  imports: [StepperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <app-stepper [steps]="steps" [current]="2" />
          <div class="step__card">
            <h1 class="step__heading" tabindex="-1">Elige tu plan</h1>
            <p class="step__text">Los planes llegan con US-02.</p>
            <button type="button" class="button button--secondary" (click)="back()">Volver</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .step__card {
      margin-top: var(--space-4);
      padding: var(--space-6);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      box-shadow: var(--shadow-card);
    }
    .step__heading {
      margin: 0 0 var(--space-2);
      font-size: 24px;
      font-weight: 700;
      color: var(--color-brand);
    }
    .step__heading:focus {
      outline: none;
    }
    .step__text {
      margin: 0 0 var(--space-6);
      color: var(--color-text-muted);
    }
    @media (min-width: 768px) {
      .step__heading {
        font-size: 32px;
      }
    }
  `,
})
export class Step2PlaceholderPage {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly steps = ['Tus datos', 'Elige tu plan', 'Resumen'];

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus());
  }

  protected back(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }
}
