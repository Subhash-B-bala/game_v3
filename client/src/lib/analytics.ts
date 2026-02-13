"use client";

/* ============================================================
   Analytics Emitter — Decision-level events only
   Batched POST to backend, 5s flush interval or 10 events
   ============================================================ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const FLUSH_INTERVAL_MS = 5000;
const FLUSH_THRESHOLD = 10;

interface AnalyticsPayload {
    sessionId: string;
    eventType: string;
    payload: Record<string, unknown>;
    clientTs: string;
}

let buffer: AnalyticsPayload[] = [];
let timer: ReturnType<typeof setInterval> | null = null;

function startTimer() {
    if (timer) return;
    timer = setInterval(() => {
        flush();
    }, FLUSH_INTERVAL_MS);
}

async function flush() {
    if (buffer.length === 0) return;

    const batch = [...buffer];
    buffer = [];

    try {
        await fetch(`${API_URL}/api/analytics/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ events: batch }),
        });
    } catch {
        // Re-add failed events to buffer (best-effort)
        buffer = [...batch, ...buffer];
    }
}

export function trackEvent(
    sessionId: string,
    eventType: string,
    payload: Record<string, unknown> = {},
) {
    buffer.push({
        sessionId,
        eventType,
        payload,
        clientTs: new Date().toISOString(),
    });

    startTimer();

    if (buffer.length >= FLUSH_THRESHOLD) {
        flush();
    }
}

// Flush on page unload
if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => flush());
}
