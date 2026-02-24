/**
 * Stage Content — Floor Transition Data
 *
 * Used during stage transitions to show:
 *   - Tony's summary dialogue
 *   - Key takeaways from the floor
 *   - Real-world actionable checklist
 */

export interface StageTransitionContent {
    floorNumber: number;
    floorName: string;
    subtitle: string;
    tonyDialogue: string;
    takeaways: string[];
    checklist: string[];
    nextFloorTeaser: string;
}

export const STAGE_CONTENT: StageTransitionContent[] = [
    // ── Floor 0 → Floor 1 Transition ──
    {
        floorNumber: 0,
        floorName: "THE GRIND",
        subtitle: "Foundation Building Complete",
        tonyDialogue: "You've built your foundation. LinkedIn is optimized, your resume passes ATS, and you know how to spot scams. The market is tough, but you're tougher. Time to level up — technical screenings are next.",
        takeaways: [
            "Your LinkedIn profile is your digital handshake — treat it like a living document",
            "ATS-friendly formatting beats fancy design every time",
            "Quality outreach beats mass messaging by 10x",
            "Job scams prey on urgency and desperation — always verify",
            "Your 90-second pitch is the key to every screening call",
        ],
        checklist: [
            "Optimize LinkedIn: professional photo + keyword-rich headline",
            "ATS-format your resume (single column, standard fonts)",
            "Build or deploy your portfolio on Vercel/GitHub Pages",
            "Prepare your 90-second 'Tell me about yourself' pitch",
            "Research 5 target companies and their tech stacks",
        ],
        nextFloorTeaser: "FLOOR 1: THE WORKBENCH — Technical screenings, take-home assignments, and building your reputation.",
    },

    // ── Floor 1 → Floor 2 Transition ──
    {
        floorNumber: 1,
        floorName: "THE WORKBENCH",
        subtitle: "Technical Foundation Locked In",
        tonyDialogue: "You've proven you can handle the technical side. SQL, Python, algorithms — you've faced them all. But interviews aren't just about code. The next floor tests your communication, composure, and strategy.",
        takeaways: [
            "Technical screenings test HOW you think, not just IF you can solve it",
            "Talking through your approach scores more than silent coding",
            "Take-home assignments should be scoped to 4-6 hours max",
            "Referrals are 15x more effective than cold applications",
            "Being ghosted is normal — keep your pipeline full",
        ],
        checklist: [
            "Practice 50 SQL problems on StrataScratch or LeetCode",
            "Build 2 portfolio projects with clean README files",
            "Contribute to 1 open-source repo (even documentation counts)",
            "Prepare system design basics (data flow diagrams)",
            "Send 3 genuine reconnection messages to your network",
        ],
        nextFloorTeaser: "FLOOR 2: THE COWORK — Behavioral interviews, pair programming, and reading the room.",
    },

    // ── Floor 2 → Floor 3 Transition ──
    {
        floorNumber: 2,
        floorName: "THE COWORK",
        subtitle: "Interview Skills Sharpened",
        tonyDialogue: "You've survived the hardest part — real interviews. System design, behavioral questions, pair programming, even the dreaded stress test. You held your ground. Now comes the reward: offers are coming in. But the game isn't over — negotiation is where the real money is.",
        takeaways: [
            "STAR method (Situation, Task, Action, Result) is your behavioral answer framework",
            "System design interviews care about trade-offs, not perfect answers",
            "In pair programming, communication matters more than speed",
            "Stress interviews test composure — staying calm IS the answer",
            "The 'lunch interview' is never casual — always be professional",
        ],
        checklist: [
            "Write STAR stories for 5 common behavioral questions",
            "Do 3 mock interviews (Pramp, Interviewing.io, or with friends)",
            "Research each company's culture, values, and tech stack",
            "Prepare 5 thoughtful questions to ask your interviewers",
            "Practice staying calm under pressure (breathing exercises)",
        ],
        nextFloorTeaser: "FLOOR 3: THE NEGOTIATION SUITE — Salary negotiation, equity, and knowing your worth.",
    },

    // ── Floor 3 → Floor 4 Transition ──
    {
        floorNumber: 3,
        floorName: "THE NEGOTIATION SUITE",
        subtitle: "You Know Your Worth",
        tonyDialogue: "You've learned to negotiate like a professional. You understand market rates, equity, competing offers, and the power of walking away. One final step remains — the decision that shapes the next chapter of your career.",
        takeaways: [
            "Never reveal your current salary — redirect to market research",
            "Total compensation = Base + Bonus + Equity + Benefits",
            "Exploding offers are pressure tactics — most companies will extend deadlines",
            "Competing offers are powerful leverage — use them ethically",
            "References are manageable — context and preparation matter",
        ],
        checklist: [
            "Research market rate on Glassdoor, Levels.fyi, and Payscale",
            "Prepare your counter-offer script with specific numbers",
            "Understand equity vesting schedules (4-year with 1-year cliff)",
            "List your non-negotiables (remote work, PTO, learning budget)",
            "Prepare a professional reference list with advance notice to referees",
        ],
        nextFloorTeaser: "FLOOR 4: THE SUMMIT — The final decision. Sign or walk. Your career, your choice.",
    },
];

/**
 * Floor metadata for title cards during transitions
 */
export const FLOOR_META: Record<number, { name: string; subtitle: string; description: string }> = {
    0: {
        name: "THE GRIND",
        subtitle: "Foundational",
        description: "Build your foundation. Optimize your profile, fix your resume, and start the hunt.",
    },
    1: {
        name: "THE WORKBENCH",
        subtitle: "Technical Screening",
        description: "Prove your technical skills. SQL, Python, algorithms — the gauntlet begins.",
    },
    2: {
        name: "THE COWORK",
        subtitle: "Interview Stage",
        description: "Face real interviews. System design, behavioral rounds, and pair programming.",
    },
    3: {
        name: "THE NEGOTIATION SUITE",
        subtitle: "Offer & Negotiation",
        description: "Negotiate your worth. Salary, equity, and competing offers — the endgame.",
    },
    4: {
        name: "THE SUMMIT",
        subtitle: "The Decision",
        description: "The final choice. Sign the contract or walk away. Your career, your call.",
    },
};
