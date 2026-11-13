// Pillow-compatible antialiased bilinear RGB resampling. See THIRD_PARTY_NOTICES.md.
export const mean = [.485, .456, .406] as const;
export const std = [.229, .224, .225] as const;
const precision = 2 ** 22;
type Coefficients = { start: number; weights: number[] };
function coefficients(input: number, output: number): Coefficients[] {
  const scale = input / output, filterScale = Math.max(1, scale);
  return Array.from({ length: output }, (_, i) => {
    const center = (i + .5) * scale;
    const start = Math.max(0, Math.trunc(center - filterScale + .5));
    const end = Math.min(input, Math.trunc(center + filterScale + .5));
    const values = Array.from({ length: end - start }, (_, j) => Math.max(0, 1 - Math.abs((start + j - center + .5) / filterScale)));
    const sum = values.reduce((a, b) => a + b, 0);
    return { start, weights: values.map(value => Math.floor(.5 + value / sum * precision)) };
  });
}
export function resizeRgb(rgb: Uint8Array, width: number, height: number, size = 224): Uint8Array {
  if (width < 1 || height < 1 || rgb.length !== width * height * 3) throw new Error('Invalid decoded image.');
  let horizontal = rgb;
  if (width !== size) {
    const xCoefficients = coefficients(width, size);
    horizontal = new Uint8Array(size * height * 3);
    for (let y = 0; y < height; y++) for (let x = 0; x < size; x++) for (let c = 0; c < 3; c++) {
      const { start, weights } = xCoefficients[x];
      let sum = precision / 2;
      for (let k = 0; k < weights.length; k++) sum += rgb[(y * width + start + k) * 3 + c] * weights[k];
      horizontal[(y * size + x) * 3 + c] = Math.max(0, Math.min(255, Math.floor(sum / precision)));
    }
  }
  if (height === size) return horizontal;
  const yCoefficients = coefficients(height, size), output = new Uint8Array(size * size * 3);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) for (let c = 0; c < 3; c++) {
    const { start, weights } = yCoefficients[y];
    let sum = precision / 2;
    for (let k = 0; k < weights.length; k++) sum += horizontal[((start + k) * size + x) * 3 + c] * weights[k];
    output[(y * size + x) * 3 + c] = Math.max(0, Math.min(255, Math.floor(sum / precision)));
  }
  return output;
}
export function normalizeRgb(rgb: Uint8Array, size = 224): Float32Array {
  if (rgb.length !== size * size * 3) throw new Error('Invalid resized image.');
  const output = new Float32Array(rgb.length), plane = size * size;
  for (let c = 0; c < 3; c++) for (let i = 0; i < plane; i++)
    output[c * plane + i] = Math.fround(Math.fround(Math.fround(rgb[3 * i + c] / 255) - Math.fround(mean[c])) / Math.fround(std[c]));
  return output;
}
export function preprocessRgb(rgb: Uint8Array, width: number, height: number): Float32Array {
  return normalizeRgb(resizeRgb(rgb, width, height));
}
