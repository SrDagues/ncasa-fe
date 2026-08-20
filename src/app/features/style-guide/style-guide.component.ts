import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LogoComponent } from '../../shared/components/logo/logo.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { FormFieldComponent } from '../../shared/components/form-field/form-field.component';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-style-guide',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    LogoComponent,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    AlertComponent,
    InputComponent,
    FormFieldComponent,
    CheckboxComponent,
    AvatarComponent,
    TranslatePipe,
  ],
  templateUrl: './style-guide.component.html',
})
export class StyleGuideComponent {
  readonly swatches = [
    { name: 'Forest', bg: 'bg-ncasa-forest', hex: '#123C36' },
    { name: 'Coral', bg: 'bg-ncasa-coral', hex: '#F26B5B' },
    { name: 'Sage', bg: 'bg-ncasa-sage', hex: '#9DB9A7' },
    { name: 'Sage soft', bg: 'bg-ncasa-sage-soft', hex: '#E3ECE5' },
    { name: 'Cream', bg: 'bg-ncasa-cream border border-ncasa-border', hex: '#F7F1E7' },
    { name: 'Surface', bg: 'bg-ncasa-surface border border-ncasa-border', hex: '#FFFCF7' },
    { name: 'Charcoal', bg: 'bg-ncasa-charcoal', hex: '#202624' },
    { name: 'Error', bg: 'bg-ncasa-error', hex: '#B83A32' },
  ];
}
