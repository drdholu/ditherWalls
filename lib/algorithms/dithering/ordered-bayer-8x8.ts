import type { DitheringOptions, DitheringStrategy } from "./types";

const BAYER_8X8 = [
  0, 48, 12, 60, 3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
  8, 56, 4, 52, 11, 59, 7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
  2, 50, 14, 62, 1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58, 6, 54, 9, 57, 5, 53,
  42, 26, 38, 22, 41, 25, 37, 21,
] as const;

const MATRIX_SIZE = 8;
const MATRIX_AREA = MATRIX_SIZE * MATRIX_SIZE;
const clampFloatToByteRange = (value: number) => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 255) {
    return 255;
  }
  return value;
};

export const orderedBayer8x8Dither: DitheringStrategy = {
  key: "ordered-bayer-8x8",
  apply(imageData: ImageData, options: DitheringOptions) {
    const { width, height, data } = imageData;
    const scaledIntensity = Math.max(0, Math.min(1, options.intensity));
    const diffusionScale = scaledIntensity * 255;

    for (let y = 0; y < height; y += 1) {
      const rowBase = (y % MATRIX_SIZE) * MATRIX_SIZE;

      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const threshold = (BAYER_8X8[rowBase + (x % MATRIX_SIZE)] + 0.5) / MATRIX_AREA - 0.5;
        const offset = threshold * diffusionScale;

        const adjustedR = clampFloatToByteRange(data[index] + offset);
        const adjustedG = clampFloatToByteRange(data[index + 1] + offset);
        const adjustedB = clampFloatToByteRange(data[index + 2] + offset);

        const [quantizedR, quantizedG, quantizedB] = options.quantize(adjustedR, adjustedG, adjustedB);

        data[index] = quantizedR;
        data[index + 1] = quantizedG;
        data[index + 2] = quantizedB;
      }
    }

    return imageData;
  },
};
