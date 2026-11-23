import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PlanOffer } from '../../data/plan.model';

/**
 * One selectable plan: a native radio inside a label, styled as a card (ui-ux-guidelines plan-card
 * recipe). The four rows (name, price, coverages, benefits) sit in the parent's subgrid.
 */
@Component({
  selector: 'app-plan-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './plan-card.component.scss',
  template: `
    <label
      class="plan-card"
      [class.plan-card--recommended]="offer().plan.highlighted"
      [class.plan-card--selected]="selected()"
    >
      @if (offer().plan.highlighted) {
        <span class="plan-card__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
            <path
              fill="currentColor"
              d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
            />
          </svg>
          Recomendado
        </span>
      }
      <input
        class="plan-card__input"
        type="radio"
        [name]="groupName()"
        [value]="offer().plan.id"
        [checked]="selected()"
        [attr.aria-labelledby]="nameId()"
        [attr.aria-describedby]="priceId()"
        (change)="chosen.emit(offer().plan.id)"
      />
      <span class="plan-card__head">
        <span class="plan-card__radio" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" focusable="false">
            <path
              d="M3 8.5l3.2 3.2L13 4.8"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="plan-card__title">
          <span class="plan-card__name" [id]="nameId()"
            >{{ offer().plan.name
            }}@if (offer().plan.highlighted) {<span class="visually-hidden">, plan recomendado</span>}</span
          >
          <span class="plan-card__description">{{ offer().plan.shortDescription }}</span>
        </span>
      </span>
      <span class="plan-card__price-row" [id]="priceId()">
        <span class="plan-card__price">{{ price().amount }}</span>
        <span class="plan-card__period">{{ price().period }}</span>
      </span>
      <span class="plan-card__section">
        @if (offer().plan.coverages.length > 0) {
          <span class="plan-card__section-title">Coberturas</span>
          <ul class="plan-card__list">
            @for (item of offer().plan.coverages; track $index) {
              <li class="plan-card__item">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ item }}
              </li>
            }
          </ul>
        }
      </span>
      <span class="plan-card__section">
        @if (offer().plan.benefits.length > 0) {
          <span class="plan-card__section-title">Beneficios</span>
          <ul class="plan-card__list">
            @for (item of offer().plan.benefits; track $index) {
              <li class="plan-card__item">
                <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
                  <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ item }}
              </li>
            }
          </ul>
        }
      </span>
    </label>
  `,
})
export class PlanCardComponent {
  readonly offer = input.required<PlanOffer>();
  readonly selected = input(false);
  /** Shared `name` of the radio group. */
  readonly groupName = input.required<string>();
  readonly chosen = output<string>();

  protected readonly nameId = computed(() => `plan-name-${this.offer().plan.id}`);
  protected readonly priceId = computed(() => `plan-price-${this.offer().plan.id}`);
  /** "$ 145.000 / mes" shown as a large amount and a smaller period. */
  protected readonly price = computed(() => {
    const text = this.offer().formattedPrice;
    const cut = text.lastIndexOf(' / ');
    return cut < 0
      ? { amount: text, period: '' }
      : { amount: text.slice(0, cut), period: text.slice(cut + 1) };
  });
}
