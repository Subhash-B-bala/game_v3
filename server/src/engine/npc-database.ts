/**
 * NPC DATABASE — Complete NPC definitions with dialogue trees
 *
 * 5 Core NPCs:
 *   1. Sarah (Recruiter) — Gateway to opportunities
 *   2. Alex (Senior Engineer Mentor) — Technical guidance
 *   3. Casey (HR Manager) — HR rounds & offers
 *   4. Jordan (Networking Peer) — Emotional support
 *   5. Family — Burnout trigger & grounding
 *
 * Each NPC has:
 *   - Greeting node (always accessible)
 *   - Conditional branches (desperate, confident, neutral)
 *   - Activity trigger
 *   - Post-activity follow-up
 *   - Fallback node
 */

export interface NPCStatBase {
  npcId: string;
  name: string;
  role: string;
  avatar: string;
  location: string;
  x: number;
  y: number;
}

export interface NPCRelationship {
  npcId: string;
  name: string;
  role: string;
  trustLevel: number; // 0-100
  attitude: 'stranger' | 'contact' | 'friend' | 'mentor' | 'advocate';
  lastInteractionAt?: number;
  sharedHistory: Array<{
    event: string;
    timestamp: number;
  }>;
}

export interface DialogueChoice {
  id: string;
  text: string;
  nextNodeId?: string;
  triggerActivity?: string;
  npcEffects?: {
    trust?: number;
    attitude?: 'stranger' | 'contact' | 'friend' | 'mentor' | 'advocate';
  };
  playerEffects?: Record<string, number>;
  flags?: Record<string, boolean>;
}

export interface DialogueBranch {
  id: string;
  conditions: Array<{
    type: 'stat' | 'flag' | 'npc_trust' | 'track';
    stat?: string;
    min?: number;
    max?: number;
    flag?: string;
    value?: boolean;
    track?: string;
  }>;
  variantText: string;
  variantChoices?: DialogueChoice[];
}

export interface DialogueNode {
  id: string;
  text: string;
  emotion?: 'neutral' | 'warm' | 'cold' | 'concerned' | 'excited';
  branches?: DialogueBranch[];
  choices: DialogueChoice[];
}

export interface DialogueTree {
  rootNodeId: string;
  nodes: Record<string, DialogueNode>;
}

/**
 * NPC: SARAH — Recruiter (Tech Talent Agency)
 *
 * Role: Gateway to opportunities
 * Relationship arc: Stranger → Contact → Friend → Mentor → Advocate
 * Initial attitude: Contact (professional)
 */
