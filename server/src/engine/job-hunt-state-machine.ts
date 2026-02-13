/**
 * JOB HUNT STATE MACHINE
 *
 * States: Searching → Screening → Technical → HR → Offer → Accepted
 * Each transition has success probability based on player stats
 *
 * Tracks progression through the interview funnel
 */

import type { SeedStats } from './stat-seeder';

export type JobHuntState =
  | 'searching'
  | 'screening'
  | 'technical_round'
  | 'hr_round'
  | 'offer_stage'
  | 'accepted';

export type EndingType =
  | 'offer_accepted'
  | 'burnout_collapse'
  | 'financial_breakdown'
  | 'referral_fast_track';

export interface JobHuntPhase {
  state: JobHuntState;
  enteredAt: number; // timestamp
  attemptCount: number;
  rejections: number;
  currentCompany?: string;
  currentRole?: string;
}

export interface JobHuntProgress {
  phase: JobHuntPhase;
  history: JobHuntPhase[]; // All previous phases
  daysInSearch: number;
  totalApplications: number;
  totalInterviews: number;
  totalRejections: number;
  offers: Array<{
    salary: number;
    role: string;
    company: string;
    receivedAt: number;
  }>;
  ending?: {
    type: EndingType;
    triggeredAt: number;
    summary: string;
  };
}

/**
 * Initialize job hunt state
 */
export function initializeJobHunt(): JobHuntProgress {
  const now = Date.now();
  return {
    phase: {
      state: 'searching',
      enteredAt: now,
      attemptCount: 0,
      rejections: 0,
    },
    history: [],
    daysInSearch: 0,
    totalApplications: 0,
    totalInterviews: 0,
    totalRejections: 0,
    offers: [],
  };
}

/**
 * Transition probability from current state
 */
export interface TransitionProbability {
  success: number; // 0-1
  rejection: number; // 0-1
  stall: number; // 0-1 (no change)
}

/**
 * Calculate transition probability
 */
export function getTransitionProbability(
  state: JobHuntState,
  stats: SeedStats
): TransitionProbability {
  // Normalize stats to 0-1
  const conf = stats.confidence / 100;
  const tech = stats.technical_depth / 100;
  const rep = stats.reputation / 100;
  const interview = stats.interview_skill / 100;
  const resume = stats.resume_strength / 100;
  const stress_factor = 1 - stats.stress / 100; // Higher stress = lower success

  switch (state) {
    case 'searching': {
      // Resume needs to pass initial filter
      const resumeScore = resume * 0.5;
      const success = Math.min(0.8, 0.4 + resumeScore); // 40-80% chance per day
      return {
        success: success * stress_factor, // Stress delays screening
        rejection: 0.15, // Can get rejected immediately for poor resume
        stall: 1 - success - 0.15,
      };
    }

    case 'screening': {
      // Phone screen with recruiter
      const interviewScore = interview * 0.4 + conf * 0.3 + rep * 0.3;
      const success = Math.min(0.85, 0.5 + interviewScore);
      return {
        success: success * stress_factor,
        rejection: 0.25, // Higher rejection rate here
        stall: 1 - success - 0.25,
      };
    }

    case 'technical_round': {
      // Technical interview
      const techScore = tech * 0.7 + interview * 0.3;
      const success = Math.min(0.80, 0.3 + techScore);
      return {
        success: success * stress_factor,
        rejection: 0.35, // Highest rejection rate
        stall: 1 - success - 0.35,
      };
    }

    case 'hr_round': {
      // HR round (team fit)
      const fitScore = rep * 0.5 + conf * 0.3 + interview * 0.2;
      const success = Math.min(0.9, 0.6 + fitScore);
      return {
        success: success,
        rejection: 0.2, // Still possible to fail here
        stall: 1 - success - 0.2,
      };
    }

    case 'offer_stage': {
      // Offer received! Now it's about acceptance
      // (This state is more about negotiation than transition)
      return {
        success: 0.95, // Almost certainly accepted
        rejection: 0.05, // Only if outrageous terms
        stall: 0,
      };
    }

    case 'accepted': {
      // Terminal state
      return {
        success: 0,
        rejection: 0,
        stall: 1,
      };
    }
  }
}

/**
 * Attempt transition to next state
 * Returns new state or same state if rejected/stalled
 */
