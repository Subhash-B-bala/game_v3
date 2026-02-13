/* ============================================================
   Narrative Threads — Story Arc Definitions
   Complete narrative threads with chapters, conditions, and endings
   ============================================================ */

import type {
  NarrativeThread,
  ThreadChapter,
  ThreadEnding,
  BranchCondition,
} from './narrative.types';

// ============================================================
// THREAD 1: Sarah Recruiter - Mentor/Network Arc
// ============================================================

export const SarahRecruiterThread: NarrativeThread = {
  id: 'thread_sarah_recruiter',
  name: 'The Recruiter Mentor',
  description:
    'Build a relationship with Sarah, a senior recruiter who can become your mentor or rival.',
  
  startScenario: 'jh2',  // "LinkedIn Outreach"
  startConditions: [
    { type: 'flag', flag: 'can_start_threads', value: true }
  ],
  
  category: 'relationship',
  canBeBranching: true,
  keyNPCs: ['sarah_recruiter'],
  
  chapters: [
    {
      order: 1,
      scenarioId: 'jh2',
      title: 'First Contact - LinkedIn Outreach',
      triggerConditions: [
        { type: 'eventHistory', scenarioId: 'jh2' }
      ],
      onComplete: {
        unlocks: ['jh2_coffee_chat', 'jh2_formal_rejection'],
        globalFlag: 'sarah_contacted',
        npcEffect: [
          {
            npcId: 'sarah_recruiter',
            trust: 10,
            attitude: 'neutral'
          }
        ]
      }
    },
    {
      order: 2,
      scenarioId: 'jh2_coffee_chat',
      title: 'Coffee Chat - Build Connection',
      triggerConditions: [
        { type: 'flag', flag: 'sarah_contacted', value: true },
        { type: 'npcRelation', npcId: 'sarah_recruiter', minTrust: 10 }
      ],
      onComplete: {
        nextChapters: [3],
        npcEffect: [
          {
            npcId: 'sarah_recruiter',
            trust: 20,  // Trust increases significantly
            attitude: 'friendly'
          }
        ],
        globalFlags: {
          sarah_knows_you_well: true,
          can_ask_for_referral: true
        }
      }
    },
    {
      order: 3,
      scenarioId: 'jh2_job_opportunity',
      title: 'Sarah Offers Opportunity',
      triggerConditions: [
        { type: 'flag', flag: 'can_ask_for_referral', value: true },
        { 
          type: 'stat', 
          stat: 'reputation', 
          min: 0  // Any reputation level can get this
        }
      ],
      onComplete: {
        nextChapters: [4],
        globalFlags: {
          sarah_job_offered: true
        }
      }
    },
    {
      order: 4,
      scenarioId: 'jh2_decision',
      title: 'Career Decision - Accept or Decline Sarah\'s Offer',
      triggerConditions: [
        { type: 'flag', flag: 'sarah_job_offered', value: true }
      ],
      onComplete: {
        // This leads to endings based on choice
        globalFlag: 'sarah_arc_finalized'
      }
    }
  ],
  
  endings: [
    {
      id: 'ending_mentor_path',
      title: 'Mentor Path',
      description: 'Sarah becomes your long-term mentor. Career growth through guidance.',
      condition: [
        { type: 'flag', flag: 'sarah_job_offered', value: true },
        { type: 'eventHistory', scenarioId: 'jh2_decision', choiceId: 'accept_with_gratitude' }
      ],
      rewards: {
        globalFlags: {
          sarah_is_mentor: true,
          fast_track_available: true
        },
        statBonuses: {
          leadership: 15,
          reputation: 25,
          confidence: 10
        },
        npcRelationUpdates: [
          {
            npcId: 'sarah_recruiter',
            trust: 80,
            attitude: 'mentor'
          }
        ]
      }
    },
    {
      id: 'ending_professional_path',
      title: 'Professional Path',
      description: 'You and Sarah maintain a professional relationship with mutual respect.',
      condition: [
        { type: 'flag', flag: 'sarah_job_offered', value: true },
        { type: 'eventHistory', scenarioId: 'jh2_decision', choiceId: 'accept_and_negotiate' }
      ],
      rewards: {
        globalFlags: {
          sarah_is_professional_contact: true
        },
        statBonuses: {
          negotiation: 10,
          reputation: 15,
          salary: 5000
        },
        npcRelationUpdates: [
          {
            npcId: 'sarah_recruiter',
            trust: 50,
            attitude: 'friendly'
          }
        ]
      }
    },
    {
      id: 'ending_missed_opportunity',
      title: 'Missed Connection',
      description: 'You decline Sarah\'s offer. The opportunity passes, but you remain friendly acquaintances.',
      condition: [
        { type: 'flag', flag: 'sarah_job_offered', value: true },
        { type: 'eventHistory', scenarioId: 'jh2_decision', choiceId: 'decline_politely' }
      ],
      rewards: {
        globalFlags: {
          sarah_is_acquaintance: true
        },
        statBonuses: {
          confidence: 5
        },
        npcRelationUpdates: [
          {
            npcId: 'sarah_recruiter',
            trust: 30,
            attitude: 'friendly'
          }
        ]
      }
    },
    {
      id: 'ending_bridge_burned',
      title: 'Bridge Burned',
      description: 'You refuse rudely or mislead Sarah. She becomes unlikely to help in future.',
      condition: [
        { type: 'flag', flag: 'sarah_job_offered', value: true },
        { type: 'eventHistory', scenarioId: 'jh2_decision', choiceId: 'reject_rudely' }
      ],
      rewards: {
        globalFlags: {
          sarah_is_rival: true
        },
        statBonuses: {
          reputation: -20,
          confidence: -10
        },
        npcRelationUpdates: [
          {
            npcId: 'sarah_recruiter',
            trust: 10,
            attitude: 'hostile'
          }
        ]
      }
    }
  ]
};