export const NPC_SARAH: NPCStatBase & { dialogueTree: DialogueTree } = {
  npcId: 'sarah_recruiter',
  name: 'Sarah',
  role: 'Tech Recruiter',
  avatar: 'sarah',
  location: 'downtown',
  x: 450,
  y: 250,

  dialogueTree: {
    rootNodeId: 'sarah_greeting',
    nodes: {
      sarah_greeting: {
        id: 'sarah_greeting',
        text: '[Sarah looks up from her coffee. She seems welcoming.]',
        emotion: 'neutral',
        branches: [
          {
            id: 'branch_desperate',
            conditions: [
              { type: 'stat', stat: 'confidence', max: 30 },
              { type: 'stat', stat: 'savings', max: 20000 },
            ],
            variantText:
              'Sarah: "You look like you\'ve been through the wringer. How long has it been?"',
            variantChoices: [
              {
                id: 'desperate_honest',
                text: '"Three months. Starting to lose hope."',
                nextNodeId: 'sarah_empathy',
                npcEffects: { trust: 25, attitude: 'friend' },
                playerEffects: { stress: -10, confidence: 5 },
              },
            ],
          },
          {
            id: 'branch_confident',
            conditions: [
              { type: 'stat', stat: 'confidence', min: 70 },
              { type: 'stat', stat: 'reputation', min: 50 },
            ],
            variantText:
              'Sarah: "I\'ve been following your work. Really impressive portfolio. We should talk."',
            variantChoices: [
              {
                id: 'confident_leap',
                text: '"I\'m interested. What did you have in mind?"',
                nextNodeId: 'sarah_opportunity',
                npcEffects: { trust: 20, attitude: 'mentor' },
                playerEffects: { confidence: 10 },
              },
            ],
          },
        ],
        choices: [
          {
            id: 'sarah_generic_intro',
            text: '"Hi Sarah! I\'ve heard great things about you."',
            nextNodeId: 'sarah_intro_follow',
            npcEffects: { trust: 10 },
          },
          {
            id: 'sarah_direct',
            text: '"I\'m actively job hunting. Can you help?"',
            nextNodeId: 'sarah_can_help',
            npcEffects: { trust: 8 },
          },
        ],
      },

      sarah_intro_follow: {
        id: 'sarah_intro_follow',
        text: 'Sarah: "Thanks! So, what brings you here today? Just networking or actively looking?"',
        emotion: 'warm',
        choices: [
          {
            id: 'sarah_active',
            text: '"Actively looking. I\'m really interested in technical roles."',
            nextNodeId: 'sarah_next_step',
            npcEffects: { trust: 8 },
          },
          {
            id: 'sarah_exploring',
            text: '"Just exploring what\'s out there."',
            nextNodeId: 'sarah_next_step',
            npcEffects: { trust: 5 },
          },
        ],
      },

      sarah_empathy: {
        id: 'sarah_empathy',
        text: 'Sarah: "I get it. This is brutal. But you know what? I\'ve seen people turn it around fast with the right opportunity. Let me help you."',
        emotion: 'warm',
        choices: [
          {
            id: 'sarah_coffee',
            text: '"Really? I\'d appreciate that."',
            triggerActivity: 'coffee_chat',
            npcEffects: { trust: 15, attitude: 'friend' },
            playerEffects: { stress: -15, confidence: 10 },
          },
        ],
      },

      sarah_opportunity: {
        id: 'sarah_opportunity',
        text: 'Sarah: "There\'s a really strong company looking for someone like you. Technical depth, but also communication skills. Let me set up an interview."',
        emotion: 'excited',
        choices: [
          {
            id: 'sarah_interview_setup',
            text: '"Yes, absolutely! When?"',
            triggerActivity: 'interview',
            npcEffects: { trust: 20 },
            playerEffects: { confidence: 15, stress: -5 },
          },
        ],
      },

      sarah_can_help: {
        id: 'sarah_can_help',
        text: 'Sarah: "I can definitely help. Let me ask you a few things. What\'s your background? What kind of roles are you targeting?"',
        emotion: 'professional',
        choices: [
          {
            id: 'sarah_profile_share',
            text: '"I\'m a data engineer looking for senior roles with growth opportunity."',
            nextNodeId: 'sarah_next_step',
            npcEffects: { trust: 12 },
          },
        ],
      },

      sarah_next_step: {
        id: 'sarah_next_step',
        text: 'Sarah: "Got it. Let me see what I have. I\'ll reach out if something matches. In the meantime, let\'s stay connected."',
        emotion: 'neutral',
        choices: [
          {
            id: 'sarah_exit',
            text: '"Sounds good. Thanks, Sarah."',
            npcEffects: { trust: 5 },
          },
        ],
      },
    },
  },
};

/**
 * NPC: ALEX — Senior Engineer Mentor
 *
 * Role: Technical guidance, confidence building
 * Relationship arc: Professional → Mentor → Advocate
 * Initial attitude: Contact (busy but helpful)
 */
