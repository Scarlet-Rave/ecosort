import { materialIds, type Material, type MaterialId } from "./materials.ts";


export type Catalog = {
  materials: Material[];
  localRule: string;
  reviewThreshold: number;
  maxUploadBytes: number;
  maxImagePixels: number;
  scoreNote: string;
  references: Record<string, string>;
};
export type Prediction = {
  category: string;
  label: MaterialId;
  score: number;
  scores: { category: string; label: MaterialId; score: number }[];
  needsReview: boolean;
  reviewThreshold: number;
  guidance: Material;
  localRule: string;
  scoreNote: string;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("EcoSort returned an unreadable response. Please try again.");
  return value as Record<string, unknown>;
}
function number(value: unknown, maximum = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum)
    throw new Error("EcoSort returned invalid scores. Please try again.");
  return value;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim())
    throw new Error("EcoSort returned incomplete guidance. Please try again.");
  return value;
}
function id(value: unknown): MaterialId {
  if (!materialIds.includes(value as MaterialId))
    throw new Error("EcoSort returned an unsupported material. Please try again.");
  return value as MaterialId;
}
function material(value: unknown): Material {
  const item = object(value);
  const label = id(item.label);
  if (item.icon !== label || !Array.isArray(item.steps) || item.steps.length !== 3)
    throw new Error("EcoSort returned incomplete guidance. Please try again.");
  return {
    label,
    icon: label,
    name: text(item.name),
    description: text(item.description),
    action: text(item.action),
    steps: item.steps.map(text),
    caution: text(item.caution),
  };
}

export function parseCatalog(value: unknown): Catalog {
  const payload = object(value);
  if (!Array.isArray(payload.materials) || payload.materials.length !== 6)
    throw new Error("Sorting guidance is unavailable. Please try again.");
  const materials = payload.materials.map(material);
  if (!materials.every((item, index) => item.label === materialIds[index]))
    throw new Error("Sorting guidance is unavailable. Please try again.");
  const references = object(payload.references);
  return {
    materials,
    localRule: text(payload.local_rule),
    reviewThreshold: number(payload.review_threshold),
    maxUploadBytes: number(payload.max_upload_bytes, Number.MAX_SAFE_INTEGER),
    maxImagePixels: number(payload.max_image_pixels, Number.MAX_SAFE_INTEGER),
    scoreNote: text(payload.score_note),
    references: Object.fromEntries(
      Object.entries(references).map(([name, value]) => [name, text(value)]),
    ),
  };
}

export function parsePrediction(value: unknown): Prediction {
  const payload = object(value);
  if (!Array.isArray(payload.scores) || payload.scores.length !== 6)
    throw new Error("EcoSort returned incomplete scores. Please try again.");
  const scores = payload.scores.map((value, index) => {
    const item = object(value);
    if (item.label !== materialIds[index])
      throw new Error("EcoSort returned an invalid material mapping. Please try again.");
    return { label: id(item.label), category: text(item.category), score: number(item.score) };
  });
  const label = id(payload.label),
    score = number(payload.score),
    threshold = number(payload.review_threshold);
  const top = scores.reduce((best, item) => (item.score > best.score ? item : best));
  const guidance = material(payload.guidance);
  if (
    Math.abs(scores.reduce((sum, item) => sum + item.score, 0) - 1) > 1e-5 ||
    top.label !== label ||
    top.score !== score ||
    guidance.label !== label ||
    typeof payload.needs_review !== "boolean" ||
    payload.needs_review !== score < threshold
  ) {
    throw new Error("EcoSort returned inconsistent results. Please try again.");
  }
  return {
    label,
    category: text(payload.category),
    score,
    scores,
    needsReview: payload.needs_review,
    reviewThreshold: threshold,
    guidance,
    localRule: text(payload.local_rule),
    scoreNote: text(payload.score_note),
  };
}

export function validateImage(
  file: Pick<File, "type" | "name" | "size">,
  maxBytes = 10 * 1024 * 1024,
): string | null {
  if (
    (file.type && !["image/jpeg", "image/png"].includes(file.type)) ||
    !/\.(jpe?g|png)$/i.test(file.name)
  )
    return "Please choose a JPG, JPEG or PNG image.";
  if (file.size === 0) return "This file is empty. Please choose another image.";
  if (file.size > maxBytes) return "This image exceeds the 10 MB upload limit.";
  return null;
}
