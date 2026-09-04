import { Component, Input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './select.component.html',
})
export class SelectComponent {
  @Input() id?: string;
  @Input() options: any[] = [];
  readonly value = model('');
  @Input() placeholder = '';
  @Input() disabled = false;

  protected change(event: Event): void { this.value.set((event.target as HTMLSelectElement).value); }
}
