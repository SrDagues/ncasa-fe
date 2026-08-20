import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

let uid = 0;

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './checkbox.component.html',
})
export class CheckboxComponent {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() label = '';
  @Input() checkboxId = `checkbox-${uid++}`;

  @Output() checkedChange = new EventEmitter<boolean>();

  onChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.checkedChange.emit(target.checked);
  }
}
