import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'destructive'
  | 'neutral';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() icon?: string;
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;

  private readonly base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ncasa-cream ' +
    'disabled:cursor-not-allowed disabled:opacity-50';

  private readonly variants: Record<ButtonVariant, string> = {
    primary:
      'bg-ncasa-coral text-ncasa-cream hover:bg-ncasa-coral-dark active:bg-ncasa-coral-dark focus-visible:ring-ncasa-coral',
    secondary:
      'bg-ncasa-surface text-ncasa-forest border border-ncasa-forest/30 hover:border-ncasa-forest hover:bg-ncasa-sage-soft active:bg-ncasa-sage-soft focus-visible:ring-ncasa-forest',
    tertiary:
      'bg-transparent text-ncasa-forest hover:bg-ncasa-forest/5 active:bg-ncasa-forest/10 focus-visible:ring-ncasa-forest',
    destructive:
      'bg-transparent text-ncasa-error border border-ncasa-error/40 hover:bg-ncasa-error/5 active:bg-ncasa-error/10 focus-visible:ring-ncasa-error',
    neutral:
      'bg-ncasa-sage-soft text-ncasa-forest hover:bg-ncasa-sage/40 active:bg-ncasa-sage/50 focus-visible:ring-ncasa-forest',
  };

  private readonly sizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'h-11 w-11',
  };

  get classes(): string {
    return [
      this.base,
      this.variants[this.variant],
      this.sizes[this.size],
      this.fullWidth ? 'w-full' : '',
    ].join(' ');
  }

  get iconSize(): number {
    return this.size === 'lg' ? 20 : 18;
  }
}
