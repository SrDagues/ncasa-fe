import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from './language.models';

const STORAGE_KEY = 'ncasa.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly currentLanguageState = signal<SupportedLanguage>(DEFAULT_LANGUAGE);

  readonly currentLanguage = this.currentLanguageState.asReadonly();
  readonly supportedLanguages = SUPPORTED_LANGUAGES;

  async initialize(): Promise<void> {
    const storedLanguage = this.readStoredLanguage();
    const browserLanguage = this.document.defaultView?.navigator.language.split('-')[0];
    const language = storedLanguage ?? (isSupportedLanguage(browserLanguage) ? browserLanguage : DEFAULT_LANGUAGE);

    await this.applyLanguage(language, false);
  }

  async changeLanguage(language: SupportedLanguage): Promise<void> {
    await this.applyLanguage(language, true);
  }

  private async applyLanguage(language: SupportedLanguage, persist: boolean): Promise<void> {
    await firstValueFrom(this.translate.use(language));
    this.currentLanguageState.set(language);
    this.document.documentElement.lang = language;
    this.meta.updateTag({ name: 'description', content: this.translate.instant('metadata.description') });

    if (persist) {
      this.document.defaultView?.localStorage.setItem(STORAGE_KEY, language);
    }
  }

  private readStoredLanguage(): SupportedLanguage | null {
    const language = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(language) ? language : null;
  }
}
