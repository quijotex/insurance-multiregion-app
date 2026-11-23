import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RichTextBlock } from './rich-text.model';

/**
 * Renders the Strapi `blocks` subset with plain templates (ADR 0007): no innerHTML and no
 * sanitiser bypass, so every text is escaped by Angular. Headings sit under the page's `h2`,
 * so levels 1-2 become `h3` and 3-6 become `h4`.
 */
@Component({
  selector: 'app-rich-text',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './rich-text.component.scss',
  template: `
    <ng-template #inlines let-nodes>
      @for (node of nodes; track $index) {
        @switch (node.type) {
          @case ('link') {
            <a
              class="rich-text__link"
              [href]="node.url"
              target="_blank"
              rel="noopener noreferrer"
              ><ng-container
                [ngTemplateOutlet]="inlines"
                [ngTemplateOutletContext]="{ $implicit: node.children }"
            /></a>
          }
          @default {
            <span
              [class.rich-text__bold]="node.bold"
              [class.rich-text__italic]="node.italic"
              [class.rich-text__underline]="node.underline"
              >{{ node.text }}</span
            >
          }
        }
      }
    </ng-template>

    <div class="rich-text">
      @for (block of blocks(); track $index) {
        @switch (block.type) {
          @case ('paragraph') {
            <p class="rich-text__paragraph">
              <ng-container
                [ngTemplateOutlet]="inlines"
                [ngTemplateOutletContext]="{ $implicit: block.children }"
              />
            </p>
          }
          @case ('quote') {
            <blockquote class="rich-text__quote">
              <ng-container
                [ngTemplateOutlet]="inlines"
                [ngTemplateOutletContext]="{ $implicit: block.children }"
              />
            </blockquote>
          }
          @case ('heading') {
            @if (block.level <= 2) {
              <h3 class="rich-text__heading">
                <ng-container
                  [ngTemplateOutlet]="inlines"
                  [ngTemplateOutletContext]="{ $implicit: block.children }"
                />
              </h3>
            } @else {
              <h4 class="rich-text__subheading">
                <ng-container
                  [ngTemplateOutlet]="inlines"
                  [ngTemplateOutletContext]="{ $implicit: block.children }"
                />
              </h4>
            }
          }
          @case ('list') {
            @if (block.format === 'ordered') {
              <ol class="rich-text__list">
                @for (item of block.children; track $index) {
                  <li>
                    <ng-container
                      [ngTemplateOutlet]="inlines"
                      [ngTemplateOutletContext]="{ $implicit: item.children }"
                    />
                  </li>
                }
              </ol>
            } @else {
              <ul class="rich-text__list">
                @for (item of block.children; track $index) {
                  <li>
                    <ng-container
                      [ngTemplateOutlet]="inlines"
                      [ngTemplateOutletContext]="{ $implicit: item.children }"
                    />
                  </li>
                }
              </ul>
            }
          }
        }
      }
    </div>
  `,
})
export class RichTextComponent {
  readonly blocks = input.required<RichTextBlock[]>();
}
