import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  @Input() initials = '';
  @Input() name = '';
  @Input() color = 'bg-ncasa-sage text-ncasa-forest';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get classes(): string {
    const dim = {
      sm: 'h-7 w-7 text-xs',
      md: 'h-9 w-9 text-sm',
      lg: 'h-12 w-12 text-base',
    }[this.size];
    return `inline-flex items-center justify-center rounded-full font-semibold ${dim} ${this.color}`;
  }
}
