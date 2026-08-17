import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from './avatar.component';

@Component({
  selector: 'app-avatar-group',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './avatar-group.component.html',
})
export class AvatarGroupComponent {
  @Input() members: any[] = [];
  @Input() size: 'sm' | 'md' = 'sm';
  @Input() max = 4;

  get visible(): any[] {
    return this.members.slice(0, this.max);
  }

  get overflow(): number {
    return Math.max(0, this.members.length - this.max);
  }
}
