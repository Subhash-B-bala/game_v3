import { query } from '../db/pool.js';
import {
    PlayerSession,
    StateVector,
    DEFAULT_STATE_VECTOR,
    SubmitActionRequest,
    ActionRecord,
} from '../../../shared/types.js';

interface ResolveResult {
    narrative: string;
    audioCue?: string;
    stateDeltas: { variable: string; delta: number }[];
    emotionalShift?: { to: string };
    spawnedEvents?: { eventId: string; eventType: string; delayTicks: number; payload: Record<string, unknown> }[];
    immediateFeedbackKey: string;
}

/* ============================================================
   Save session to DB
   ============================================================ */
export async function saveSession(session: PlayerSession): Promise<void> {
    await query(
        `INSERT INTO player_sessions (
       session_id, player_id, created_at, updated_at,
       current_chapter, current_scene, scene_completed,
       run_number, role_choice, experience_level, mindset_bias,
       state_vector, action_history, event_queue, applied_events, career_mirror
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (session_id) DO UPDATE SET
       updated_at = $4,
       current_chapter = $5,
       current_scene = $6,
       scene_completed = $7,
       run_number = $8,
       role_choice = $9,
       experience_level = $10,
       mindset_bias = $11,
       state_vector = $12,
       action_history = $13,
       event_queue = $14,
       applied_events = $15,
       career_mirror = $16`,
        [
            session.sessionId,
            session.playerId,
            session.createdAt,
            new Date().toISOString(),
            session.currentChapter,
            session.currentScene,
            session.sceneCompleted,
            session.runNumber,
            session.roleChoice,
            session.experienceLevel,
            session.mindsetBias,
            JSON.stringify(session.stateVector),
            JSON.stringify(session.actionHistory),
            JSON.stringify(session.eventQueue),
            JSON.stringify(session.appliedEvents),
            session.careerMirror ? JSON.stringify(session.careerMirror) : null,
        ],
    );
}

/* ============================================================
   Load session from DB
   ============================================================ */
export async function loadSession(sessionId: string): Promise<PlayerSession | null> {
    const { rows } = await query(
        'SELECT * FROM player_sessions WHERE session_id = $1',
        [sessionId],
    );
    if (rows.length === 0) return null;

    const row = rows[0];
    return {
        sessionId: row.session_id,
        playerId: row.player_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        currentChapter: row.current_chapter,
        currentScene: row.current_scene,
        sceneCompleted: row.scene_completed,
        runNumber: row.run_number,
        roleChoice: row.role_choice,
        experienceLevel: row.experience_level,
        mindsetBias: row.mindset_bias,
        stateVector: row.state_vector,
        actionHistory: row.action_history,
        eventQueue: row.event_queue,
        appliedEvents: row.applied_events,
        careerMirror: row.career_mirror,
    };
}

/* ============================================================
   Apply state delta from resolved scenario
   ============================================================ */
export function applyStateDelta(
    session: PlayerSession,
    result: ResolveResult,
    action: SubmitActionRequest,
): PlayerSession {
    const sv = { ...session.stateVector };

    // Apply numeric deltas with clamping [0, 1]
    for (const d of result.stateDeltas) {
        const key = d.variable as keyof Omit<StateVector, 'emotionalState'>;
        if (key in sv && key !== 'emotionalState') {
            sv[key] = Math.max(0, Math.min(1, (sv[key] as number) + d.delta));
        }
    }

    // Apply emotional shift if present
    if (result.emotionalShift) {
        sv.emotionalState = result.emotionalShift.to as StateVector['emotionalState'];
    }

    // Record action
    const actionRecord: ActionRecord = {
        scene: session.currentScene,
        action: action.actionId,
        timestamp: new Date().toISOString(),
    };

    // Add spawned events to queue
    const newEvents = (result.spawnedEvents || []).map((e) => ({
        ...e,
        status: 'pending' as const,
    }));

    return {
        ...session,
        updatedAt: new Date().toISOString(),
        stateVector: sv,
        actionHistory: [...session.actionHistory, actionRecord],
        eventQueue: [...session.eventQueue, ...newEvents],
        sceneCompleted: true, // action completes the scene
    };
}

/* ============================================================
   Mid-scene resume: reset timers, preserve state
   ============================================================ */
export function handleMidSceneResume(session: PlayerSession): PlayerSession {
    if (session.sceneCompleted) {
        // Already completed — no change needed
        return session;
    }

    // Mid-scene resume rules:
    // 1. Timers restart (clear pending timer-based events for current scene)
    // 2. No double consequences (applied_events already tracks this)
    const resetQueue = session.eventQueue.filter(
        (e) => e.status !== 'pending' || !('sceneOrigin' in e.payload && e.payload.sceneOrigin === session.currentScene),
    );

    return {
        ...session,
        eventQueue: resetQueue,
    };
}
