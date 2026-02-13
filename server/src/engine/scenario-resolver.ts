import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
    PlayerSession,
    ScenarioTemplate,
    RoleOverlay,
    FeedbackVariant,
    ConsequenceRule,
    ScenarioAction,
    Condition,
    StateVector,
} from '../../../shared/types.js';

/* ============================================================
   Scenario Cache — loaded once at boot
   ============================================================ */
const scenarioCache = new Map<string, ScenarioTemplate>();
const overlayCache = new Map<string, RoleOverlay[]>(); // key = scenarioId

let loaded = false;

export function loadScenarios(dir?: string): void {
    const scenariosDir = dir || path.resolve(process.cwd(), 'content', 'scenarios');
    if (!fs.existsSync(scenariosDir)) {
        console.warn(`Scenarios directory not found: ${scenariosDir}`);
        return;
    }

    const files = fs.readdirSync(scenariosDir).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));

    for (const file of files) {
        const raw = fs.readFileSync(path.join(scenariosDir, file), 'utf-8');
        const docs = yaml.loadAll(raw) as any[];

        for (const doc of docs) {
            if (!doc) continue;

            const items = Array.isArray(doc) ? doc : [doc];

            for (const item of items) {
                if ('overrides' in item) {
                    // It's a role overlay
                    const overlay = item as unknown as RoleOverlay;
                    const existing = overlayCache.get(overlay.scenarioId) || [];
                    existing.push(overlay);
                    overlayCache.set(overlay.scenarioId, existing);
                } else if ('scenarioId' in item) {
                    // It's a template
                    const tmpl = item as unknown as ScenarioTemplate;
                    scenarioCache.set(tmpl.scenarioId, tmpl);
                }
            }
        }
    }

    loaded = true;
    console.log(`Loaded ${scenarioCache.size} scenarios, ${overlayCache.size} overlay sets`);
}

/* ============================================================
   Get merged scenario (template + role overlay)
   ============================================================ */
export function getMergedScenario(
    scenarioId: string,
    role: string | null,
): ScenarioTemplate | null {
    if (!loaded) loadScenarios();

    const template = scenarioCache.get(scenarioId);
    if (!template) return null;

    if (!role) return template;

    const overlays = overlayCache.get(scenarioId) || [];
    const overlay = overlays.find((o) => o.role === role);
    if (!overlay) return template;

    // Merge: overlay fields FULLY REPLACE template fields when present
    return {
        ...template,
        actions: overlay.overrides.actions || template.actions,
        consequenceRules: overlay.overrides.consequenceRules || template.consequenceRules,
        feedbackVariants: overlay.overrides.narrativeSwaps
            ? template.feedbackVariants.map((fv) => ({
                ...fv,
                narrativeText: overlay.overrides.narrativeSwaps![fv.key] || fv.narrativeText,
            }))
            : template.feedbackVariants,
    };
}

/* ============================================================
   Evaluate entry conditions
   ============================================================ */
function evaluateCondition(cond: Condition, sv: StateVector): boolean {
    const val = sv[cond.variable as keyof StateVector];
    if (val === undefined) return false;

    const numVal = typeof val === 'number' ? val : 0;

    switch (cond.operator) {
        case 'gt':
            return numVal > (cond.threshold as number);
        case 'lt':
            return numVal < (cond.threshold as number);
        case 'eq':
            return val === cond.threshold;
        case 'gte':
            return numVal >= (cond.threshold as number);
        case 'lte':
            return numVal <= (cond.threshold as number);
        case 'in_range': {
            const [lo, hi] = cond.threshold as [number, number];
            return numVal >= lo && numVal <= hi;
        }
        default:
            return false;
    }
}

/* ============================================================
   Select feedback variant by emotional state
   ============================================================ */
function selectFeedback(
    variants: FeedbackVariant[],
    feedbackKey: string,
    emotionalState: string,
): FeedbackVariant | null {
    // Find exact match
    const exact = variants.find((v) => v.key === feedbackKey && v.emotionalState === emotionalState);
    if (exact) return exact;

    // Fallback to wildcard
    const wildcard = variants.find((v) => v.key === feedbackKey && v.emotionalState === '*');
    if (wildcard) return wildcard;

    // Fallback to any matching key
    return variants.find((v) => v.key === feedbackKey) || null;
}

/* ============================================================
   Resolve Scenario — core function
   ============================================================ */
export interface ResolveResult {
    narrative: string;
    audioCue?: string;
    stateDeltas: { variable: string; delta: number }[];
    emotionalShift?: { to: string };
    spawnedEvents?: { eventId: string; eventType: string; delayTicks: number; payload: Record<string, unknown> }[];
    immediateFeedbackKey: string;
}

export function resolveScenario(
    session: PlayerSession,
    scenarioId: string,
    actionId: string,
): ResolveResult | null {
    const scenario = getMergedScenario(scenarioId, session.roleChoice);
    if (!scenario) {
        console.warn(`[resolveScenario] Scenario not found: ${scenarioId}`);
        return null;
    }

    // Check entry conditions
    if (scenario.entryConditions) {
        const allMet = scenario.entryConditions.every((c) => evaluateCondition(c, session.stateVector));
        if (!allMet) {
            console.warn(`[resolveScenario] Entry conditions not met for scenario: ${scenarioId}`);
            return null;
        }
    }

    // Find action
    const action = scenario.actions.find((a) => a.actionId === actionId);
    if (!action) {
        console.warn(`[resolveScenario] Action not found: ${actionId} in scenario: ${scenarioId}`);
        return null;
    }

    // Check action visibility
    if (action.visibleIf) {
        const visible = action.visibleIf.every((c) => evaluateCondition(c, session.stateVector));
        if (!visible) {
            console.warn(`[resolveScenario] Action ${actionId} not visible for session ${session.sessionId}`);
            return null;
        }
    }

    // Find consequence rule
    const rule = scenario.consequenceRules.find((r) => r.actionId === actionId);
    if (!rule) {
        console.warn(`[resolveScenario] Rule not found for actionId: ${actionId} in scenario: ${scenarioId}`);
        return null;
    }

    // Select feedback
    const feedback = selectFeedback(
        scenario.feedbackVariants,
        rule.immediateFeedback,
        session.stateVector.emotionalState,
    );

    return {
        narrative: feedback?.narrativeText || '',
        audioCue: feedback?.audioCue,
        stateDeltas: rule.stateDeltas.map((d) => ({ variable: d.variable, delta: d.delta })),
        emotionalShift: rule.emotionalShift ? { to: rule.emotionalShift.to } : undefined,
        spawnedEvents: rule.spawnedEvents?.map((e) => ({
            eventId: crypto.randomUUID(),
            eventType: e.eventType,
            delayTicks: e.delayTicks,
            payload: e.payload,
        })),
        immediateFeedbackKey: rule.immediateFeedback,
    };
}
