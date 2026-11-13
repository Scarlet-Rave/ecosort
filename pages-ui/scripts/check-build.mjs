import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'model-manifest.json'), 'utf8'));
const model = fs.readFileSync(path.join(dist, manifest.model_file));
assert.equal(crypto.createHash('sha256').update(model).digest('hex'), manifest.onnx_sha256);
assert.equal(model.length, manifest.onnx_bytes);
assert.equal(manifest.review_threshold, 0.47120377421379084);
assert.deepEqual(manifest.classes, ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']);
for (const asset of ['index.html','catalog.json','.nojekyll','runtime/ort-wasm-simd-threaded.mjs','runtime/ort-wasm-simd-threaded.wasm'])
  assert(fs.statSync(path.join(dist, asset)).isFile(), asset);
function* files(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const p = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* files(p); else yield p;
  }
}
let bytes = 0;
for (const file of files(dist)) {
  const data = fs.readFileSync(file); bytes += data.length;
  assert(data.length < 100 * 1024 * 1024, `Oversized asset: ${file}`);
  if (/\.(js|html|json)$/.test(file)) assert(!/127\.0\.0\.1|localhost|\/api\/classify/.test(data.toString()), `Server dependency: ${file}`);
}
assert(bytes < 1024 ** 3);
console.log(`Static build verified: ${(bytes / 1024 ** 2).toFixed(2)} MiB; pinned model, runtime assets, no localhost/API dependency.`);
