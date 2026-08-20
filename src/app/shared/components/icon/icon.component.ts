import { Component, Input } from '@angular/core';

@Component({
  selector: 'lucide-icon',
  templateUrl: './icon.component.html',
  styles: ':host { display: inline-flex; flex: 0 0 auto; line-height: 0; }',
})
export class IconComponent {
  @Input() name = 'circle';
  @Input() size: string | number = 20;

  protected readonly paths: Record<string, string[]> = {
    home: ['M3 11 12 3l9 8', 'M5 10v10h14V10', 'M9 20v-6h6v6'],
    calendar: ['M3 5h18v16H3z', 'M7 3v4M17 3v4M3 9h18'],
    'calendar-plus': ['M3 5h18v16H3z', 'M7 3v4M17 3v4M3 9h18', 'M12 12v6M9 15h6'],
    wallet: ['M3 6h18v14H3z', 'M16 11h5v4h-5z', 'M5 6V4h13v2'],
    'chart-pie': ['M12 2v10h10A10 10 0 0 0 12 2Z', 'M19.1 19.1A10 10 0 1 1 8 2.8V13h10.2a10 10 0 0 1 .9 6.1Z'],
    'piggy-bank': ['M4 10a7 7 0 0 1 7-5h2a6 6 0 0 1 6 6v1h2v4h-3l-1 4h-3l-.5-2h-5L8 20H5l-1-4a5 5 0 0 1 0-6Z', 'M14 9h.01M7 8 5 5'],
    'receipt-text': ['M5 3h14v19l-3-2-4 2-4-2-3 2z', 'M8 8h8M8 12h8M8 16h5'],
    users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'],
    user: ['M20 21a8 8 0 0 0-16 0', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
    'user-plus': ['M16 21a8 8 0 0 0-16 0', 'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M16 11h6'],
    plus: ['M12 5v14M5 12h14'],
    check: ['m5 12 4 4L19 6'],
    'check-square': ['M3 3h18v18H3z', 'm7 12 3 3 7-7'],
    mail: ['M3 5h18v14H3z', 'm3 7 9 6 9-6'],
    lock: ['M5 10h14v11H5z', 'M8 10V7a4 4 0 0 1 8 0v3'],
    eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
    'eye-off': ['m3 3 18 18', 'M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 22 12a15 15 0 0 1-2.1 3.1M6.6 6.6A15 15 0 0 0 2 12s4 7 10 7a9 9 0 0 0 3.4-.7'],
    bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4'],
    'chevron-left': ['m15 18-6-6 6-6'],
    'chevron-right': ['m9 18 6-6-6-6'],
    'chevron-down': ['m6 9 6 6 6-6'],
    'ellipsis-vertical': ['M12 5h.01M12 12h.01M12 19h.01'],
    'arrow-left': ['M19 12H5m7-7-7 7 7 7'],
    'arrow-right': ['M5 12h14m-7-7 7 7-7 7'],
    'arrow-up-right': ['M7 17 17 7M7 7h10v10'],
    'arrow-down-right': ['m7 7 10 10M7 17h10V7'],
    'log-out': ['M10 17l5-5-5-5M15 12H3M14 3h7v18h-7'],
    'shopping-cart': ['M3 3h2l2.5 11h10l3-8H6', 'M9 20h.01M17 20h.01'],
    zap: ['m13 2-9 12h8l-1 8 9-12h-8z'],
    wifi: ['M5 12a11 11 0 0 1 14 0M8.5 15.5a6 6 0 0 1 7 0M12 19h.01'],
    utensils: ['M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c-3 2-3 8 0 10'],
    tag: ['M3 12V3h9l9 9-9 9z', 'M8 8h.01'],
    heart: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
    camera: ['M3 7h4l2-3h6l2 3h4v13H3z', 'M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
    upload: ['M12 16V4m-5 5 5-5 5 5M4 20h16'],
    'scan-line': ['M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4M7 12h10'],
    palette: ['M12 3a9 9 0 1 0 0 18h2a2 2 0 0 0 0-4h-1a2 2 0 0 1-2-2c0-1 1-2 2-3a6 6 0 0 0-6-9Z'],
    type: ['M4 6V4h16v2M9 20h6M12 4v16'],
    layers: ['m12 2 9 5-9 5-9-5z', 'm3 12 9 5 9-5M3 17l9 5 9-5'],
    'trash-2': ['M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7'],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 10v6M12 7h.01'],
    'circle-check': ['M22 11a10 10 0 1 1-5-8.7', 'm9 11 3 3L22 4'],
    'triangle-alert': ['M10.3 2.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z', 'M12 9v4M12 17h.01'],
    'octagon-alert': ['m7.9 2 8.2 0L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z', 'M12 8v4M12 16h.01'],
    inbox: ['M4 4h16l2 12h-6l-2 3h-4l-2-3H2z'],
    circle: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z'],
  };

  protected get iconPaths(): string[] {
    return this.paths[this.name] ?? this.paths['circle'];
  }
}
