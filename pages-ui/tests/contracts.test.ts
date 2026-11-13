import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { parseCatalog, parsePrediction, validateImage } from '../src/result-contract.ts';
import { preprocessRgb } from '../src/preprocess.ts';
import { imageHeader, orientRgb, decodeRgb } from '../src/decode.ts';
import { encode } from 'fast-png';
const catalogRaw = JSON.parse(fs.readFileSync(new URL('../public/catalog.json', import.meta.url), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(new URL('../public/model-manifest.json', import.meta.url), 'utf8'));
const catalog = parseCatalog(catalogRaw);
function fixture(score: number) {
  const scores = catalog.materials.map((item, index) => ({ label: item.label, category: item.name, score: index === 0 ? score : (1 - score) / 5 }));
  return { label: 'cardboard', category: 'Cardboard', score, scores, needs_review: score < catalog.reviewThreshold, review_threshold: catalog.reviewThreshold,
    guidance: catalogRaw.materials[0], local_rule: catalog.localRule, score_note: catalog.scoreNote };
}
test('catalog retains six classes and exact validation-only policy', () => {
  assert.deepEqual(catalog.materials.map(item => item.label), manifest.classes);
  assert.equal(catalog.reviewThreshold, 0.47120377421379084);
  assert.equal(manifest.selection_data, 'validation_only');
  assert.equal(catalog.maxImagePixels, 20_000_000);
  assert(catalog.materials.every(item => item.steps.length === 3 && item.caution));
});
test('strict threshold is applied before display rounding (logic fixture only)', () => {
  assert(parsePrediction(fixture(catalog.reviewThreshold - Number.EPSILON)).needsReview);
  assert(!parsePrediction(fixture(catalog.reviewThreshold)).needsReview);
  assert(!parsePrediction(fixture(catalog.reviewThreshold + Number.EPSILON)).needsReview);
});
test('inconsistent mapping and invented review decision are rejected', () => {
  const result = fixture(.8); result.needs_review = true;
  assert.throws(() => parsePrediction(result));
  const bad = structuredClone(catalogRaw); bad.materials.reverse();
  assert.throws(() => parseCatalog(bad));
});
test('file type, empty file and byte limits remain enforced', () => {
  assert.equal(validateImage({ name: 'photo.JPG', type: 'image/jpeg', size: 10 }), null);
  assert.equal(validateImage({ name: 'photo.png', type: '', size: 10 }), null);
  assert(validateImage({ name: 'x.gif', type: 'image/gif', size: 10 }));
  assert(validateImage({ name: 'x.png', type: 'image/png', size: 0 }));
  assert(validateImage({ name: 'x.jpg', type: 'image/jpeg', size: 10 * 1024 ** 2 + 1 }));
});
test('Pillow reference tensor hashes match up/down/identity resizing', () => {
  const goldens = JSON.parse(fs.readFileSync(new URL('./pillow-goldens.json', import.meta.url), 'utf8'));
  for (const item of goldens) {
    const rgb = Uint8Array.from({ length: item.width * item.height * 3 }, (_, index) => (index * 37 + Math.floor(index / 11)) % 256);
    const tensor = preprocessRgb(rgb, item.width, item.height);
    assert.equal(createHash('sha256').update(new Uint8Array(tensor.buffer)).digest('hex'), item.tensor_sha256);
  }
});
test('PNG alpha is discarded rather than compositing onto a background', async () => {
  const pixels = new Uint8Array([20,40,60,0,100,150,200,64]);
  const png = encode({ width: 2, height: 1, channels: 4, depth: 8, data: pixels });
  const result = await decodeRgb(png.slice().buffer as ArrayBuffer);
  assert.deepEqual([...result.rgb], [20,40,60,100,150,200]);
});
test('oversized dimensions are rejected before decompression', () => {
  const png = encode({ width: 1, height: 1, channels: 3, data: new Uint8Array(3) });
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength); view.setUint32(16, 50_000); view.setUint32(20, 50_000);
  assert.throws(() => imageHeader(png), /20 megapixels/);
  view.setUint32(16, 1); view.setUint32(20, 100_000);
  assert.throws(() => imageHeader(png), /unusually large dimensions/);
});
test('unsupported/corrupt bytes are rejected without model execution', () => {
  assert.throws(() => imageHeader(new TextEncoder().encode('GIF89a...')));
  assert.throws(() => imageHeader(new Uint8Array([255,216,255,225,0,1])));
  assert.throws(() => imageHeader(new Uint8Array([255,216,255,255,255,255])), /couldn’t open/);
});
test('EXIF 90-degree rotation preserves all RGB channels', () => {
  const result = orientRgb({ width: 2, height: 1, rgb: new Uint8Array([1,2,3,4,5,6]) }, 6);
  assert.equal(result.width, 1); assert.equal(result.height, 2);
  assert.deepEqual([...result.rgb], [1,2,3,4,5,6]);
});
test('the committed ONNX asset matches its pinned digest and size', () => {
  const data = fs.readFileSync(new URL('../public/' + manifest.model_file, import.meta.url));
  assert.equal(data.length, manifest.onnx_bytes);
  assert.equal(createHash('sha256').update(data).digest('hex'), manifest.onnx_sha256);
});
