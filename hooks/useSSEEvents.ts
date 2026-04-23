"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SecurityEvent } from "@/types/security";
import { useToast } from "@/components/ToastProvider";

export function useSSEEvents(maxBufferSize = 500) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const es = new EventSource("/api/events");
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (msg) => {
      try {
        const event: SecurityEvent = JSON.parse(msg.data);
        
        // Handle autonomous block notifications
        if (event.source === "system") {
          addToast(event.attack_type, "error", event.raw);
        }

        setEvents((prev) => {
          const next = [event, ...prev];
          return next.length > maxBufferSize ? next.slice(0, maxBufferSize) : next;
        });
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [maxBufferSize]);

  const clear = useCallback(() => setEvents([]), []);

  return { events, connected, clear };
}
