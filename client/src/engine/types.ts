export type RoleType = "analyst" | "engineer" | "ai_engineer" | null;
export type AvatarType = 'fresher' | 'analyst' | 'engineer' | 'manager' | 'mentor' | 'scammer' | 'stressed' | 'success' | 'recruiter' | 'family' | 'intl' | 'founder' | 'peer' | 'codebasics';

export interface SkillStats {
    // Technical
    sql: number;
    python: number;
    excel: number;
    powerbi: number;
    cloud: number;
    ml: number;

    // Soft/Professional
    communication: number;
    leadership: number;
    problem_solving: number;
    stakeholder_mgmt: number;
}

export interface GameStats extends SkillStats {
    savings: number;
    salary: number; // 0 if unemployed
    energy: number; // 0.0 to 1.0
    stress: number; // 0.0 to 1.0
    network: number; // 0 to 100
    confidence: number; // 0 to 100

    // Behavioral Attributes (New)
    grit: number;
    aggression: number;
    stability: number;
    learningSpeed: number;
    startupBias: number;
    burnoutRisk: number;
    interviewPerformance: number;

    // Hidden Factors
    reputation: number;
    ethics: number;
}

export interface Choice {
    id: string;
    text: string;
    description?: string;

    // Effects
    fx?: Partial<GameStats>; // Direct stat changes
    skillBonus?: keyof SkillStats; // +10 to +20 random boost
    flag?: string; // Set a specific game flag
    setRole?: RoleType; // Change role (e.g. getting hired/fired)
    huntStage?: number;
    huntProgress?: number;

    // Cost
    timeCost: number; // in months (e.g. 0.5, 1, 3)
    energyCost?: number;

    // Conditions
    reqSkill?: keyof SkillStats;
    reqLevel?: number;
}

export interface Scenario {
    id: string;
    type?: "text" | "meeting" | "taskboard";
    phase: "setup" | "hunt" | "game" | "roadmap" | "end";

    title: string;
    text: string;

    sender: {
        name: string;
        role: string;
        avatar: AvatarType;
    };

    choices: Choice[];

    // Dynamic Engine Metadata
    difficulty?: "beginner" | "intermediate" | "advanced";
    tags?: string[];
    roleLock?: RoleType[];
    minReq?: Partial<GameStats>;
    gates?: {
        stageMin?: number;
        stageMax?: number;
    };
    cooldown?: number;
}

export interface GameState {
    characterName: string;
    characterAvatar: AvatarType;
    role: RoleType;
    months: number;

    // Hunt Pipeline (New)
    huntStage: number; // 0-5
    huntProgress: number; // 0-100 within a stage

    stats: GameStats;
    flags: Record<string, boolean>;

    history: string[];
    currentScenarioId: string | null;

    notifications: string[];
    slasherChances: number;
    slasherLastRefill: number | null;
}
