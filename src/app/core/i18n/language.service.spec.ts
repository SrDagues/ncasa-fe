import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateNoOpLoader } from '@ngx-translate/core';
import { provideTranslateLoader } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let document: Document;
  let storage: Storage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'es',
          lang: 'es',
          loader: provideTranslateLoader(TranslateNoOpLoader),
        }),
      ],
    });
    service = TestBed.inject(LanguageService);
    document = TestBed.inject(DOCUMENT);
    const values = new Map<string, string>();
    storage = {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key) => values.get(key) ?? null,
      key: (index) => [...values.keys()][index] ?? null,
      removeItem: (key) => { values.delete(key); },
      setItem: (key, value) => { values.set(key, value); },
    };
    Object.defineProperty(document.defaultView, 'localStorage', { configurable: true, value: storage });
  });

  it('should use a supported browser language when no preference exists', async () => {
    await service.initialize();

    expect(service.currentLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should persist a selected language and update the document language', async () => {
    await service.changeLanguage('en');

    expect(service.currentLanguage()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(storage.getItem('ncasa.language')).toBe('en');
  });
});
