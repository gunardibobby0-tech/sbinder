import { useState, useCallback } from "react";

interface ProgressEvent {
  type: "started" | "processing" | "progress" | "complete";
  total?: number;
  index?: number;
  item?: any;
  result?: any;
  error?: string;
  processed?: number;
  errors?: number;
}

export function useSSEProgress() {
  const [progress, setProgress] = useState<{
    status: "idle" | "running" | "complete" | "error";
    current: number;
    total: number;
    errors: number;
    lastItem?: any;
    results: any[];
  }>({
    status: "idle",
    current: 0,
    total: 0,
    errors: 0,
    results: [],
  });

  const startTracking = useCallback((url: string, onComplete?: (results: any[]) => void) => {
    const eventSource = new EventSource(url);
    
    setProgress({
      status: "running",
      current: 0,
      total: 0,
      errors: 0,
      results: [],
    });

    eventSource.onmessage = (event) => {
      const data: ProgressEvent = JSON.parse(event.data);

      switch (data.type) {
        case "started":
          setProgress(prev => ({ ...prev, total: data.total || 0 }));
          break;
        case "processing":
          setProgress(prev => ({ ...prev, lastItem: data.item }));
          break;
        case "progress":
          setProgress(prev => {
            const newResults = [...prev.results];
            if (data.index !== undefined) newResults[data.index] = data.result;
            return {
              ...prev,
              current: (data.index || 0) + 1,
              results: newResults,
              errors: prev.errors + (data.error ? 1 : 0),
            };
          });
          break;
        case "complete":
          setProgress(prev => ({ ...prev, status: "complete" }));
          eventSource.close();
          if (onComplete) onComplete(progress.results);
          break;
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      setProgress(prev => ({ ...prev, status: "error" }));
      eventSource.close();
    };

    return () => eventSource.close();
  }, [progress.results]);

  return { progress, startTracking };
}
