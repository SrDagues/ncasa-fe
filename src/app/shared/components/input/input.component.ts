import { Component, EventEmitter, Input, model, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './input.component.html',
})
export class InputComponent {
  @Input() id?: string;
  @Input() type = 'text';
  @Input() placeholder = '';
  readonly value = model('');
  @Input() icon?: string;
  @Input() trailingIcon?: string;
  @Input() prefix?: string;
  @Input() invalid = false;
  @Input() disabled = false;
  @Input() autocomplete?: string;

  @Output() trailingIconClick = new EventEmitter<void>();

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
  }

  get classes(): string {
    return [
      'h-11 w-full rounded-xl border bg-ncasa-surface text-sm text-ncasa-charcoal placeholder:text-ncasa-muted',
      'transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ncasa-cream',
      'disabled:cursor-not-allowed disabled:opacity-60',
      this.icon ? 'pl-11' : 'pl-4',
      this.prefix ? 'pl-9' : '',
      this.trailingIcon ? 'pr-11' : 'pr-4',
      this.invalid
        ? 'border-ncasa-error focus-visible:ring-ncasa-error'
        : 'border-ncasa-border focus:border-ncasa-forest focus-visible:ring-ncasa-forest',
    ].join(' ');
  }
}
