import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Country } from '../../core/country/country.model';
import { CountryService } from '../../core/country/country.service';
import { QuoteSessionStore } from '../../core/session/quote-session.store';

type LoadStatus = 'loading' | 'error' | 'ready';

@Component({
  selector: 'app-country-selection-page',
  templateUrl: './country-selection.page.html',
  styleUrl: './country-selection.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountrySelectionPage implements OnInit {
  private readonly countryService = inject(CountryService);
  private readonly session = inject(QuoteSessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly countries = signal<Country[]>([]);
  protected readonly selectedCode = signal<string | null>(null);
  protected readonly unavailable = this.route.snapshot.queryParamMap.has('unavailable');

  protected readonly isEmpty = computed(
    () => this.status() === 'ready' && this.countries().length === 0,
  );
  protected readonly canContinue = computed(() => this.selectedCode() !== null);

  ngOnInit(): void {
    this.fetch(this.countryService.load());
  }

  protected retry(): void {
    this.fetch(this.countryService.reload());
  }

  protected select(code: string): void {
    this.selectedCode.set(code);
  }

  protected continue(): void {
    const code = this.selectedCode();
    if (code) void this.router.navigateByUrl(`/${code}/quote`);
  }

  private fetch(request$: Observable<Country[]>): void {
    this.status.set('loading');
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (countries) => {
        this.countries.set(countries);
        const last = this.session.lastCountryCode();
        const preselect = last ? countries.find((c) => c.code === last.toLowerCase()) : undefined;
        this.selectedCode.set(preselect?.code ?? null);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }
}
