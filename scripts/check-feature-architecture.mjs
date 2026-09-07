import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';

const appRoot = new URL('../src/app/', import.meta.url).pathname;
const featuresRoot = join(appRoot, 'features');
const files = walk(featuresRoot).filter(file => extname(file) === '.ts' && !file.endsWith('.spec.ts'));
const violations = [];

for (const file of files) {
  const path = relative(featuresRoot, file);
  const [feature, layer] = path.split(sep);
  const source = readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]);

  if (layer === 'domain') {
    for (const dependency of imports.filter(value => value.startsWith('@angular') || value.includes('/application') || value.includes('/infrastructure') || value.includes('/presentation'))) {
      violations.push(`${path}: domain cannot import ${dependency}`);
    }
  }
  if (layer === 'application') {
    for (const dependency of imports.filter(value => value.includes('/infrastructure') || value.includes('/presentation') || value.startsWith('@angular'))) {
      violations.push(`${path}: application cannot import ${dependency}`);
    }
  }
  if (layer !== 'infrastructure' && /api(?:-|\.)?(?:dto|mapper)|http-/i.test(source)) {
    violations.push(`${path}: HTTP DTOs and adapters belong to infrastructure`);
  }

  for (const dependency of imports) {
    const target = dependency.startsWith('.') ? resolve(dirname(file), dependency) : null;
    if (!target || !target.startsWith(`${featuresRoot}${sep}`)) continue;
    const [targetFeature, targetInternal] = relative(featuresRoot, target).split(sep);
    if (targetFeature !== feature && targetInternal && targetInternal !== 'index' && targetInternal !== 'index.ts') {
      violations.push(`${path}: import ${targetFeature} through its public index: ${dependency}`);
    }
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
