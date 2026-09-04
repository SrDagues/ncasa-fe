import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const root = new URL('../src/app/features/expenses/', import.meta.url);
const files = walk(root.pathname).filter(file => extname(file) === '.ts' && !file.endsWith('.spec.ts'));
const violations = [];

for (const file of files) {
  const path = relative(root.pathname, file);
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
  if (path.startsWith('domain/')) {
    for (const dependency of imports.filter(value => value.startsWith('@angular') || value.includes('/application') || value.includes('/infrastructure') || value.includes('/presentation'))) {
      violations.push(`${path}: domain cannot import ${dependency}`);
    }
  }
  if (path.startsWith('application/')) {
    for (const dependency of imports.filter(value => value.includes('/infrastructure') || value.includes('/presentation') || value.startsWith('@angular'))) {
      violations.push(`${path}: application cannot import ${dependency}`);
    }
  }
  if (!path.startsWith('infrastructure/') && /api(?:-|\.)?(?:dto|mapper)|http-/i.test(source)) {
    violations.push(`${path}: HTTP DTOs and adapters belong to infrastructure`);
  }
  for (const dependency of imports.filter(value => value.includes('/features/') && !value.includes('/features/expenses'))) {
    violations.push(`${path}: import other features through their public index: ${dependency}`);
  }
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exitCode = 1;
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
