import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.component.html',
})
export class LogoComponent {
  /** 'full' shows the wordmark + tagline, 'mark' only the isotype */
  @Input() variant: 'full' | 'wordmark' | 'mark' = 'full';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() tone: 'default' | 'light' = 'default';

  get markSize(): string {
    return { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' }[this.size];
  }

  get wordSize(): string {
    return { sm: 'text-xl', md: 'text-2xl', lg: 'text-4xl' }[this.size];
  }

  get wordColor(): string {
    return this.tone === 'light' ? 'text-ncasa-cream' : 'text-ncasa-forest';
  }

  get tagColor(): string {
    return this.tone === 'light' ? 'text-ncasa-cream/70' : 'text-ncasa-muted';
  }
}
