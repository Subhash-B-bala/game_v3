/* ============================================================
   CareerSim — Shared Types & Enums
   Single source of truth for client + server
   ============================================================ */

// ---- Enums ----

export type RoleChoice = 'analyst' | 'data_engineer' | 'data_scientist' | 'ai_ml';

export type ExperienceLevel = 'student_fresher' | 'early_1_3' | 'mid_3_7';

export type MindsetBias = 'ambitious' | 'cautious' | 'idealistic' | 'pragmatic';

export type EmotionalState = 'calm' | 'anxious' | 'confident' | 'deflated' | 'numb';

export type EventType = 'interruption' | 'opportunity' | 'consequence' | 'expiry';

export type EventStatus = 'pending' | 'fired' | 'expired' | 'cancelled';

export type AnalyticsEventType =
    | 'decision_made'
    | 'scenario_entered'
    | 'chapter_transition'
    | 'session_started'
    | 'session_resumed';

// ---- State Vector ----

export interface StateVector {
    // Core Metrics
    confidence: number;       // 0.0 – 1.0 (or 0-100 client side, usually 0-1 normalized for server)
    reputation: number;
    health: number;           // Physical/Mental wellness
    worklife: number;         // Balance score
    family: number;           // Personal support score

    // Financials
    savings: number;
    salary: number;
    loan: number;

    // Technical Skills
    sql: number;
    python: number;
    excel: number;
    powerbi: number;
    cloud: number;
    ml: number;
    statistics: number;
    engineering: number;

    // Professional Skills
    communication: number;
    stakeholder: number;
    presentation: number;
    leadership: number;
    negotiation: number;
    problem: number;

    // Behavioral / Psychological
    energy: number;
    riskTolerance: number;
    ethics: number;
    networkStrength: number;

    emotionalState: EmotionalState;
}

export const DEFAULT_STATE_VECTOR: StateVector = {
    confidence: 0.5,
    reputation: 0.3,
    health: 0.8,
    worklife: 0.7,
    family: 0.8,
    savings: 0,
    salary: 0,
    loan: 0,
    sql: 0,
    python: 0,
    excel: 0,
    powerbi: 0,
    cloud: 0,
    ml: 0,
    statistics: 0,
    engineering: 0,
    communication: 0.2,
    stakeholder: 0.1,
    presentation: 0.1,
    leadership: 0,
    negotiation: 0,
    problem: 0.2,
    energy: 1.0,
    riskTolerance: 0.5,
    ethics: 0.7,
    networkStrength: 0.2,
    emotionalState: 'calm',
};

// ---- Player Session ----

export interface ActionRecord {
    scene: string;
    action: string;
    timestamp: string; // ISO 8601
}

export interface GameEvent {
    eventId: string;
    eventType: EventType;
    triggerAt: number;         // in-game tick
    status: EventStatus;
    payload: Record<string, unknown>;
}

export interface PlayerSession {
    sessionId: string;
    playerId: string | null;
    createdAt: string;
    updatedAt: string;
    currentChapter: number;    // 0–7
    currentScene: string;
    sceneCompleted: boolean;
    runNumber: number;
    roleChoice: RoleChoice | null;
    experienceLevel: ExperienceLevel | null;
    mindsetBias: MindsetBias | null;
    stateVector: StateVector;
    actionHistory: ActionRecord[];
    eventQueue: GameEvent[];
    appliedEvents: string[];   // event IDs already fired (no double consequences)
    careerMirror: Record<string, unknown> | null;

}

// ---- Scenario Definitions ----

export interface Condition {
    variable: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'in_range';
    threshold: number | [number, number];
}

export interface ScenarioAction {
    actionId: string;
    label: string;
    description?: string;
    visibleIf?: Condition[];
    locksOut?: string[];
}

export interface StateDelta {
    variable: keyof Omit<StateVector, 'emotionalState'>;
    delta: number;
}

export interface EmotionalShift {
    to: EmotionalState;
    ifCurrentIn?: EmotionalState[];
}

export interface EventDef {
    eventType: EventType;
    delayTicks: number;
    payload: Record<string, unknown>;
}

export interface ConsequenceRule {
    actionId: string;
    stateDeltas: StateDelta[];
    emotionalShift?: EmotionalShift;
    spawnedEvents?: EventDef[];
    immediateFeedback: string; // feedback variant key
}

export interface FeedbackVariant {
    key: string;
    emotionalState: EmotionalState | '*'; // '*' = default fallback
    narrativeText: string;
    audioCue?: string;
}

export interface ScenarioTemplate {
    scenarioId: string;
    contentVersion: string;
    chapter: number;
    title: string;
    description?: string;
    avatar?: string;         // Asset key for character avatar
    mood?: string;           // Asset key for character mood
    scenarioType?: 'text' | 'meeting' | 'mail' | 'taskboard';
    entryConditions?: Condition[];
    actions: ScenarioAction[];
    consequenceRules: ConsequenceRule[];
    feedbackVariants: FeedbackVariant[];
    timeConstraint?: number;  // ticks before expiry, null = no timer
}

export interface RoleOverlay {
    scenarioId: string;
    contentVersion: string;
    role: RoleChoice;
    overrides: {
        actions?: ScenarioAction[];
        consequenceRules?: ConsequenceRule[];
        narrativeSwaps?: Record<string, string>;
    };
}

// ---- Analytics ----

export interface AnalyticsEvent {
    eventId?: string;
    sessionId: string;
    eventType: AnalyticsEventType;
    payload: Record<string, unknown>;
    clientTs: string;   // ISO 8601
    serverTs?: string;
}

// ---- API Request/Response ----

export interface CreateSessionRequest {
    playerId?: string;
}

export interface CreateSessionResponse {
    session: PlayerSession;
}

export interface SubmitActionRequest {
    scenarioId: string;
    actionId: string;
}

export interface SubmitActionResponse {
    session: PlayerSession;
    narrative: string;
    audioCue?: string;
}

export interface PollEventsResponse {
    events: GameEvent[];
}
