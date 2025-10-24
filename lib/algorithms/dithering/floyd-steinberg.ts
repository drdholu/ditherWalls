import type { DitheringOptions, DitheringStrategy } from "./types";

const diffusionMatrix = [
  { x: 1, y: 0, weight: 7 / 16 },
  { x: -1, y: 1, weight: 3 / 16 },
  { x: 0, y: 1, weight: 5 / 16 },
  { x: 1, y: 1, weight: 1 / 16 },
] as const;

const clampFloatToByteRange = (value: number) => {
  if (value <= 0) {
    return 0;
  }
  if (value >= 255) {
    return 255;
  }
  return value;
};

export const floydSteinbergDither: DitheringStrategy = {
  key: "floyd-steinberg",
  apply(imageData: ImageData, options: DitheringOptions) {
    const { width, height, data } = imageData;
    const diffusedPixels = new Float32Array(data.length);
    diffusedPixels.set(data);

    const scaledIntensity = Math.max(0, Math.min(1, options.intensity));

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        const originalR = diffusedPixels[index];
        const originalG = diffusedPixels[index + 1];
        const originalB = diffusedPixels[index + 2];

        const [quantizedR, quantizedG, quantizedB] = options.quantize(originalR, originalG, originalB);

        data[index] = quantizedR;
        data[index + 1] = quantizedG;
        data[index + 2] = quantizedB;

        diffusedPixels[index] = quantizedR;
        diffusedPixels[index + 1] = quantizedG;
        diffusedPixels[index + 2] = quantizedB;

        const errorR = (originalR - quantizedR) * scaledIntensity;
        const errorG = (originalG - quantizedG) * scaledIntensity;
        const errorB = (originalB - quantizedB) * scaledIntensity;

        if (scaledIntensity === 0) {
          continue;
        }

        for (const { x: offsetX, y: offsetY, weight } of diffusionMatrix) {
          const targetX = x + offsetX;
          const targetY = y + offsetY;

          if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
            continue;
          }

          const targetIndex = (targetY * width + targetX) * 4;

          diffusedPixels[targetIndex] = clampFloatToByteRange(diffusedPixels[targetIndex] + errorR * weight);
          diffusedPixels[targetIndex + 1] = clampFloatToByteRange(diffusedPixels[targetIndex + 1] + errorG * weight);
          diffusedPixels[targetIndex + 2] = clampFloatToByteRange(diffusedPixels[targetIndex + 2] + errorB * weight);
        }
      }
    }

    return imageData;
  },
};
