import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';

@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './icon-button.component.html',
})
export class IconButtonComponent {
  @Input({ required: true }) icon!: string;
  /** Required for accessibility on icon-only controls */
  @Input({ required: true }) label!: string;
  @Input() variant: IconButtonVariant = 'secondary';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;

  private readonly base =
    'inline-flex items-center justify-center rounded-xl transition-colors duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ncasa-cream ' +
    'disabled:cursor-not-allowed disabled:opacity-50';

  private readonly variants: Record<IconButtonVariant, string> = {
    primary: 'bg-ncasa-coral text-ncasa-cream hover:bg-ncasa-coral-dark focus-visible:ring-ncasa-coral',
    secondary:
      'bg-ncasa-surface text-ncasa-forest border border-ncasa-border hover:bg-ncasa-sage-soft focus-visible:ring-ncasa-forest',
    tertiary: 'bg-ncasa-sage-soft text-ncasa-forest hover:bg-ncasa-sage/40 focus-visible:ring-ncasa-forest',
    ghost: 'bg-transparent text-ncasa-forest hover:bg-ncasa-forest/5 focus-visible:ring-ncasa-forest',
  };

  get classes(): string {
    const dim = this.size === 'sm' ? 'h-9 w-9' : 'h-11 w-11';
    return [this.base, this.variants[this.variant], dim].join(' ');
  }

  get iconSize(): number {
    return this.size === 'sm' ? 18 : 20;
  }
}
