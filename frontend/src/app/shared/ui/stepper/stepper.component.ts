import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './stepper.component.scss',
  template: `
    <p class="stepper__summary">Paso {{ shown() }} de {{ steps().length }}</p>
    <ol class="stepper">
      @for (step of steps(); track $index) {
        <li
          class="stepper__step"
          [class.stepper__step--current]="$index + 1 === current()"
          [class.stepper__step--done]="$index + 1 < current()"
          [class.stepper__step--shown]="$index + 1 === shown()"
          [attr.aria-current]="$index + 1 === current() ? 'step' : null"
        >
          <span class="stepper__circle">
            @if ($index + 1 < current()) {
              <svg
                class="stepper__check"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  d="M3 8.5l3.2 3.2L13 4.8"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            } @else {
              <span aria-hidden="true">{{ $index + 1 }}</span>
            }
          </span>
          <span class="stepper__label"
            >{{ step }}@if ($index + 1 < current()) {
              <span class="visually-hidden"> (completado)</span>
            }</span
          >
        </li>
      }
    </ol>
  `,
})
export class StepperComponent {
  readonly steps = input.required<string[]>();
  /** A value above the last step means "all done" (confirmation). */
  readonly current = input<number>(1);
  /** The step shown alone on mobile: the current one, or the last when all are done. */
  protected readonly shown = computed(() => Math.min(this.current(), this.steps().length));
}
