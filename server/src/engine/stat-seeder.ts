/**
 * STAT SEEDER — Initialize player stats based on profile
 *
 * Profile:
 *   - Track: analyst | engineer | ai_engineer
 *   - Background: fresh_grad | career_switcher | bootcamp | experienced
 *   - Financial: comfortable | moderate | high_pressure
 *   - Self-ratings: Python, SQL, Communication, Confidence (1-5)
 *
 * Output: Complete stats object ready for job hunt
 */

export type ProfessionalTrack = 'analyst' | 'engineer' | 'ai_engineer';
export type BackgroundType = 'fresh_grad' | 'career_switcher' | 'bootcamp' | 'experienced';
export type FinancialSituation = 'comfortable' | 'moderate' | 'high_pressure';

export interface PlayerProfile {
  track: ProfessionalTrack;
  background: BackgroundType;
  financialSituation: FinancialSituation;
  selfRatings: {
    python: number; // 1-5
    sql: number;
    communication: number;
    confidence: number;
  };
}

export interface SeedStats {
  // Mental & Emotional
  confidence: number; // 0-100
  stress: number; // 0-100
  energy: number; // 0-100

  // Financial
  savings: number; // Raw amount
  spending_monthly: number;

  // Opportunity Access
  reputation: number; // 0-100
  network: number; // 0-100
  linkedin_presence: number; // 0-100

  // Job-Relevant Skills
  resume_strength: number; // 0-100
  portfolio_strength: number; // 0-100
  interview_skill: number; // 0-100

  // Technical Skills (track-specific)
  technical_depth: number; // 0-100
  python_skill: number; // 0-100
  sql_skill: number; // 0-100

  // Judgment & Risk
  scam_awareness: number; // 0-100

  // Meta
  months_unemployed: number;
  applications_sent: number;
}

/**
 * Seed stats based on player profile
 */
export function seedStats(profile: PlayerProfile): SeedStats {
  // Base values by track
  const trackDefaults = getTrackDefaults(profile.track);

  // Adjust by background
  const backgroundMultiplier = getBackgroundMultiplier(profile.background);

  // Base stats
  let stats: SeedStats = {
    confidence: trackDefaults.confidence * backgroundMultiplier.confidence,
    stress: trackDefaults.stress * (1 / backgroundMultiplier.confidence), // inverse
    energy: 80,

    savings: getInitialSavings(profile.financialSituation),
    spending_monthly: getMonthlySpending(profile.financialSituation),

    reputation: trackDefaults.reputation,
    network: trackDefaults.network,
    linkedin_presence: trackDefaults.linkedin_presence,

    resume_strength: trackDefaults.resume_strength * backgroundMultiplier.resume,
    portfolio_strength: trackDefaults.portfolio_strength * backgroundMultiplier.portfolio,
    interview_skill: trackDefaults.interview_skill,

    technical_depth: trackDefaults.technical_depth,
    python_skill: 0, // Will set below
    sql_skill: 0, // Will set below

    scam_awareness: 60, // Universal baseline

    months_unemployed: 0,
    applications_sent: 0,
  };

  // Apply self-ratings (each point = +10-15 to relevant stat)
  stats.python_skill = Math.min(100, 30 + profile.selfRatings.python * 12);
  stats.sql_skill = Math.min(100, 30 + profile.selfRatings.sql * 12);
  stats.communication = Math.min(100, 40 + profile.selfRatings.communication * 10);
  stats.confidence = Math.min(100, stats.confidence + profile.selfRatings.confidence * 5);

  // Track-specific adjustments based on background
  if (profile.track === 'analyst') {
    stats.sql_skill = Math.min(100, stats.sql_skill + 10);
  } else if (profile.track === 'engineer') {
    stats.python_skill = Math.min(100, stats.python_skill + 10);
  } else if (profile.track === 'ai_engineer') {
    stats.python_skill = Math.min(100, stats.python_skill + 15);
    stats.technical_depth = Math.min(100, stats.technical_depth + 10);
  }

  // Financial situation impacts stress
  if (profile.financialSituation === 'high_pressure') {
    stats.stress = Math.min(100, stats.stress + 20);
  } else if (profile.financialSituation === 'comfortable') {
    stats.stress = Math.max(0, stats.stress - 15);
  }

  return stats;
}