export const NPC_ALEX: NPCStatBase & { dialogueTree: DialogueTree } = {
  npcId: 'alex_mentor',
  name: 'Alex',
  role: 'Senior Engineer',
  avatar: 'alex',
  location: 'library',
  x: 350,
  y: 300,

  dialogueTree: {
    rootNodeId: 'alex_greeting',
    nodes: {
      alex_greeting: {
        id: 'alex_greeting',
        text: '[Alex is deep in a coding book. They look up.]',
        emotion: 'neutral',
        branches: [
          {
            id: 'branch_struggling',
            conditions: [
              { type: 'stat', stat: 'confidence', max: 40 },
              { type: 'stat', stat: 'technical_depth', max: 50 },
            ],
            variantText:
              'Alex: "You look like you could use some help. Interview prep?"',
            variantChoices: [
              {
                id: 'struggling_yes',
                text: '"Yeah, I\'m struggling with the technical rounds."',
                nextNodeId: 'alex_offers_mentorship',
                npcEffects: { trust: 30, attitude: 'mentor' },
                playerEffects: { confidence: 15, stress: -20 },
              },
            ],
          },
          {
            id: 'branch_strong',
            conditions: [
              { type: 'stat', stat: 'technical_depth', min: 70 },
            ],
            variantText:
              'Alex: "Interesting. Your GitHub project on distributed systems caught my eye."',
            variantChoices: [
              {
                id: 'strong_respond',
                text: '"Oh? I\'m glad someone noticed. I\'m looking for senior engineering roles."',
                nextNodeId: 'alex_peer_respect',
                npcEffects: { trust: 20, attitude: 'mentor' },
              },
            ],
          },
        ],
        choices: [
          {
            id: 'alex_intro',
            text: '"Hi Alex! I heard you\'re great at mentoring."',
            nextNodeId: 'alex_modest',
            npcEffects: { trust: 10 },
          },
          {
            id: 'alex_direct',
            text: '"Would you be willing to mentor me? I\'m prepping for interviews."',
            nextNodeId: 'alex_consider',
            npcEffects: { trust: 15 },
          },
        ],
      },

      alex_modest: {
        id: 'alex_modest',
        text: 'Alex: "Ha, I try. Been through a lot of interviews myself. What\'s your situation?"',
        emotion: 'warm',
        choices: [
          {
            id: 'alex_situation',
            text: '"I\'ve been searching for 2 months. Technical rounds are where I stumble."',
            nextNodeId: 'alex_offers_help',
            npcEffects: { trust: 12 },
          },
        ],
      },

      alex_offers_mentorship: {
        id: 'alex_offers_mentorship',
        text: 'Alex: "Tell you what. Let\'s do a few mock interviews. System design, algorithms, whatever you\'re weak on. I\'ll give you real feedback."',
        emotion: 'excited',
        choices: [
          {
            id: 'alex_mock_setup',
            text: '"That would be amazing. When can we start?"',
            triggerActivity: 'mentoring',
            npcEffects: { trust: 40, attitude: 'mentor' },
            playerEffects: { technical_depth: 20, confidence: 25, stress: -20 },
            flags: { has_mentor: true },
          },
        ],
      },

      alex_consider: {
        id: 'alex_consider',
        text: 'Alex: "Mentoring... I\'m pretty busy, but I see the hunger. Yeah, I\'ll help. What do you need?"',
        emotion: 'professional',
        choices: [
          {
            id: 'alex_mock_request',
            text: '"Mock interviews would be perfect. System design especially."',
            triggerActivity: 'mentoring',
            npcEffects: { trust: 35, attitude: 'mentor' },
            playerEffects: { technical_depth: 15, confidence: 15 },
            flags: { has_mentor: true },
          },
        ],
      },

      alex_peer_respect: {
        id: 'alex_peer_respect',
        text: 'Alex: "Senior engineer job market is different. It\'s not just technical—it\'s about what you\'ve shipped. How can I help?"',
        emotion: 'warm',
        choices: [
          {
            id: 'alex_peer_help',
            text: '"Maybe just a sounding board? I\'m overthinking the interviews."',
            triggerActivity: 'coffee_chat',
            npcEffects: { trust: 25, attitude: 'mentor' },
            playerEffects: { confidence: 10, stress: -10 },
          },
        ],
      },

      alex_offers_help: {
        id: 'alex_offers_help',
        text: 'Alex: "Two months is rough. Technical rounds are about communication as much as code. Let\'s practice."',
        emotion: 'warm',
        choices: [
          {
            id: 'alex_practice_session',
            text: '"Thanks Alex. I really need this."',
            triggerActivity: 'mentoring',
            npcEffects: { trust: 30, attitude: 'mentor' },
            playerEffects: { technical_depth: 15, confidence: 15, stress: -15 },
            flags: { has_mentor: true },
          },
        ],
      },
    },
  },
};

