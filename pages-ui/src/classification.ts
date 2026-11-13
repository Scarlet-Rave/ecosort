import { materialIds } from './materials.ts';
import { parseCatalog, parsePrediction, validateImage, type Catalog, type Prediction } from './result-contract.ts';
export { validateImage };
export type { Catalog, Prediction };
export const siteBase = () => new URL(import.meta.env.BASE_URL, document.baseURI).href;
type Manifest = { onnx_sha256: string; onnx_bytes: number; model_file: string; classes: string[]; review_threshold: number; selection_data: string };
let settingsPromise: Promise<{ catalog: Catalog; manifest: Manifest }> | undefined;
async function settings() {
  if (!settingsPromise) settingsPromise = (async () => {
    const base = siteBase();
    const [catalogResponse, manifestResponse] = await Promise.all([fetch(new URL('catalog.json', base)), fetch(new URL('model-manifest.json', base))]);
    if (!catalogResponse.ok || !manifestResponse.ok) throw new Error('Sorting guidance is unavailable. Please check your connection and try again.');
    const catalog = parseCatalog(await catalogResponse.json()), manifest: Manifest = await manifestResponse.json();
    if (JSON.stringify(manifest.classes) !== JSON.stringify(materialIds) || manifest.review_threshold !== catalog.reviewThreshold ||
        manifest.selection_data !== 'validation_only' || manifest.model_file !== 'models/ecosort-mobilenetv2.onnx' ||
        !/^[0-9a-f]{64}$/.test(manifest.onnx_sha256) || !Number.isSafeInteger(manifest.onnx_bytes) || manifest.onnx_bytes <= 0)
      throw new Error('The classifier settings are inconsistent. Please reload EcoSort.');
    return { catalog, manifest };
  })().catch(error => {
    settingsPromise = undefined;
    if (error instanceof TypeError) throw new Error('Sorting guidance is unavailable. Please check your connection and try again.');
    throw error;
  });
  return settingsPromise;
}
function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Classification cancelled.', 'AbortError');
}
export async function loadCatalog(signal?: AbortSignal): Promise<Catalog> {
  const { catalog } = await settings(); abortIfNeeded(signal); return catalog;
}
let worker: Worker | undefined, sequence = 0;
const pending = new Map<number, { resolve: (scores: number[]) => void; reject: (reason: Error) => void }>();
function getWorker() {
  if (!worker) {
    if (!globalThis.Worker || !globalThis.WebAssembly || !globalThis.OffscreenCanvas || !globalThis.createImageBitmap || !globalThis.crypto?.subtle)
      throw new Error('This browser cannot run the classifier. Please open EcoSort in an up-to-date Chrome, Edge, Firefox or Safari.');
    worker = new Worker(new URL('./inference.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = event => {
      const item = pending.get(event.data.id); if (!item) return;
      pending.delete(event.data.id);
      if (event.data.error) item.reject(new Error(event.data.error)); else item.resolve(event.data.scores);
    };
    worker.onerror = () => {
      worker?.terminate(); worker = undefined;
      for (const item of pending.values()) item.reject(new Error('The classifier could not start. Please reload EcoSort or try an up-to-date browser.'));
      pending.clear();
    };
  }
  return worker;
}
export async function classifyImage(file: File, signal?: AbortSignal): Promise<Prediction> {
  abortIfNeeded(signal);
  const invalid = validateImage(file); if (invalid) throw new Error(invalid);
  const { catalog, manifest } = await settings(), bytes = await file.arrayBuffer(); abortIfNeeded(signal);
  const instance = getWorker(), id = ++sequence;
  const scores = await new Promise<number[]>((resolve, reject) => {
    const finish = (error?: Error, values?: number[]) => {
      clearTimeout(timer); signal?.removeEventListener('abort', abort); pending.delete(id);
      if (error) reject(error); else resolve(values!);
    };
    const abort = () => finish(new DOMException('Classification cancelled.', 'AbortError'));
    const timer = setTimeout(() => {
      // A stuck WASM operation cannot be aborted internally; discard its worker/session.
      worker?.terminate(); worker = undefined;
      for (const item of [...pending.values()]) item.reject(new Error('This is taking longer than expected. Please try again.'));
    }, 120_000);
    pending.set(id, { resolve: values => finish(undefined, values), reject: error => finish(error) });
    signal?.addEventListener('abort', abort, { once: true });
    instance.postMessage({ id, bytes, base: siteBase(), manifest }, [bytes]);
  });
  abortIfNeeded(signal);
  const top = scores.reduce((best, score, index) => score > scores[best] ? index : best, 0), label = materialIds[top];
  return parsePrediction({
    category: catalog.materials[top]?.name, label, score: scores[top],
    scores: scores.map((score, index) => ({ label: materialIds[index], category: catalog.materials[index]?.name, score })),
    needs_review: scores[top] < catalog.reviewThreshold, review_threshold: catalog.reviewThreshold,
    guidance: catalog.materials[top], local_rule: catalog.localRule, score_note: catalog.scoreNote,
  });
}
