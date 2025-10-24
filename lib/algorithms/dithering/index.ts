import { createQuantizer, quantizeImageData, type QuantizationMode, type RGBColor } from "../quantization";

import type { DitheringAlgorithmKey, DitheringOptions, DitheringStrategy } from "./types";
import { floydSteinbergDither } from "./floyd-steinberg";
import { orderedBayer8x8Dither } from "./ordered-bayer-8x8";

const STRATEGIES: Record<Exclude<DitheringAlgorithmKey, "none">, DitheringStrategy> = {
  "floyd-steinberg": floydSteinbergDither,
  "ordered-bayer-8x8": orderedBayer8x8Dither,
};

export const DITHERING_ALGORITHMS: ReadonlyArray<DitheringAlgorithmKey> = [
  "none",
  "floyd-steinberg",
  "ordered-bayer-8x8",
];

export interface ApplyDitheringConfig {
  algorithm: DitheringAlgorithmKey;
  intensity: number;
  palette?: readonly RGBColor[] | null;
  levels: number;
  mode?: QuantizationMode;
}

export function applyDithering(imageData: ImageData, config: ApplyDitheringConfig): ImageData {
  const { algorithm, palette, levels, intensity, mode } = config;

  const quantize = createQuantizer({
    palette: palette ?? undefined,
    levels,
    mode,
  });

  if (algorithm === "none") {
    return quantizeImageData(imageData, quantize);
  }

  const strategy = STRATEGIES[algorithm as Exclude<DitheringAlgorithmKey, "none">];

  if (!strategy) {
    return quantizeImageData(imageData, quantize);
  }

  const options: DitheringOptions = {
    intensity,
    quantize,
    palette: palette ?? undefined,
    levels,
  };

  return strategy.apply(imageData, options);
}

export function getDitheringStrategy(key: DitheringAlgorithmKey) {
  if (key === "none") {
    return null;
  }
  return STRATEGIES[key];
}

export type { DitheringAlgorithmKey } from "./types";
