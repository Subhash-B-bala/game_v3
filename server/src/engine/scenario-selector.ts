/**
 * ADAPTIVE SCENARIO SELECTOR
 *
 * Weighted, role-based scenario injection
 * Filters by:
 *  - Professional track
 *  - Job hunt state (Searching vs HR round vs etc)
 *  - Player condition (desperation, scam risk, etc)
 *  - Cooldowns (no repeat within X scenario iterations)
 *
 * Returns next scenario intelligently
 */

import type { ProfessionalTrack } from './stat-seeder';
import type { SeedStats } from './stat-seeder';
import type { JobHuntState } from './job-hunt-state-machine';

export interface GameScenario {
  id: string;
  title: string;
  text: string;
  phase: JobHuntState; // Which phase this applies to
  tracks: ProfessionalTrack[]; // Which tracks can see this
  difficulty: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
  tags: string[]; // [resume, screening, technical, negotiation, scam, etc]
  weight: number; // Base weight (modified by state)
  choices: { id: string; text: string; fx: Record<string, number> }[];
}

export interface SelectorState {
  scenarioHistory: string[]; // Last 50 scenario IDs shown
  lastScenarioAt: number;
  cooldownPeriod: number; // iterations before repeat
}

/**
 * All job hunt scenarios
 * Phase 1 MVP: Start with 10-15 per track, expand later
 */
