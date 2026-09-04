import { inject, Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({ name: 'localizedCurrency', pure: false })
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly language = inject(LanguageService).currentLanguage;

  transform(value: { readonly minorUnits: bigint; readonly currency: string; readonly fractionDigits: number }): string {
    const resolvedCurrency = value.currency;
    const negative = value.minorUnits < 0n;
    const absolute = negative ? -value.minorUnits : value.minorUnits;
    const divisor = 10n ** BigInt(value.fractionDigits);
    const fraction = (absolute % divisor).toString().padStart(value.fractionDigits, '0');
    const formatter = new Intl.NumberFormat(this.language(), {
      style: 'currency', currency: resolvedCurrency, minimumFractionDigits: value.fractionDigits,
      maximumFractionDigits: value.fractionDigits,
    });
    const formatted = formatter.formatToParts(absolute / divisor).map(part => part.type === 'fraction' ? fraction : part.value).join('');
    if (!negative) return formatted;
    const minus = new Intl.NumberFormat(this.language()).formatToParts(-1).find(part => part.type === 'minusSign')?.value ?? '-';
    return `${minus}${formatted}`;
  }
}

@Pipe({ name: 'localizedDate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService).currentLanguage;

  transform(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
    return new Intl.DateTimeFormat(this.language(), options).format(new Date(`${value}T12:00:00`));
  }
}
