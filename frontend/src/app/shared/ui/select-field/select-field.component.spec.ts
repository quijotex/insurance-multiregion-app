import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import { SelectFieldComponent, SelectOption } from './select-field.component';

@Component({
  imports: [ReactiveFormsModule, SelectFieldComponent],
  template: `<label for="brand">Marca</label>
    <app-select-field inputId="brand" [options]="options()" [formControl]="control" />`,
})
class HostComponent {
  options = signal<SelectOption[]>([
    { label: 'Alfa', value: 'a' },
    { label: 'Beta', value: 'b' },
    { label: 'Gamma', value: 'c' },
  ]);
  control = new FormControl<string>('', { nonNullable: true });
}

describe('US-01 · FR-011 select field keyboard', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let trigger: HTMLButtonElement;

  const key = (k: string) => {
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    trigger = fixture.nativeElement.querySelector('[role="combobox"]');
  });

  it('opens with ArrowDown and updates aria-expanded', () => {
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    key('ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('[role="option"]').length).toBe(3);
  });

  it('moves with arrows (wrapping), Home and End, updating aria-activedescendant', () => {
    key('ArrowDown');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-0');
    key('ArrowDown');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-1');
    key('End');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-2');
    key('ArrowDown');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-0');
    key('ArrowUp');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-2');
    key('Home');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-0');
  });

  it('scrolls the active option into view as the arrows move (long lists)', async () => {
    const scrolled: string[] = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.id);
    };
    try {
      key('ArrowDown');
      await fixture.whenStable();
      key('End');
      await fixture.whenStable();
      expect(scrolled).toContain('brand-option-0');
      expect(scrolled.at(-1)).toBe('brand-option-2');
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('Enter picks the active option, emits the value and closes', () => {
    key('ArrowDown');
    key('ArrowDown');
    key('Enter');
    expect(host.control.value).toBe('b');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent).toContain('Beta');
  });

  it('Escape closes without changing the value', () => {
    key('ArrowDown');
    key('ArrowDown');
    key('Escape');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(host.control.value).toBe('');
  });

  it('writeValue shows the matching label', () => {
    host.control.setValue('c');
    fixture.detectChanges();
    expect(trigger.textContent).toContain('Gamma');
    key('Enter');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('brand-option-2');
  });

  it('is aria-disabled, focusable and does not open when there are no options', () => {
    host.options.set([]);
    fixture.detectChanges();
    expect(trigger.disabled).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.textContent).toContain('Sin opciones disponibles');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    key('ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});