/**
 * NPC: CASEY — HR Manager (Company Representative)
 *
 * Role: Interview coordinator, offer layer
 * Relationship arc: Professional → Evaluator → Ally
 * Initial attitude: Contact (formal)
 */
export const NPC_CASEY: NPCStatBase & { dialogueTree: DialogueTree } = {
  npcId: 'casey_hr',
  name: 'Casey',
  role: 'HR Manager',
  avatar: 'casey',
  location: 'tech_office',
  x: 500,
  y: 350,

  dialogueTree: {
    rootNodeId: 'casey_greeting',
    nodes: {
      casey_greeting: {
        id: 'casey_greeting',
        text: '[Casey is reviewing applications. They smile professionally.]',
        emotion: 'neutral',
        branches: [
          {
            id: 'branch_strong_candidate',
            conditions: [
              { type: 'stat', stat: 'resume_strength', min: 70 },
              { type: 'stat', stat: 'portfolio_strength', min: 65 },
            ],
            variantText:
              'Casey: "Your resume really stood out. No wonder our hiring panel pushed for an HR round."',
            variantChoices: [
              {
                id: 'strong_grateful',
                text: '"I\'m excited to learn more about the role and team."',
                nextNodeId: 'casey_hr_round',
                npcEffects: { trust: 20, attitude: 'contact' },
                playerEffects: { confidence: 10 },
              },
            ],
          },
        ],
        choices: [
          {
            id: 'casey_intro',
            text: '"Hi Casey! Thanks for taking the time."',
            nextNodeId: 'casey_welcome',
            npcEffects: { trust: 8 },
          },
        ],
      },

      casey_welcome: {
        id: 'casey_welcome',
        text: 'Casey: "Of course! So, you\'ve made it through our technical rounds. Now let\'s talk about you as a person and teammate. Tell me about your biggest professional challenge."',
        emotion: 'professional',
        choices: [
          {
            id: 'casey_challenge',
            text: '"I had to lead a project where the tech was mismatched to the problem. I had to convince stakeholders to pivot."',
            nextNodeId: 'casey_impressed',
            npcEffects: { trust: 20, attitude: 'contact' },
            playerEffects: { reputation: 15, interview_skill: 10 },
          },
        ],
      },

      casey_hr_round: {
        id: 'casey_hr_round',
        text: 'Casey: "Let\'s dive into this. What attracted you specifically to our company and this role?"',
        emotion: 'warm',
        choices: [
          {
            id: 'casey_interested',
            text: '"Your tech stack and the product roadmap. I believe in what you\'re building."',
            nextNodeId: 'casey_offer_path',
            npcEffects: { trust: 25, attitude: 'contact' },
            playerEffects: { reputation: 10, interview_skill: 8 },
          },
        ],
      },

      casey_impressed: {
        id: 'casey_impressed',
        text: 'Casey: "I like that. Adaptability and leadership. That\'s what we value. I think you\'d be a strong addition to the team."',
        emotion: 'warm',
        choices: [
          {
            id: 'casey_offer_coming',
            text: '"Thank you, Casey. I\'m really interested."',
            nextNodeId: 'casey_offer_signals',
            npcEffects: { trust: 25 },
            playerEffects: { confidence: 15, stress: -10 },
          },
        ],
      },

      casey_offer_path: {
        id: 'casey_offer_path',
        text: 'Casey: "Great. Our team will align on an offer. We\'ll have something to you by EOW."',
        emotion: 'professional',
        choices: [
          {
            id: 'casey_await',
            text: '"I look forward to it!"',
            npcEffects: { trust: 15 },
            playerEffects: { stress: -15 },
          },
        ],
      },

      casey_offer_signals: {
        id: 'casey_offer_signals',
        text: 'Casey: "I think we\'re moving forward with an offer. Let\'s schedule that conversation next week."',
        emotion: 'warm',
        choices: [
          {
            id: 'casey_offer_next_week',
            text: '"Sounds good. Thanks, Casey."',
            npcEffects: { trust: 20 },
          },
        ],
      },
    },
  },
};

