import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-filter-chip',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './filter-chip.component.html',
})
export class FilterChipComponent {
  @Input() active = false;
  @Input() icon?: string;

  get classes(): string {
    return [
      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ncasa-forest focus-visible:ring-offset-2 focus-visible:ring-offset-ncasa-cream',
      this.active
        ? 'border-ncasa-forest bg-ncasa-forest text-ncasa-cream'
        : 'border-ncasa-border bg-ncasa-surface text-ncasa-charcoal hover:border-ncasa-forest/40 hover:bg-ncasa-sage-soft',
    ].join(' ');
  }
}
