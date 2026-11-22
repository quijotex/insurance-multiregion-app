import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { startWith, switchMap } from 'rxjs';
import { SelectFieldComponent } from '../../../../shared/ui/select-field/select-field.component';
import { FormFieldDescriptor } from '../../data/form-field.model';
import { FieldValue } from '../../validation/validation.model';

/** DOM id of the focusable control of a field (also used to focus the first invalid one). */
export function fieldInputId(key: string): string {
  return `field-${key}`;
}

@Component({
  selector: 'app-form-field',
  imports: [ReactiveFormsModule, SelectFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './form-field.component.scss',
  template: `
    <div class="form-field" [class.form-field--invalid]="showError()">
      @if (field().type === 'checkbox') {
        <div class="form-field__check">
          <input
            class="form-field__checkbox"
            type="checkbox"
            [id]="inputId()"
            [formControl]="control()"
            [attr.required]="field().required ? '' : null"
            [attr.aria-required]="field().required ? 'true' : null"
            [attr.aria-invalid]="showError() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
          />
          <label class="form-field__check-label" [for]="inputId()"
            >{{ field().label }}@if (field().required) {
              <span class="form-field__star" aria-hidden="true"> *</span>
            }</label
          >
        </div>
      } @else {
        <label class="form-field__label" [for]="inputId()"
          >{{ field().label }}@if (field().required) {
            <span class="form-field__star" aria-hidden="true"> *</span>
          }</label
        >
        @if (field().type === 'select') {
          <app-select-field
            [inputId]="inputId()"
            [options]="field().options"
            [placeholder]="field().placeholder ?? 'Selecciona'"
            [invalid]="showError()"
            [describedBy]="describedBy()"
            [required]="field().required"
            [formControl]="control()"
          />
        } @else if (field().type === 'date') {
          <input
            class="form-field__control"
            type="date"
            [id]="inputId()"
            [formControl]="control()"
            [attr.required]="field().required ? '' : null"
            [attr.aria-required]="field().required ? 'true' : null"
            [attr.aria-invalid]="showError() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
          />
        } @else {
          <input
            class="form-field__control"
            type="text"
            [attr.inputmode]="field().type === 'number' ? 'numeric' : null"
            [id]="inputId()"
            [formControl]="control()"
            [placeholder]="field().placeholder ?? ''"
            [attr.required]="field().required ? '' : null"
            [attr.aria-required]="field().required ? 'true' : null"
            [attr.aria-invalid]="showError() ? 'true' : null"
            [attr.aria-describedby]="describedBy()"
          />
        }
      }
      @if (field().helpText) {
        <p class="form-field__help" [id]="helpId()">{{ field().helpText }}</p>
      }
      @if (showError()) {
        <p class="form-field__error" role="alert" [id]="errorId()">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
            <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M8 4.5v4.2M8 11v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <span>{{ field().errorMessage }}</span>
        </p>
      }
    </div>
  `,
})
export class FormFieldComponent {
  readonly field = input.required<FormFieldDescriptor>();
  readonly control = input.required<FormControl<FieldValue>>();
  readonly submitted = input(false);

  /** Re-evaluates whenever the control is touched or its status changes (OnPush + reactive forms). */
  private readonly tick = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) => control.events.pipe(startWith(null))),
    ),
    { initialValue: null },
  );

  protected readonly inputId = computed(() => fieldInputId(this.field().key));
  protected readonly helpId = computed(() => `${this.inputId()}-help`);
  protected readonly errorId = computed(() => `${this.inputId()}-error`);

  protected readonly showError = computed(() => {
    this.tick();
    const control = this.control();
    return control.invalid && (control.touched || this.submitted());
  });

  protected readonly describedBy = computed(() => {
    const ids: string[] = [];
    if (this.field().helpText) ids.push(this.helpId());
    if (this.showError()) ids.push(this.errorId());
    return ids.length ? ids.join(' ') : null;
  });
}
