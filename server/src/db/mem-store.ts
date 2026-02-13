import { PlayerSession } from '../../../shared/types.js';

/* ============================================================
   In-Memory Store — Development fallback when PG is unavailable
   ============================================================ */

const sessions = new Map<string, PlayerSession>();
const analyticsBuffer: Array<{
    eventId: string;
    sessionId: string;
    eventType: string;
    payload: Record<string, unknown>;
    clientTs: string;
    serverTs: string;
}> = [];

export const memStore = {
    // Sessions
    saveSession(session: PlayerSession): void {
        sessions.set(session.sessionId, { ...session, updatedAt: new Date().toISOString() });
    },

    loadSession(sessionId: string): PlayerSession | null {
        return sessions.get(sessionId) || null;
    },

    // Analytics
    insertEvents(
        events: Array<{
            eventId: string;
            sessionId: string;
            eventType: string;
            payload: Record<string, unknown>;
            clientTs: string;
        }>,
    ): void {
        for (const e of events) {
            analyticsBuffer.push({ ...e, serverTs: new Date().toISOString() });
        }
    },

    getAnalyticsSummary(): Array<{ event_type: string; count: string }> {
        const counts = new Map<string, number>();
        for (const e of analyticsBuffer) {
            counts.set(e.eventType, (counts.get(e.eventType) || 0) + 1);
        }
        return Array.from(counts.entries())
            .map(([event_type, count]) => ({ event_type, count: String(count) }))
            .sort((a, b) => Number(b.count) - Number(a.count));
    },
};
