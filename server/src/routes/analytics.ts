import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { memStore } from '../db/mem-store.js';
import { AnalyticsEvent } from '../../../shared/types.js';

export async function analyticsRoutes(app: FastifyInstance) {
    // Batch ingest decision-level events
    app.post<{ Body: { events: AnalyticsEvent[] } }>(
        '/analytics/events',
        async (req, reply) => {
            const { events } = req.body;
            if (!events || !Array.isArray(events) || events.length === 0) {
                return reply.code(400).send({ error: 'No events provided' });
            }

            memStore.insertEvents(
                events.map((evt) => ({
                    eventId: evt.eventId || uuid(),
                    sessionId: evt.sessionId,
                    eventType: evt.eventType,
                    payload: evt.payload,
                    clientTs: evt.clientTs,
                })),
            );

            return reply.code(201).send({ ingested: events.length });
        },
    );

    // Get analytics summary
    app.get('/analytics/summary', async () => {
        return { summary: memStore.getAnalyticsSummary() };
    });
}
