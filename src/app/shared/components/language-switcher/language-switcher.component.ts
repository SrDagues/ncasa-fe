import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageService } from '../../../core/i18n/language.service';
import { SupportedLanguage } from '../../../core/i18n/language.models';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.component.html',
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);
  protected readonly currentLanguage = this.languageService.currentLanguage;

  protected changeLanguage(event: Event): void {
    const language = (event.target as HTMLSelectElement).value as SupportedLanguage;
    void this.languageService.changeLanguage(language);
  }
}
