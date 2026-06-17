import type { WsEvent } from '@sitepulse/shared/events';

interface Session {
  ws: WebSocket;
  sessionId: string;
}

export class BroadcastManager {
  private sessions = new Map<string, Session>();
  private ringBuffer: Array<{ eventId: string; event: WsEvent }> = [];

  // Throttling for page.scanned events
  private scannedBuffer: Array<{ url: string; statusCode: number; responseTimeMs: number }> = [];
  private scannedFlushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastProgressBroadcast = 0;

  addSession(sessionId: string, ws: WebSocket) {
    this.sessions.set(sessionId, { ws, sessionId });
  }

  removeSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  sessionCount(): number {
    return this.sessions.size;
  }

  broadcast(event: WsEvent) {
    // Ring buffer: keep last RING_BUFFER_SIZE events
    if (this.ringBuffer.length >= 500) {
      this.ringBuffer.shift();
    }
    this.ringBuffer.push({ eventId: event.eventId, event });

    const payload = JSON.stringify(event);
    const dead: string[] = [];

    for (const [id, session] of this.sessions) {
      try {
        // Check bufferedAmount — if too high, disconnect
        if ((session.ws as unknown as { bufferedAmount?: number }).bufferedAmount ?? 0 > 1_000_000) {
          session.ws.close(1011, 'Send buffer full');
          dead.push(id);
          continue;
        }
        session.ws.send(payload);
      } catch {
        dead.push(id);
      }
    }

    for (const id of dead) this.sessions.delete(id);
  }

  // Throttled page.scanned — batches up to 10/sec
  bufferPageScanned(url: string, statusCode: number, responseTimeMs: number) {
    this.scannedBuffer.push({ url, statusCode, responseTimeMs });

    if (!this.scannedFlushTimer) {
      this.scannedFlushTimer = setTimeout(() => {
        this.flushScannedBuffer();
      }, 100); // flush every 100ms = max 10/sec
    }
  }

  private flushScannedBuffer() {
    this.scannedFlushTimer = null;
    if (this.scannedBuffer.length === 0) return;

    const items = this.scannedBuffer.splice(0);
    this.broadcast({
      type: 'page.scanned.batch',
      items,
      eventId: crypto.randomUUID(),
    });
  }

  // Progress — max 1/sec
  broadcastProgress(scanned: number, total: number) {
    const now = Date.now();
    if (now - this.lastProgressBroadcast < 1000) return;
    this.lastProgressBroadcast = now;

    this.broadcast({
      type: 'progress',
      scanned,
      total,
      percent: total > 0 ? Math.round((scanned / total) * 100) : 0,
      eventId: crypto.randomUUID(),
    });
  }

  // Replay events from lastEventId for reconnecting clients
  replaySince(sessionId: string, lastEventId: string | undefined) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (!lastEventId) return; // Will receive snapshot instead

    const idx = this.ringBuffer.findIndex((e) => e.eventId === lastEventId);
    if (idx === -1) return; // Buffer exhausted, client gets snapshot

    const toReplay = this.ringBuffer.slice(idx + 1);
    for (const { event } of toReplay) {
      try {
        session.ws.send(JSON.stringify(event));
      } catch {
        this.sessions.delete(sessionId);
        break;
      }
    }
  }
}
