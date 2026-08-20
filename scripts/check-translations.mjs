import { readFileSync } from 'node:fs';

const languages = ['es', 'en'];
const translations = Object.fromEntries(
  languages.map((language) => [
    language,
    JSON.parse(readFileSync(new URL(`../public/i18n/${language}.json`, import.meta.url), 'utf8')),
  ]),
);

function keys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'object' && child !== null ? keys(child, path) : [path];
  });
}

const reference = keys(translations.es).sort();
const errors = languages.flatMap((language) => {
  const current = keys(translations[language]).sort();
  const missing = reference.filter((key) => !current.includes(key));
  const unexpected = current.filter((key) => !reference.includes(key));
  return [
    ...missing.map((key) => `${language}: missing ${key}`),
    ...unexpected.map((key) => `${language}: unexpected ${key}`),
  ];
});

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Translation catalogs are aligned (${reference.length} keys).`);
}
