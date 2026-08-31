/**
 * build-json.js
 * Aggregates all _*.json block/model definitions into the three global
 * component JSON files consumed by the Universal Editor:
 *
 *   component-definition.json  — block registry (what appears in Add panel)
 *   component-models.json      — authoring field definitions
 *   component-filters.json     — container-block filter rules
 *
 * Run:  node scripts/build-json.js
 * Or:   npm run build:json
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const result = { definitions: [], models: [], filters: [] };

function mergeJsonFile(filePath) {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    if (Array.isArray(data.definitions)) result.definitions.push(...data.definitions);
    if (Array.isArray(data.models)) result.models.push(...data.models);
    if (Array.isArray(data.filters)) result.filters.push(...data.filters);
  } catch (e) {
    console.error(`  ✗ Failed to parse ${filePath}: ${e.message}`);
  }
}

function scanDirectory(dir) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        scanDirectory(full);
      } else if (entry.startsWith('_') && entry.endsWith('.json')) {
        console.log(`  ✓ ${full.replace(ROOT, '')}`);
        mergeJsonFile(full);
      }
    }
  } catch {
    // directory may not exist — skip silently
  }
}

console.log('\nScanning block and model JSON files…');
scanDirectory(join(ROOT, 'blocks'));
scanDirectory(join(ROOT, 'models'));

// component-definition.json wraps definitions in a groups array
const componentDefinition = {
  groups: [
    {
      title: 'Blocks',
      id: 'blocks',
      components: result.definitions,
    },
  ],
};

writeFileSync(
  join(ROOT, 'component-definition.json'),
  JSON.stringify(componentDefinition, null, 2),
);
writeFileSync(
  join(ROOT, 'component-models.json'),
  JSON.stringify(result.models, null, 2),
);
writeFileSync(
  join(ROOT, 'component-filters.json'),
  JSON.stringify(result.filters, null, 2),
);

console.log(`
Built:
  component-definition.json  (${result.definitions.length} component${result.definitions.length !== 1 ? 's' : ''})
  component-models.json      (${result.models.length} model${result.models.length !== 1 ? 's' : ''})
  component-filters.json     (${result.filters.length} filter${result.filters.length !== 1 ? 's' : ''})
`);
