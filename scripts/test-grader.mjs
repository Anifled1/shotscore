// D2 helper: grade local image files against the running server and print a compact report.
// Usage: node scripts/test-grader.mjs image1.jpg image2.png ...
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/test-grader.mjs <image...>');
  process.exit(1);
}

for (const file of files) {
  const ext = file.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  const image = `data:image/${ext};base64,${readFileSync(file).toString('base64')}`;
  const t0 = Date.now();
  const res = await fetch('http://localhost:3100/api/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
  const ms = Date.now() - t0;
  const data = await res.json();
  if (!res.ok) {
    console.log(`x ${file}: HTTP ${res.status} ${data.error ?? ''} (${ms}ms)`);
    continue;
  }
  console.log(`\n=== ${file} — total ${data.total}/100 (${ms}ms, mock=${data.mock ?? false}) ===`);
  for (const c of data.criteria) {
    console.log(`  ${String(c.score).padStart(3)}  ${c.label} — ${c.finding}`);
  }
  for (const f of data.fixes ?? []) console.log(`  fix: ${f}`);
}
