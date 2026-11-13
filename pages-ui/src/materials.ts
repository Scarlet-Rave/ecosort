// Material content is supplied by EcoSort's original Python guidance records.
export const materialIds = ["cardboard", "glass", "metal", "paper", "plastic", "trash"] as const;
export type MaterialId = (typeof materialIds)[number];
export type Material = {
  label: MaterialId;
  name: string;
  icon: MaterialId;
  description: string;
  action: string;
  steps: string[];
  caution: string;
};
