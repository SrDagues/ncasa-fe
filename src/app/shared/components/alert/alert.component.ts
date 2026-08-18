import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './alert.component.html',
})
export class AlertComponent {
  @Input() tone: AlertTone = 'info';
  @Input() title = '';

  private readonly icons: Record<AlertTone, string> = {
    info: 'info',
    success: 'circle-check',
    warning: 'triangle-alert',
    error: 'octagon-alert',
  };

  get icon(): string {
    return this.icons[this.tone];
  }

  get wrap(): string {
    const tones: Record<AlertTone, string> = {
      info: 'bg-ncasa-forest/5 border-ncasa-forest/20 text-ncasa-forest',
      success: 'bg-ncasa-sage-soft border-ncasa-sage/50 text-ncasa-forest',
      warning: 'bg-ncasa-coral/10 border-ncasa-coral/30 text-ncasa-coral-dark',
      error: 'bg-ncasa-error/10 border-ncasa-error/30 text-ncasa-error',
    };
    return `flex gap-3 rounded-xl border p-4 ${tones[this.tone]}`;
  }
}
