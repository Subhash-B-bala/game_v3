import { Scenario } from "./types";

export const SCENARIO_POOL: Scenario[] = [
    // --- 🧭 1: PROFESSIONAL ORIGIN ---
    {
        id: "setup_background",
        phase: "setup",
        title: "Professional Origin",
        text: "Where did your journey begin? This defines your starting strengths and weaknesses.",
        sender: { name: "Codebasics", role: "Orientation", avatar: "codebasics" },
        choices: [
            {
                id: "bg_fresher",
                text: "Fresh Graduate",
                description: "CS Degree. High energy, ready to learn.",
                timeCost: 0,
                fx: { energy: 0.15, reputation: -10, network: -5, learningSpeed: 5 }
            },
            {
                id: "bg_switcher",
                text: "Career Switcher",
                description: "Non-tech background. Expert communicator.",
                timeCost: 0,
                fx: { communication: 15, stakeholder_mgmt: 10, python: -10, confidence: 5 }
            },
            {
                id: "bg_bootcamp",
                text: "Bootcamp Grad",
                description: "Intensive training. Focused on practical output.",
                timeCost: 0,
                fx: { sql: 10, python: 10, savings: -15000, confidence: 5 }
            },
            {
                id: "bg_pro",
                text: "Experienced Professional",
                description: "3–8 years in tech. Pivoting your focus.",
                timeCost: 0,
                fx: { reputation: 15, network: 15, energy: -0.05, leadership: 5 }
            }
        ]
    },

    // --- 💰 2: FINANCIAL RUNWAY ---
    {
        id: "setup_financial",
        phase: "setup",
        title: "Financial Runway",
        text: "How strong is your financial cushion? High pressure leads to high urgency.",
        sender: { name: "Codebasics", role: "Strategic Planning", avatar: "codebasics" },
        choices: [
            {
                id: "fin_comfortable",
                text: "Comfortable",
                description: "Large safety net. Focus on quality.",
                timeCost: 0,
                fx: { savings: 25000, burnRatePerMonth: 2200, stress: -0.15, confidence: 5 }
            },
            {
                id: "fin_middle",
                text: "Middle Class",
                description: "Standard runway. Balanced risk.",
                timeCost: 0,
                fx: { savings: 15000, burnRatePerMonth: 2000 }
            },
            {
                id: "fin_dependent",
                text: "Self-Dependent",
                description: "High stakes. High urgency.",
                timeCost: 0,
                fx: { savings: 10000, burnRatePerMonth: 1800, stress: 0.10, grit: 5 }
            },
            {
                id: "fin_debt",
                text: "In Debt",
                description: "EMI / Loan pressure. Failure is not an option.",
                timeCost: 0,
                fx: { savings: -3000, burnRatePerMonth: 1600, stress: 0.30, grit: 15 }
            }
        ]
    },

    // --- 🚀 3: TECHNICAL TRACK ---
    {
        id: "setup_role",
        phase: "setup",
        title: "Technical Track",
        text: "What is your primary focus? This shapes your early career opportunities.",
        sender: { name: "Codebasics", role: "Career Pathing", avatar: "codebasics" },
        choices: [
            {
                id: "role_analyst",
                text: "Data Analyst",
                description: "Insights, SQL, Business Thinking.",
                timeCost: 0,
                fx: { sql: 10, powerbi: 5, problem_solving: 5 },
                setRole: "analyst"
            },
            {
                id: "role_engineer",
                text: "Data Engineer",
                description: "Pipelines, Pipelines, Infra, Systems.",
                timeCost: 0,
                fx: { python: 10, cloud: 5, problem_solving: 5 },
                setRole: "engineer"
            },
            {
                id: "role_ai",
                text: "AI / ML Engineer",
                description: "Neural Networks, Models, Stats.",
                timeCost: 0,
                fx: { python: 10, ml: 5, learningSpeed: 5 },
                setRole: "ai_engineer"
            }
        ]
    },

    // --- 📈 4: SKILL CONFIDENCE ---
    {
        id: "setup_confidence",
        phase: "setup",
        title: "Skill Confidence",
        text: "How confident are you in your current technical technical skills?",
        sender: { name: "Codebasics", role: "Skill Assessment", avatar: "codebasics" },
        choices: [
            {
                id: "conf_beginner",
                text: "Beginner",
                description: "Eager to learn everything from scratch.",
                timeCost: 0,
                fx: { learningSpeed: 15, confidence: -10 }
            },
            {
                id: "conf_intermediate",
                text: "Intermediate",
                description: "I know my way around a codebase.",
                timeCost: 0,
                fx: { confidence: 5 }
            },
            {
                id: "conf_advanced",
                text: "Advanced",
                description: "I'm ready for the toughest technical rounds.",
                timeCost: 0,
                fx: { confidence: 15, reputation: 5 }
            }
        ]
    },

    // --- 🎯 5: RISK APPETITE ---
    {
        id: "setup_risk",
        phase: "setup",
        title: "Risk Appetite",
        text: "How do you handle professional risk? High risk can lead to high reward.",
        sender: { name: "Codebasics", role: "Behavioral Profile", avatar: "codebasics" },
        choices: [
            {
                id: "risk_averse",
                text: "Risk-Averse",
                description: "Preferences for stable, safe paths.",
                timeCost: 0,
                fx: { stability: 10, aggression: -10 }
            },
            {
                id: "risk_balanced",
                text: "Balanced",
                description: "Calculated moves only.",
                timeCost: 0,
                fx: { stability: 5 }
            },
            {
                id: "risk_high",
                text: "High Risk",
                description: "All in on the big swings.",
                timeCost: 0,
                fx: { aggression: 15, startupBias: 10, burnoutRisk: 10 }
            }
        ]
    },

    // --- 🏢 6: TARGET COMPANY ---
    {
        id: "setup_target",
        phase: "setup",
        title: "Job Target Type",
        text: "What type of environment are you aiming for?",
        sender: { name: "Codebasics", role: "Market Targeting", avatar: "codebasics" },
        choices: [
            {
                id: "target_mnc",
                text: "MNC",
                description: "Global giants. Stable, but slower.",
                timeCost: 0,
                fx: { stability: 15, interviewPerformance: -5 } // Harder interviews
            },
            {
                id: "target_startup",
                text: "Fast-Paced Startup",
                description: "High growth, high ownership, high chaos.",
                timeCost: 0,
                fx: { startupBias: 15, aggression: 10 }
            },
            {
                id: "target_remote",
                text: "Remote / Global",
                description: "Competing with the world's best.",
                timeCost: 0,
                fx: { reputation: 10, learningSpeed: 5 }
            },
            {
                id: "target_gov",
                text: "Safe Path",
                description: "Focus on job security above all else.",
                timeCost: 0,
                fx: { stability: 20, aggression: -5 }
            }
        ]
    },

    // --- 🔥 7: MENTAL PRESSURE ---
    {
        id: "setup_pressure",
        phase: "setup",
        title: "Initial Mental State",
        text: "Finally, what is your mindset at the start of this journey?",
        sender: { name: "Codebasics", role: "Final Assessment", avatar: "codebasics" },
        choices: [
            {
                id: "state_motivated",
                text: "Highly Motivated",
                description: "Ready to conquer the office.",
                timeCost: 0,
                fx: { confidence: 20, learningSpeed: 5 },
                flag: "setup_complete",
                huntStage: 1
            },
            {
                id: "state_neutral",
                text: "Neutral / Focused",
                description: "Steady as she goes.",
                timeCost: 0,
                flag: "setup_complete",
                huntStage: 1
            },
            {
                id: "state_burned",
                text: "Already Burned Out",
                description: "Searching for a fresh start.",
                timeCost: 0,
                fx: { energy: -0.15, stress: 0.20 },
                flag: "setup_complete",
                huntStage: 1
            }
        ]
    }
];