// ============================================================
// THREAD 2: Skill Mastery - Technical Growth Arc
// ============================================================

export const SkillMasteryThread: NarrativeThread = {
  id: 'thread_skill_mastery',
  name: 'The Coder\'s Journey',
  description:
    'Progress through technical challenges. Each success builds momentum and unlocks harder problems.',
  
  startScenario: 'jh_coding_challenge_1',
  category: 'skill_development',
  canBeBranching: true,
  
  chapters: [
    {
      order: 1,
      scenarioId: 'jh_coding_challenge_1',
      title: 'Warm-up: Simple SQL Query',
      onComplete: {
        unlocks: ['jh_coding_challenge_2'],
        globalFlags: {
          skill_arc_started: true,
          completed_sql_basics: true
        },
        npcEffect: [
          {
            npcId: 'mentor_coder',
            trust: 15,
            attitude: 'friendly'
          }
        ]
      }
    },
    {
      order: 2,
      scenarioId: 'jh_coding_challenge_2',
      title: 'Intermediate: Python Algorithm',
      triggerConditions: [
        { type: 'flag', flag: 'completed_sql_basics', value: true },
        { type: 'stat', stat: 'python', min: 20 }
      ],
      onComplete: {
        unlocks: ['jh_coding_challenge_3'],
        globalFlags: {
          completed_python: true
        },
        npcEffect: [
          {
            npcId: 'mentor_coder',
            trust: 20,
            attitude: 'mentor'
          }
        ]
      }
    },
    {
      order: 3,
      scenarioId: 'jh_coding_challenge_3',
      title: 'Advanced: System Design Interview',
      triggerConditions: [
        { type: 'flag', flag: 'completed_python', value: true },
        { type: 'stat', stat: 'python', min: 50 }
      ],
      onComplete: {
        nextChapters: [4],
        globalFlags: {
          ready_for_big_leagues: true
        }
      }
    },
    {
      order: 4,
      scenarioId: 'jh_final_interview',
      title: 'The Final Test',
      triggerConditions: [
        { type: 'flag', flag: 'ready_for_big_leagues', value: true }
      ]
    }
  ],
  
  endings: [
    {
      id: 'ending_tech_expert',
      title: 'Technical Expert',
      description: 'You\'ve mastered your craft. Tech companies compete for you.',
      condition: [
        { type: 'stat', stat: 'python', min: 80 },
        { type: 'eventHistory', scenarioId: 'jh_final_interview', choiceId: 'ace_it' }
      ],
      rewards: {
        globalFlags: { tech_expert: true },
        statBonuses: { python: 20, reputation: 50, salary: 30000 }
      }
    },
    {
      id: 'ending_solid_foundation',
      title: 'Solid Foundation',
      description: 'You\'re competent and career-ready, with room to grow.',
      condition: [
        { type: 'stat', stat: 'python', min: 40 },
        { type: 'stat', stat: 'python', max: 79 }
      ],
      rewards: {
        globalFlags: { competent: true },
        statBonuses: { python: 10, reputation: 25, salary: 15000 }
      }
    }
  ]
};

// ============================================================
// THREAD 3: Burnout Crisis - Personal/Mental Health Arc
// ============================================================

