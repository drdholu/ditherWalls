import { CanvasStage } from "@/components/canvas-stage";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function EditorShell() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background/80 px-4 py-4 backdrop-blur md:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Workspace</p>
            <h1 className="font-serif text-3xl font-semibold leading-tight">Visual editor</h1>
            <p className="text-sm text-muted-foreground">
              Build next-generation editing experiences with responsive layouts and adaptive theming.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8 md:px-8 md:py-10">
        <Sidebar className="md:sticky md:top-24" />
        <CanvasStage className="flex-1" />
      </main>
    </div>
  );
}