export const SCENARIO_POOL: GameScenario[] = [
  // ===== ANALYST SCENARIOS =====
  {
    id: 'analyst_sql_screening_1',
    title: 'SQL Screening Question',
    text:
      'Write a query to find customers who spent > $1000 in the last month. Table: orders(id, customer_id, amount, date)',
    phase: 'screening',
    tracks: ['analyst'],
    difficulty: 1,
    tags: ['technical', 'screening', 'sql'],
    weight: 1.0,
    choices: [
      {
        id: 'sql_correct',
        text: 'SELECT DISTINCT c.id FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.date > DATE_SUB(NOW(), INTERVAL 1 MONTH) GROUP BY c.id HAVING SUM(o.amount) > 1000',
        fx: { interview_skill: 15, confidence: 5 },
      },
      {
        id: 'sql_partial',
        text: 'SELECT * FROM orders WHERE amount > 1000 AND date > DATE_SUB(NOW(), INTERVAL 1 MONTH)',
        fx: { interview_skill: 5, stress: -5 },
      },
      {
        id: 'sql_wrong',
        text: 'SELECT * FROM customers WHERE total_spent > 1000',
        fx: { interview_skill: -10, stress: 5 },
      },
    ],
  },

  {
    id: 'analyst_dashboard_challenge',
    title: 'Dashboard Case Study',
    text:
      'Design a dashboard to track marketing campaign ROI. What metrics would you include? How would you structure the data?',
    phase: 'technical_round',
    tracks: ['analyst'],
    difficulty: 2,
    tags: ['technical', 'portfolio', 'communication'],
    weight: 0.9,
    choices: [
      {
        id: 'dashboard_thoughtful',
        text: 'I\'d track: acquisition cost, conversion rate, revenue per user, and cohort retention. Query recent data daily.',
        fx: { portfolio_strength: 20, interview_skill: 15 },
      },
      {
        id: 'dashboard_surface',
        text: 'Just show revenue and users',
        fx: { portfolio_strength: 5, stress: 10 },
      },
    ],
  },

  {
    id: 'analyst_salary_lowball',
    title: 'Lowball Salary Offer',
    text:
      'They offer $75k but similar roles in your city pay $95-110k. What do you do?',
    phase: 'offer_stage',
    tracks: ['analyst'],
    difficulty: 2,
    tags: ['negotiation', 'scam_awareness'],
    weight: 0.8,
    choices: [
      {
        id: 'salary_negotiate',
        text: 'Counter with market data: "I\'ve researched and similar roles are $95-110k. Can we discuss $95k?"',
        fx: { scam_awareness: 15, reputation: 10, stress: -5 },
      },
      {
        id: 'salary_accept_desperate',
        text: 'Accept it. (You need the job)',
        fx: { stress: 20, confidence: -10 },
      },
    ],
  },

  // ===== ENGINEER SCENARIOS =====
  {
    id: 'engineer_debug_challenge',
    title: 'Debug the Function',
    text: `This Python function is slow. Optimize it:
    
def find_duplicates(arr):
    result = []
    for i in range(len(arr)):
        for j in range(i+1, len(arr)):
            if arr[i] == arr[j]:
                result.append(arr[i])
    return result`,
    phase: 'technical_round',
    tracks: ['engineer'],
    difficulty: 1,
    tags: ['technical', 'python'],
    weight: 1.0,
    choices: [
      {
        id: 'debug_optimal',
        text: 'Use a set to track seen: O(n) instead of O(n²)',
        fx: { technical_depth: 20, interview_skill: 15 },
      },
      {
        id: 'debug_partial',
        text: 'Use a hash table',
        fx: { technical_depth: 10, interview_skill: 8 },
      },
    ],
  },

  {
    id: 'engineer_system_design',
    title: 'System Design: Cache Layer',
    text:
      'Design a caching layer for a real-time dashboard. What tech would you use? How would you handle cache invalidation?',
    phase: 'technical_round',
    tracks: ['engineer'],
    difficulty: 3,
    tags: ['technical', 'system_design'],
    weight: 0.9,
    choices: [
      {
        id: 'cache_thoughtful',
        text: 'Redis for hot data, TTL-based expiry, event-driven invalidation for critical data',
        fx: { technical_depth: 25, portfolio_strength: 20, interview_skill: 20 },
      },
      {
        id: 'cache_basic',
        text: 'Just use memcached',
        fx: { technical_depth: 8, interview_skill: 5 },
      },
    ],
  },

  // ===== AI ENGINEER SCENARIOS =====
  {
    id: 'ai_model_evaluation',
    title: 'Model Overfitting Question',
    text:
      'Your model has 98% train accuracy but 72% test accuracy. What might be happening and how would you fix it?',
    phase: 'technical_round',
    tracks: ['ai_engineer'],
    difficulty: 2,
    tags: ['technical', 'ml'],
    weight: 1.0,
    choices: [
      {
        id: 'overfit_correct',
        text: 'Classic overfitting. I\'d add regularization (L1/L2), increase training data, or simplify the model. Then use cross-validation.',
        fx: { technical_depth: 25, interview_skill: 18 },
      },
      {
        id: 'overfit_surface',
        text: 'Data quality issue?',
        fx: { technical_depth: 5, stress: 5 },
      },
    ],
  },

  {
    id: 'ai_dataset_bias',
    title: 'Dataset Bias Challenge',
    text:
      'Your classification model performs well overall but fails 40% of the time on black faces. What went wrong?',
    phase: 'technical_round',
    tracks: ['ai_engineer'],
    difficulty: 3,
    tags: ['technical', 'ethics', 'ml'],
    weight: 0.85,
    choices: [
      {
        id: 'bias_aware',
        text: 'Training data was likely homogeneous (mostly white faces). Need balanced dataset, fairness metrics, and adversarial testing.',
        fx: { technical_depth: 20, reputation: 15, interview_skill: 18 },
      },
      {
        id: 'bias_dismiss',
        text: 'Probably just randomness',
        fx: { reputation: -20, confidence: -15 },
      },
    ],
  },

  // ===== UNIVERSAL SCENARIOS =====
  {
    id: 'rejection_after_5_interviews',
    title: 'Five Rejections in a Row',
    text:
      'You\'ve had 5 interviews in the last 2 weeks and got rejected from all of them. You\'re starting to doubt yourself. What do you do?',
    phase: 'searching',
    tracks: ['analyst', 'engineer', 'ai_engineer'],
    difficulty: 2,
    tags: ['burnout_check', 'mental_health'],
    weight: 0.7,
    choices: [
      {
        id: 'rejection_resilient',
        text: 'Take a day off, reflect on feedback, adjust strategy, keep applying',
        fx: { stress: -15, confidence: 5 },
      },
      {
        id: 'rejection_spiral',
        text: 'Feel defeated. Question if this is right for me',
        fx: { stress: 25, confidence: -20 },
      },
    ],
  },

  {
    id: 'referral_from_network',
    title: 'Friend Refers You',
    text:
      'A friend from a previous role refers you to their manager for an opening. No online application needed.',
    phase: 'searching',
    tracks: ['analyst', 'engineer', 'ai_engineer'],
    difficulty: 1,
    tags: ['referral', 'network'],
    weight: 0.6,
    choices: [
      {
        id: 'referral_apply',
        text: 'Take it! Fast-track to interview',
        fx: { reputation: 15, network: 10, stress: -10 },
      },
    ],
  },

  {
    id: 'suspicious_job_posting',
    title: 'Too Good to Be True?',
    text:
      '$150k for junior role, remote, fully flexible hours. They\'re asking for $5000 training fee "to get certified".',
    phase: 'searching',
    tracks: ['analyst', 'engineer', 'ai_engineer'],
    difficulty: 1,
    tags: ['scam', 'scam_awareness'],
    weight: 0.5,
    choices: [
      {
        id: 'scam_aware',
        text: 'Red flags: unrealistic salary, upfront payment. This is a scam. Skip it.',
        fx: { scam_awareness: 20 },
      },
      {
        id: 'scam_fall',
        text: 'Seems legit! Apply and send the $5000',
        fx: { scam_awareness: -30, stress: 30, savings: -5000 },
      },
    ],
  },

  {
    id: 'financial_pressure_deadline',
    title: 'Savings Running Out',
    text:
      'You have 2 months of savings left. Your dream job rejected you yesterday. An OK job wants to move fast.',
    phase: 'searching',
    tracks: ['analyst', 'engineer', 'ai_engineer'],
    difficulty: 2,
    tags: ['financial_pressure', 'decision'],
    weight: 0.8,
    choices: [
      {
        id: 'financial_pragmatic',
        text: 'Take the OK job. Stability first. Can always leave later.',
        fx: { stress: -20, confidence: -5 },
      },
      {
        id: 'financial_risk',
        text: 'Keep looking for dream job. Maybe I\'ll find something',
        fx: { stress: 15, confidence: 10 },
      },
    ],
  },
];

