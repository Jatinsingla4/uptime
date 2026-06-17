'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { CrawlEvent } from '@sitepulse/shared/events';
import type { CrawlStats, JobStatus } from '@sitepulse/shared/types';

const WS_BASE = process.env['NEXT_PUBLIC_WS_URL'] ?? 'wss://ws.sitepulse.app';
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // exponential backoff cap

export interface CrawlWsState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  jobStatus: JobStatus | null;
  stats: CrawlStats | null;
  lastEventId: string | null;
  liveFeed: LiveFeedItem[];
}

export interface LiveFeedItem {
  id: string;
  url: string;
  statusCode: number | null;
  responseTimeMs: number | null;
  type: 'ok' | 'broken' | 'redirect';
  ts: number;
}

export function useCrawlWebSocket(jobId: string | null, token: string | null) {
  const [state, setState] = useState<CrawlWsState>({
    status: 'disconnected',
    jobStatus: null,
    stats: null,
    lastEventId: null,
    liveFeed: [],
  });

  const wsRef = useRef<WebSocket | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!jobId || !token) return;
    if (!mountedRef.current) return;

    setState((s) => ({ ...s, status: 'connecting' }));

    const params = new URLSearchParams({ token });
    if (lastEventIdRef.current) {
      params.set('lastEventId', lastEventIdRef.current);
    }

    const ws = new WebSocket(`${WS_BASE}/crawl/${jobId}?${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptRef.current = 0;
      setState((s) => ({ ...s, status: 'connected' }));
    };

    ws.onmessage = (e: MessageEvent<string>) => {
      let event: CrawlEvent;
      try {
        event = JSON.parse(e.data) as CrawlEvent;
      } catch {
        return;
      }

      lastEventIdRef.current = event.eventId;

      setState((s) => {
        const newFeed = [...s.liveFeed];

        switch (event.type) {
          case 'snapshot':
            return { ...s, jobStatus: event.status, stats: event.stats, lastEventId: event.eventId };

          case 'page.scanned':
            if (newFeed.length > 200) newFeed.shift();
            newFeed.push({
              id: event.eventId,
              url: event.url,
              statusCode: event.statusCode,
              responseTimeMs: event.responseTimeMs,
              type: event.statusCode >= 400 ? 'broken' : event.statusCode >= 300 ? 'redirect' : 'ok',
              ts: Date.now(),
            });
            return { ...s, liveFeed: newFeed, lastEventId: event.eventId };

          case 'page.scanned.batch':
            for (const item of event.items) {
              if (newFeed.length > 200) newFeed.shift();
              newFeed.push({
                id: crypto.randomUUID(),
                url: item.url,
                statusCode: item.statusCode,
                responseTimeMs: item.responseTimeMs,
                type: item.statusCode >= 400 ? 'broken' : item.statusCode >= 300 ? 'redirect' : 'ok',
                ts: Date.now(),
              });
            }
            return { ...s, liveFeed: newFeed, lastEventId: event.eventId };

          case 'link.broken':
            if (newFeed.length > 200) newFeed.shift();
            newFeed.push({
              id: event.eventId,
              url: event.url,
              statusCode: event.statusCode,
              responseTimeMs: null,
              type: 'broken',
              ts: Date.now(),
            });
            return { ...s, liveFeed: newFeed, lastEventId: event.eventId };

          case 'progress':
            return {
              ...s,
              stats: s.stats ? {
                ...s.stats,
                scanned: event.scanned,
                totalPages: event.total,
              } : null,
              lastEventId: event.eventId,
            };

          case 'crawl.completed':
            return { ...s, jobStatus: 'completed', stats: event.summary, lastEventId: event.eventId };

          case 'crawl.failed':
            return { ...s, jobStatus: 'failed', lastEventId: event.eventId };

          case 'crawl.cancelled':
            return { ...s, jobStatus: 'cancelled', lastEventId: event.eventId };

          default:
            return { ...s, lastEventId: event.eventId };
        }
      });
    };

    ws.onclose = (e) => {
      if (!mountedRef.current) return;

      // Terminal states — don't reconnect
      const terminalCode = e.code === 1000; // Normal closure
      if (terminalCode) {
        setState((s) => ({ ...s, status: 'disconnected' }));
        return;
      }

      setState((s) => ({ ...s, status: 'disconnected' }));

      // Reconnect with backoff
      const attempt = reconnectAttemptRef.current;
      const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)] ?? 30000;
      reconnectAttemptRef.current++;
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, status: 'error' }));
    };
  }, [jobId, token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close(1000, 'Component unmounted');
    };
  }, [connect]);

  const pauseFeed = useRef(false);

  return { ...state, pauseFeed };
}
