import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-select-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './select-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
  template: `
    <div class="select-field" [class.select-field--open]="open()">
      <button
        type="button"
        class="select-field__trigger"
        [class.select-field__trigger--invalid]="invalid()"
        role="combobox"
        aria-haspopup="listbox"
        [id]="inputId()"
        [attr.aria-disabled]="isDisabled() ? 'true' : null"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="listboxId()"
        [attr.aria-activedescendant]="open() ? optionId(activeIndex()) : null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [attr.aria-required]="required() ? 'true' : null"
        [attr.aria-describedby]="describedBy()"
        (click)="toggle()"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
      >
        <span
          class="select-field__value"
          [class.select-field__value--placeholder]="!selectedOption()"
          >{{ displayText() }}</span
        >
        <svg
          class="select-field__chevron"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M3.5 6l4.5 4.5L12.5 6"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      @if (open()) {
        <ul
          class="select-field__listbox"
          role="listbox"
          [id]="listboxId()"
          (mousedown)="$event.preventDefault()"
        >
          @for (option of options(); track option.value; let i = $index) {
            <!-- Keyboard handled on the combobox trigger (aria-activedescendant pattern). -->
            <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
            <li
              class="select-field__option"
              [class.select-field__option--active]="i === activeIndex()"
              [class.select-field__option--selected]="option.value === value()"
              role="option"
              [id]="optionId(i)"
              [attr.aria-selected]="option.value === value()"
              (click)="pick(i)"
              (mousemove)="activeIndex.set(i)"
            >
              <span>{{ option.label }}</span>
              @if (option.value === value()) {
                <svg
                  class="select-field__check"
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
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class SelectFieldComponent implements ControlValueAccessor {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly inputId = input.required<string>();
  readonly options = input<SelectOption[]>([]);
  readonly placeholder = input('Selecciona');
  readonly invalid = input(false);
  readonly describedBy = input<string | null>(null);
  readonly required = input(false);

  protected readonly value = signal('');
  protected readonly open = signal(false);
  protected readonly activeIndex = signal(0);
  private readonly formDisabled = signal(false);

  protected readonly isDisabled = computed(
    () => this.formDisabled() || this.options().length === 0,
  );
  protected readonly listboxId = computed(() => `${this.inputId()}-listbox`);
  protected readonly selectedOption = computed(
    () => this.options().find((o) => o.value === this.value()) ?? null,
  );
  protected readonly displayText = computed(() => {
    if (this.options().length === 0) return 'Sin opciones disponibles';
    return this.selectedOption()?.label ?? this.placeholder();
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected optionId(index: number): string {
    return `${this.inputId()}-option-${index}`;
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    if (this.open()) {
      this.close();
    } else {
      this.openList();
    }
  }

  private openList(): void {
    if (this.isDisabled()) return;
    const idx = this.options().findIndex((o) => o.value === this.value());
    this.activeIndex.set(idx >= 0 ? idx : 0);
    this.open.set(true);
  }

  private close(): void {
    this.open.set(false);
  }

  protected pick(index: number): void {
    const option = this.options()[index];
    if (!option) return;
    this.value.set(option.value);
    this.onChange(option.value);
    this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    if (this.isDisabled() || count === 0) return;
    if (!this.open()) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        this.openList();
      }
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex.set((this.activeIndex() + 1) % count);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex.set((this.activeIndex() - 1 + count) % count);
        break;
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(0);
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(count - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.pick(this.activeIndex());
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        this.onTouched();
        break;
    }
  }

  protected onBlur(): void {
    if (!this.open()) this.onTouched();
  }

  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
      this.onTouched();
    }
  }
}
