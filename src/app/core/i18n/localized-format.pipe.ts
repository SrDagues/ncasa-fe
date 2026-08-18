import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({ name: 'localizedCurrency', pure: false })
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly language = inject(LanguageService).currentLanguage;

  transform(value: number): string {
    return new Intl.NumberFormat(this.language(), {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }
}

@Pipe({ name: 'localizedDate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService).currentLanguage;

  transform(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
    return new Intl.DateTimeFormat(this.language(), options).format(new Date(`${value}T12:00:00`));
  }
}
