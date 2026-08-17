import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
})
export class CardComponent {
  @Input() padding: 'sm' | 'md' | 'lg' | 'none' = 'md';
  @Input() tone: 'surface' | 'forest' | 'sage' = 'surface';

  get classes(): string {
    const pad = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' }[this.padding];
    const tones = {
      surface: 'bg-ncasa-surface border border-ncasa-border',
      forest: 'bg-ncasa-forest border border-ncasa-forest text-ncasa-cream',
      sage: 'bg-ncasa-sage-soft border border-ncasa-sage/40',
    }[this.tone];
    return `rounded-2xl shadow-soft ${tones} ${pad}`;
  }
}
