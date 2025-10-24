import { Layers, Palette, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const controlGroups = [
  {
    title: "Layers",
    description: "Manage the hierarchy of elements in your scene.",
    icon: Layers,
    items: ["Hero", "Callout", "Footer"],
  },
  {
    title: "Appearance",
    description: "Adjust typography, color, and surface styling.",
    icon: Palette,
    items: ["Primary · #2563eb", "Accent · #d946ef", "Typeface · Playfair"],
  },
  {
    title: "Spacing",
    description: "Configure spacing, alignment, and layout behavior.",
    icon: SlidersHorizontal,
    items: ["Grid · 12 column", "Gap · 32px", "Columns · Auto"],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-6 rounded-xl border border-border bg-card/60 p-4 shadow-sm backdrop-blur md:w-72",
        className,
      )}
    >
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Editor mode</p>
        <h2 className="font-serif text-2xl font-semibold leading-tight">Controls</h2>
        <p className="text-sm text-muted-foreground">
          Fine-tune details, adjust your palette, and iterate on the fly with a responsive canvas.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {controlGroups.map(({ title, description, icon: Icon, items }) => (
          <section key={title} className="space-y-3 rounded-lg border border-border/70 bg-background/70 p-3">
            <header className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-medium text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </header>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {items.map((item) => (
                <li key={item} className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
                  <span>{item}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground/70">Edit</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
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
