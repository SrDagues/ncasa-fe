import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './stat-card.component.html',
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() caption?: string;
  @Input() icon?: string;
  @Input() tone: 'default' | 'positive' | 'coral' | 'forest' = 'default';

  get valueClass(): string {
    return {
      default: 'text-ncasa-charcoal',
      positive: 'text-ncasa-forest',
      coral: 'text-ncasa-coral-dark',
      forest: 'text-ncasa-cream',
    }[this.tone];
  }

  get iconWrap(): string {
    return {
      default: 'bg-ncasa-sage-soft text-ncasa-forest',
      positive: 'bg-ncasa-sage-soft text-ncasa-forest',
      coral: 'bg-ncasa-coral/15 text-ncasa-coral-dark',
      forest: 'bg-ncasa-cream/15 text-ncasa-cream',
    }[this.tone];
  }
}
