import es from '../../../../public/i18n/es.json';
import en from '../../../../public/i18n/en.json';

function translationKeys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null
      ? translationKeys(child, path)
      : [path];
  });
}

describe('translations', () => {
  it('should provide the same keys in Spanish and English', () => {
    expect(translationKeys(en).sort()).toEqual(translationKeys(es).sort());
  });
});
