import {
    PlayerSession,
    StateVector,
    ActionRecord,
} from '../../../shared/types.js';

/* ============================================================
   Career Mirror — Aggregates all decisions into a reflection
   ============================================================ */

export interface MirrorResult {
    totalDecisions: number;
    chaptersCompleted: number;
    dominantTrait: string;
    traitScores: Record<string, number>;
    archetype: string;
    archetypeDescription: string;
    keyMoments: string[];
    emotionalJourney: string[];
}

// Archetypes based on dominant trait combinations
const ARCHETYPES: Array<{
    name: string;
    description: string;
    check: (sv: StateVector) => boolean;
}> = [
        {
            name: 'The Trailblazer',
            description: 'High confidence and engineering spirit. You charge forward, solving technical debt and corporate politics with equal fervor.',
            check: (sv) => (sv.confidence || 0) >= 0.7 && (sv.engineering || 0) >= 0.6,
        },
        {
            name: 'The Diplomat',
            description: 'Strong stakeholder management and communication. You build bridges and ensure alignment across the organization.',
            check: (sv) => (sv.stakeholder || 0) >= 0.6 && (sv.communication || 0) >= 0.6,
        },
        {
            name: 'The Strategist',
            description: 'High reputation and methodical problem solving. You see the board three moves ahead, optimizing for long-term growth.',
            check: (sv) => (sv.reputation || 0) >= 0.7 && (sv.problem || 0) >= 0.6,
        },
        {
            name: 'The Survivor',
            description: 'Low work-life balance, but high resilience. You\'ve weathered intensive periods of work and kept the machinery running.',
            check: (sv) => (sv.worklife || 0) <= 0.4 && (sv.health || 0) >= 0.4,
        },
        {
            name: 'The Architect',
            description: 'Deep technical focus on SQL, Python, and Cloud. You don\'t just use tools; you build the systems that define the future.',
            check: (sv) => (sv.sql || 0) >= 0.7 && (sv.cloud || 0) >= 0.6,
        },
        {
            name: 'The Climber',
            description: 'Reputation above all. You optimized for leadership and visibility. Whether that\'s ambition or politics depends on who\'s watching.',
            check: (sv) => (sv.reputation || 0) >= 0.8 && (sv.leadership || 0) >= 0.5,
        },
        {
            name: 'The Specialist',
            description: 'Hyper-focused on ML and Statistics. You are the deep-thinker of the team, solving the problems nobody else can touch.',
            check: (sv) => (sv.ml || 0) >= 0.7 && (sv.statistics || 0) >= 0.7,
        },
        {
            name: 'The Burnout',
            description: 'Work-life balance and health have reached critical lows. This path isn\'t sustainable, and deep down, you know it.',
            check: (sv) => (sv.worklife || 0) <= 0.2 || (sv.health || 0) <= 0.2,
        },
    ];

const DEFAULT_ARCHETYPE = {
    name: 'The Journeyer',
    description: 'No single trait dominates. You\'ve walked a balanced path — a little of everything, master of the middle ground. That\'s not indecision. That\'s adaptability.',
};

function identifyKeyMoments(history: ActionRecord[]): string[] {
    const moments: string[] = [];
    const actionLabels: Record<string, string> = {
        resume_honest: 'Chose honesty on your resume',
        resume_fluff: 'Padded your resume',
        apply_mass: 'Mass-applied to jobs',
        apply_referral: 'Leveraged your network for referrals',
        offer_negotiate: 'Negotiated your offer',
        offer_reject: 'Walked away from an offer',
        ethics_speak_up: 'Spoke up about an ethical concern',
        ethics_quiet: 'Stayed quiet on an ethical issue',
        cross_leave: 'Decided to leave for something new',
        cross_entrepreneurship: 'Chose to go independent',
        cross_stay: 'Chose stability over change',
        routine_check_out: 'Quietly disengaged from work',
        growth_side_project: 'Built something on the side',
    };

    for (const record of history) {
        if (actionLabels[record.action]) {
            moments.push(actionLabels[record.action]);
        }
    }

    return moments.slice(-6); // Last 6 key moments
}

function traceEmotionalJourney(history: ActionRecord[]): string[] {
    // Map scenes to emotional landmarks
    const sceneEmotions: Record<string, string> = {
        entry: '🟢 Fresh start',
        role_selection: '🔵 Direction chosen',
        ch2_resume: '📝 First compromise?',
        ch2_interview: '🎯 Moment of truth',
        ch2_offer: '💰 First real stakes',
        ch3_day_one: '🏢 Reality check',
        ch3_team: '👥 People politics',
        ch3_checkin: '📊 Under the microscope',
        ch4_routine: '⏰ The grind',
        ch4_ethics: '⚖️ Defining moment',
        ch4_crossroads: '🔀 Crossroads',
        ch4_mirror: '🪞 Reflection',
    };

    return history
        .filter((h) => sceneEmotions[h.scene])
        .map((h) => sceneEmotions[h.scene]!);
}

export function generateMirror(session: PlayerSession): MirrorResult {
    const sv = session.stateVector;

    const traitScores: Record<string, number> = {
        Confidence: Math.round((sv.confidence || 0) * 100),
        Reputation: Math.round((sv.reputation || 0) * 100),
        'Work-Life': Math.round((sv.worklife || 0) * 100),
        Technical: Math.round(((sv.sql || 0) + (sv.python || 0) + (sv.ml || 0)) / 3 * 100),
        SoftSkills: Math.round(((sv.communication || 0) + (sv.stakeholder || 0) + (sv.leadership || 0)) / 3 * 100),
        Financials: Math.round((sv.savings > 0 ? 1 : 0) * 100), // Simple proxy for now
    };

    // Find dominant trait
    const sorted = Object.entries(traitScores).sort((a, b) => b[1] - a[1]);
    const dominantTrait = sorted[0][0];

    // Determine archetype
    const matchedArchetype = ARCHETYPES.find((a) => a.check(sv)) || DEFAULT_ARCHETYPE;

    return {
        totalDecisions: session.actionHistory.length,
        chaptersCompleted: session.currentChapter,
        dominantTrait,
        traitScores,
        archetype: matchedArchetype.name,
        archetypeDescription: matchedArchetype.description,
        keyMoments: identifyKeyMoments(session.actionHistory),
        emotionalJourney: traceEmotionalJourney(session.actionHistory),
    };
}
