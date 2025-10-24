'use client';

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { ColorDepthOption, ProcessingAlgorithm, ResolutionPreset } from "@/lib/image-processing";
import { useProcessingStore } from "@/lib/state/processing-store";
import { cn } from "@/lib/utils";

const algorithmOptions: Array<{ label: string; value: ProcessingAlgorithm }> = [
  { label: "Identity", value: "identity" },
  { label: "Enhance", value: "enhance" },
  { label: "Denoise", value: "denoise" },
];

const resolutionOptions: Array<{ label: string; value: ResolutionPreset }> = [
  { label: "Original", value: "original" },
  { label: "Half", value: "half" },
  { label: "Quarter", value: "quarter" },
];

const colorDepthOptions: Array<{ label: string; value: ColorDepthOption }> = [
  { label: "8-bit", value: 8 },
  { label: "10-bit", value: 10 },
  { label: "12-bit", value: 12 },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const settings = useProcessingStore((state) => state.settings);
  const updateSetting = useProcessingStore((state) => state.updateSetting);
  const supportsOffscreen = useProcessingStore((state) => state.supportsOffscreen);

  const workerCapability = useMemo(() => {
    if (supportsOffscreen === null) {
      return "Detecting";
    }
    return supportsOffscreen ? "OffscreenCanvas" : "ImageData";
  }, [supportsOffscreen]);

  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-6 rounded-xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur md:w-72",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Renderer</p>
        <h2 className="font-serif text-2xl font-semibold leading-tight">Controls</h2>
        <p className="text-sm text-muted-foreground">
          Tune the worker-driven pipeline and keep the UI responsive while you experiment with different looks.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted/60 px-2 py-1">State store · synced</span>
        <span className="rounded-md bg-muted/60 px-2 py-1">Worker · {workerCapability}</span>
        <span className="rounded-md bg-muted/60 px-2 py-1">Aspect · {settings.aspectLock ? 'locked' : 'free'}</span>
      </div>

      <div className="flex flex-col gap-4">
        <section className="space-y-4 rounded-lg border border-border/70 bg-background/70 p-4">
          <header className="space-y-1">
            <h3 className="font-medium text-foreground">Processing pipeline</h3>
            <p className="text-xs text-muted-foreground">Direct the worker algorithm and resolution preferences.</p>
          </header>

          <div className="space-y-3 text-sm">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Algorithm</span>
              <select
                className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={settings.algorithm}
                onChange={(event) => updateSetting("algorithm", event.target.value as ProcessingAlgorithm)}
              >
                {algorithmOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Resolution preset</span>
              <select
                className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={settings.resolutionPreset}
                onChange={(event) => updateSetting("resolutionPreset", event.target.value as ResolutionPreset)}
              >
                {resolutionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Color depth</span>
              <select
                className="h-9 rounded-md border border-border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={settings.colorDepth}
                onChange={(event) => updateSetting("colorDepth", Number(event.target.value) as ColorDepthOption)}
              >
                {colorDepthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border/70 bg-background/70 p-4">
          <header className="space-y-1">
            <h3 className="font-medium text-foreground">Structure</h3>
            <p className="text-xs text-muted-foreground">Balance algorithm strength and pixel scaling.</p>
          </header>

          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Strength</span>
                <span>{Math.round(settings.strength * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.strength}
                onChange={(event) => updateSetting("strength", parseFloat(event.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Pixel scale</span>
                <span>{settings.pixelScale.toFixed(0)}×</span>
              </div>
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={settings.pixelScale}
                onChange={(event) => updateSetting("pixelScale", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-border/70 bg-background/70 p-4">
          <header className="space-y-1">
            <h3 className="font-medium text-foreground">Tone & lighting</h3>
            <p className="text-xs text-muted-foreground">Adjust brightness, contrast, and aspect behaviour.</p>
          </header>

          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Brightness</span>
                <span>{settings.brightness > 0 ? `+${settings.brightness}` : settings.brightness}</span>
              </div>
              <input
                type="range"
                min={-60}
                max={60}
                step={5}
                value={settings.brightness}
                onChange={(event) => updateSetting("brightness", Number(event.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>Contrast</span>
                <span>{Math.round(settings.contrast * 100)}%</span>
              </div>
              <input
                type="range"
                min={-0.5}
                max={0.5}
                step={0.1}
                value={settings.contrast}
                onChange={(event) => updateSetting("contrast", parseFloat(event.target.value))}
                className="w-full accent-primary"
              />
            </div>

            <label className="flex items-center justify-between rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Aspect lock</span>
              <input
                type="checkbox"
                checked={settings.aspectLock}
                onChange={(event) => updateSetting("aspectLock", event.target.checked)}
                className="h-4 w-4 rounded border border-border"
              />
            </label>
          </div>
        </section>
      </div>

      <div className="mt-auto space-y-2">
        <Button className="w-full" variant="secondary">
          Add layer
        </Button>
        <Button className="w-full" variant="outline">
          Publish snapshot
        </Button>
      </div>
    </aside>
  );
}
