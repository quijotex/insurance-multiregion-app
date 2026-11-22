import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  output,
  viewChild,
} from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './confirm-dialog.component.scss',
  template: `
    <dialog
      #dialog
      class="confirm-dialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      (cancel)="onCancel($event)"
    >
      <div class="confirm-dialog__content">
        <h2 id="confirm-dialog-title" class="confirm-dialog__title">{{ options().title }}</h2>
        <p id="confirm-dialog-message" class="confirm-dialog__message">{{ options().message }}</p>
        <div class="confirm-dialog__actions">
          <button type="button" class="button button--secondary" (click)="closed.emit(false)">
            {{ options().cancelLabel }}
          </button>
          <button type="button" class="button button--primary" (click)="closed.emit(true)">
            {{ options().confirmLabel }}
          </button>
        </div>
      </div>
    </dialog>
  `,
})
export class ConfirmDialogComponent {
  readonly options = input.required<ConfirmOptions>();
  readonly closed = output<boolean>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterNextRender(() => this.dialog().nativeElement.showModal());
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.closed.emit(false);
  }
}
