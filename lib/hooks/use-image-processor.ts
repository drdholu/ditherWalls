'use client';

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  ProcessingSettings,
  WorkerIncomingMessage,
  WorkerOutgoingMessage,
  WorkerProcessPayload,
} from "@/lib/image-processing";
import { useProcessingStore } from "@/lib/state/processing-store";

interface ProcessImageArgs {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  settings: ProcessingSettings;
}

interface UseImageProcessorOptions {
  onResult: (result: {
    id: number;
    width: number;
    height: number;
    bitmap?: ImageBitmap;
    imageData?: ImageData;
  }) => void;
  onError?: (error: string) => void;
}

export function useImageProcessor({ onResult, onError }: UseImageProcessorOptions) {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const supportsOffscreen = useProcessingStore((state) => state.supportsOffscreen);
  const setSupportsOffscreen = useProcessingStore((state) => state.setSupportsOffscreen);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const worker = new Worker(new URL("../../workers/image-processor.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;
    const initId = ++idRef.current;
    const initMessage: WorkerIncomingMessage = { type: "INIT", id: initId };
    worker.postMessage(initMessage);

    const handleMessage = (event: MessageEvent) => {
      const message = event.data as WorkerOutgoingMessage;

      switch (message.type) {
        case "READY":
          setSupportsOffscreen(message.payload.supportsOffscreen);
          setReady(true);
          break;
        case "PROCESS_COMPLETE":
          onResultRef.current?.({
            id: message.id,
            ...message.payload,
          });
          break;
        case "SETTINGS_ACK":
          break;
        case "ERROR":
          if (onErrorRef.current) {
            onErrorRef.current(message.error);
          } else {
            console.error("Image processor worker error:", message.error);
          }
          break;
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (onErrorRef.current) {
        onErrorRef.current(event.message);
      } else {
        console.error("Image processor worker error:", event.message);
      }
    };

    worker.addEventListener("message", handleMessage);
    worker.addEventListener("error", handleError);

    return () => {
      worker.removeEventListener("message", handleMessage);
      worker.removeEventListener("error", handleError);
      worker.terminate();
      workerRef.current = null;
      setReady(false);
    };
  }, [setSupportsOffscreen]);

  const processImage = useCallback(
    async ({ canvas, width, height, settings }: ProcessImageArgs) => {
      const worker = workerRef.current;
      if (!worker || width === 0 || height === 0) {
        return null;
      }

      const payload: WorkerProcessPayload = {
        width,
        height,
        settings,
      };

      const transferables: Transferable[] = [];
      const canUseBitmap = (supportsOffscreen ?? false) && typeof createImageBitmap === "function";

      if (canUseBitmap) {
        try {
          const bitmap = await createImageBitmap(canvas);
          payload.bitmap = bitmap;
          transferables.push(bitmap);
        } catch (error) {
          console.warn("createImageBitmap failed, falling back to ImageData", error);
        }
      }

      if (!payload.bitmap) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          if (onErrorRef.current) {
            onErrorRef.current("Unable to read image data from canvas.");
          }
          return null;
        }
        const imageData = ctx.getImageData(0, 0, width, height);
        payload.imageData = imageData;
        transferables.push(imageData.data.buffer);
      }

      const requestId = ++idRef.current;
      const message: WorkerIncomingMessage = { type: "PROCESS", id: requestId, payload };
      worker.postMessage(message, transferables);

      return requestId;
    },
    [supportsOffscreen],
  );

  const syncSettings = useCallback((settings: ProcessingSettings) => {
    const worker = workerRef.current;
    if (!worker) {
      return;
    }
    const requestId = ++idRef.current;
    const message: WorkerIncomingMessage = {
      type: "UPDATE_SETTINGS",
      id: requestId,
      payload: { settings },
    };
    worker.postMessage(message);
  }, []);

  return {
    ready,
    supportsOffscreen: supportsOffscreen ?? false,
    processImage,
    syncSettings,
  };
}
