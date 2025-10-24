import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasStageProps {
  className?: string;
}

export function CanvasStage({ className }: CanvasStageProps) {
  return (
    <section
      className={cn(
        "relative flex flex-1 flex-col overflow-hidden rounded-xl border border-dashed border-muted bg-muted/20",
        "shadow-[0_60px_120px_-60px_rgba(15,23,42,0.3)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(148,163,184,0.15)_1px,_transparent_0)] bg-[length:24px_24px]" />
      <div className="relative z-10 flex flex-1 flex-col gap-6 p-6 md:p-10">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs uppercase tracking-wide text-primary">
              Live canvas
            </span>
            <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">
              Design beautiful editor experiences
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Iterate quickly with instant visual feedback. Drag, drop, and fine-tune components
              directly inside the canvas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline">Guides</Button>
            <Button>Preview</Button>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-12">
          <div className="col-span-1 flex flex-col gap-3 rounded-lg border border-border/50 bg-background/80 p-4 text-sm shadow-sm md:col-span-4">
            <h2 className="font-semibold">Hero module</h2>
            <p className="text-muted-foreground">
              Layered typography and imagery with responsive behavior and adaptive theming.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="rounded-md bg-muted/60 px-2 py-1">Padding · 64px</span>
              <span className="rounded-md bg-muted/60 px-2 py-1">Gap · 32px</span>
              <span className="rounded-md bg-muted/60 px-2 py-1">Columns · 12</span>
              <span className="rounded-md bg-muted/60 px-2 py-1">Breakpoints · Auto</span>
            </div>
          </div>
          <div className="col-span-1 flex flex-col justify-end gap-3 rounded-lg border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background p-6 text-foreground shadow-lg md:col-span-8">
            <p className="text-xs uppercase tracking-[0.3em] text-foreground/70">Live preview</p>
            <h2 className="text-2xl font-semibold md:text-3xl">Craft multi-theme layouts effortlessly</h2>
            <p className="text-sm text-foreground/80 md:text-base">
              Switch themes, adjust tokens, and see changes instantly across your experience.
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-foreground/80">
              <span className="rounded-full bg-background/40 px-3 py-1">Dark mode</span>
              <span className="rounded-full bg-background/40 px-3 py-1">Grids</span>
              <span className="rounded-full bg-background/40 px-3 py-1">Playfair</span>
              <span className="rounded-full bg-background/40 px-3 py-1">Live tokens</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
