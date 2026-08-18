import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type BadgeTone = 'neutral' | 'positive' | 'warning' | 'coral' | 'forest';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './badge.component.html',
})
export class BadgeComponent {
  @Input() tone: BadgeTone = 'neutral';
  @Input() icon?: string;

  get classes(): string {
    const tones: Record<BadgeTone, string> = {
      neutral: 'bg-ncasa-charcoal/8 text-ncasa-charcoal',
      positive: 'bg-ncasa-sage-soft text-ncasa-forest',
      warning: 'bg-ncasa-coral/15 text-ncasa-coral-dark',
      coral: 'bg-ncasa-coral text-ncasa-cream',
      forest: 'bg-ncasa-forest text-ncasa-cream',
    };
    return `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[this.tone]}`;
  }
}
