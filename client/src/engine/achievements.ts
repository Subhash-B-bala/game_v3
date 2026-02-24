import { AchievementDefinition, GameState, Achievement } from './types';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
    // Pipeline Achievements
    {
        id: 'first_contact',
        name: 'First Contact',
        description: 'Reach Stage 1: GATED',
        icon: '🚪',
        tier: 'bronze',
        category: 'pipeline',
        checkUnlock: (state) => state.huntStage >= 1
    },
    {
        id: 'speed_runner',
        name: 'Speed Runner',
        description: 'Get hired in under 4 months',
        icon: '⚡',
        tier: 'gold',
        category: 'pipeline',
        checkUnlock: (state) => (state.flags.has_job === true || state.flags.has_job_startup === true) && state.months < 4
    },
    {
        id: 'methodical_climber',
        name: 'Methodical Climber',
        description: 'Reach Stage 4 sequentially',
        icon: '🧗',
        tier: 'silver',
        category: 'pipeline',
        checkUnlock: (state) => state.huntStage === 4 && state.flags.stage_skipped !== true
    },
    {
        id: 'pipeline_master',
        name: 'Pipeline Master',
        description: 'Reach Stage 4 in under 6 months',
        icon: '🎯',
        tier: 'gold',
        category: 'pipeline',
        checkUnlock: (state) => state.huntStage >= 4 && state.months < 6
    },

    // Skill Mastery
    {
        id: 'sql_wizard',
        name: 'SQL Wizard',
        description: 'Reach SQL skill level 80+',
        icon: '🔮',
        tier: 'gold',
        category: 'skill',
        checkUnlock: (state) => state.stats.sql >= 80
    },
    {
        id: 'python_master',
        name: 'Python Master',
        description: 'Reach Python skill level 80+',
        icon: '🐍',
        tier: 'gold',
        category: 'skill',
        checkUnlock: (state) => state.stats.python >= 80
    },
    {
        id: 'full_stack',
        name: 'Full Stack',
        description: 'All technical skills above 40',
        icon: '📚',
        tier: 'silver',
        category: 'skill',
        checkUnlock: (state) => {
            const techSkills = ['sql', 'python', 'excel', 'powerbi', 'cloud', 'ml'];
            return techSkills.every(skill => (state.stats[skill as keyof typeof state.stats] || 0) >= 40);
        }
    },
    {
        id: 'communication_master',
        name: 'Communication Master',
        description: 'Communication + Stakeholder mgmt > 140',
        icon: '🗣️',
        tier: 'silver',
        category: 'skill',
        checkUnlock: (state) => (state.stats.communication + state.stats.stakeholder_mgmt) >= 140
    },

    // Behavioral
    {
        id: 'zen_master',
        name: 'Zen Master',
        description: 'Complete 10 scenarios with stress < 30%',
        icon: '🧘',
        tier: 'silver',
        category: 'behavioral',
        checkUnlock: (state) => (state.flags.low_stress_count as number || 0) >= 10
    },
    {
        id: 'grinder',
        name: 'The Grinder',
        description: 'Complete 30+ scenarios',
        icon: '💪',
        tier: 'bronze',
        category: 'behavioral',
        checkUnlock: (state) => state.history.length >= 30
    },
    {
        id: 'momentum_master',
        name: 'Momentum Master',
        description: 'Trigger momentum bonus 5 times',
        icon: '🔥',
        tier: 'silver',
        category: 'behavioral',
        checkUnlock: (state) => (state.flags.momentum_triggers as number || 0) >= 5
    },
    {
        id: 'energy_efficient',
        name: 'Energy Efficient',
        description: 'Complete 5 scenarios with >70% energy',
        icon: '⚡',
        tier: 'bronze',
        category: 'behavioral',
        checkUnlock: (state) => (state.flags.high_energy_count as number || 0) >= 5
    },
    {
        id: 'networker',
        name: 'Master Networker',
        description: 'Reach network level 80+',
        icon: '🤝',
        tier: 'gold',
        category: 'behavioral',
        checkUnlock: (state) => state.stats.network >= 80
    },

    // Outcome-Based
    {
        id: 'startup_warrior',
        name: 'Startup Warrior',
        description: 'Accept the startup gamble',
        icon: '🚀',
        tier: 'gold',
        category: 'outcome',
        checkUnlock: (state) => state.flags.has_job_startup === true
    },
    {
        id: 'negotiator',
        name: 'Master Negotiator',
        description: 'Increase starting salary by 30%+',
        icon: '💰',
        tier: 'gold',
        category: 'outcome',
        checkUnlock: (state) => (state.flags.salary_boost as number || 0) >= 30
    },
    {
        id: 'portfolio_pro',
        name: 'Portfolio Pro',
        description: 'Complete portfolio before Stage 2',
        icon: '📁',
        tier: 'silver',
        category: 'outcome',
        checkUnlock: (state) => state.flags.portfolio_done === true && state.huntStage >= 2
    },
    {
        id: 'first_job',
        name: 'First Job',
        description: 'Land your first job offer',
        icon: '🎉',
        tier: 'bronze',
        category: 'outcome',
        checkUnlock: (state) => state.flags.has_job === true || state.flags.has_job_startup === true
    },

    // Secret/Challenge
    {
        id: 'phoenix_rising',
        name: 'Phoenix Rising',
        description: 'Recover from 80%+ stress',
        icon: '🔥',
        tier: 'platinum',
        category: 'secret',
        hidden: true,
        checkUnlock: (state) => state.flags.stress_recovery === true
    },
    {
        id: 'debt_warrior',
        name: 'Debt Warrior',
        description: 'Get hired while in debt',
        icon: '⚔️',
        tier: 'platinum',
        category: 'secret',
        hidden: true,
        checkUnlock: (state) => (state.flags.has_job === true || state.flags.has_job_startup === true) && state.stats.savings < 0
    },
    {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Get hired after 5+ rejections',
        icon: '💪',
        tier: 'platinum',
        category: 'secret',
        hidden: true,
        checkUnlock: (state) => (state.flags.has_job === true || state.flags.has_job_startup === true) && (state.flags.rejection_count as number || 0) >= 5
    },
    {
        id: 'unstoppable',
        name: 'Unstoppable',
        description: 'Complete 50+ scenarios',
        icon: '🏆',
        tier: 'platinum',
        category: 'secret',
        hidden: true,
        checkUnlock: (state) => state.history.length >= 50
    }
];

export function checkAchievements(state: GameState): {
    newAchievements: Achievement[],
    updatedState: GameState
} {
    const newAchievements: Achievement[] = [];
    const updatedAchievements = { ...state.achievements };
    let count = state.achievementCount || 0;

    for (const def of ACHIEVEMENT_DEFINITIONS) {
        // Skip if already unlocked
        if (updatedAchievements[def.id]?.unlocked) continue;

        // Check if should unlock
        if (def.checkUnlock(state)) {
            const achievement: Achievement = {
                id: def.id,
                name: def.name,
                description: def.description,
                icon: def.icon,
                tier: def.tier,
                category: def.category,
                unlocked: true,
                unlockedAt: state.months,
                hidden: def.hidden
            };

            updatedAchievements[def.id] = achievement;
            newAchievements.push(achievement);
            count++;
        }
    }

    return {
        newAchievements,
        updatedState: {
            ...state,
            achievements: updatedAchievements,
            achievementCount: count
        }
    };
}
