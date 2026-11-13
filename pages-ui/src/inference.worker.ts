/// <reference lib="webworker" />
import * as ort from 'onnxruntime-web/wasm';
import { decodeRgb } from './decode.ts';
import { preprocessRgb } from './preprocess.ts';
type Manifest = { onnx_sha256: string; onnx_bytes: number; model_file: string; classes: string[]; review_threshold: number; };
let sessionPromise: Promise<ort.InferenceSession> | undefined;
async function session(base: string, manifest: Manifest): Promise<ort.InferenceSession> {
  if (!sessionPromise) sessionPromise = (async () => {
    // GitHub Pages cannot supply COOP/COEP headers; no shared-memory threads or GPU required.
    ort.env.wasm.numThreads = 1; ort.env.wasm.proxy = false;
    ort.env.wasm.wasmPaths = new URL('runtime/', base).href;
    const response = await fetch(new URL(manifest.model_file, base));
    if (!response.ok) throw new Error('The classifier could not download. Please check your connection and try again.');
    const bytes = await response.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
    if (bytes.byteLength !== manifest.onnx_bytes || hash !== manifest.onnx_sha256) throw new Error('The classifier failed its integrity check. Please reload EcoSort.');
    return ort.InferenceSession.create(bytes, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  })().catch(error => { sessionPromise = undefined; throw error; });
  return sessionPromise;
}
self.onmessage = async (event: MessageEvent<{ id: number; bytes: ArrayBuffer; base: string; manifest: Manifest }>) => {
  const { id, bytes, base, manifest } = event.data;
  try {
    const image = await decodeRgb(bytes), input = preprocessRgb(image.rgb, image.width, image.height);
    const model = await session(base, manifest);
    const output = await model.run({ images: new ort.Tensor('float32', input, [1,3,224,224]) });
    const scores = Array.from(output.scores.data as Float32Array);
    for (const tensor of Object.values(output)) tensor.dispose();
    self.postMessage({ id, scores });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    self.postMessage({ id, error: /^(The classifier|We couldn’t open|Please choose|This image)/.test(message)
      ? message : 'The classifier could not run in this browser. Please reload EcoSort or try an up-to-date browser.' });
  }
};