/**
 * Base stats by professional track
 */
function getTrackDefaults(track: ProfessionalTrack) {
  switch (track) {
    case 'analyst':
      return {
        confidence: 50,
        stress: 55,
        reputation: 30,
        network: 20,
        linkedin_presence: 40,
        resume_strength: 45,
        portfolio_strength: 30,
        interview_skill: 40,
        technical_depth: 55, // SQL focus
      };

    case 'engineer':
      return {
        confidence: 55,
        stress: 50,
        reputation: 35,
        network: 25,
        linkedin_presence: 45,
        resume_strength: 40,
        portfolio_strength: 50, // Engineers usually have GitHub
        interview_skill: 35,
        technical_depth: 60, // System design focus
      };

    case 'ai_engineer':
      return {
        confidence: 60,
        stress: 45,
        reputation: 40,
        network: 30,
        linkedin_presence: 50,
        resume_strength: 50,
        portfolio_strength: 60, // ML projects
        interview_skill: 40,
        technical_depth: 70, // Deep ML knowledge
      };
  }
}

/**
 * Multipliers based on background
 */
function getBackgroundMultiplier(
  background: BackgroundType
): {
  confidence: number;
  resume: number;
  portfolio: number;
} {
  switch (background) {
    case 'fresh_grad':
      return { confidence: 0.7, resume: 0.6, portfolio: 0.5 };

    case 'career_switcher':
      return { confidence: 0.65, resume: 0.85, portfolio: 0.4 };

    case 'bootcamp':
      return { confidence: 0.8, resume: 0.4, portfolio: 0.8 };

    case 'experienced':
      return { confidence: 1.1, resume: 1.2, portfolio: 1.0 };
  }
}

/**
 * Initial savings by financial situation
 */
function getInitialSavings(
  situation: FinancialSituation
): number {
  switch (situation) {
    case 'comfortable':
      return 150000; // 6+ months runway

    case 'moderate':
      return 60000; // 2-3 months runway

    case 'high_pressure':
      return 20000; // Less than 1 month runway
  }
}

/**
 * Monthly expenses based on situation
 */
function getMonthlySpending(
  situation: FinancialSituation
): number {
  switch (situation) {
    case 'comfortable':
      return 3000; // Flexible

    case 'moderate':
      return 3500; // Standard living

    case 'high_pressure':
      return 2500; // Cutting costs
  }
}

/**
 * Debug helper: Print seeded stats
 */
export function debugStats(stats: SeedStats, profile: PlayerProfile): string {
  return `
PLAYER PROFILE
  Track: ${profile.track}
  Background: ${profile.background}
  Financial: ${profile.financialSituation}
  Self-Ratings: Python ${profile.selfRatings.python}/5, SQL ${profile.selfRatings.sql}/5

SEEDED STATS
  Confidence: ${stats.confidence.toFixed(0)}/100
  Stress: ${stats.stress.toFixed(0)}/100
  Resume Strength: ${stats.resume_strength.toFixed(0)}/100
  Portfolio Strength: ${stats.portfolio_strength.toFixed(0)}/100
  Interview Skill: ${stats.interview_skill.toFixed(0)}/100
  Technical Depth: ${stats.technical_depth.toFixed(0)}/100
  
  Reputation: ${stats.reputation.toFixed(0)}/100
  Network: ${stats.network.toFixed(0)}/100
  LinkedIn Presence: ${stats.linkedin_presence.toFixed(0)}/100
  
  Savings: $${stats.savings}
  Monthly Spending: $${stats.spending_monthly}
  Runway: ${(stats.savings / stats.spending_monthly).toFixed(1)} months
  
  Scam Awareness: ${stats.scam_awareness.toFixed(0)}/100
  `;
}
