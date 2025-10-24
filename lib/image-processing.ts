export type ProcessingAlgorithm = "identity" | "enhance" | "denoise";

export type ColorDepthOption = 8 | 10 | 12;

export type ResolutionPreset = "original" | "half" | "quarter";

export interface ProcessingSettings {
  algorithm: ProcessingAlgorithm;
  colorDepth: ColorDepthOption;
  strength: number;
  pixelScale: number;
  brightness: number;
  contrast: number;
  resolutionPreset: ResolutionPreset;
  aspectLock: boolean;
}

export const DEFAULT_SETTINGS: ProcessingSettings = {
  algorithm: "identity",
  colorDepth: 8,
  strength: 0.5,
  pixelScale: 1,
  brightness: 0,
  contrast: 0,
  resolutionPreset: "original",
  aspectLock: true,
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
