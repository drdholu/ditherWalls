"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CanvasStageProps {
  className?: string;
}

type StageStatus = {
  type: "info" | "success" | "error";
  message: string;
};

type ImageState = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
};

type StageSource = "drop" | "paste" | "picker";

const FILE_SIZE_LIMIT_BYTES = 15 * 1024 * 1024; // 15 MB
const SUPPORTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const EXTENSION_MIME_MAP: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

const STATUS_EMPHASIS: Record<StageStatus["type"], string> = {
  info: "bg-muted/60 text-muted-foreground",
  success: "bg-emerald-500/15 text-emerald-500",
  error: "bg-destructive/10 text-destructive",
};

export function CanvasStage({ className }: CanvasStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const operationIdRef = useRef(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [status, setStatus] = useState<StageStatus>({
    type: "info",
    message: "Drop, paste, or pick an image to load it onto the canvas.",
  });
  const [imageState, setImageState] = useState<ImageState | null>(null);

  const renderOnStage = useCallback(
    (image: ImageState | null) => {
      if (!canvasRef.current) {
        return;
      }

      const { width: containerWidth, height: containerHeight } = stageSize;
      const canvasElement = canvasRef.current;

      if (!containerWidth || !containerHeight) {
        canvasElement.width = 0;
        canvasElement.height = 0;
        return;
      }

      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      canvasElement.width = Math.max(1, Math.floor(containerWidth * dpr));
      canvasElement.height = Math.max(1, Math.floor(containerHeight * dpr));
      canvasElement.style.width = `${containerWidth}px`;
      canvasElement.style.height = `${containerHeight}px`;

      const ctx = canvasElement.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      if (!image) {
        return;
      }

      const scale = Math.min(containerWidth / image.width, containerHeight / image.height, 1);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const offsetX = (containerWidth - drawWidth) / 2;
      const offsetY = (containerHeight - drawHeight) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image.canvas, offsetX, offsetY, drawWidth, drawHeight);
    },
    [stageSize],
  );

  useEffect(() => {
    if (!imageState) {
      renderOnStage(null);
      return;
    }

    renderOnStage(imageState);
  }, [imageState, renderOnStage]);

  useEffect(() => {
    if (typeof window === "undefined" || !dropZoneRef.current) {
      return;
    }

    const element = dropZoneRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      setStageSize((prev) => {
        const roundedWidth = Math.round(width);
        const roundedHeight = Math.round(height);
        if (prev.width === roundedWidth && prev.height === roundedHeight) {
          return prev;
        }

        return { width: roundedWidth, height: roundedHeight };
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null, source: StageSource) => {
      if (!files || files.length === 0) {
        setStatus({ type: "error", message: "No image data detected." });
        return;
      }

      const list: File[] = files instanceof FileList ? Array.from(files) : [...files];
      const file = list[0];

      if (!file) {
        setStatus({ type: "error", message: "Unable to access the provided file." });
        return;
      }

      const normalizedType = normaliseMimeType(file);
      if (!normalizedType || !SUPPORTED_MIME_TYPES.has(normalizedType)) {
        setStatus({
          type: "error",
          message: "Unsupported file type. Try PNG, JPEG, WebP, or SVG.",
        });
        return;
      }

      if (file.size > FILE_SIZE_LIMIT_BYTES) {
        setStatus({
          type: "error",
          message: `File is too large (${formatFileSize(file.size)}). Maximum allowed is ${formatFileSize(FILE_SIZE_LIMIT_BYTES)}.`,
        });
        return;
      }

      const operationId = ++operationIdRef.current;
      setIsProcessing(true);
      setStatus({ type: "info", message: "Decoding image…" });

      try {
        const nextImage = await decodeFileToCanvas(file, normalizedType);

        if (operationIdRef.current !== operationId) {
          return;
        }

        setImageState({
          canvas: nextImage.canvas,
          width: nextImage.canvas.width,
          height: nextImage.canvas.height,
          name: file.name,
          size: file.size,
          type: normalizedType,
        });

        const sourceLabel =
          source === "paste" ? "pasted" : source === "drop" ? "dropped" : "selected";
        setStatus({ type: "success", message: `Successfully ${sourceLabel} "${file.name}".` });
      } catch (error) {
        if (operationIdRef.current !== operationId) {
          return;
        }

        console.error(error);
        setStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message || "Failed to decode image."
              : "Failed to decode image.",
        });
      } finally {
        if (operationIdRef.current === operationId) {
          setIsProcessing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onPaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        return;
      }

      const clipboardFiles: File[] = [];
      for (const item of Array.from(event.clipboardData.items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            clipboardFiles.push(file);
          }
        }
      }

      if (clipboardFiles.length === 0 && event.clipboardData.files.length > 0) {
        clipboardFiles.push(...Array.from(event.clipboardData.files));
      }

      if (clipboardFiles.length === 0) {
        return;
      }

      event.preventDefault();
      handleFiles(clipboardFiles, "paste");
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      handleFiles(event.dataTransfer?.files ?? null, "drop");
    },
    [handleFiles],
  );

  const stageChips = imageState
    ? [
        `Dimensions · ${imageState.width} × ${imageState.height}`,
        `File size · ${formatFileSize(imageState.size)}`,
        `Format · ${formatDisplayType(imageState.type)}`,
      ]
    : [
        "Supported · PNG, JPEG, WebP, SVG",
        `Size limit · ${formatFileSize(FILE_SIZE_LIMIT_BYTES)}`,
        "Tip · Use ⌘V / Ctrl+V to paste",
      ];

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
            <h1 className="font-serif text-3xl font-semibold leading-tight md:text-4xl">Visual asset workspace</h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Drag images in, paste from your clipboard, or pick a file. We&apos;ll validate, decode, and fit it to
              the stage without blocking the UI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted/60 px-3 py-1">Async decoding</span>
            <span className="rounded-full bg-muted/60 px-3 py-1">EXIF aware</span>
            <span className="rounded-full bg-muted/60 px-3 py-1">Optimised rendering</span>
          </div>
        </header>

        <div
          ref={dropZoneRef}
          className={cn(
            "relative flex flex-1 items-stretch overflow-hidden rounded-xl border border-dashed border-border/70 bg-background/80 min-h-[320px] md:min-h-[420px]",
            "transition-all duration-200",
            isDragging ? "border-primary bg-primary/10 shadow-inner" : "hover:border-primary/50",
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <canvas ref={canvasRef} className="h-full w-full" />

          {!imageState && !isProcessing && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center text-sm text-muted-foreground">
              <p className="text-base font-medium text-foreground">Drop an image or paste from your clipboard</p>
              <p>Use the button below to pick a file. The canvas will automatically scale large assets to fit.</p>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <span className="animate-pulse text-sm font-medium text-muted-foreground">Decoding image…</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div
              className={cn("inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium", STATUS_EMPHASIS[status.type])}
              role="status"
              aria-live={status.type === "error" ? "assertive" : "polite"}
            >
              {status.message}
            </div>
            <ul className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {stageChips.map((chip) => (
                <li key={chip} className="rounded-md bg-muted/60 px-2 py-1">
                  {chip}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-3">
            <Button onClick={openFilePicker} disabled={isProcessing} variant="secondary">
              Choose image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.svg"
              className="hidden"
              onChange={(event) => {
                handleFiles(event.target.files, "picker");
                if (event.target) {
                  event.target.value = "";
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Press <span className="font-medium">⌘V</span> / <span className="font-medium">Ctrl+V</span> to paste an image.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function normaliseMimeType(file: File): string | null {
  const declaredType = file.type?.toLowerCase();
  if (declaredType && SUPPORTED_MIME_TYPES.has(declaredType)) {
    return declaredType;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_MAP[extension] ?? null;
}

async function decodeFileToCanvas(file: File, mimeType: string) {
  const arrayBuffer = await file.arrayBuffer();
  const orientation = mimeType === "image/jpeg" ? getExifOrientation(arrayBuffer) : 1;
  const blob = new Blob([arrayBuffer], { type: mimeType });

  let source: ImageBitmap | HTMLImageElement | null = null;

  if (typeof createImageBitmap === "function") {
    try {
      source = await createImageBitmap(blob);
    } catch (error) {
      console.warn("createImageBitmap failed, falling back to HTMLImageElement", error);
    }
  }

  if (!source) {
    source = await loadImageFromBlob(blob);
  }

  const orientedCanvas = renderSourceToOrientedCanvas(source, orientation);

  if (isImageBitmap(source)) {
    source.close();
  }

  return { canvas: orientedCanvas };
}

function renderSourceToOrientedCanvas(source: ImageBitmap | HTMLImageElement, orientation: number) {
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;

  if (!width || !height) {
    throw new Error("Image has invalid dimensions.");
  }

  const needsSwap = orientation >= 5 && orientation <= 8;
  const canvas = document.createElement("canvas");
  canvas.width = needsSwap ? height : width;
  canvas.height = needsSwap ? width : height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to render onto canvas.");
  }

  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      ctx.transform(1, 0, 0, 1, 0, 0);
      break;
  }

  if ("naturalWidth" in source) {
    ctx.drawImage(source, 0, 0, width, height);
  } else {
    ctx.drawImage(source, 0, 0);
  }

  return canvas;
}

function getExifOrientation(buffer: ArrayBuffer): number {
  try {
    const view = new DataView(buffer);
    if (view.getUint16(0, false) !== 0xffd8) {
      return 1;
    }

    let offset = 2;
    const length = view.byteLength;

    while (offset < length) {
      if (view.getUint8(offset) !== 0xff) {
        break;
      }

      const marker = view.getUint8(offset + 1);
      if (marker === 0xe1) {
        const segmentLength = view.getUint16(offset + 2, false);
        const exifStart = offset + 4;

        if (getAscii(view, exifStart, 4) !== "Exif") {
          break;
        }

        const tiffOffset = exifStart + 6;
        const littleEndian = view.getUint16(tiffOffset, false) === 0x4949;
        const firstIFDOffset = view.getUint32(tiffOffset + 4, littleEndian);
        let directoryOffset = tiffOffset + firstIFDOffset;
        const entries = view.getUint16(directoryOffset, littleEndian);

        for (let i = 0; i < entries; i++) {
          const entryOffset = directoryOffset + 2 + i * 12;
          const tag = view.getUint16(entryOffset, littleEndian);
          if (tag === 0x0112) {
            const value = view.getUint16(entryOffset + 8, littleEndian);
            return value || 1;
          }
        }
        break;
      } else {
        const segmentLength = view.getUint16(offset + 2, false);
        offset += 2 + segmentLength;
      }
    }
  } catch (error) {
    console.warn("Failed to read EXIF orientation", error);
  }

  return 1;
}

function getAscii(view: DataView, start: number, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += String.fromCharCode(view.getUint8(start + i));
  }
  return out;
}

function isImageBitmap(value: ImageBitmap | HTMLImageElement): value is ImageBitmap {
  return typeof (value as ImageBitmap).close === "function";
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = "async";

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Unable to decode image."));
    };

    img.src = url;
  });
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const formatted = value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value).toString();
  return `${formatted} ${units[unit]}`;
}

function formatDisplayType(type: string): string {
  switch (type) {
    case "image/png":
      return "PNG";
    case "image/jpeg":
      return "JPEG";
    case "image/webp":
      return "WebP";
    case "image/svg+xml":
      return "SVG";
    default:
      return type;
  }
}