/**
 * NPC: JORDAN — Networking Peer (Fellow Job Seeker)
 *
 * Role: Emotional support, shared experience, possible referral source
 * Relationship arc: Stranger → Peer → Ally
 * Initial attitude: Stranger (but relatable)
 */
export const NPC_JORDAN: NPCStatBase & { dialogueTree: DialogueTree } = {
  npcId: 'jordan_peer',
  name: 'Jordan',
  role: 'Job Seeker / Developer',
  avatar: 'jordan',
  location: 'downtown',
  x: 400,
  y: 300,

  dialogueTree: {
    rootNodeId: 'jordan_greeting',
    nodes: {
      jordan_greeting: {
        id: 'jordan_greeting',
        text: '[Jordan is at the coffee bar. They notice you.]',
        emotion: 'neutral',
        branches: [
          {
            id: 'branch_both_searching',
            conditions: [
              { type: 'stat', stat: 'stress', min: 50 },
            ],
            variantText:
              'Jordan: "You look like you\'ve been in the trenches too. How long on the search?"',
            variantChoices: [
              {
                id: 'searching_commiserate',
                text: '"Longer than I\'d like. You too?"',
                nextNodeId: 'jordan_commiserate',
                npcEffects: { trust: 15, attitude: 'contact' },
                playerEffects: { stress: -10 },
              },
            ],
          },
        ],
        choices: [
          {
            id: 'jordan_intro',
            text: '"Hi Jordan! How\'s your job search going?"',
            nextNodeId: 'jordan_respond',
            npcEffects: { trust: 8 },
          },
          {
            id: 'jordan_vent',
            text: '"I\'m exhausted. Got rejected from my dream job today."',
            nextNodeId: 'jordan_support',
            npcEffects: { trust: 12, attitude: 'contact' },
            playerEffects: { stress: -15 },
          },
        ],
      },

      jordan_respond: {
        id: 'jordan_respond',
        text: 'Jordan: "It\'s a journey. Some days are great, some days I question everything. You applying to similar roles?"',
        emotion: 'warm',
        choices: [
          {
            id: 'jordan_similar',
            text: '"Yeah, mostly backend engineer and some full-stack. The market is brutal right now."',
            nextNodeId: 'jordan_share',
            npcEffects: { trust: 10 },
          },
        ],
      },

      jordan_commiserate: {
        id: 'jordan_commiserate',
        text: 'Jordan: "Three months for me. But I just landed something good! First offer was solid. You\'re going to get there too."',
        emotion: 'warm',
        choices: [
          {
            id: 'jordan_celebrate',
            text: '"Congrats! That\'s amazing. What was your turning point?"',
            nextNodeId: 'jordan_advice',
            npcEffects: { trust: 20, attitude: 'friend' },
            playerEffects: { confidence: 15, stress: -15 },
          },
        ],
      },

      jordan_support: {
        id: 'jordan_support',
        text: 'Jordan: "Ugh, sorry. Rejection always stings. But you know what? It just means you\'re interviewing enough. Average is like 8 rejections per offer. You\'re on the right path."',
        emotion: 'warm',
        choices: [
          {
            id: 'jordan_resilience',
            text: '"Thanks. I needed to hear that."',
            nextNodeId: 'jordan_exchange',
            npcEffects: { trust: 25, attitude: 'friend' },
            playerEffects: { stress: -20, confidence: 10 },
          },
        ],
      },

      jordan_share: {
        id: 'jordan_share',
        text: 'Jordan: "Same space! Actually, my buddy is hiring. Want me to refer you?"',
        emotion: 'warm',
        choices: [
          {
            id: 'jordan_referral',
            text: '"Wait, really? Yes, absolutely!"',
            triggerActivity: 'coffee_chat',
            npcEffects: { trust: 35, attitude: 'friend' },
            playerEffects: { network: 20, reputation: 10, stress: -10 },
            flags: { has_referral: true },
          },
        ],
      },

      jordan_advice: {
        id: 'jordan_advice',
        text: 'Jordan: "Honestly? Referrals. One of my bootcamp classmates knew someone at my new company. That skip-the-line moment made all the difference."',
        emotion: 'reflective',
        choices: [
          {
            id: 'jordan_network',
            text: '"Got it. Network harder, less cold applications."',
            npcEffects: { trust: 15 },
            playerEffects: { network: 10 },
          },
        ],
      },

      jordan_exchange: {
        id: 'jordan_exchange',
        text: 'Jordan: "Let\'s stay in touch. If I hear about anything, I\'ll reach out. And if you do, same?"',
        emotion: 'warm',
        choices: [
          {
            id: 'jordan_agree',
            text: '"Definitely. We got this."',
            npcEffects: { trust: 15 },
          },
        ],
      },
    },
  },
};

