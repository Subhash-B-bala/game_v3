import { FastifyInstance } from 'fastify';
import { v4 as uuid } from 'uuid';
import { memStore } from '../db/mem-store.js';
import {
    PlayerSession,
    DEFAULT_STATE_VECTOR,
    CreateSessionRequest,
    CreateSessionResponse,
    SubmitActionRequest,
    SubmitActionResponse,
} from '../../../shared/types.js';
import { resolveScenario, getMergedScenario } from '../engine/scenario-resolver.js';
import { applyStateDelta } from '../engine/state-engine.js';
import { generateMirror } from '../engine/career-mirror.js';

export async function sessionRoutes(app: FastifyInstance) {
    // Get scenario template (including role overlays)
    app.get<{ Params: { id: string }; Querystring: { role?: string } }>(
        '/scenario/:id',
        async (req, reply) => {
            const { id } = req.params;
            const { role } = req.query;
            const scenario = getMergedScenario(id, role || null);
            if (!scenario) {
                return reply.code(404).send({ error: 'Scenario not found' });
            }
            return scenario;
        },
    );

    // Create new session
    app.post<{ Body: CreateSessionRequest }>('/session', async (req, reply) => {
        const sessionId = uuid();
        const session: PlayerSession = {
            sessionId,
            playerId: req.body?.playerId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currentChapter: 0,
            currentScene: 'entry',
            sceneCompleted: false,
            runNumber: 1,
            roleChoice: null,
            experienceLevel: null,
            mindsetBias: null,
            stateVector: { ...DEFAULT_STATE_VECTOR },
            actionHistory: [],
            eventQueue: [],
            appliedEvents: [],
            careerMirror: null,
        };

        memStore.saveSession(session);
        return reply.code(201).send({ session } as CreateSessionResponse);
    });

    // Load session
    app.get<{ Params: { id: string } }>('/session/:id', async (req, reply) => {
        const session = memStore.loadSession(req.params.id);
        if (!session) {
            return reply.code(404).send({ error: 'Session not found' });
        }
        return { session };
    });

    // Submit action (core game loop)
    app.patch<{ Params: { id: string }; Body: SubmitActionRequest }>(
        '/session/:id/action',
        async (req, reply) => {
            const session = memStore.loadSession(req.params.id);
            if (!session) {
                return reply.code(404).send({ error: 'Session not found' });
            }

            const result = resolveScenario(session, req.body.scenarioId, req.body.actionId);
            if (!result) {
                console.warn(`[PATCH /action] resolveScenario failed. Body:`, JSON.stringify(req.body));
                return reply.code(400).send({ error: 'Invalid scenario or action' });
            }

            const updated = applyStateDelta(session, result, req.body);
            memStore.saveSession(updated);

            return {
                session: updated,
                narrative: result.narrative,
                audioCue: result.audioCue,
            } as SubmitActionResponse;
        },
    );

    // Poll for events (REST-only, no WebSocket)
    app.get<{ Params: { id: string } }>('/session/:id/events', async (req, reply) => {
        const session = memStore.loadSession(req.params.id);
        if (!session) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        const dueEvents = session.eventQueue.filter(
            (e) => e.status === 'pending' && !session.appliedEvents.includes(e.eventId),
        );

        return { events: dueEvents };
    });

    // Career Mirror — end-of-game reflection
    app.get<{ Params: { id: string } }>('/session/:id/mirror', async (req, reply) => {
        const session = memStore.loadSession(req.params.id);
        if (!session) {
            return reply.code(404).send({ error: 'Session not found' });
        }

        const mirror = generateMirror(session);
        return { mirror };
    });
}
