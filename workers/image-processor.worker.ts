/// <reference lib="webworker" />

import type {
  ProcessingSettings,
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
  WorkerProcessPayload,
} from "@/lib/image-processing";

const supportsOffscreen = typeof OffscreenCanvas !== "undefined";

let processingCanvas: OffscreenCanvas | null = supportsOffscreen ? new OffscreenCanvas(1, 1) : null;
let processingContext: OffscreenCanvasRenderingContext2D | null = processingCanvas ? processingCanvas.getContext("2d") : null;
let currentSettings: ProcessingSettings | null = null;

self.addEventListener("message", async (event: MessageEvent<WorkerIncomingMessage>) => {
  const message = event.data;

  switch (message.type) {
    case "INIT": {
      postMessageFromWorker({
        type: "READY",
        id: message.id,
        payload: { supportsOffscreen },
      });
      break;
    }
    case "UPDATE_SETTINGS": {
      currentSettings = message.payload.settings;
      postMessageFromWorker({ type: "SETTINGS_ACK", id: message.id });
      break;
    }
    case "PROCESS": {
      try {
        currentSettings = message.payload.settings;
        const payload = await processPayload(message.payload);
        postMessageFromWorker({ type: "PROCESS_COMPLETE", id: message.id, payload });
      } catch (error) {
        postMessageFromWorker({
          type: "ERROR",
          id: message.id,
          error: error instanceof Error ? error.message : "Unknown processing error",
        });
      }
      break;
    }
  }
});

function postMessageFromWorker(message: WorkerOutgoingMessage) {
  const transferables: Transferable[] = [];
  if (message.type === "PROCESS_COMPLETE") {
    if (message.payload.bitmap) {
      transferables.push(message.payload.bitmap);
    } else if (message.payload.imageData) {
      transferables.push(message.payload.imageData.data.buffer);
    }
  }

  (self as DedicatedWorkerGlobalScope).postMessage(message, transferables);
}

async function processPayload(payload: WorkerProcessPayload) {
  if (supportsOffscreen && payload.bitmap) {
    return processWithOffscreen(payload.bitmap, payload.settings, payload.width, payload.height);
  }

  const imageData =
    payload.imageData ?? (payload.bitmap ? await convertBitmapToImageData(payload.bitmap) : undefined);

  if (!imageData) {
    throw new Error("No image data available for processing.");
  }

  const processed = applyAdjustmentsToImageData(imageData, currentSettings ?? payload.settings);
  return {
    width: payload.width,
    height: payload.height,
    imageData: processed,
  } as const;
}

async function processWithOffscreen(
  bitmap: ImageBitmap,
  settings: ProcessingSettings,
  width: number,
  height: number,
) {
  if (!processingCanvas || !processingContext) {
    processingCanvas = new OffscreenCanvas(width, height);
    processingContext = processingCanvas.getContext("2d");
  }

  if (!processingCanvas || !processingContext) {
    bitmap.close();
    throw new Error("Unable to prepare offscreen canvas.");
  }

  if (processingCanvas.width !== width || processingCanvas.height !== height) {
    processingCanvas.width = width;
    processingCanvas.height = height;
  }

  processingContext.clearRect(0, 0, width, height);
  processingContext.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  applyAdjustments(processingContext, currentSettings ?? settings, width, height);

  const processedBitmap = await createImageBitmap(processingCanvas);

  return {
    width,
    height,
    bitmap: processedBitmap,
  } as const;
}

async function convertBitmapToImageData(bitmap: ImageBitmap) {
  const canvas = supportsOffscreen ? new OffscreenCanvas(bitmap.width, bitmap.height) : (null as OffscreenCanvas | null);

  if (!canvas) {
    bitmap.close();
    throw new Error("OffscreenCanvas is not supported in this environment.");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Unable to convert bitmap to ImageData.");
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function applyAdjustments(
  ctx: OffscreenCanvasRenderingContext2D,
  settings: ProcessingSettings | null,
  width: number,
  height: number,
) {
  if (!settings) {
    return;
  }

  if (settings.brightness === 0 && settings.contrast === 0) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const adjusted = applyAdjustmentsToImageData(imageData, settings);
  ctx.putImageData(adjusted, 0, 0);
}

function applyAdjustmentsToImageData(imageData: ImageData, settings: ProcessingSettings) {
  if (settings.brightness === 0 && settings.contrast === 0) {
    return imageData;
  }

  const data = imageData.data;
  const brightnessOffset = settings.brightness;
  const contrastValue = settings.contrast;
  const contrastFactor = Math.tan(((contrastValue + 1) * Math.PI) / 4);

  for (let index = 0; index < data.length; index += 4) {
    data[index] = clamp(contrastFactor * (data[index] - 128) + 128 + brightnessOffset);
    data[index + 1] = clamp(contrastFactor * (data[index + 1] - 128) + 128 + brightnessOffset);
    data[index + 2] = clamp(contrastFactor * (data[index + 2] - 128) + 128 + brightnessOffset);
  }

  return imageData;
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}