/**
 * NPC: FAMILY — Optional Emotional Arc
 *
 * Role: Burnout trigger, emotional grounding
 * Relationship arc: Supportive → Concerned → Understanding
 * Initial attitude: Supporter
 */
export const NPC_FAMILY: NPCStatBase & { dialogueTree: DialogueTree } = {
  npcId: 'family',
  name: 'Family',
  role: 'Close Family',
  avatar: 'family',
  location: 'home',
  x: 400,
  y: 400,

  dialogueTree: {
    rootNodeId: 'family_greeting',
    nodes: {
      family_greeting: {
        id: 'family_greeting',
        text: '[Your family member sits down. They look concerned.]',
        emotion: 'neutral',
        branches: [
          {
            id: 'branch_stressed',
            conditions: [
              { type: 'stat', stat: 'stress', min: 65 },
            ],
            variantText:
              'Family: "You look really stressed. Is the job search eating you up?"',
            variantChoices: [
              {
                id: 'stressed_admit',
                text: '"Yeah. It\'s harder than I expected. I keep getting rejected."',
                nextNodeId: 'family_reassure',
                npcEffects: { trust: 20 },
                playerEffects: { stress: -20, confidence: 10 },
              },
            ],
          },
          {
            id: 'branch_doing_well',
            conditions: [
              { type: 'stat', stat: 'confidence', min: 70 },
              { type: 'stat', stat: 'stress', max: 40 },
            ],
            variantText:
              'Family: "You seem different lately. More confident. Something good happening?"',
            variantChoices: [
              {
                id: 'doing_well_share',
                text: '"Actually, yeah. Got to the final round at a company I love."',
                nextNodeId: 'family_proud',
                npcEffects: { trust: 15 },
                playerEffects: { confidence: 10 },
              },
            ],
          },
        ],
        choices: [
          {
            id: 'family_check_in',
            text: '"Hi. How are you doing?"',
            nextNodeId: 'family_respond',
            npcEffects: { trust: 5 },
          },
          {
            id: 'family_vent',
            text: '"Can I vent? Job hunt is brutal."',
            nextNodeId: 'family_listen',
            npcEffects: { trust: 10 },
            playerEffects: { stress: -15 },
          },
        ],
      },

      family_reassure: {
        id: 'family_reassure',
        text: 'Family: "Rejection isn\'t personal. You\'re skilled and driven. The right place will see that. Take care of yourself though, okay?"',
        emotion: 'warm',
        choices: [
          {
            id: 'family_thanks',
            text: '"Thanks. I needed that."',
            npcEffects: { trust: 15 },
            playerEffects: { stress: -15, confidence: 10 },
          },
        ],
      },

      family_proud: {
        id: 'family_proud',
        text: 'Family: "That\'s wonderful! I\'m proud of you. Whatever happens, you\'re going to land somewhere amazing."',
        emotion: 'warm',
        choices: [
          {
            id: 'family_hopeful',
            text: '"Thanks. I\'m cautiously optimistic."',
            npcEffects: { trust: 15 },
            playerEffects: { confidence: 10, stress: -10 },
          },
        ],
      },

      family_respond: {
        id: 'family_respond',
        text: 'Family: "I\'m good. How\'s the job hunt treating you?"',
        emotion: 'neutral',
        choices: [
          {
            id: 'family_update',
            text: '"It\'s going. Some good leads, some rejections. Normal process."',
            npcEffects: { trust: 8 },
          },
        ],
      },

      family_listen: {
        id: 'family_listen',
        text: 'Family: "Of course. I\'m here. What happened?"',
        emotion: 'concerned',
        choices: [
          {
            id: 'family_share_all',
            text: '"I was rejected after great interviews. I thought I had it. Now I\'m doubting everything."',
            nextNodeId: 'family_perspective',
            npcEffects: { trust: 20 },
            playerEffects: { stress: -20, confidence: 10 },
          },
        ],
      },

      family_perspective: {
        id: 'family_perspective',
        text: 'Family: "That\'s the hardest part—not taking it personally. But every "no" is one step closer to "yes". Your effort matters."',
        emotion: 'warm',
        choices: [
          {
            id: 'family_resolved',
            text: '"You\'re right. One foot in front of the other."',
            npcEffects: { trust: 15 },
            playerEffects: { stress: -15 },
          },
        ],
      },
    },
  },
};