/**
 * Select next scenario
 */
export function selectNextScenario(
  track: ProfessionalTrack,
  state: JobHuntState,
  stats: SeedStats,
  selectorState: SelectorState,
  randomSeed?: number
): GameScenario {
  const roll = randomSeed !== undefined ? randomSeed : Math.random();

  // FILTER 1: By track
  let candidates = SCENARIO_POOL.filter(
    (s) => s.tracks.includes(track) || s.tracks.includes('*' as any)
  );

  // FILTER 2: By phase (or universal)
  candidates = candidates.filter((s) => s.phase === state || s.phase === ('*' as any));

  // FILTER 3: By difficulty (based on months in search)
  // This is a simplified version - full implementation would track time
  const difficulty = getDifficultyTierForPhase(state, stats);
  candidates = candidates.filter((s) => s.difficulty <= difficulty);

  // FILTER 4: Apply weight modifiers based on current state
  const weighted = candidates.map((scenario) => ({
    scenario,
    weight: getAdjustedWeight(scenario, stats, selectorState),
  }));

  // FILTER 5: Remove recently-used (cooldown)
  const filtered = weighted.filter(
    (w) => !selectorState.scenarioHistory.includes(w.scenario.id)
  );

  // If all recently used, allow repeats
  const pool = filtered.length > 0 ? filtered : weighted;

  // FILTER 6: Weighted random selection
  const totalWeight = pool.reduce((sum, w) => sum + w.weight, 0);
  let selected = roll * totalWeight;

  for (const { scenario, weight } of pool) {
    selected -= weight;
    if (selected <= 0) {
      return scenario;
    }
  }

  // Fallback (shouldn't reach here)
  return pool[0].scenario;
}

/**
 * Difficulty tier for phase
 */
function getDifficultyTierForPhase(
  state: JobHuntState,
  stats: SeedStats
): number {
  // Easier in early phases, harder later
  switch (state) {
    case 'searching':
      return stats.resume_strength > 50 ? 1 : 1; // Easy confidence building
    case 'screening':
      return 1;
    case 'technical_round':
      return 2; // Medium to hard
    case 'hr_round':
      return 2;
    case 'offer_stage':
      return 2; // High stakes
    default:
      return 1;
  }
}

/**
 * Adjust scenario weight based on player state
 */
function getAdjustedWeight(
  scenario: GameScenario,
  stats: SeedStats,
  selectorState: SelectorState
): number {
  let weight = scenario.weight;

  // Increase weight if low confidence (build it up)
  if (stats.confidence < 30) {
    if (scenario.tags.includes('technical')) {
      weight *= 0.5; // Avoid hard technical
    }
  }

  // Inject financial pressure scenarios if low savings
  if (stats.savings < 20000) {
    if (scenario.tags.includes('financial_pressure')) {
      weight *= 2.0; // Double weight
    }
  }

  // Inject scam detection if hasn't seen many
  if (stats.scam_awareness < 50) {
    if (scenario.tags.includes('scam')) {
      weight *= 1.5;
    }
  }

  // Increase referral scenarios if high network
  if (stats.network > 70) {
    if (scenario.tags.includes('referral')) {
      weight *= 1.8;
    }
  }

  // Reduce weight for recent scenarios
  const daysSinceLast = (Date.now() - selectorState.lastScenarioAt) / (1000 * 60 * 60 * 24);
  if (selectorState.scenarioHistory.includes(scenario.id) && daysSinceLast < 30) {
    weight *= 0.3; // 70% reduction for recently-seen
  }

  return Math.max(0.1, weight); // Floor at 0.1
}

/**
 * Initialize selector state
 */
export function initializeSelectorState(): SelectorState {
  return {
    scenarioHistory: [],
    lastScenarioAt: Date.now(),
    cooldownPeriod: 50, // Don't repeat within 50 selections
  };
}

/**
 * Record scenario shown
 */
export function recordScenarioShown(
  state: SelectorState,
  scenarioId: string
): void {
  state.scenarioHistory.push(scenarioId);
  state.lastScenarioAt = Date.now();

  // Keep only last 100 to prevent memory bloat
  if (state.scenarioHistory.length > 100) {
    state.scenarioHistory = state.scenarioHistory.slice(-100);
  }
}

/**
 * Debug: Show candidate pool
 */
export function debugCandidates(
  track: ProfessionalTrack,
  state: JobHuntState,
  stats: SeedStats,
  selectorState: SelectorState
): string {
  let candidates = SCENARIO_POOL.filter((s) => s.tracks.includes(track));
  candidates = candidates.filter((s) => s.phase === state);

  const weighted = candidates.map((scenario) => ({
    scenario,
    weight: getAdjustedWeight(scenario, stats, selectorState),
  }));

  return weighted
    .map((w) => `${w.scenario.title} (weight: ${w.weight.toFixed(2)})`)
    .join('\n');
}
