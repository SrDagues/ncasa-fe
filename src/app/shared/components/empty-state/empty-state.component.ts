import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = '';
  @Input() description = '';
}
