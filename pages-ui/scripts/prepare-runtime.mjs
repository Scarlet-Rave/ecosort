import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const distribution = path.dirname(require.resolve('onnxruntime-web'));
const target = path.join(root, 'public/runtime');
fs.mkdirSync(target, { recursive: true });
for (const name of ['ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.mjs']) {
  fs.copyFileSync(path.join(distribution, name), path.join(target, name));
}
fs.writeFileSync(path.join(root, 'public/.nojekyll'), '');
fs.cpSync(path.join(root, 'licenses'), path.join(root, 'public/licenses'), { recursive: true });
fs.copyFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(root, 'public/THIRD_PARTY_NOTICES.md'));
console.log('Prepared version-matched local ONNX WASM assets (single-thread execution).');
