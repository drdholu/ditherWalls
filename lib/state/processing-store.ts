import { create } from "zustand";

import { DEFAULT_SETTINGS, type ProcessingSettings } from "@/lib/image-processing";

interface ProcessingState {
  settings: ProcessingSettings;
  supportsOffscreen: boolean | null;
  updateSetting: <K extends keyof ProcessingSettings>(key: K, value: ProcessingSettings[K]) => void;
  setSettings: (settings: ProcessingSettings) => void;
  setSupportsOffscreen: (value: boolean) => void;
}

export const useProcessingStore = create<ProcessingState>((set) => ({
  settings: DEFAULT_SETTINGS,
  supportsOffscreen: null,
  updateSetting: (key, value) =>
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    })),
  setSettings: (settings) => set({ settings }),
  setSupportsOffscreen: (value) => set({ supportsOffscreen: value }),
}));
