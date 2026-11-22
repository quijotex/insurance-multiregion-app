import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  createComponent,
  inject,
} from '@angular/core';
import { ConfirmDialogComponent, ConfirmOptions } from './confirm-dialog.component';

/** Awaitable confirmation usable from guards and components. */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const previouslyFocused =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const ref = createComponent(ConfirmDialogComponent, { environmentInjector: this.injector });
      ref.setInput('options', options);
      let done = false;
      const subscription = ref.instance.closed.subscribe((result) => {
        if (done) return;
        done = true;
        subscription.unsubscribe();
        this.appRef.detachView(ref.hostView);
        ref.destroy();
        previouslyFocused?.focus();
        resolve(result);
      });
      this.appRef.attachView(ref.hostView);
      document.body.appendChild(ref.location.nativeElement);
      ref.changeDetectorRef.detectChanges();
    });
  }
}
