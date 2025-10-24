import type { QuantizeFn, RGBColor } from "../quantization";

export type DitheringAlgorithmKey = "none" | "floyd-steinberg" | "ordered-bayer-8x8";

export interface DitheringOptions {
  intensity: number;
  quantize: QuantizeFn;
  palette?: readonly RGBColor[];
  levels: number;
}

export interface DitheringStrategy {
  key: Exclude<DitheringAlgorithmKey, "none">;
  apply(imageData: ImageData, options: DitheringOptions): ImageData;
}
