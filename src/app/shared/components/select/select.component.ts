import { Component, Input } from '@angular/core';
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
  @Input() value?: string;
  @Input() placeholder = '';
  @Input() disabled = false;
}
