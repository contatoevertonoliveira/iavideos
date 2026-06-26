import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../features/auth/store";

export type JobUpdateEvent = {
  type: "job_update" | string;
  video_post_id: number;
  job_run_id?: number;
  task?: string;
  status?: string; // queued | running | completed | failed
  progress?: number; // 0-100
  message?: string;
};

type UseSSEOptions = {
  url: string; // absolute or relative API path
  onEvent?: (evt: JobUpdateEvent) => void;
  autoReconnect?: boolean;
  parseJson?: boolean;
  headers?: Record<string, string>;
};

type SSEState = {
  connected: boolean;
  error: string | null;
};

export function useSSE(options: UseSSEOptions) {
  const {
    url,
    onEvent,
    autoReconnect = true,
    parseJson = true,
    headers = {},
  } = options;

  const [state, setState] = useState<SSEState>({ connected: false, error: null });
  const controllerRef = useRef<AbortController | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;

    // Usar token do store; compatível com campos `access` (principal) ou `accessToken` (legado)
    const s = useAuthStore.getState();
    const token = (s as any).access || (s as any).accessToken;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    const allHeaders: HeadersInit = {
      Accept: "text/event-stream",
      ...authHeader,
      ...headers,
    };

    async function connect() {
      try {
        const resp = await fetch(url, {
          method: "GET",
          headers: allHeaders,
          signal: controller.signal,
        });
        if (!resp.ok) {
          throw new Error(`SSE HTTP ${resp.status}`);
        }

        const reader = resp.body?.getReader();
        if (!reader) throw new Error("SSE stream not readable");
        setState({ connected: true, error: null });

        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Split by double newlines which delimit events in SSE
          const parts = buffer.split(/\n\n/);
          buffer = parts.pop() || "";
          for (const part of parts) {
            // Extract lines starting with 'data: '
            const dataLines = part
              .split(/\n/)
              .filter((l) => l.startsWith("data:"))
              .map((l) => l.replace(/^data:\s?/, ""));
            if (dataLines.length === 0) continue;
            const data = dataLines.join("\n");
            try {
              const parsed = parseJson ? (JSON.parse(data) as JobUpdateEvent) : (data as unknown as JobUpdateEvent);
              onEvent?.(parsed);
            } catch (err) {
              // Ignore parse errors to keep stream alive
              // Optionally could surface via state.error
            }
          }
        }
      } catch (err: any) {
        setState({ connected: false, error: err?.message ?? String(err) });
        if (autoReconnect && !controller.signal.aborted) {
          // Reconnect after a short delay
          reconnectTimerRef.current = window.setTimeout(connect, 2000);
        }
      }
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      controller.abort();
      controllerRef.current = null;
      setState((s) => ({ ...s, connected: false }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return state;
}