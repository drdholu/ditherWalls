export type RGBColor = readonly [number, number, number];

export type QuantizeFn = (r: number, g: number, b: number) => RGBColor;

export type QuantizationMode = "grayscale" | "per-channel";

export interface QuantizerOptions {
  palette?: readonly RGBColor[];
  levels?: number;
  mode?: QuantizationMode;
}

const DEFAULT_LEVELS = 2;
const MIN_LEVELS = 2;
const MAX_LEVELS = 256;

export function clampToByte(value: number) {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 255) {
    return 255;
  }
  return Math.round(value);
}

export function createQuantizer({ palette, levels = DEFAULT_LEVELS, mode = "grayscale" }: QuantizerOptions = {}): QuantizeFn {
  const paletteLength = palette?.length ?? 0;

  if (paletteLength > 0 && palette) {
    const normalisedPalette = palette.map((color) => {
      const [r, g, b] = color;
      return [clampToByte(r), clampToByte(g), clampToByte(b)] as RGBColor;
    });

    return ((r: number, g: number, b: number) => {
      let nearest = normalisedPalette[0];
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const candidate of normalisedPalette) {
        const dr = r - candidate[0];
        const dg = g - candidate[1];
        const db = b - candidate[2];
        const distance = dr * dr + dg * dg + db * db;

        if (distance < closestDistance) {
          closestDistance = distance;
          nearest = candidate;
        }
      }

      return nearest;
    }) as QuantizeFn;
  }

  const boundedLevels = Math.max(MIN_LEVELS, Math.min(MAX_LEVELS, Math.round(levels)));
  const divisor = boundedLevels - 1;
  const step = divisor <= 0 ? 255 : 255 / divisor;

  if (mode === "per-channel") {
    return ((r: number, g: number, b: number) => {
      const quantizedR = clampToByte(Math.round(r / step) * step);
      const quantizedG = clampToByte(Math.round(g / step) * step);
      const quantizedB = clampToByte(Math.round(b / step) * step);
      return [quantizedR, quantizedG, quantizedB] as RGBColor;
    }) as QuantizeFn;
  }

  return ((r: number, g: number, b: number) => {
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const quantized = clampToByte(Math.round(luminance / step) * step);
    return [quantized, quantized, quantized] as RGBColor;
  }) as QuantizeFn;
}

export function quantizeImageData(imageData: ImageData, quantize: QuantizeFn): ImageData {
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const [r, g, b] = quantize(data[index], data[index + 1], data[index + 2]);
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
  }

  return imageData;
}