export function attemptTransition(
  current: JobHuntState,
  stats: SeedStats,
  randomSeed?: number // For testing
): {
  outcome: 'success' | 'rejection' | 'stall';
  nextState: JobHuntState;
  rejectReason?: string;
} {
  // Use provided seed or random
  const roll = randomSeed !== undefined ? randomSeed : Math.random();

  const prob = getTransitionProbability(current, stats);

  if (roll < prob.success) {
    // Success! Move to next state
    return {
      outcome: 'success',
      nextState: getNextState(current),
    };
  } else if (roll < prob.success + prob.rejection) {
    // Rejection
    return {
      outcome: 'rejection',
      nextState: current === 'searching' ? 'searching' : 'searching', // Drop back
      rejectReason: getRejectionReason(current, stats),
    };
  } else {
    // Stall (waiting)
    return {
      outcome: 'stall',
      nextState: current,
    };
  }
}

/**
 * Get next state in funnel
 */
export function getNextState(current: JobHuntState): JobHuntState {
  switch (current) {
    case 'searching':
      return 'screening';
    case 'screening':
      return 'technical_round';
    case 'technical_round':
      return 'hr_round';
    case 'hr_round':
      return 'offer_stage';
    case 'offer_stage':
      return 'offer_stage'; // Stay until accepted
    case 'accepted':
      return 'accepted'; // Terminal
  }
}

/**
 * Check for end conditions
 */
export function checkEndConditions(
  stats: SeedStats,
  progress: JobHuntProgress,
  currentDay: number
): EndingType | null {
  // Check: Burnout Collapse (stress > 90 for extended period)
  if (stats.stress > 90) {
    const stressedDays = progress.history.filter(
      (p) => p.enteredAt > currentDay - 3 * 24 * 60 * 60 * 1000
    ).length;
    if (stressedDays >= 3) {
      return 'burnout_collapse';
    }
  }

  // Check: Financial Breakdown (savings < 0)
  if (stats.savings < 0) {
    return 'financial_breakdown';
  }

  // Check: Offer Accepted (state)
  if (progress.phase.state === 'accepted') {
    return 'offer_accepted';
  }

  // Check: Referral Fast-Track (network > 80 + has_mentor flag)
  // This is set by narrative system, checked during transitions
  if (stats.network > 80 && stats.reputation > 60) {
    // Could trigger fast-track (narrative flags will gate this)
    return 'referral_fast_track';
  }

  return null;
}

/**
 * Get rejection reason (flavor text)
 */
function getRejectionReason(state: JobHuntState, stats: SeedStats): string {
  const reasons: Record<JobHuntState, string[]> = {
    searching: [
      'Your resume didn\'t pass the initial screen',
      'They\'re looking for more experienced candidates',
      'The role was filled internally',
    ],
    screening: [
      'The recruiter didn\'t think it was a good fit',
      'They\'re pushing for more senior candidates',
      'Your communication threw them off',
    ],
    technical_round: [
      'You struggled with the technical questions',
      'Your approach wasn\'t what they were looking for',
      'You couldn\'t explain your thought process clearly',
    ],
    hr_round: [
      'There were some concerns about team fit',
      'Another candidate was more aligned with culture',
      'They decided to keep looking',
    ],
    offer_stage: ['They retracted the offer (rare)'],
    accepted: [],
  };

  const list = reasons[state];
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Calculate days until financial breakdown
 */
export function daysUntilBreakdown(stats: SeedStats): number {
  if (stats.savings <= 0) return 0;
  return Math.floor(stats.savings / stats.spending_monthly);
}

/**
 * Simulate one day of job hunt
 */
export function simulateDay(
  progress: JobHuntProgress,
  stats: SeedStats
): {
  progress: JobHuntProgress;
  events: string[];
} {
  const events: string[] = [];

  // Increment day count
  progress.daysInSearch += 1;

  // Update stress (increases over time)
  stats.stress = Math.min(100, stats.stress + 0.5);

  // Update savings (decreases)
  stats.savings -= stats.spending_monthly / 30;
  events.push(`Spent $${(stats.spending_monthly / 30).toFixed(0)} today`);

  // If in "searching" state, might send application
  if (progress.phase.state === 'searching') {
    if (Math.random() < 0.6) {
      progress.totalApplications += 1;
      events.push('Sent job application');
    }
  }

  // Maybe attempt transition
  if (Math.random() < 0.1) {
    const transition = attemptTransition(progress.phase.state, stats);
    if (transition.outcome === 'success') {
      progress.phase.state = transition.nextState;
      progress.history.push(progress.phase);
      progress.totalInterviews += 1;
      events.push(`Advanced to: ${transition.nextState}`);
    } else if (transition.outcome === 'rejection') {
      progress.totalRejections += 1;
      events.push(`Rejection: ${transition.rejectReason}`);
    }
  }

  return { progress, events };
}
