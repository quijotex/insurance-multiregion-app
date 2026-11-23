import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import Swiper from 'swiper';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { Subscription } from 'rxjs';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { StepperComponent } from '../../shared/ui/stepper/stepper.component';
import { WizardCountry } from '../quote-wizard/wizard-country.service';
import { PlanCardComponent } from './components/plan-card/plan-card.component';
import { Plan, PlanOffer } from './data/plan.model';
import { PlanService } from './data/plan.service';
import { Ages, agesFromStep1 } from './pricing/ages-from-step1';
import { formatPrice } from './pricing/format-price';
import { simulatePrice } from './pricing/simulate-price';

/** Below Bootstrap's lg breakpoint the cards always become a Swiper slider (R13). */
const NARROW_QUERY = '(max-width: 991.98px)';
/** From lg up, more than this many plans use the slider (3 visible) instead of the grid (G3). */
const MAX_GRID_PLANS = 3;
const ROW_SELECTOR =
  ':scope > .plan-card__head, :scope > .plan-card__price-row, :scope > .plan-card__section';

@Component({
  selector: 'app-plan-list-page',
  imports: [StepperComponent, PlanCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // None: Swiper builds some elements (dots) itself, so its classes must be styled globally.
  encapsulation: ViewEncapsulation.None,
  templateUrl: './plan-list.page.html',
  styleUrl: './plan-list.page.scss',
})
export class PlanListPage {
  private readonly wizardCountry = inject(WizardCountry);
  private readonly planService = inject(PlanService);
  private readonly session = inject(QuoteSessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly steps = ['Tus datos', 'Elige tu plan', 'Resumen'];
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  private readonly narrow = signal(false);
  protected readonly selectedId = signal<string | null>(null);
  private readonly plans = signal<Plan[]>([]);
  private readonly ages = signal<Ages>({ driverAge: null, vehicleAge: null });
  private loadSub: Subscription | null = null;
  private swiper: Swiper | null = null;
  private rowObserver: ResizeObserver | null = null;

  protected readonly offers = computed<PlanOffer[]>(() => {
    const country = this.wizardCountry.country();
    if (!country) return [];
    const { driverAge, vehicleAge } = this.ages();
    return this.plans().map((plan) => {
      const finalPrice = simulatePrice(plan.basePrice, driverAge, vehicleAge, country);
      return { plan, finalPrice, formattedPrice: formatPrice(finalPrice, country) };
    });
  });
  /** Slider below 992px, or from 992px when there are more than 3 plans. */
  protected readonly slider = computed(
    () => this.narrow() || this.offers().length > MAX_GRID_PLANS,
  );
  protected readonly isEmpty =computed(
    () => !this.loading() && !this.failed() && this.offers().length === 0,
  );
  protected readonly actionsDelay = computed(() => this.offers().length + 1);

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus());
    this.watchViewport();
    afterRenderEffect(() => {
      if (this.slider() && this.offers().length > 0) this.mountSwiper();
      else this.unmountSwiper();
    });
    this.destroyRef.onDestroy(() => {
      this.loadSub?.unsubscribe();
      this.unmountSwiper();
    });
    this.load();
  }

  protected load(): void {
    const country = this.wizardCountry.country();
    if (!country) return;
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.failed.set(false);
    this.plans.set([]);
    this.loadSub = this.planService.load(country.code).subscribe({
      next: (plans) => {
        this.ages.set(agesFromStep1(this.session.readStep1(), new Date()));
        this.plans.set(plans);
        this.restoreChoice(plans);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  /** FR-009: keeps the saved choice only while the plan is still offered. */
  private restoreChoice(plans: Plan[]): void {
    const saved = this.session.readPlanId();
    if (saved && plans.some((plan) => plan.id === saved)) {
      this.selectedId.set(saved);
      return;
    }
    if (saved) this.session.clearPlan();
    this.selectedId.set(null);
  }

  protected choose(planId: string): void {
    this.selectedId.set(planId);
    this.session.savePlan(planId);
    const index = this.offers().findIndex((offer) => offer.plan.id === planId);
    if (index >= 0) this.swiper?.slideTo(index, this.reducedMotion() ? 0 : undefined);
  }

  protected backToStep1(): void {
    void this.router.navigate(['..'], { relativeTo: this.route });
  }

  protected continue(): void {
    if (!this.selectedId()) return;
    void this.router.navigate(['..', 'summary'], { relativeTo: this.route });
  }

  private watchViewport(): void {
    if (typeof matchMedia !== 'function') return;
    const query = matchMedia(NARROW_QUERY);
    this.narrow.set(query.matches);
    const onChange = (event: MediaQueryListEvent) => this.narrow.set(event.matches);
    query.addEventListener('change', onChange);
    this.destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
  }

  private reducedMotion(): boolean {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private mountSwiper(): void {
    if (this.swiper) return;
    const root = this.host.nativeElement;
    const container = root.querySelector<HTMLElement>('.plan-list__viewport');
    if (!container) return;
    const offers = untracked(this.offers);
    const selectedId = untracked(this.selectedId);
    const chosen = offers.findIndex((offer) => offer.plan.id === selectedId);
    const highlighted = offers.findIndex((offer) => offer.plan.highlighted);
    // From 992px 3 slides are visible and not centred: clamp so the last 3 fill the track.
    const start = Math.max(0, chosen >= 0 ? chosen : highlighted);
    const initialSlide = this.narrow() ? start : Math.min(start, Math.max(0, offers.length - 3));
    // R-16: dots are positions (one per snap), not plans: label them with the real count.
    const bulletMessage = (swiper: Swiper) =>
      `Ir a la posición {{index}} de ${swiper.snapGrid.length}`;
    this.swiper = new Swiper(container, {
      modules: [Navigation, Pagination, A11y, Keyboard],
      initialSlide,
      slidesPerView: 1.2,
      centeredSlides: true,
      spaceBetween: 16,
      loop: false,
      // R-08: no slide transition under prefers-reduced-motion.
      speed: this.reducedMotion() ? 0 : 300,
      breakpoints: {
        768: { slidesPerView: 2.2 },
        992: { slidesPerView: 3, centeredSlides: false, spaceBetween: 24 },
      },
      keyboard: { enabled: true, onlyInViewport: true },
      navigation: {
        prevEl: root.querySelector<HTMLElement>('.plan-list__nav--prev'),
        nextEl: root.querySelector<HTMLElement>('.plan-list__nav--next'),
      },
      pagination: {
        el: root.querySelector<HTMLElement>('.plan-list__dots'),
        clickable: true,
        // R-07: real buttons with a Spanish name.
        bulletElement: 'button',
        renderBullet: (index, className) =>
          `<button type="button" class="${className}" aria-label="Ir a la posición ${index + 1} de ${this.swiper?.snapGrid.length ?? offers.length}"></button>`,
      },
      on: {
        // Keep the A11y bullet label in step with the number of positions (changes per breakpoint).
        snapGridLengthChange: (swiper) => {
          if (swiper.params.a11y) swiper.params.a11y.paginationBulletMessage = bulletMessage(swiper);
        },
      },
      a11y: {
        prevSlideMessage: 'Plan anterior',
        nextSlideMessage: 'Plan siguiente',
        paginationBulletMessage: 'Ir a la posición {{index}}',
        firstSlideMessage: 'Este es el primer plan',
        lastSlideMessage: 'Este es el último plan',
        slideLabelMessage: 'Plan {{index}} de {{slidesLength}}',
      },
    });
    // The first render ran before `this.swiper` existed: set the labels with the final count.
    const swiper = this.swiper;
    if (swiper.params.a11y) swiper.params.a11y.paginationBulletMessage = bulletMessage(swiper);
    swiper.pagination.bullets.forEach((bullet, index) =>
      bullet.setAttribute('aria-label', `Ir a la posición ${index + 1} de ${swiper.snapGrid.length}`),
    );
    this.syncRows(container);
  }

  /** Slider only: every row (name, price, coverages, benefits) takes the tallest height across slides. */
  private syncRows(container: HTMLElement): void {
    if (typeof ResizeObserver !== 'function') return;
    const cards = Array.from(container.querySelectorAll<HTMLElement>('.plan-card'));
    const rows = cards.map((card) => Array.from(card.querySelectorAll<HTMLElement>(ROW_SELECTOR)));
    const apply = () => {
      for (let i = 0; i < 4; i++) {
        const tallest = Math.max(0, ...rows.map((r) => r[i]?.getBoundingClientRect().height ?? 0));
        container.style.setProperty(`--plan-row-${i + 1}`, `${Math.ceil(tallest)}px`);
      }
    };
    this.rowObserver = new ResizeObserver(apply);
    rows.flat().forEach((row) => this.rowObserver?.observe(row));
    apply();
  }

  private unmountSwiper(): void {
    this.rowObserver?.disconnect();
    this.rowObserver = null;
    this.swiper?.destroy(true, true);
    this.swiper = null;
  }
}
