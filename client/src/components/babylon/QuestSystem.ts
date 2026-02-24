/**
 * QuestSystem — Manages quests from NPC quest givers
 *
 * Quest types:
 * - "go_to" — Navigate to a location
 * - "defeat_enemies" — Defeat N scam recruiters
 * - "complete_minigame" — Complete a mini-game at a station
 * - "talk_to" — Talk to a specific NPC
 *
 * Quests are tied to districts and unlock with progression.
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type QuestObjectiveType = 'go_to' | 'defeat_enemies' | 'complete_minigame' | 'talk_to';

export interface QuestObjective {
    type: QuestObjectiveType;
    description: string;
    targetId?: string;       // for go_to, talk_to, complete_minigame
    targetX?: number;        // for go_to
    targetZ?: number;
    targetCount?: number;    // for defeat_enemies
    currentCount?: number;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    giverNpcId: string;
    giverName: string;
    district: number;
    objectives: QuestObjective[];
    reward: {
        coins: number;
        xp: number;
        unlockDistrict?: number;
    };
    status: 'available' | 'active' | 'completed';
    isMain: boolean;  // Main story quest vs side quest
}

export interface QuestSystemHandle {
    getActiveQuests: () => Quest[];
    getAvailableQuests: () => Quest[];
    getCompletedQuests: () => Quest[];
    acceptQuest: (questId: string) => void;
    checkObjectiveProgress: (type: QuestObjectiveType, targetId?: string) => void;
    getActiveQuestTracker: () => { quest: Quest; objectiveText: string } | null;
    getAllQuests: () => Quest[];
}

// ═══════════════════════════════════════════════════════════════
// Quest Database
// ═══════════════════════════════════════════════════════════════

const QUEST_DATABASE: Omit<Quest, 'status'>[] = [
    // ── DOWNTOWN (District 0) ──
    {
        id: 'q_downtown_01',
        title: 'First Steps',
        description: 'Tony wants you to check the Job Board to understand the job market.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 0,
        objectives: [
            { type: 'complete_minigame', description: 'Use the Job Board', targetId: 'jobboard_downtown' },
        ],
        reward: { coins: 100, xp: 50 },
        isMain: true,
    },
    {
        id: 'q_downtown_02',
        title: 'Resume Polish',
        description: 'Fix your resume at the Resume Printer before applying anywhere.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 0,
        objectives: [
            { type: 'complete_minigame', description: 'Use the Resume Printer', targetId: 'resume_downtown' },
        ],
        reward: { coins: 150, xp: 75 },
        isMain: true,
    },
    {
        id: 'q_downtown_03',
        title: 'Street Smarts',
        description: 'Defeat 2 scam recruiters roaming Downtown to prove you can spot fraud.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 0,
        objectives: [
            { type: 'defeat_enemies', description: 'Defeat scam recruiters', targetCount: 2, currentCount: 0 },
        ],
        reward: { coins: 200, xp: 100, unlockDistrict: 1 },
        isMain: true,
    },

    // ── TECH PARK (District 1) ──
    {
        id: 'q_tech_01',
        title: 'Code Challenge',
        description: 'Prove your coding skills at the Coding Terminal in Tech Park.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 1,
        objectives: [
            { type: 'complete_minigame', description: 'Complete the Coding Terminal challenge', targetId: 'terminal_techpark' },
        ],
        reward: { coins: 200, xp: 100 },
        isMain: true,
    },
    {
        id: 'q_tech_02',
        title: 'Tech Interview Prep',
        description: 'Study at the Tech Library and complete the Design Board challenge.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 1,
        objectives: [
            { type: 'complete_minigame', description: 'Complete the Design Board quiz', targetId: 'whiteboard_techpark' },
        ],
        reward: { coins: 250, xp: 125 },
        isMain: true,
    },
    {
        id: 'q_tech_03',
        title: 'Scam Hunter: Tech Edition',
        description: 'Tech Park has sophisticated scammers. Defeat 3 of them.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 1,
        objectives: [
            { type: 'defeat_enemies', description: 'Defeat tech scam recruiters', targetCount: 3, currentCount: 0 },
        ],
        reward: { coins: 300, xp: 150, unlockDistrict: 2 },
        isMain: true,
    },

    // ── BUSINESS DISTRICT (District 2) ──
    {
        id: 'q_business_01',
        title: 'Mock Interview',
        description: 'Practice your interview skills on the Interview Screen.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 2,
        objectives: [
            { type: 'complete_minigame', description: 'Complete the Mock Interview', targetId: 'screen_business' },
        ],
        reward: { coins: 300, xp: 150 },
        isMain: true,
    },
    {
        id: 'q_business_02',
        title: 'Corporate Scam Busting',
        description: 'The Business District has the most polished scammers. Stop 3.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 2,
        objectives: [
            { type: 'defeat_enemies', description: 'Defeat corporate scam recruiters', targetCount: 3, currentCount: 0 },
        ],
        reward: { coins: 400, xp: 200, unlockDistrict: 3 },
        isMain: true,
    },

    // ── GOVERNMENT QUARTER (District 3) ──
    {
        id: 'q_gov_01',
        title: 'Evidence Gathering',
        description: 'Analyze scam patterns at the Evidence Board.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 3,
        objectives: [
            { type: 'complete_minigame', description: 'Complete the Evidence Board', targetId: 'evidence_gov' },
        ],
        reward: { coins: 350, xp: 175 },
        isMain: true,
    },
    {
        id: 'q_gov_02',
        title: 'Final Scam Sweep',
        description: 'Clear the remaining scam recruiters to unlock Executive Heights.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 3,
        objectives: [
            { type: 'defeat_enemies', description: 'Defeat government quarter scammers', targetCount: 4, currentCount: 0 },
        ],
        reward: { coins: 500, xp: 250, unlockDistrict: 4 },
        isMain: true,
    },

    // ── EXECUTIVE HEIGHTS (District 4) ──
    {
        id: 'q_exec_01',
        title: 'The Final Offer',
        description: 'Review the contract at Executive Heights. This is your moment.',
        giverNpcId: 'tony',
        giverName: 'Tony Sharma',
        district: 4,
        objectives: [
            { type: 'go_to', description: 'Go to The Contract', targetX: 55, targetZ: 58 },
        ],
        reward: { coins: 1000, xp: 500 },
        isMain: true,
    },
];

// ═══════════════════════════════════════════════════════════════
// System Factory
// ═══════════════════════════════════════════════════════════════

export function createQuestSystem(
    activeDistrict: number,
    completedQuestIds: string[],
    onQuestComplete: (quest: Quest) => void
): QuestSystemHandle {
    // Initialize quests
    const quests: Quest[] = QUEST_DATABASE.map(q => ({
        ...q,
        status: completedQuestIds.includes(q.id)
            ? 'completed' as const
            : q.district <= activeDistrict ? 'available' as const : 'available' as const,
        objectives: q.objectives.map(o => ({ ...o })),
    }));

    // Mark completed ones
    for (const q of quests) {
        if (completedQuestIds.includes(q.id)) {
            q.status = 'completed';
        }
    }

    // Auto-accept first available main quest
    const firstAvailable = quests.find(q => q.status === 'available' && q.isMain && q.district <= activeDistrict);
    if (firstAvailable) {
        firstAvailable.status = 'active';
    }

    function acceptQuest(questId: string) {
        const quest = quests.find(q => q.id === questId);
        if (quest && quest.status === 'available') {
            quest.status = 'active';
        }
    }

    function checkObjectiveProgress(type: QuestObjectiveType, targetId?: string) {
        for (const quest of quests) {
            if (quest.status !== 'active') continue;

            let allComplete = true;
            for (const obj of quest.objectives) {
                if (obj.type === type) {
                    if (type === 'defeat_enemies') {
                        obj.currentCount = (obj.currentCount || 0) + 1;
                        if ((obj.currentCount || 0) < (obj.targetCount || 1)) {
                            allComplete = false;
                        }
                    } else if (type === 'complete_minigame' && obj.targetId === targetId) {
                        // Mark as done (count 1/1)
                        obj.currentCount = 1;
                        obj.targetCount = 1;
                    } else if (type === 'talk_to' && obj.targetId === targetId) {
                        obj.currentCount = 1;
                        obj.targetCount = 1;
                    } else if (type === 'go_to') {
                        // Checked externally with position
                        obj.currentCount = 1;
                        obj.targetCount = 1;
                    } else {
                        if ((obj.currentCount || 0) < (obj.targetCount || 1)) {
                            allComplete = false;
                        }
                    }
                } else {
                    if ((obj.currentCount || 0) < (obj.targetCount || 1)) {
                        allComplete = false;
                    }
                }
            }

            if (allComplete) {
                quest.status = 'completed';
                onQuestComplete(quest);

                // Auto-activate next quest
                const nextQuest = quests.find(q =>
                    q.status === 'available' && q.isMain && q.district <= activeDistrict
                );
                if (nextQuest) {
                    nextQuest.status = 'active';
                }
            }
        }
    }

    function getActiveQuestTracker() {
        const active = quests.find(q => q.status === 'active');
        if (!active) return null;

        const obj = active.objectives[0];
        let objectiveText = obj.description;
        if (obj.targetCount && obj.targetCount > 1) {
            objectiveText += ` (${obj.currentCount || 0}/${obj.targetCount})`;
        }

        return { quest: active, objectiveText };
    }

    return {
        getActiveQuests: () => quests.filter(q => q.status === 'active'),
        getAvailableQuests: () => quests.filter(q => q.status === 'available'),
        getCompletedQuests: () => quests.filter(q => q.status === 'completed'),
        acceptQuest,
        checkObjectiveProgress,
        getActiveQuestTracker,
        getAllQuests: () => [...quests],
    };
}