/**
 * Master NPC list
 */
export const NPC_DATABASE = {
  sarah_recruiter: NPC_SARAH,
  alex_mentor: NPC_ALEX,
  casey_hr: NPC_CASEY,
  jordan_peer: NPC_JORDAN,
  family: NPC_FAMILY,
};

/**
 * Initialize NPC relationships
 */
export function initializeNPCRelationships(): Record<
  string,
  NPCRelationship
> {
  return {
    sarah_recruiter: {
      npcId: 'sarah_recruiter',
      name: 'Sarah',
      role: 'Recruiter',
      trustLevel: 0,
      attitude: 'stranger',
      sharedHistory: [],
    },
    alex_mentor: {
      npcId: 'alex_mentor',
      name: 'Alex',
      role: 'Senior Engineer',
      trustLevel: 0,
      attitude: 'stranger',
      sharedHistory: [],
    },
    casey_hr: {
      npcId: 'casey_hr',
      name: 'Casey',
      role: 'HR Manager',
      trustLevel: 0,
      attitude: 'stranger',
      sharedHistory: [],
    },
    jordan_peer: {
      npcId: 'jordan_peer',
      name: 'Jordan',
      role: 'Job Seeker',
      trustLevel: 0,
      attitude: 'stranger',
      sharedHistory: [],
    },
    family: {
      npcId: 'family',
      name: 'Family',
      role: 'Close Family',
      trustLevel: 50, // Family starts with baseline trust
      attitude: 'contact',
      sharedHistory: [],
    },
  };
}

/**
 * Get NPC by ID
 */
export function getNPCDialogueTree(
  npcId: string
):DialogueTree | null {
  const npc = NPC_DATABASE[npcId as keyof typeof NPC_DATABASE];
  return npc?.dialogueTree || null;
}

/**
 * Get dialogue node by ID from NPC tree
 */
export function getDialogueNode(
  npcId: string,
  nodeId: string
): DialogueNode | null {
  const tree = getNPCDialogueTree(npcId);
  if (!tree) return null;
  return tree.nodes[nodeId] || null;
}
