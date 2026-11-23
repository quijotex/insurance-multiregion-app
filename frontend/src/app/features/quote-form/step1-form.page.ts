import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { QuoteSessionStore } from '../../core/session/quote-session.store';
import { StepperComponent } from '../../shared/ui/stepper/stepper.component';
import { WizardCountry } from '../quote-wizard/wizard-country.service';
import { FormFieldComponent, fieldInputId } from './components/form-field/form-field.component';
import { FormFieldDescriptor, FormSections } from './data/form-field.model';
import { FormFieldService } from './data/form-field.service';
import { restoredValue } from './validation/restored-value';
import { buildValidators } from './validation/build-validators';
import { FieldValue } from './validation/validation.model';

export { restoredValue };

type Step1Group = FormGroup<Record<string, FormControl<FieldValue>>>;

interface SectionView {
  id: 'policyholder' | 'vehicle';
  title: string;
  fields: { field: FormFieldDescriptor; delay: number }[];
  titleDelay: number;
}

const SECTION_TITLES: Record<SectionView['id'], string> = {
  policyholder: 'Tus datos',
  vehicle: 'Tu vehículo',
};

@Component({
  selector: 'app-step1-form-page',
  imports: [ReactiveFormsModule, StepperComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './step1-form.page.html',
  styleUrl: './step1-form.page.scss',
})
export class Step1FormPage {
  private readonly wizardCountry = inject(WizardCountry);
  private readonly fieldService = inject(FormFieldService);
  private readonly session = inject(QuoteSessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  protected readonly steps = ['Tus datos', 'Elige tu plan', 'Resumen'];
  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly submitted = signal(false);
  protected readonly statusMessage = signal('');
  protected readonly form = signal<Step1Group | null>(null);
  private readonly loaded = signal<FormSections | null>(null);
  private loadSub: Subscription | null = null;

  protected readonly sections = computed<SectionView[]>(() => {
    const data = this.loaded();
    if (!data) return [];
    let index = 1; // 0 is the card header
    const views: SectionView[] = [];
    for (const id of ['policyholder', 'vehicle'] as const) {
      const fields = data[id];
      if (fields.length === 0) continue;
      const titleDelay = index++;
      views.push({
        id,
        title: SECTION_TITLES[id],
        titleDelay,
        fields: fields.map((field) => ({ field, delay: index++ })),
      });
    }
    return views;
  });
  protected readonly isEmpty = computed(
    () => !this.loading() && !this.failed() && this.sections().length === 0,
  );
  protected readonly buttonDelay = computed(
    () => 1 + this.sections().reduce((n, s) => n + 1 + s.fields.length, 0),
  );

  constructor() {
    afterNextRender(() => this.host.nativeElement.querySelector<HTMLElement>('h1')?.focus());
    this.load();
  }

  protected load(): void {
    const country = this.wizardCountry.country();
    if (!country) return;
    this.loadSub?.unsubscribe();
    this.loading.set(true);
    this.failed.set(false);
    this.loadSub = this.fieldService.load(country.code).subscribe({
      next: (sections) => {
        this.form.set(this.buildForm(sections, country.legalAge));
        this.loaded.set(sections);
        this.loading.set(false);
        // R-02: the guard sent us back because the saved values are no longer valid.
        if (this.session.consumeStep1Review()) afterNextRender(() => this.showErrors(), { injector: this.injector });
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  private buildForm(sections: FormSections, legalAge: number): Step1Group {
    const stored = this.session.readStep1();
    const today = new Date();
    const controls: Record<string, FormControl<FieldValue>> = {};
    for (const field of [...sections.policyholder, ...sections.vehicle]) {
      const initial = restoredValue(field, stored[field.key]);
      controls[field.key] = new FormControl<FieldValue>(initial, {
        nonNullable: true,
        validators: buildValidators(field.rules, { legalAge, today }, field.key),
      });
    }
    const group: Step1Group = new FormGroup(controls);
    group.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.session.saveStep1(group.getRawValue()));
    return group;
  }

  protected control(key: string): FormControl<FieldValue> {
    return this.form()!.controls[key];
  }

  protected submit(): void {
    const form = this.form();
    if (!form) return;
    if (this.showErrors()) return;
    this.session.markStep1Completed();
    void this.router.navigate(['plans'], { relativeTo: this.route });
  }

  /** Marks everything touched; when invalid, announces and focuses the first bad field. */
  private showErrors(): boolean {
    const form = this.form();
    if (!form) return false;
    this.submitted.set(true);
    form.markAllAsTouched();
    if (form.invalid) {
      const count = Object.values(form.controls).filter((c) => c.invalid).length;
      // Same text twice in a row is not re-announced: clear first, then set on the next tick.
      this.statusMessage.set('');
      queueMicrotask(() =>
        this.statusMessage.set(
          count === 1 ? 'Revisa el campo marcado.' : `Revisa los ${count} campos marcados.`,
        ),
      );
      this.focusFirstInvalid(form);
      return true;
    }
    return false;
  }

  private focusFirstInvalid(form: Step1Group): void {
    for (const section of this.sections()) {
      for (const { field } of section.fields) {
        if (form.controls[field.key].invalid) {
          this.host.nativeElement.querySelector<HTMLElement>(`#${fieldInputId(field.key)}`)?.focus();
          return;
        }
      }
    }
  }
}
