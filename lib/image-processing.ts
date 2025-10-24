export type ProcessingAlgorithm = "none" | "floyd-steinberg" | "ordered-bayer-8x8";

export type ColorDepthOption = 2 | 4 | 8 | 16 | 32 | 64;

export type ResolutionPreset = "original" | "half" | "quarter";

export interface ProcessingSettings {
  algorithm: ProcessingAlgorithm;
  colorDepth: ColorDepthOption;
  ditheringIntensity: number;
  brightness: number;
  contrast: number;
  resolutionPreset: ResolutionPreset;
  aspectLock: boolean;
  palette: Array<[number, number, number]> | null;
}

export const DEFAULT_SETTINGS: ProcessingSettings = {
  algorithm: "floyd-steinberg",
  colorDepth: 8,
  ditheringIntensity: 0.75,
  brightness: 0,
  contrast: 0,
  resolutionPreset: "original",
  aspectLock: true,
  palette: null,
};

export interface WorkerProcessPayload {
  width: number;
  height: number;
  settings: ProcessingSettings;
  bitmap?: ImageBitmap;
  imageData?: ImageData;
}

export type WorkerIncomingMessage =
  | { type: "INIT"; id: number }
  | { type: "PROCESS"; id: number; payload: WorkerProcessPayload }
  | { type: "UPDATE_SETTINGS"; id: number; payload: { settings: ProcessingSettings } };

export type WorkerOutgoingMessage =
  | { type: "READY"; id: number; payload: { supportsOffscreen: boolean } }
  | { type: "PROCESS_COMPLETE"; id: number; payload: { width: number; height: number; bitmap?: ImageBitmap; imageData?: ImageData } }
  | { type: "SETTINGS_ACK"; id: number }
  | { type: "ERROR"; id: number; error: string };
