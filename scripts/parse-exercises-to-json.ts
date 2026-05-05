import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvFilePath = path.resolve(__dirname, '../exercises.csv');
const outDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(csvFilePath)) {
  console.error('exercises.csv not found at', csvFilePath);
  process.exit(1);
}
const txt = fs.readFileSync(csvFilePath, 'utf8');
const records = parse(txt, { columns: true, skip_empty_lines: true, bom: true });

function collectIndexedValues(record: Record<string, unknown>, prefix: string) {
  return Object.keys(record)
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => Number(a.split('/')[1] || 0) - Number(b.split('/')[1] || 0))
    .map((k) => String(record[k] ?? '').trim())
    .filter(Boolean);
}

const out = records.map((r: any) => ({
  id: String(r.id || '').trim(),
  name: String(r.name || '').trim(),
  bodyPart: String(r.bodyPart || '').trim(),
  equipment: String(r.equipment || '').trim(),
  target: String(r.target || '').trim(),
  instructions: collectIndexedValues(r, 'instructions/'),
  secondaryMuscles: collectIndexedValues(r, 'secondaryMuscles/'),
}));

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, 'exercises.json'), JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', out.length, 'records to', path.join('data', 'exercises.json'));