export const BurnoutCrisisThread: NarrativeThread = {
  id: 'thread_burnout_crisis',
  name: 'When Ambition Becomes Obsession',
  description:
    'A cautionary arc about working too hard. If not managed, leads to health crisis. If navigated well, teaches balance.',
  
  startScenario: 'jh_overwork_warning',
  startConditions: [
    { type: 'stat', stat: 'health', max: 0.3 }  // Only triggers if health is low
  ],
  
  category: 'crisis',
  canBeBranching: true,
  
  chapters: [
    {
      order: 1,
      scenarioId: 'jh_overwork_warning',
      title: 'Warning Signs - You\'re Exhausted',
      triggerConditions: [
        { type: 'stat', stat: 'health', max: 0.3 }
      ],
      onComplete: {
        unlocks: ['jh_take_break_or_push', 'jh_medical_checkup'],
        globalFlags: { burnout_warning_shown: true }
      }
    },
    {
      order: 2,
      scenarioId: 'jh_take_break_or_push',
      title: 'The Choice: Rest or Push',
      triggerConditions: [
        { type: 'flag', flag: 'burnout_warning_shown', value: true }
      ],
      onComplete: {
        // Branching based on choice handled by scenario branches
        globalFlag: 'burnout_decision_made'
      }
    }
  ],
  
  endings: [
    {
      id: 'ending_balanced_growth',
      title: 'Balanced Growth',
      description: 'You take time off, recover, and return stronger. Career is marathon, not sprint.',
      condition: [
        { type: 'eventHistory', scenarioId: 'jh_take_break_or_push', choiceId: 'rest_and_recover' }
      ],
      rewards: {
        globalFlags: { learned_balance: true },
        statBonuses: { health: 40, worklife: 30, confidence: 5 }
      }
    },
    {
      id: 'ending_breakdown',
      title: 'Health Crisis',
      description: 'You pushed too hard. Now facing serious health consequences.',
      condition: [
        { type: 'eventHistory', scenarioId: 'jh_take_break_or_push', choiceId: 'ignore_and_push' }
      ],
      rewards: {
        globalFlags: { had_health_crisis: true },
        statBonuses: { health: -50, worklife: -40, confidence: -20 }
      }
    }
  ]
};

// ============================================================
// THREAD 4: Imposter Syndrome - Psychological Growth Arc
// ============================================================

export const ImposterSyndromeThread: NarrativeThread = {
  id: 'thread_imposter_syndrome',
  name: 'Overcoming Self-Doubt',
  description:
    'A psychological journey where you gradually build self-belief despite initial doubts.',
  
  startScenario: 'jh_self_doubt_emerges',
  startConditions: [
    { type: 'stat', stat: 'confidence', max: 0.4 }
  ],
  
  category: 'opportunity',
  canBeBranching: true,
  
  chapters: [
    {
      order: 1,
      scenarioId: 'jh_self_doubt_emerges',
      title: 'The Imposter Feeling',
      onComplete: {
        unlocks: ['jh_seek_support_or_isolate'],
        globalFlags: { imposter_started: true }
      }
    },
    {
      order: 2,
      scenarioId: 'jh_seek_support_or_isolate',
      title: 'Seek Support or Go Alone?',
      onComplete: {
        globalFlag: 'imposter_choice_made'
      }
    },
    {
      order: 3,
      scenarioId: 'jh_proof_of_capability',
      title: 'Evidence of Your Capability',
      triggerConditions: [
        { type: 'eventHistory', scenarioId: 'jh_seek_support_or_isolate', choiceId: 'seek_mentor' }
      ],
      onComplete: {
        globalFlags: { gained_evidence: true },
        npcEffect: [
          {
            npcId: 'support_mentor',
            trust: 30,
            attitude: 'mentor'
          }
        ]
      }
    }
  ],
  
  endings: [
    {
      id: 'ending_confidence_surge',
      title: 'Confidence Surge',
      description: 'With support, you realize you DO belong. Confidence skyrockets.',
      condition: [
        { type: 'flag', flag: 'gained_evidence', value: true },
        { type: 'eventHistory', scenarioId: 'jh_proof_of_capability', choiceId: 'accept_yourself' }
      ],
      rewards: {
        statBonuses: { confidence: 50, leadership: 20 }
      }
    },
    {
      id: 'ending_lingering_doubt',
      title: 'Lingering Doubt',
      description: 'You succeeded, but the doubt never fully goes away.',
      condition: [
        { type: 'eventHistory', scenarioId: 'jh_seek_support_or_isolate', choiceId: 'go_alone' }
      ],
      rewards: {
        statBonuses: { confidence: 15 }  // Small improvement
      }
    }
  ]
};

// Export all threads
export const ALL_NARRATIVE_THREADS: NarrativeThread[] = [
  SarahRecruiterThread,
  SkillMasteryThread,
  BurnoutCrisisThread,
  ImposterSyndromeThread
];
