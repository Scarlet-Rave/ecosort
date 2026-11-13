import { decode as decodePng, convertIndexedToRgb } from 'fast-png';
export type DecodedRgb = { rgb: Uint8Array; width: number; height: number };
export type ImageHeader = { kind: 'PNG' | 'JPEG'; width: number; height: number; orientation: number };
const invalid = () => new Error('We couldn’t open that image. Please export it as a new JPG or PNG.');
function tiffOrientation(data: Uint8Array): number {
  try {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength), little = view.getUint16(0) === 0x4949;
    if ((!little && view.getUint16(0) !== 0x4d4d) || view.getUint16(2, little) !== 42) return 1;
    const offset = view.getUint32(4, little), count = view.getUint16(offset, little);
    for (let i = 0; i < count; i++) {
      const entry = offset + 2 + i * 12;
      if (view.getUint16(entry, little) === 0x112 && view.getUint16(entry + 2, little) === 3 && view.getUint32(entry + 4, little) === 1) {
        const value = view.getUint16(entry + 8, little);
        return value >= 1 && value <= 8 ? value : 1;
      }
    }
  } catch { /* Invalid EXIF orientation is ignored, as a normal orientation. */ }
  return 1;
}
function readHeader(data: Uint8Array, maxPixels: number): ImageHeader {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let width = 0, height = 0, orientation = 1, kind: 'PNG' | 'JPEG';
  if (data.length >= 24 && [137,80,78,71,13,10,26,10].every((v, i) => data[i] === v)) {
    kind = 'PNG'; width = view.getUint32(16); height = view.getUint32(20);
    for (let offset = 8; offset + 12 <= data.length;) {
      const length = view.getUint32(offset), end = offset + 12 + length;
      if (end > data.length) throw invalid();
      const type = String.fromCharCode(...data.subarray(offset + 4, offset + 8));
      if (type === 'acTL') throw new Error('Please choose a still image rather than an animated image.');
      if (type === 'eXIf') orientation = tiffOrientation(data.subarray(offset + 8, offset + 8 + length));
      offset = end;
      if (type === 'IEND') break;
    }
  } else if (data.length >= 4 && data[0] === 255 && data[1] === 216) {
    kind = 'JPEG';
    let offset = 2;
    while (offset + 4 <= data.length) {
      if (data[offset++] !== 255) throw invalid();
      while (data[offset] === 255) offset++;
      const marker = data[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 1 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > data.length) throw invalid();
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5);
      }
      if (marker === 0xe1 && String.fromCharCode(...data.subarray(offset + 2, offset + 8)) === 'Exif\0\0')
        orientation = tiffOrientation(data.subarray(offset + 8, offset + length));
      offset += length;
    }
  } else throw invalid();
  if (width < 1 || height < 1) throw invalid();
  if (width * height > maxPixels) throw new Error('This image is too large. Resize it to 20 megapixels or less.');
  if (width > 32768 || height > 32768) throw new Error('This image has unusually large dimensions. Please resize it to 32,768 pixels per side or less.');
  return { kind, width, height, orientation };
}
export function imageHeader(data: Uint8Array, maxPixels = 20_000_000): ImageHeader {
  try { return readHeader(data, maxPixels); } catch (error) {
    if (error instanceof Error && /20 megapixels|still image|unusually large dimensions/.test(error.message)) throw error;
    throw invalid();
  }
}
export function orientRgb(source: DecodedRgb, orientation: number): DecodedRgb {
  if (orientation === 1) return source;
  const swap = orientation >= 5, width = swap ? source.height : source.width, height = swap ? source.width : source.height;
  const rgb = new Uint8Array(width * height * 3);
  for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
    let dx = x, dy = y;
    if (orientation === 2) dx = source.width - 1 - x;
    if (orientation === 3) { dx = source.width - 1 - x; dy = source.height - 1 - y; }
    if (orientation === 4) dy = source.height - 1 - y;
    if (orientation === 5) { dx = y; dy = x; }
    if (orientation === 6) { dx = source.height - 1 - y; dy = x; }
    if (orientation === 7) { dx = source.height - 1 - y; dy = source.width - 1 - x; }
    if (orientation === 8) { dx = y; dy = source.width - 1 - x; }
    rgb.set(source.rgb.subarray((y * source.width + x) * 3, (y * source.width + x) * 3 + 3), (dy * width + dx) * 3);
  }
  return { rgb, width, height };
}
export async function decodeRgb(bytes: ArrayBuffer): Promise<DecodedRgb> {
  const data = new Uint8Array(bytes), header = imageHeader(data);
  try {
    if (header.kind === 'PNG') {
      const decoded = decodePng(data, { checkCrc: true }), { width, height, channels, depth } = decoded;
      const rgb = new Uint8Array(width * height * 3);
      if (decoded.palette) {
        const pixels = convertIndexedToRgb(decoded), stride = pixels.length / (width * height);
        for (let i = 0; i < width * height; i++) rgb.set(pixels.subarray(i * stride, i * stride + 3), i * 3);
      } else {
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const i = y * width + x;
          for (let c = 0; c < 3; c++) {
            if (depth < 8) {
              const bit = x * depth, byte = decoded.data[y * Math.ceil(width * depth / 8) + Math.floor(bit / 8)];
              rgb[i * 3 + c] = ((byte >> (8 - depth - bit % 8)) & ((1 << depth) - 1)) * 255 / ((1 << depth) - 1);
            } else {
              const value = decoded.data[i * channels + (channels >= 3 ? c : 0)];
              // Pillow treats 16-bit grayscale as integer luminance, clamped by convert('RGB').
              rgb[i * 3 + c] = depth === 16 ? (channels <= 2 ? Math.min(255, value) : value >> 8) : value;
            }
          }
        }
      }
      return orientRgb({ rgb, width, height }, header.orientation);
    }
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/jpeg' }), {
      imageOrientation: 'from-image', premultiplyAlpha: 'none', colorSpaceConversion: 'none',
    });
    try {
      const { width, height } = bitmap;
      const canvas = new OffscreenCanvas(width, height), context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw invalid();
      context.drawImage(bitmap, 0, 0);
      const rgba = context.getImageData(0, 0, width, height).data, rgb = new Uint8Array(width * height * 3);
      for (let i = 0; i < width * height; i++) rgb.set(rgba.subarray(i * 4, i * 4 + 3), i * 3);
      return { rgb, width, height };
    } finally { bitmap.close(); }
  } catch (error) {
    if (error instanceof Error && /20 megapixels|still image/.test(error.message)) throw error;
    throw invalid();
  }
}
