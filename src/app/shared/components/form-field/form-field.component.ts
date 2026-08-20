import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

let uid = 0;

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-field.component.html',
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() hint?: string;
  @Input() error?: string;
  @Input() optional = false;
  /** Id shared with the inner control via label[for] */
  @Input() fieldId = `field-${uid++}`;
}
